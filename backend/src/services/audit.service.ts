import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';

// ─────────────────────────────────────────────────────────
// Audit Log Service
// Immutable, append-only audit trail for all admin actions
// ─────────────────────────────────────────────────────────

export enum AuditAction {
  // Auth
  ADMIN_LOGIN = 'admin.login',
  ADMIN_LOGIN_FAILED = 'admin.login_failed',
  ADMIN_LOGOUT = 'admin.logout',
  ADMIN_2FA_VERIFIED = 'admin.2fa_verified',

  // Withdrawal management
  WITHDRAWAL_APPROVED = 'withdrawal.approved',
  WITHDRAWAL_REJECTED = 'withdrawal.rejected',
  EMERGENCY_WITHDRAWAL_OVERRIDE = 'withdrawal.emergency_override',

  // Wallet operations
  WALLET_SWEEP = 'wallet.sweep',
  WALLET_THRESHOLD_UPDATED = 'wallet.threshold_updated',

  // Merchant operations
  MERCHANT_FROZEN = 'merchant.frozen',
  MERCHANT_UNFROZEN = 'merchant.unfrozen',
  MERCHANT_SUSPENDED = 'merchant.suspended',
  MERCHANT_ACTIVATED = 'merchant.activated',
  MERCHANT_DELETED = 'merchant.deleted',

  // KYC/AML
  KYC_APPROVED = 'kyc.approved',
  KYC_REJECTED = 'kyc.rejected',
  KYC_ADDITIONAL_INFO = 'kyc.additional_info',
  AML_SCREENING = 'aml.screening',

  // Fraud
  FRAUD_ALERT_UPDATED = 'fraud.alert_updated',
  ADDRESS_BLACKLISTED = 'fraud.address_blacklisted',

  // Emergency
  EMERGENCY_GLOBAL_FREEZE = 'emergency.global_freeze',
  EMERGENCY_GLOBAL_UNFREEZE = 'emergency.global_unfreeze',
  EMERGENCY_CRYPTO_FREEZE = 'emergency.crypto_freeze',
  EMERGENCY_CRYPTO_UNFREEZE = 'emergency.crypto_unfreeze',
  EMERGENCY_MERCHANT_FREEZE = 'emergency.merchant_freeze',
  EMERGENCY_MERCHANT_UNFREEZE = 'emergency.merchant_unfreeze',
  EMERGENCY_MAINTENANCE_ON = 'emergency.maintenance_on',
  EMERGENCY_MAINTENANCE_OFF = 'emergency.maintenance_off',

  // Settings
  SETTINGS_UPDATED = 'settings.updated',

  // Reconciliation
  RECONCILIATION_RUN = 'reconciliation.run',

  // Session management
  SESSION_FORCE_LOGOUT = 'session.force_logout',
  SESSION_FORCE_LOGOUT_ALL = 'session.force_logout_all',

  // Admin management
  ADMIN_CREATED = 'admin.created',
  ADMIN_ROLE_CHANGED = 'admin.role_changed',
  ADMIN_DEACTIVATED = 'admin.deactivated',
  IP_WHITELIST_UPDATED = 'security.ip_whitelist_updated',
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  adminId: string;
  adminEmail?: string;
  action: AuditAction;
  target: string;
  targetId: string;
  previousValue: string;
  newValue: string;
  metadata: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
}

export interface AuditLogInput {
  adminId: string;
  action: AuditAction;
  target: string;
  targetId: string;
  previousValue: string;
  newValue: string;
  metadata: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
}

class AuditService {
  /**
   * Log an admin action. APPEND-ONLY — no updates, no deletes.
   */
  async log(input: AuditLogInput): Promise<void> {
    try {
      // Get admin email for convenience
      let adminEmail = '';
      if (input.adminId && input.adminId !== 'SYSTEM' && input.adminId !== 'SYSTEM_AUTO_SWEEP') {
        try {
          const admin = await prisma.merchant.findUnique({
            where: { id: input.adminId },
            select: { email: true },
          });
          adminEmail = admin?.email || '';
        } catch {
          // Non-critical
        }
      }

      await prisma.auditLog.create({
        data: {
          adminId: input.adminId,
          adminEmail,
          action: input.action,
          target: input.target,
          targetId: input.targetId,
          previousValue: input.previousValue || '',
          newValue: input.newValue || '',
          metadata: JSON.stringify(input.metadata || {}),
          ipAddress: input.ipAddress || '',
          userAgent: input.userAgent || '',
        },
      });

      // Also push to Redis stream for real-time monitoring
      try {
        await redis.xadd(
          'audit:stream',
          '*',
          'adminId', input.adminId,
          'action', input.action,
          'target', input.target,
          'timestamp', new Date().toISOString(),
        );

        // Trim stream to last 10,000 entries
        await redis.xtrim('audit:stream', 'MAXLEN', '~', 10000);
      } catch {
        // Redis stream is non-critical
      }
    } catch (error) {
      // Audit logging MUST NOT crash the main operation.
      // But we MUST log the failure for debugging.
      logger.error('AUDIT LOG FAILURE — this is a critical issue', {
        input,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Query audit logs with filters.
   * This is read-only — the UI cannot modify or delete entries.
   */
  async query(options: {
    adminId?: string;
    action?: AuditAction;
    actionPrefix?: string;           // e.g., 'emergency.' for all emergency actions
    target?: string;
    targetId?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    entries: AuditEntry[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      adminId,
      action,
      actionPrefix,
      target,
      targetId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50,
    } = options;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (adminId) where.adminId = adminId;
    if (action) where.action = action;
    if (actionPrefix) where.action = { startsWith: actionPrefix };
    if (target) where.target = { contains: target };
    if (targetId) where.targetId = targetId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    if (search) {
      where.OR = [
        { action: { contains: search } },
        { target: { contains: search } },
        { adminEmail: { contains: search } },
        { newValue: { contains: search } },
        { previousValue: { contains: search } },
      ];
    }

    const [entries, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      entries: entries.map((e: any) => ({
        id: e.id,
        timestamp: e.createdAt,
        adminId: e.adminId,
        adminEmail: e.adminEmail || '',
        action: e.action as AuditAction,
        target: e.target,
        targetId: e.targetId,
        previousValue: e.previousValue,
        newValue: e.newValue,
        metadata: typeof e.metadata === 'string' ? JSON.parse(e.metadata) : e.metadata || {},
        ipAddress: e.ipAddress,
        userAgent: e.userAgent,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Export audit logs as JSON (for CSV conversion on the client).
   * Handles large datasets with streaming.
   */
  async exportLogs(options: {
    startDate?: Date;
    endDate?: Date;
    adminId?: string;
    action?: AuditAction;
  } = {}): Promise<AuditEntry[]> {
    const where: any = {};

    if (options.adminId) where.adminId = options.adminId;
    if (options.action) where.action = options.action;

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    // Limit export to 10,000 records max
    const entries = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    return entries.map((e: any) => ({
      id: e.id,
      timestamp: e.createdAt,
      adminId: e.adminId,
      adminEmail: e.adminEmail || '',
      action: e.action as AuditAction,
      target: e.target,
      targetId: e.targetId,
      previousValue: e.previousValue,
      newValue: e.newValue,
      metadata: typeof e.metadata === 'string' ? JSON.parse(e.metadata) : e.metadata || {},
      ipAddress: e.ipAddress,
      userAgent: e.userAgent,
    }));
  }

  /**
   * Get recent activity summary (for dashboard).
   */
  async getRecentActivity(limit: number = 20): Promise<AuditEntry[]> {
    const entries = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return entries.map((e: any) => ({
      id: e.id,
      timestamp: e.createdAt,
      adminId: e.adminId,
      adminEmail: e.adminEmail || '',
      action: e.action as AuditAction,
      target: e.target,
      targetId: e.targetId,
      previousValue: e.previousValue,
      newValue: e.newValue,
      metadata: typeof e.metadata === 'string' ? JSON.parse(e.metadata) : e.metadata || {},
      ipAddress: e.ipAddress,
      userAgent: e.userAgent,
    }));
  }

  /**
   * Get audit stats for a time range.
   */
  async getStats(startDate: Date, endDate: Date): Promise<{
    totalActions: number;
    uniqueAdmins: number;
    actionBreakdown: Record<string, number>;
    topAdmins: Array<{ adminId: string; adminEmail: string; count: number }>;
  }> {
    const where = {
      createdAt: { gte: startDate, lte: endDate },
    };

    const [totalActions, actionGroups, adminGroups] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 20,
      }),
      prisma.auditLog.groupBy({
        by: ['adminId', 'adminEmail'],
        where,
        _count: true,
        orderBy: { _count: { adminId: 'desc' } },
        take: 10,
      }),
    ]);

    const actionBreakdown: Record<string, number> = {};
    for (const group of actionGroups) {
      actionBreakdown[group.action] = group._count;
    }

    return {
      totalActions,
      uniqueAdmins: adminGroups.length,
      actionBreakdown,
      topAdmins: adminGroups.map((g: any) => ({
        adminId: g.adminId,
        adminEmail: g.adminEmail || '',
        count: g._count,
      })),
    };
  }
}

export const auditService = new AuditService();
