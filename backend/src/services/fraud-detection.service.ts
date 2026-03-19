import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { auditService, AuditAction } from './audit.service';
import { notificationService } from './notification.service';
import { logger } from '../utils/logger';

// ─────────────────────────────────────────────────────────
// Fraud Detection & Anomaly Alerts Service
// Real-time monitoring for suspicious activity
// ─────────────────────────────────────────────────────────

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AlertType {
  VELOCITY_LIMIT = 'velocity_limit',
  AMOUNT_ANOMALY = 'amount_anomaly',
  NEW_ADDRESS = 'new_address',
  BLACKLISTED_ADDRESS = 'blacklisted_address',
  IP_MISMATCH = 'ip_mismatch',
  RAPID_WITHDRAWALS = 'rapid_withdrawals',
  UNUSUAL_PATTERN = 'unusual_pattern',
  ACCOUNT_TAKEOVER = 'account_takeover',
  LARGE_WITHDRAWAL = 'large_withdrawal',
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  DISMISSED = 'dismissed',
  ESCALATED = 'escalated',
  AUTO_RESOLVED = 'auto_resolved',
}

export interface FraudAlert {
  id: string;
  merchantId: string;
  merchantName: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  recommendedAction: string;
  autoFrozen: boolean;
  createdAt: Date;
  acknowledgedAt: Date | null;
  acknowledgedBy: string | null;
}

export interface FraudRules {
  velocityChecks: {
    maxWithdrawalsPerHour: number;
    maxWithdrawalsPerDay: number;
    enabled: boolean;
  };
  amountAnomaly: {
    multiplier: number;             // Alert if > N x average
    lookbackDays: number;           // Average over N days
    enabled: boolean;
  };
  newAddress: {
    flagFirstTime: boolean;
    requireReview: boolean;
    enabled: boolean;
  };
  ipMismatch: {
    enabled: boolean;
    geoDistanceKm: number;          // Alert if IP geo > N km from usual
  };
  autoFreeze: {
    onCriticalAlert: boolean;
    onMultipleHighAlerts: number;   // Auto-freeze after N high alerts
    enabled: boolean;
  };
  blacklist: {
    enabled: boolean;
    externalApiEnabled: boolean;    // Check against external sanction APIs
  };
}

const DEFAULT_FRAUD_RULES: FraudRules = {
  velocityChecks: {
    maxWithdrawalsPerHour: 5,
    maxWithdrawalsPerDay: 20,
    enabled: true,
  },
  amountAnomaly: {
    multiplier: 3,
    lookbackDays: 30,
    enabled: true,
  },
  newAddress: {
    flagFirstTime: true,
    requireReview: false,
    enabled: true,
  },
  ipMismatch: {
    enabled: true,
    geoDistanceKm: 500,
  },
  autoFreeze: {
    onCriticalAlert: true,
    onMultipleHighAlerts: 3,
    enabled: true,
  },
  blacklist: {
    enabled: true,
    externalApiEnabled: false,
  },
};

const FRAUD_RULES_KEY = 'settings:fraud_rules';
const VELOCITY_PREFIX = 'fraud:velocity:';
const ADDRESS_HISTORY_PREFIX = 'fraud:address:';

class FraudDetectionService {
  /**
   * Get current fraud detection rules.
   */
  async getRules(): Promise<FraudRules> {
    try {
      const cached = await redis.get(FRAUD_RULES_KEY);
      if (cached) return JSON.parse(cached);

      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'fraud_rules' },
      });
      if (setting) {
        const rules = JSON.parse(setting.value) as FraudRules;
        await redis.setex(FRAUD_RULES_KEY, 300, JSON.stringify(rules));
        return rules;
      }
    } catch {
      // Fall through
    }
    return DEFAULT_FRAUD_RULES;
  }

  /**
   * Update fraud detection rules.
   */
  async updateRules(
    rules: Partial<FraudRules>,
    adminId: string,
  ): Promise<FraudRules> {
    const current = await this.getRules();
    const updated = this.deepMerge(current, rules) as FraudRules;

    await prisma.systemSetting.upsert({
      where: { key: 'fraud_rules' },
      update: { value: JSON.stringify(updated), updatedBy: adminId },
      create: { key: 'fraud_rules', value: JSON.stringify(updated), updatedBy: adminId },
    });

    await redis.setex(FRAUD_RULES_KEY, 300, JSON.stringify(updated));

    await auditService.log({
      adminId,
      action: AuditAction.SETTINGS_UPDATED,
      target: 'settings:fraud_rules',
      targetId: 'fraud_rules',
      previousValue: JSON.stringify(current),
      newValue: JSON.stringify(updated),
      metadata: {},
      ipAddress: '',
      userAgent: '',
    });

    return updated;
  }

  /**
   * Check a withdrawal request against all fraud rules.
   * Returns any triggered alerts.
   */
  async checkWithdrawal(params: {
    merchantId: string;
    crypto: string;
    amount: string;
    toAddress: string;
    ipAddress: string;
  }): Promise<{
    allowed: boolean;
    alerts: FraudAlert[];
    frozen: boolean;
  }> {
    const rules = await this.getRules();
    const alerts: FraudAlert[] = [];
    let frozen = false;

    const merchant = await prisma.merchant.findUnique({
      where: { id: params.merchantId },
      select: { id: true, email: true, businessName: true, isFrozen: true },
    });

    if (!merchant) {
      return { allowed: false, alerts: [], frozen: false };
    }

    if (merchant.isFrozen) {
      return { allowed: false, alerts: [], frozen: true };
    }

    const merchantName = merchant.businessName || merchant.email;

    // 1. Velocity checks
    if (rules.velocityChecks.enabled) {
      const velocityAlert = await this.checkVelocity(
        params.merchantId,
        merchantName,
        rules.velocityChecks,
      );
      if (velocityAlert) alerts.push(velocityAlert);
    }

    // 2. Amount anomaly
    if (rules.amountAnomaly.enabled) {
      const anomalyAlert = await this.checkAmountAnomaly(
        params.merchantId,
        merchantName,
        params.crypto,
        params.amount,
        rules.amountAnomaly,
      );
      if (anomalyAlert) alerts.push(anomalyAlert);
    }

    // 3. New address check
    if (rules.newAddress.enabled) {
      const addressAlert = await this.checkNewAddress(
        params.merchantId,
        merchantName,
        params.toAddress,
        params.crypto,
        rules.newAddress,
      );
      if (addressAlert) alerts.push(addressAlert);
    }

    // 4. Blacklist check
    if (rules.blacklist.enabled) {
      const blacklistAlert = await this.checkBlacklist(
        params.merchantId,
        merchantName,
        params.toAddress,
      );
      if (blacklistAlert) alerts.push(blacklistAlert);
    }

    // 5. IP geolocation mismatch
    if (rules.ipMismatch.enabled) {
      const ipAlert = await this.checkIpMismatch(
        params.merchantId,
        merchantName,
        params.ipAddress,
        rules.ipMismatch,
      );
      if (ipAlert) alerts.push(ipAlert);
    }

    // Store alerts in DB
    for (const alert of alerts) {
      await this.createAlert(alert);
    }

    // Auto-freeze logic
    if (rules.autoFreeze.enabled) {
      const criticalAlerts = alerts.filter((a) => a.severity === AlertSeverity.CRITICAL);
      const highAlerts = alerts.filter((a) => a.severity === AlertSeverity.HIGH);

      if (
        (rules.autoFreeze.onCriticalAlert && criticalAlerts.length > 0) ||
        highAlerts.length >= rules.autoFreeze.onMultipleHighAlerts
      ) {
        await this.autoFreezeAccount(params.merchantId, alerts);
        frozen = true;
      }
    }

    // Track velocity
    await this.incrementVelocity(params.merchantId);

    const blocked = alerts.some(
      (a) => a.severity === AlertSeverity.CRITICAL || a.type === AlertType.BLACKLISTED_ADDRESS,
    );

    return {
      allowed: !blocked && !frozen,
      alerts,
      frozen,
    };
  }

  /**
   * Velocity check: max withdrawals per hour/day.
   */
  private async checkVelocity(
    merchantId: string,
    merchantName: string,
    config: FraudRules['velocityChecks'],
  ): Promise<FraudAlert | null> {
    const hourKey = `${VELOCITY_PREFIX}${merchantId}:hour`;
    const dayKey = `${VELOCITY_PREFIX}${merchantId}:day`;

    const hourCount = Number(await redis.get(hourKey)) || 0;
    const dayCount = Number(await redis.get(dayKey)) || 0;

    if (hourCount >= config.maxWithdrawalsPerHour) {
      return {
        id: '',
        merchantId,
        merchantName,
        type: AlertType.VELOCITY_LIMIT,
        severity: AlertSeverity.HIGH,
        status: AlertStatus.ACTIVE,
        title: 'Hourly withdrawal velocity limit exceeded',
        description: `Merchant has made ${hourCount} withdrawals in the last hour (limit: ${config.maxWithdrawalsPerHour})`,
        metadata: { hourCount, limit: config.maxWithdrawalsPerHour },
        recommendedAction: 'Review merchant activity and consider temporary hold',
        autoFrozen: false,
        createdAt: new Date(),
        acknowledgedAt: null,
        acknowledgedBy: null,
      };
    }

    if (dayCount >= config.maxWithdrawalsPerDay) {
      return {
        id: '',
        merchantId,
        merchantName,
        type: AlertType.VELOCITY_LIMIT,
        severity: AlertSeverity.MEDIUM,
        status: AlertStatus.ACTIVE,
        title: 'Daily withdrawal velocity limit exceeded',
        description: `Merchant has made ${dayCount} withdrawals today (limit: ${config.maxWithdrawalsPerDay})`,
        metadata: { dayCount, limit: config.maxWithdrawalsPerDay },
        recommendedAction: 'Monitor merchant — may require verification contact',
        autoFrozen: false,
        createdAt: new Date(),
        acknowledgedAt: null,
        acknowledgedBy: null,
      };
    }

    return null;
  }

  /**
   * Amount anomaly: alert if withdrawal > N x average.
   */
  private async checkAmountAnomaly(
    merchantId: string,
    merchantName: string,
    crypto: string,
    amount: string,
    config: FraudRules['amountAnomaly'],
  ): Promise<FraudAlert | null> {
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - config.lookbackDays);

    const avgResult = await prisma.withdrawal.aggregate({
      where: {
        merchantId,
        crypto,
        createdAt: { gte: lookbackDate },
        status: { in: ['COMPLETED', 'APPROVED', 'PROCESSING'] },
      },
      _avg: { amount: true },
      _count: true,
    });

    const avgAmount = Number(avgResult._avg.amount || 0);
    const withdrawalCount = avgResult._count;
    const requestedAmount = Number(amount);

    // Need at least 3 historical withdrawals for meaningful comparison
    if (withdrawalCount < 3 || avgAmount === 0) return null;

    if (requestedAmount > avgAmount * config.multiplier) {
      const severity =
        requestedAmount > avgAmount * config.multiplier * 2
          ? AlertSeverity.CRITICAL
          : AlertSeverity.HIGH;

      return {
        id: '',
        merchantId,
        merchantName,
        type: AlertType.AMOUNT_ANOMALY,
        severity,
        status: AlertStatus.ACTIVE,
        title: 'Unusual withdrawal amount detected',
        description: `Withdrawal of ${amount} ${crypto} is ${(requestedAmount / avgAmount).toFixed(1)}x the average (${avgAmount.toFixed(6)} ${crypto} over ${config.lookbackDays} days)`,
        metadata: {
          requestedAmount: amount,
          averageAmount: avgAmount,
          multiplier: requestedAmount / avgAmount,
          historyCount: withdrawalCount,
        },
        recommendedAction: 'Verify withdrawal with merchant before approval',
        autoFrozen: false,
        createdAt: new Date(),
        acknowledgedAt: null,
        acknowledgedBy: null,
      };
    }

    return null;
  }

  /**
   * New address check: flag first-time withdrawal addresses.
   */
  private async checkNewAddress(
    merchantId: string,
    merchantName: string,
    toAddress: string,
    crypto: string,
    config: FraudRules['newAddress'],
  ): Promise<FraudAlert | null> {
    if (!config.flagFirstTime) return null;

    // Check if this address has been used before by this merchant
    const existingWithdrawal = await prisma.withdrawal.findFirst({
      where: {
        merchantId,
        toAddress,
        status: { in: ['COMPLETED', 'APPROVED', 'PROCESSING'] },
      },
    });

    if (!existingWithdrawal) {
      return {
        id: '',
        merchantId,
        merchantName,
        type: AlertType.NEW_ADDRESS,
        severity: config.requireReview ? AlertSeverity.MEDIUM : AlertSeverity.LOW,
        status: AlertStatus.ACTIVE,
        title: 'First-time withdrawal address',
        description: `Withdrawal to new ${crypto} address: ${toAddress.substring(0, 12)}...${toAddress.substring(toAddress.length - 6)}`,
        metadata: { toAddress, crypto },
        recommendedAction: 'Verify address ownership with merchant',
        autoFrozen: false,
        createdAt: new Date(),
        acknowledgedAt: null,
        acknowledgedBy: null,
      };
    }

    return null;
  }

  /**
   * Blacklist check: check address against known sanctioned addresses.
   */
  private async checkBlacklist(
    merchantId: string,
    merchantName: string,
    toAddress: string,
  ): Promise<FraudAlert | null> {
    const blacklisted = await prisma.addressBlacklist.findFirst({
      where: { address: toAddress.toLowerCase() },
    });

    if (blacklisted) {
      return {
        id: '',
        merchantId,
        merchantName,
        type: AlertType.BLACKLISTED_ADDRESS,
        severity: AlertSeverity.CRITICAL,
        status: AlertStatus.ACTIVE,
        title: 'BLACKLISTED ADDRESS — Withdrawal blocked',
        description: `Withdrawal to blacklisted address: ${toAddress}. Reason: ${blacklisted.reason || 'Sanctioned/flagged address'}`,
        metadata: {
          toAddress,
          blacklistId: blacklisted.id,
          reason: blacklisted.reason,
          source: blacklisted.source,
        },
        recommendedAction: 'BLOCK immediately. Report to compliance. Do NOT process.',
        autoFrozen: false,
        createdAt: new Date(),
        acknowledgedAt: null,
        acknowledgedBy: null,
      };
    }

    return null;
  }

  /**
   * IP geolocation mismatch check.
   */
  private async checkIpMismatch(
    merchantId: string,
    merchantName: string,
    ipAddress: string,
    config: FraudRules['ipMismatch'],
  ): Promise<FraudAlert | null> {
    // Get merchant's usual IP pattern from recent logins
    const recentLogins = await prisma.adminLoginLog.findMany({
      where: { adminId: merchantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { ipAddress: true, country: true, city: true },
    });

    if (recentLogins.length < 3) return null; // Not enough history

    const usualIps = new Set(recentLogins.map((l) => l.ipAddress));
    const usualCountries = new Set(recentLogins.map((l) => l.country).filter(Boolean));

    if (!usualIps.has(ipAddress)) {
      // New IP — check if country matches
      // In production, use a geo-IP service for proper distance calculation
      return {
        id: '',
        merchantId,
        merchantName,
        type: AlertType.IP_MISMATCH,
        severity: AlertSeverity.MEDIUM,
        status: AlertStatus.ACTIVE,
        title: 'Withdrawal from unfamiliar IP address',
        description: `Withdrawal initiated from IP ${ipAddress} which differs from usual pattern`,
        metadata: {
          currentIp: ipAddress,
          usualIps: Array.from(usualIps),
          usualCountries: Array.from(usualCountries),
        },
        recommendedAction: 'Verify identity of the requester — possible unauthorized access',
        autoFrozen: false,
        createdAt: new Date(),
        acknowledgedAt: null,
        acknowledgedBy: null,
      };
    }

    return null;
  }

  /**
   * Increment velocity counter for a merchant.
   */
  private async incrementVelocity(merchantId: string): Promise<void> {
    const hourKey = `${VELOCITY_PREFIX}${merchantId}:hour`;
    const dayKey = `${VELOCITY_PREFIX}${merchantId}:day`;

    await redis.multi()
      .incr(hourKey)
      .expire(hourKey, 3600)      // 1 hour TTL
      .incr(dayKey)
      .expire(dayKey, 86400)      // 24 hour TTL
      .exec();
  }

  /**
   * Auto-freeze a merchant account due to suspicious activity.
   */
  private async autoFreezeAccount(
    merchantId: string,
    alerts: FraudAlert[],
  ): Promise<void> {
    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        isFrozen: true,
        frozenAt: new Date(),
        frozenReason: `Auto-frozen due to fraud alerts: ${alerts.map((a) => a.type).join(', ')}`,
      },
    });

    // Mark alerts as auto-frozen
    for (const alert of alerts) {
      alert.autoFrozen = true;
    }

    try {
      await notificationService.notifyAdmins('account_auto_frozen', {
        merchantId,
        reason: alerts.map((a) => a.title).join('; '),
        alertCount: alerts.length,
      });
    } catch {
      // Non-critical
    }

    logger.warn('Account auto-frozen due to fraud detection', {
      merchantId,
      alertCount: alerts.length,
      alertTypes: alerts.map((a) => a.type),
    });
  }

  /**
   * Store a fraud alert in the database.
   */
  private async createAlert(alert: FraudAlert): Promise<FraudAlert> {
    const created = await prisma.fraudAlert.create({
      data: {
        merchantId: alert.merchantId,
        type: alert.type,
        severity: alert.severity,
        status: alert.status,
        title: alert.title,
        description: alert.description,
        metadata: JSON.stringify(alert.metadata),
        recommendedAction: alert.recommendedAction,
        autoFrozen: alert.autoFrozen,
      },
    });

    alert.id = created.id;
    return alert;
  }

  /**
   * Get fraud alerts with filters.
   */
  async getAlerts(options: {
    status?: AlertStatus;
    severity?: AlertSeverity;
    merchantId?: string;
    type?: AlertType;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    alerts: FraudAlert[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { status, severity, merchantId, type, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (merchantId) where.merchantId = merchantId;
    if (type) where.type = type;

    const [alerts, total] = await Promise.all([
      prisma.fraudAlert.findMany({
        where,
        include: {
          merchant: { select: { id: true, email: true, businessName: true } },
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.fraudAlert.count({ where }),
    ]);

    return {
      alerts: alerts.map((a: any) => ({
        id: a.id,
        merchantId: a.merchantId,
        merchantName: a.merchant?.businessName || a.merchant?.email || 'Unknown',
        type: a.type as AlertType,
        severity: a.severity as AlertSeverity,
        status: a.status as AlertStatus,
        title: a.title,
        description: a.description,
        metadata: typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata || {},
        recommendedAction: a.recommendedAction,
        autoFrozen: a.autoFrozen,
        createdAt: a.createdAt,
        acknowledgedAt: a.acknowledgedAt,
        acknowledgedBy: a.acknowledgedBy,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Acknowledge a fraud alert.
   */
  async acknowledgeAlert(
    alertId: string,
    adminId: string,
    action: 'acknowledged' | 'dismissed' | 'escalated',
    notes?: string,
  ): Promise<void> {
    const alert = await prisma.fraudAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    const statusMap: Record<string, AlertStatus> = {
      acknowledged: AlertStatus.ACKNOWLEDGED,
      dismissed: AlertStatus.DISMISSED,
      escalated: AlertStatus.ESCALATED,
    };

    await prisma.fraudAlert.update({
      where: { id: alertId },
      data: {
        status: statusMap[action],
        acknowledgedAt: new Date(),
        acknowledgedBy: adminId,
        notes: notes || undefined,
      },
    });

    await auditService.log({
      adminId,
      action: AuditAction.FRAUD_ALERT_UPDATED,
      target: `fraud_alert:${alertId}`,
      targetId: alertId,
      previousValue: JSON.stringify({ status: alert.status }),
      newValue: JSON.stringify({ status: statusMap[action], notes }),
      metadata: { alertType: alert.type, severity: alert.severity },
      ipAddress: '',
      userAgent: '',
    });

    logger.info('Fraud alert updated', {
      alertId,
      action,
      adminId,
    });
  }

  /**
   * Get alert counts by severity (for dashboard).
   */
  async getAlertCounts(): Promise<Record<AlertSeverity, number>> {
    const counts = await prisma.fraudAlert.groupBy({
      by: ['severity'],
      where: { status: AlertStatus.ACTIVE },
      _count: true,
    });

    const result: Record<AlertSeverity, number> = {
      [AlertSeverity.LOW]: 0,
      [AlertSeverity.MEDIUM]: 0,
      [AlertSeverity.HIGH]: 0,
      [AlertSeverity.CRITICAL]: 0,
    };

    for (const c of counts) {
      result[c.severity as AlertSeverity] = c._count;
    }

    return result;
  }

  /**
   * Add an address to the blacklist.
   */
  async blacklistAddress(
    address: string,
    reason: string,
    source: string,
    adminId: string,
  ): Promise<void> {
    await prisma.addressBlacklist.upsert({
      where: { address: address.toLowerCase() },
      update: { reason, source, updatedBy: adminId },
      create: {
        address: address.toLowerCase(),
        reason,
        source,
        addedBy: adminId,
      },
    });

    await auditService.log({
      adminId,
      action: AuditAction.ADDRESS_BLACKLISTED,
      target: `blacklist:${address}`,
      targetId: address,
      previousValue: '',
      newValue: JSON.stringify({ address, reason, source }),
      metadata: {},
      ipAddress: '',
      userAgent: '',
    });

    logger.info('Address blacklisted', { address, reason, adminId });
  }

  /**
   * Deep merge utility for nested fraud rules.
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    for (const key of Object.keys(source)) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        target[key] &&
        typeof target[key] === 'object'
      ) {
        output[key] = this.deepMerge(target[key], source[key]);
      } else if (source[key] !== undefined) {
        output[key] = source[key];
      }
    }
    return output;
  }
}

export const fraudDetectionService = new FraudDetectionService();
