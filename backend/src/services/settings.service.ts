import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { CryptoSymbol } from '../config/crypto';
import { auditService, AuditAction } from './audit.service';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';

// ─────────────────────────────────────────────────────────
// System Settings Service
// Centralized configuration for the entire platform
// Every change is logged to the audit trail
// ─────────────────────────────────────────────────────────

export interface PlatformSettings {
  fees: {
    platformFeePercent: number;           // Default 0.5%
    perCryptoOverrides: Record<string, number>; // e.g., { BTC: 0.3, ETH: 0.4 }
  };
  withdrawals: {
    minimumAmounts: Record<string, string>;    // Min withdrawal per crypto
    maximumAmounts: Record<string, Record<number, string>>; // Max per crypto per tier
  };
  hotWallet: {
    thresholds: Record<string, {
      hotMinAmount: string;
      hotMaxAmount: string;
      hotMaxPercent: number;
      autoSweepEnabled: boolean;
    }>;
  };
  multiSig: {
    autoApproveLimit: number;
    singleApprovalLimit: number;
    requiredApprovals: number;
    coolingPeriodHours: number;
  };
  fraud: {
    velocityMaxPerHour: number;
    velocityMaxPerDay: number;
    amountAnomalyMultiplier: number;
    autoFreezeEnabled: boolean;
    newAddressFlag: boolean;
  };
  maintenance: {
    enabled: boolean;
    message: string;
  };
}

const SETTINGS_CACHE_KEY = 'platform:settings';
const SETTINGS_CACHE_TTL = 60; // 1 minute

const DEFAULT_SETTINGS: PlatformSettings = {
  fees: {
    platformFeePercent: 0.5,
    perCryptoOverrides: {},
  },
  withdrawals: {
    minimumAmounts: {
      BTC: '0.0001',
      ETH: '0.001',
      USDT_ERC20: '10',
      USDT_TRC20: '10',
      BNB: '0.01',
      SOL: '0.1',
      MATIC: '10',
      LTC: '0.01',
      DOGE: '100',
      XRP: '10',
    },
    maximumAmounts: {
      // Per tier: 0 = $1K, 1 = $10K, 2 = unlimited
      BTC: { 0: '0.05', 1: '0.5', 2: '999' },
      ETH: { 0: '0.5', 1: '5', 2: '9999' },
      USDT_ERC20: { 0: '1000', 1: '10000', 2: '999999' },
      USDT_TRC20: { 0: '1000', 1: '10000', 2: '999999' },
      BNB: { 0: '2', 1: '20', 2: '9999' },
      SOL: { 0: '20', 1: '200', 2: '99999' },
      MATIC: { 0: '2000', 1: '20000', 2: '999999' },
      LTC: { 0: '5', 1: '50', 2: '9999' },
      DOGE: { 0: '10000', 1: '100000', 2: '9999999' },
      XRP: { 0: '2000', 1: '20000', 2: '999999' },
    },
  },
  hotWallet: {
    thresholds: {
      BTC: { hotMinAmount: '0.1', hotMaxAmount: '2.0', hotMaxPercent: 10, autoSweepEnabled: true },
      ETH: { hotMinAmount: '1.0', hotMaxAmount: '50.0', hotMaxPercent: 15, autoSweepEnabled: true },
      USDT_ERC20: { hotMinAmount: '5000', hotMaxAmount: '100000', hotMaxPercent: 15, autoSweepEnabled: true },
      USDT_TRC20: { hotMinAmount: '5000', hotMaxAmount: '100000', hotMaxPercent: 15, autoSweepEnabled: true },
      SOL: { hotMinAmount: '50', hotMaxAmount: '5000', hotMaxPercent: 15, autoSweepEnabled: true },
      BNB: { hotMinAmount: '5', hotMaxAmount: '500', hotMaxPercent: 15, autoSweepEnabled: true },
      MATIC: { hotMinAmount: '1000', hotMaxAmount: '50000', hotMaxPercent: 20, autoSweepEnabled: true },
      LTC: { hotMinAmount: '10', hotMaxAmount: '500', hotMaxPercent: 15, autoSweepEnabled: true },
      DOGE: { hotMinAmount: '10000', hotMaxAmount: '500000', hotMaxPercent: 15, autoSweepEnabled: true },
      XRP: { hotMinAmount: '5000', hotMaxAmount: '200000', hotMaxPercent: 15, autoSweepEnabled: true },
    },
  },
  multiSig: {
    autoApproveLimit: 1000,
    singleApprovalLimit: 10000,
    requiredApprovals: 2,
    coolingPeriodHours: 24,
  },
  fraud: {
    velocityMaxPerHour: 5,
    velocityMaxPerDay: 20,
    amountAnomalyMultiplier: 3,
    autoFreezeEnabled: true,
    newAddressFlag: true,
  },
  maintenance: {
    enabled: false,
    message: '',
  },
};

class SettingsService {
  /**
   * Get all platform settings.
   */
  async getSettings(): Promise<PlatformSettings> {
    try {
      const cached = await redis.get(SETTINGS_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // Continue without cache
    }

    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'platform_settings' },
      });

      if (setting) {
        const settings = JSON.parse(setting.value) as PlatformSettings;
        await redis.setex(SETTINGS_CACHE_KEY, SETTINGS_CACHE_TTL, JSON.stringify(settings));
        return settings;
      }
    } catch {
      // Fall through
    }

    return DEFAULT_SETTINGS;
  }

  /**
   * Update platform settings (partial update).
   * Every change is logged to the audit trail.
   */
  async updateSettings(
    updates: Partial<PlatformSettings>,
    adminId: string,
    ipAddress: string,
  ): Promise<PlatformSettings> {
    const current = await this.getSettings();

    // Deep merge updates
    const updated = this.deepMerge(current, updates) as PlatformSettings;

    // Validate
    this.validateSettings(updated);

    // Persist
    await prisma.systemSetting.upsert({
      where: { key: 'platform_settings' },
      update: {
        value: JSON.stringify(updated),
        updatedBy: adminId,
      },
      create: {
        key: 'platform_settings',
        value: JSON.stringify(updated),
        updatedBy: adminId,
      },
    });

    // Invalidate cache
    await redis.del(SETTINGS_CACHE_KEY);
    await redis.setex(SETTINGS_CACHE_KEY, SETTINGS_CACHE_TTL, JSON.stringify(updated));

    // Audit log with diff
    const changes = this.computeDiff(current, updated);
    await auditService.log({
      adminId,
      action: AuditAction.SETTINGS_UPDATED,
      target: 'platform_settings',
      targetId: 'platform_settings',
      previousValue: JSON.stringify(current),
      newValue: JSON.stringify(updated),
      metadata: { changes },
      ipAddress,
      userAgent: '',
    });

    logger.info('Platform settings updated', {
      adminId,
      changeCount: Object.keys(changes).length,
    });

    return updated;
  }

  /**
   * Get a specific setting section.
   */
  async getFees(): Promise<PlatformSettings['fees']> {
    const settings = await this.getSettings();
    return settings.fees;
  }

  async getWithdrawalLimits(): Promise<PlatformSettings['withdrawals']> {
    const settings = await this.getSettings();
    return settings.withdrawals;
  }

  async getHotWalletConfig(): Promise<PlatformSettings['hotWallet']> {
    const settings = await this.getSettings();
    return settings.hotWallet;
  }

  async getMultiSigConfig(): Promise<PlatformSettings['multiSig']> {
    const settings = await this.getSettings();
    return settings.multiSig;
  }

  async getFraudConfig(): Promise<PlatformSettings['fraud']> {
    const settings = await this.getSettings();
    return settings.fraud;
  }

  /**
   * Get the platform fee for a specific crypto.
   * Uses per-crypto override if available, otherwise default.
   */
  async getPlatformFee(crypto: string): Promise<number> {
    const fees = await this.getFees();
    return fees.perCryptoOverrides[crypto] ?? fees.platformFeePercent;
  }

  /**
   * Get minimum withdrawal amount for a crypto.
   */
  async getMinWithdrawalAmount(crypto: string): Promise<string> {
    const limits = await this.getWithdrawalLimits();
    return limits.minimumAmounts[crypto] || '0';
  }

  /**
   * Get maximum withdrawal amount for a crypto and tier.
   */
  async getMaxWithdrawalAmount(crypto: string, tier: number): Promise<string> {
    const limits = await this.getWithdrawalLimits();
    const cryptoMaxes = limits.maximumAmounts[crypto];
    if (!cryptoMaxes) return '999999';
    return cryptoMaxes[tier] || cryptoMaxes[2] || '999999';
  }

  // ═══════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════

  private validateSettings(settings: PlatformSettings): void {
    // Fee validation
    if (settings.fees.platformFeePercent < 0 || settings.fees.platformFeePercent > 10) {
      throw new ValidationError('Platform fee must be between 0% and 10%');
    }

    for (const [crypto, fee] of Object.entries(settings.fees.perCryptoOverrides)) {
      if (fee < 0 || fee > 10) {
        throw new ValidationError(`Fee override for ${crypto} must be between 0% and 10%`);
      }
    }

    // Multi-sig validation
    if (settings.multiSig.autoApproveLimit < 0) {
      throw new ValidationError('Auto-approve limit cannot be negative');
    }
    if (settings.multiSig.singleApprovalLimit <= settings.multiSig.autoApproveLimit) {
      throw new ValidationError('Single approval limit must be greater than auto-approve limit');
    }
    if (settings.multiSig.requiredApprovals < 2) {
      throw new ValidationError('Multi-sig requires at least 2 approvals');
    }
    if (settings.multiSig.coolingPeriodHours < 1) {
      throw new ValidationError('Cooling period must be at least 1 hour');
    }

    // Fraud config validation
    if (settings.fraud.velocityMaxPerHour < 1) {
      throw new ValidationError('Velocity limit per hour must be at least 1');
    }
    if (settings.fraud.velocityMaxPerDay < settings.fraud.velocityMaxPerHour) {
      throw new ValidationError('Daily velocity limit must be >= hourly limit');
    }
    if (settings.fraud.amountAnomalyMultiplier < 1.5) {
      throw new ValidationError('Amount anomaly multiplier must be at least 1.5x');
    }
  }

  // ═══════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════

  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    for (const key of Object.keys(source)) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        target[key] &&
        typeof target[key] === 'object' &&
        !Array.isArray(target[key])
      ) {
        output[key] = this.deepMerge(target[key], source[key]);
      } else if (source[key] !== undefined) {
        output[key] = source[key];
      }
    }
    return output;
  }

  private computeDiff(
    prev: Record<string, any>,
    next: Record<string, any>,
    prefix: string = '',
  ): Record<string, { from: any; to: any }> {
    const diff: Record<string, { from: any; to: any }> = {};

    for (const key of new Set([...Object.keys(prev), ...Object.keys(next)])) {
      const path = prefix ? `${prefix}.${key}` : key;
      const prevVal = prev[key];
      const nextVal = next[key];

      if (
        typeof prevVal === 'object' &&
        typeof nextVal === 'object' &&
        prevVal !== null &&
        nextVal !== null &&
        !Array.isArray(prevVal)
      ) {
        Object.assign(diff, this.computeDiff(prevVal, nextVal, path));
      } else if (JSON.stringify(prevVal) !== JSON.stringify(nextVal)) {
        diff[path] = { from: prevVal, to: nextVal };
      }
    }

    return diff;
  }
}

export const settingsService = new SettingsService();
