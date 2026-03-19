import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { CryptoSymbol } from '../config/crypto';
import { auditService, AuditAction } from './audit.service';
import { notificationService } from './notification.service';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';

// ─────────────────────────────────────────────────────────
// Emergency Controls Service
// Global freeze, per-merchant freeze, per-crypto freeze,
// maintenance mode — all with WhatsApp 2FA confirmation
// ─────────────────────────────────────────────────────────

export interface FreezeStatus {
  globalFreeze: boolean;
  globalFreezeAt: Date | null;
  globalFreezeBy: string | null;
  globalFreezeReason: string | null;
  cryptoFreezes: Array<{
    crypto: CryptoSymbol;
    frozen: boolean;
    frozenAt: Date | null;
    frozenBy: string | null;
    reason: string | null;
  }>;
  merchantFreezes: Array<{
    merchantId: string;
    merchantName: string;
    frozen: boolean;
    frozenAt: Date | null;
    frozenBy: string | null;
    reason: string | null;
  }>;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  maintenanceSince: Date | null;
}

const GLOBAL_FREEZE_KEY = 'emergency:global_freeze';
const CRYPTO_FREEZE_PREFIX = 'emergency:crypto_freeze:';
const MAINTENANCE_KEY = 'emergency:maintenance';

class EmergencyService {
  /**
   * Get complete freeze status across the platform.
   */
  async getFreezeStatus(): Promise<FreezeStatus> {
    // Global freeze
    const globalFreezeData = await redis.get(GLOBAL_FREEZE_KEY);
    const globalFreeze = globalFreezeData ? JSON.parse(globalFreezeData) : null;

    // Crypto freezes
    const cryptoFreezes: FreezeStatus['cryptoFreezes'] = [];
    for (const crypto of Object.values(CryptoSymbol)) {
      const data = await redis.get(`${CRYPTO_FREEZE_PREFIX}${crypto}`);
      const parsed = data ? JSON.parse(data) : null;
      cryptoFreezes.push({
        crypto,
        frozen: !!parsed,
        frozenAt: parsed?.frozenAt ? new Date(parsed.frozenAt) : null,
        frozenBy: parsed?.frozenBy || null,
        reason: parsed?.reason || null,
      });
    }

    // Merchant freezes (get from DB)
    const frozenMerchants = await prisma.merchant.findMany({
      where: { isFrozen: true },
      select: {
        id: true,
        email: true,
        businessName: true,
        frozenAt: true,
        frozenBy: true,
        frozenReason: true,
      },
      take: 100,
    });

    // Maintenance mode
    const maintenanceData = await redis.get(MAINTENANCE_KEY);
    const maintenance = maintenanceData ? JSON.parse(maintenanceData) : null;

    return {
      globalFreeze: !!globalFreeze,
      globalFreezeAt: globalFreeze?.frozenAt ? new Date(globalFreeze.frozenAt) : null,
      globalFreezeBy: globalFreeze?.frozenBy || null,
      globalFreezeReason: globalFreeze?.reason || null,
      cryptoFreezes,
      merchantFreezes: frozenMerchants.map((m: any) => ({
        merchantId: m.id,
        merchantName: m.businessName || m.email,
        frozen: true,
        frozenAt: m.frozenAt,
        frozenBy: m.frozenBy || null,
        reason: m.frozenReason || null,
      })),
      maintenanceMode: !!maintenance,
      maintenanceMessage: maintenance?.message || null,
      maintenanceSince: maintenance?.since ? new Date(maintenance.since) : null,
    };
  }

  /**
   * Check if withdrawals are allowed for a given context.
   * Used by the withdrawal processing pipeline.
   */
  async isWithdrawalAllowed(merchantId: string, crypto: string): Promise<{
    allowed: boolean;
    reason: string | null;
  }> {
    // Check global freeze
    const globalFreeze = await redis.get(GLOBAL_FREEZE_KEY);
    if (globalFreeze) {
      return { allowed: false, reason: 'Platform-wide withdrawal freeze is active' };
    }

    // Check crypto freeze
    const cryptoFreeze = await redis.get(`${CRYPTO_FREEZE_PREFIX}${crypto}`);
    if (cryptoFreeze) {
      return { allowed: false, reason: `${crypto} withdrawals are frozen` };
    }

    // Check maintenance mode
    const maintenance = await redis.get(MAINTENANCE_KEY);
    if (maintenance) {
      return { allowed: false, reason: 'Platform is in maintenance mode' };
    }

    // Check merchant freeze
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { isFrozen: true, frozenReason: true },
    });

    if (merchant?.isFrozen) {
      return { allowed: false, reason: merchant.frozenReason || 'Merchant account is frozen' };
    }

    return { allowed: true, reason: null };
  }

  // ═══════════════════════════════════════════════════════
  // GLOBAL FREEZE — Halts ALL withdrawals across the platform
  // ═══════════════════════════════════════════════════════

  async activateGlobalFreeze(
    adminId: string,
    reason: string,
    ipAddress: string,
  ): Promise<void> {
    if (!reason || reason.trim().length < 3) {
      throw new ValidationError('Freeze reason is required');
    }

    const freezeData = {
      frozenAt: new Date().toISOString(),
      frozenBy: adminId,
      reason,
    };

    await redis.set(GLOBAL_FREEZE_KEY, JSON.stringify(freezeData));

    // Also persist in DB for durability
    await prisma.systemSetting.upsert({
      where: { key: 'global_freeze' },
      update: { value: JSON.stringify(freezeData), updatedBy: adminId },
      create: { key: 'global_freeze', value: JSON.stringify(freezeData), updatedBy: adminId },
    });

    await auditService.log({
      adminId,
      action: AuditAction.EMERGENCY_GLOBAL_FREEZE,
      target: 'emergency:global',
      targetId: 'global',
      previousValue: JSON.stringify({ frozen: false }),
      newValue: JSON.stringify({ frozen: true, reason }),
      metadata: { reason },
      ipAddress,
      userAgent: '',
    });

    // Notify all admins
    try {
      await notificationService.notifyAdmins('global_freeze_activated', {
        reason,
        activatedBy: adminId,
      });
    } catch {
      // Non-critical
    }

    logger.warn('GLOBAL FREEZE ACTIVATED', { adminId, reason });
  }

  async deactivateGlobalFreeze(
    adminId: string,
    ipAddress: string,
  ): Promise<void> {
    await redis.del(GLOBAL_FREEZE_KEY);

    await prisma.systemSetting.deleteMany({
      where: { key: 'global_freeze' },
    });

    await auditService.log({
      adminId,
      action: AuditAction.EMERGENCY_GLOBAL_UNFREEZE,
      target: 'emergency:global',
      targetId: 'global',
      previousValue: JSON.stringify({ frozen: true }),
      newValue: JSON.stringify({ frozen: false }),
      metadata: {},
      ipAddress,
      userAgent: '',
    });

    try {
      await notificationService.notifyAdmins('global_freeze_deactivated', {
        deactivatedBy: adminId,
      });
    } catch {
      // Non-critical
    }

    logger.warn('GLOBAL FREEZE DEACTIVATED', { adminId });
  }

  // ═══════════════════════════════════════════════════════
  // PER-CRYPTO FREEZE — Halts operations for a specific crypto
  // ═══════════════════════════════════════════════════════

  async freezeCrypto(
    crypto: CryptoSymbol,
    adminId: string,
    reason: string,
    ipAddress: string,
  ): Promise<void> {
    if (!reason || reason.trim().length < 3) {
      throw new ValidationError('Freeze reason is required');
    }

    const freezeData = {
      crypto,
      frozenAt: new Date().toISOString(),
      frozenBy: adminId,
      reason,
    };

    await redis.set(`${CRYPTO_FREEZE_PREFIX}${crypto}`, JSON.stringify(freezeData));

    await prisma.systemSetting.upsert({
      where: { key: `crypto_freeze:${crypto}` },
      update: { value: JSON.stringify(freezeData), updatedBy: adminId },
      create: { key: `crypto_freeze:${crypto}`, value: JSON.stringify(freezeData), updatedBy: adminId },
    });

    await auditService.log({
      adminId,
      action: AuditAction.EMERGENCY_CRYPTO_FREEZE,
      target: `emergency:crypto:${crypto}`,
      targetId: crypto,
      previousValue: JSON.stringify({ frozen: false }),
      newValue: JSON.stringify({ frozen: true, reason }),
      metadata: { crypto, reason },
      ipAddress,
      userAgent: '',
    });

    try {
      await notificationService.notifyAdmins('crypto_freeze_activated', {
        crypto,
        reason,
        activatedBy: adminId,
      });
    } catch {
      // Non-critical
    }

    logger.warn(`${crypto} FREEZE ACTIVATED`, { adminId, reason });
  }

  async unfreezeCrypto(
    crypto: CryptoSymbol,
    adminId: string,
    ipAddress: string,
  ): Promise<void> {
    await redis.del(`${CRYPTO_FREEZE_PREFIX}${crypto}`);

    await prisma.systemSetting.deleteMany({
      where: { key: `crypto_freeze:${crypto}` },
    });

    await auditService.log({
      adminId,
      action: AuditAction.EMERGENCY_CRYPTO_UNFREEZE,
      target: `emergency:crypto:${crypto}`,
      targetId: crypto,
      previousValue: JSON.stringify({ frozen: true }),
      newValue: JSON.stringify({ frozen: false }),
      metadata: { crypto },
      ipAddress,
      userAgent: '',
    });

    logger.warn(`${crypto} FREEZE DEACTIVATED`, { adminId });
  }

  // ═══════════════════════════════════════════════════════
  // PER-MERCHANT FREEZE — Freeze a specific merchant's ops
  // ═══════════════════════════════════════════════════════

  async freezeMerchant(
    merchantId: string,
    adminId: string,
    reason: string,
    ipAddress: string,
  ): Promise<void> {
    if (!reason || reason.trim().length < 3) {
      throw new ValidationError('Freeze reason is required');
    }

    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        isFrozen: true,
        frozenAt: new Date(),
        frozenBy: adminId,
        frozenReason: reason,
      },
    });

    await auditService.log({
      adminId,
      action: AuditAction.EMERGENCY_MERCHANT_FREEZE,
      target: `merchant:${merchantId}`,
      targetId: merchantId,
      previousValue: JSON.stringify({ frozen: false }),
      newValue: JSON.stringify({ frozen: true, reason }),
      metadata: { merchantId, reason },
      ipAddress,
      userAgent: '',
    });

    // Notify affected merchant
    try {
      await notificationService.notifyMerchant(merchantId, 'account_frozen', { reason });
    } catch {
      // Non-critical
    }

    logger.warn('MERCHANT FROZEN', { merchantId, adminId, reason });
  }

  async unfreezeMerchant(
    merchantId: string,
    adminId: string,
    ipAddress: string,
  ): Promise<void> {
    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        isFrozen: false,
        frozenAt: null,
        frozenBy: null,
        frozenReason: null,
      },
    });

    await auditService.log({
      adminId,
      action: AuditAction.EMERGENCY_MERCHANT_UNFREEZE,
      target: `merchant:${merchantId}`,
      targetId: merchantId,
      previousValue: JSON.stringify({ frozen: true }),
      newValue: JSON.stringify({ frozen: false }),
      metadata: { merchantId },
      ipAddress,
      userAgent: '',
    });

    try {
      await notificationService.notifyMerchant(merchantId, 'account_unfrozen', {});
    } catch {
      // Non-critical
    }

    logger.warn('MERCHANT UNFROZEN', { merchantId, adminId });
  }

  // ═══════════════════════════════════════════════════════
  // MAINTENANCE MODE — Gracefully stop new payments
  // ═══════════════════════════════════════════════════════

  async enableMaintenanceMode(
    adminId: string,
    message: string,
    ipAddress: string,
  ): Promise<void> {
    const data = {
      enabled: true,
      message: message || 'System is under maintenance. Please try again later.',
      since: new Date().toISOString(),
      enabledBy: adminId,
    };

    await redis.set(MAINTENANCE_KEY, JSON.stringify(data));

    await prisma.systemSetting.upsert({
      where: { key: 'maintenance_mode' },
      update: { value: JSON.stringify(data), updatedBy: adminId },
      create: { key: 'maintenance_mode', value: JSON.stringify(data), updatedBy: adminId },
    });

    await auditService.log({
      adminId,
      action: AuditAction.EMERGENCY_MAINTENANCE_ON,
      target: 'emergency:maintenance',
      targetId: 'maintenance',
      previousValue: JSON.stringify({ enabled: false }),
      newValue: JSON.stringify(data),
      metadata: { message },
      ipAddress,
      userAgent: '',
    });

    try {
      await notificationService.notifyAdmins('maintenance_mode_enabled', {
        message,
        enabledBy: adminId,
      });
    } catch {
      // Non-critical
    }

    logger.warn('MAINTENANCE MODE ENABLED', { adminId, message });
  }

  async disableMaintenanceMode(
    adminId: string,
    ipAddress: string,
  ): Promise<void> {
    await redis.del(MAINTENANCE_KEY);

    await prisma.systemSetting.deleteMany({
      where: { key: 'maintenance_mode' },
    });

    await auditService.log({
      adminId,
      action: AuditAction.EMERGENCY_MAINTENANCE_OFF,
      target: 'emergency:maintenance',
      targetId: 'maintenance',
      previousValue: JSON.stringify({ enabled: true }),
      newValue: JSON.stringify({ enabled: false }),
      metadata: {},
      ipAddress,
      userAgent: '',
    });

    logger.warn('MAINTENANCE MODE DISABLED', { adminId });
  }

  /**
   * Check if maintenance mode is active (used by payment routes).
   */
  async isMaintenanceMode(): Promise<{
    active: boolean;
    message: string | null;
  }> {
    const data = await redis.get(MAINTENANCE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return { active: true, message: parsed.message };
    }
    return { active: false, message: null };
  }
}

export const emergencyService = new EmergencyService();
