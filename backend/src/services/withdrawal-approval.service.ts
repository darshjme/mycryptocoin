import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { AdminRole } from './rbac.service';
import { auditService, AuditAction } from './audit.service';
import { notificationService } from './notification.service';
import { logger } from '../utils/logger';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors';

// ─────────────────────────────────────────────────────────
// Multi-Signature Withdrawal Approval Service
// Handles tiered approval flows for withdrawals
// ─────────────────────────────────────────────────────────

export interface ApprovalThresholds {
  autoApproveLimit: number;       // USD value below this = auto-approve
  singleApprovalLimit: number;    // USD value below this = 1 admin needed
  multiApprovalLimit: number;     // USD value above this = 2+ admins needed
  requiredApprovals: number;      // Number of approvals for multi-sig
  coolingPeriodHours: number;     // Cooling period for large withdrawals
}

export interface WithdrawalApproval {
  id: string;
  withdrawalId: string;
  adminId: string;
  adminEmail: string;
  adminRole: AdminRole;
  action: 'APPROVED' | 'REJECTED';
  comment: string;
  createdAt: Date;
}

export interface PendingWithdrawal {
  id: string;
  merchantId: string;
  merchantName: string;
  crypto: string;
  amount: string;
  amountUsd: number;
  toAddress: string;
  status: string;
  requiredApprovals: number;
  currentApprovals: number;
  approvals: WithdrawalApproval[];
  coolingEndsAt: Date | null;
  createdAt: Date;
}

const DEFAULT_THRESHOLDS: ApprovalThresholds = {
  autoApproveLimit: 1000,         // <$1000 auto-approve
  singleApprovalLimit: 10000,     // $1000-$10000 need 1 admin
  multiApprovalLimit: 10000,      // >$10000 need 2 admins
  requiredApprovals: 2,
  coolingPeriodHours: 24,
};

const APPROVAL_QUEUE_KEY = 'withdrawal:approval:queue';
const COOLING_PREFIX = 'withdrawal:cooling:';

class WithdrawalApprovalService {
  /**
   * Get current approval thresholds from settings or defaults.
   */
  async getThresholds(): Promise<ApprovalThresholds> {
    try {
      const cached = await redis.get('settings:approval_thresholds');
      if (cached) {
        return JSON.parse(cached) as ApprovalThresholds;
      }

      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'approval_thresholds' },
      });

      if (setting) {
        const thresholds = JSON.parse(setting.value) as ApprovalThresholds;
        await redis.setex('settings:approval_thresholds', 300, JSON.stringify(thresholds));
        return thresholds;
      }
    } catch {
      // Fall through to defaults
    }

    return DEFAULT_THRESHOLDS;
  }

  /**
   * Determine how many approvals are needed for a withdrawal amount (in USD).
   */
  async getRequiredApprovals(amountUsd: number): Promise<{
    autoApprove: boolean;
    requiredCount: number;
    requiresCooling: boolean;
  }> {
    const thresholds = await this.getThresholds();

    if (amountUsd < thresholds.autoApproveLimit) {
      return { autoApprove: true, requiredCount: 0, requiresCooling: false };
    }

    if (amountUsd < thresholds.singleApprovalLimit) {
      return { autoApprove: false, requiredCount: 1, requiresCooling: false };
    }

    return {
      autoApprove: false,
      requiredCount: thresholds.requiredApprovals,
      requiresCooling: true,
    };
  }

  /**
   * Submit a withdrawal for approval.
   * Called by the withdrawal service after initial validation.
   */
  async submitForApproval(
    withdrawalId: string,
    merchantId: string,
    crypto: string,
    amount: string,
    amountUsd: number,
    toAddress: string,
  ): Promise<{
    status: 'auto_approved' | 'pending_approval';
    requiredApprovals: number;
    coolingEndsAt: Date | null;
  }> {
    const { autoApprove, requiredCount, requiresCooling } =
      await this.getRequiredApprovals(amountUsd);

    if (autoApprove) {
      logger.info('Withdrawal auto-approved', {
        withdrawalId,
        amountUsd,
        crypto,
      });

      await prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'APPROVED',
          approvalStatus: 'AUTO_APPROVED',
          requiredApprovals: 0,
          currentApprovals: 0,
        },
      });

      return {
        status: 'auto_approved',
        requiredApprovals: 0,
        coolingEndsAt: null,
      };
    }

    const thresholds = await this.getThresholds();
    let coolingEndsAt: Date | null = null;

    if (requiresCooling) {
      coolingEndsAt = new Date(
        Date.now() + thresholds.coolingPeriodHours * 60 * 60 * 1000,
      );
      await redis.setex(
        `${COOLING_PREFIX}${withdrawalId}`,
        thresholds.coolingPeriodHours * 60 * 60,
        coolingEndsAt.toISOString(),
      );
    }

    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'PENDING_APPROVAL',
        approvalStatus: 'PENDING',
        requiredApprovals: requiredCount,
        currentApprovals: 0,
        coolingEndsAt,
      },
    });

    // Add to approval queue in Redis for real-time notifications
    await redis.lpush(
      APPROVAL_QUEUE_KEY,
      JSON.stringify({
        withdrawalId,
        merchantId,
        crypto,
        amount,
        amountUsd,
        toAddress,
        requiredApprovals: requiredCount,
        coolingEndsAt: coolingEndsAt?.toISOString() || null,
        createdAt: new Date().toISOString(),
      }),
    );

    // Notify admins
    try {
      await notificationService.notifyAdmins(
        'withdrawal_approval_needed',
        {
          withdrawalId,
          crypto,
          amount,
          amountUsd,
          requiredApprovals: requiredCount,
        },
      );
    } catch (error) {
      logger.warn('Failed to notify admins about pending withdrawal', { error });
    }

    logger.info('Withdrawal submitted for approval', {
      withdrawalId,
      requiredApprovals: requiredCount,
      coolingEndsAt,
    });

    return {
      status: 'pending_approval',
      requiredApprovals: requiredCount,
      coolingEndsAt,
    };
  }

  /**
   * Approve a withdrawal.
   * Records the admin's approval and processes if threshold met.
   */
  async approveWithdrawal(
    withdrawalId: string,
    adminId: string,
    adminEmail: string,
    adminRole: AdminRole,
    comment: string,
  ): Promise<{
    approved: boolean;
    currentApprovals: number;
    requiredApprovals: number;
    message: string;
  }> {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { merchant: { select: { id: true, email: true, businessName: true } } },
    });

    if (!withdrawal) {
      throw new NotFoundError(`Withdrawal ${withdrawalId} not found`);
    }

    if (withdrawal.status !== 'PENDING_APPROVAL') {
      throw new ValidationError(
        `Withdrawal is not pending approval. Current status: ${withdrawal.status}`,
      );
    }

    // Check cooling period
    const coolingKey = `${COOLING_PREFIX}${withdrawalId}`;
    const coolingEnd = await redis.get(coolingKey);
    if (coolingEnd && new Date(coolingEnd) > new Date()) {
      throw new ValidationError(
        `Withdrawal is in cooling period until ${coolingEnd}. Cannot approve yet.`,
      );
    }

    // Check if this admin has already approved
    const existingApproval = await prisma.withdrawalApproval.findFirst({
      where: {
        withdrawalId,
        adminId,
        action: 'APPROVED',
      },
    });

    if (existingApproval) {
      throw new ValidationError('You have already approved this withdrawal');
    }

    // Record the approval
    await prisma.withdrawalApproval.create({
      data: {
        withdrawalId,
        adminId,
        adminEmail,
        adminRole: adminRole as string,
        action: 'APPROVED',
        comment: comment || '',
      },
    });

    const newApprovalCount = (withdrawal.currentApprovals || 0) + 1;
    const requiredApprovals = withdrawal.requiredApprovals || 1;

    // Audit log
    await auditService.log({
      adminId,
      action: AuditAction.WITHDRAWAL_APPROVED,
      target: `withdrawal:${withdrawalId}`,
      targetId: withdrawalId,
      previousValue: JSON.stringify({ currentApprovals: withdrawal.currentApprovals }),
      newValue: JSON.stringify({ currentApprovals: newApprovalCount }),
      metadata: {
        merchantId: withdrawal.merchantId,
        crypto: withdrawal.crypto,
        amount: withdrawal.amount.toString(),
        comment,
      },
      ipAddress: '',
      userAgent: '',
    });

    if (newApprovalCount >= requiredApprovals) {
      // Fully approved — move to processing
      await prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'APPROVED',
          approvalStatus: 'FULLY_APPROVED',
          currentApprovals: newApprovalCount,
          approvedAt: new Date(),
        },
      });

      // Queue for processing
      await redis.lpush(
        'withdrawal:queue',
        JSON.stringify({
          withdrawalId: withdrawal.id,
          walletId: withdrawal.walletId,
        }),
      );

      logger.info('Withdrawal fully approved', {
        withdrawalId,
        approvals: newApprovalCount,
        required: requiredApprovals,
      });

      return {
        approved: true,
        currentApprovals: newApprovalCount,
        requiredApprovals,
        message: 'Withdrawal fully approved and queued for processing',
      };
    }

    // Partially approved — update count
    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        currentApprovals: newApprovalCount,
      },
    });

    logger.info('Withdrawal partially approved', {
      withdrawalId,
      approvals: newApprovalCount,
      required: requiredApprovals,
    });

    return {
      approved: false,
      currentApprovals: newApprovalCount,
      requiredApprovals,
      message: `Approval recorded (${newApprovalCount}/${requiredApprovals})`,
    };
  }

  /**
   * Reject a withdrawal. Requires a mandatory reason.
   */
  async rejectWithdrawal(
    withdrawalId: string,
    adminId: string,
    adminEmail: string,
    adminRole: AdminRole,
    reason: string,
  ): Promise<void> {
    if (!reason || reason.trim().length < 5) {
      throw new ValidationError('Rejection reason is mandatory and must be at least 5 characters');
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { merchant: { select: { id: true, email: true } } },
    });

    if (!withdrawal) {
      throw new NotFoundError(`Withdrawal ${withdrawalId} not found`);
    }

    if (withdrawal.status !== 'PENDING_APPROVAL') {
      throw new ValidationError(
        `Withdrawal is not pending approval. Current status: ${withdrawal.status}`,
      );
    }

    // Record the rejection
    await prisma.withdrawalApproval.create({
      data: {
        withdrawalId,
        adminId,
        adminEmail,
        adminRole: adminRole as string,
        action: 'REJECTED',
        comment: reason,
      },
    });

    // Update withdrawal status and refund the reserved balance
    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'REJECTED',
        approvalStatus: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });

    // Refund the reserved balance back to the merchant's wallet
    await prisma.wallet.updateMany({
      where: {
        merchantId: withdrawal.merchantId,
        crypto: withdrawal.crypto,
      },
      data: {
        balance: { increment: withdrawal.amount },
      },
    });

    // Clean up cooling period if exists
    await redis.del(`${COOLING_PREFIX}${withdrawalId}`);

    // Audit log
    await auditService.log({
      adminId,
      action: AuditAction.WITHDRAWAL_REJECTED,
      target: `withdrawal:${withdrawalId}`,
      targetId: withdrawalId,
      previousValue: JSON.stringify({ status: 'PENDING_APPROVAL' }),
      newValue: JSON.stringify({ status: 'REJECTED', reason }),
      metadata: {
        merchantId: withdrawal.merchantId,
        crypto: withdrawal.crypto,
        amount: withdrawal.amount.toString(),
        reason,
      },
      ipAddress: '',
      userAgent: '',
    });

    // Notify merchant
    try {
      await notificationService.notifyMerchant(
        withdrawal.merchantId,
        'withdrawal_rejected',
        {
          withdrawalId,
          crypto: withdrawal.crypto,
          amount: withdrawal.amount.toString(),
          reason,
        },
      );
    } catch (error) {
      logger.warn('Failed to notify merchant about rejected withdrawal', { error });
    }

    logger.info('Withdrawal rejected', { withdrawalId, reason, adminId });
  }

  /**
   * Emergency override: SUPER_ADMIN can bypass multi-sig and cooling period.
   * Requires WhatsApp 2FA confirmation (verified before calling this).
   */
  async emergencyApprove(
    withdrawalId: string,
    adminId: string,
    adminEmail: string,
    comment: string,
  ): Promise<void> {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new NotFoundError(`Withdrawal ${withdrawalId} not found`);
    }

    // Record emergency override approval
    await prisma.withdrawalApproval.create({
      data: {
        withdrawalId,
        adminId,
        adminEmail,
        adminRole: AdminRole.SUPER_ADMIN,
        action: 'APPROVED',
        comment: `[EMERGENCY OVERRIDE] ${comment}`,
      },
    });

    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'APPROVED',
        approvalStatus: 'EMERGENCY_OVERRIDE',
        currentApprovals: withdrawal.requiredApprovals || 1,
        approvedAt: new Date(),
      },
    });

    await redis.del(`${COOLING_PREFIX}${withdrawalId}`);

    // Queue for processing
    await redis.lpush(
      'withdrawal:queue',
      JSON.stringify({
        withdrawalId: withdrawal.id,
        walletId: withdrawal.walletId,
      }),
    );

    await auditService.log({
      adminId,
      action: AuditAction.EMERGENCY_WITHDRAWAL_OVERRIDE,
      target: `withdrawal:${withdrawalId}`,
      targetId: withdrawalId,
      previousValue: JSON.stringify({ status: withdrawal.status }),
      newValue: JSON.stringify({ status: 'APPROVED', override: true }),
      metadata: { comment },
      ipAddress: '',
      userAgent: '',
    });

    logger.warn('Emergency withdrawal override executed', {
      withdrawalId,
      adminId,
      adminEmail,
    });
  }

  /**
   * Get all pending withdrawals that need approval.
   */
  async getPendingWithdrawals(options: {
    page?: number;
    limit?: number;
    sortBy?: 'amount' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    withdrawals: PendingWithdrawal[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where: { status: 'PENDING_APPROVAL' },
        include: {
          merchant: { select: { id: true, email: true, businessName: true } },
          withdrawalApprovals: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: sortBy === 'amount' ? { amount: sortOrder } : { createdAt: sortOrder },
        skip,
        take: limit,
      }),
      prisma.withdrawal.count({ where: { status: 'PENDING_APPROVAL' } }),
    ]);

    return {
      withdrawals: withdrawals.map((w: any) => ({
        id: w.id,
        merchantId: w.merchantId,
        merchantName: w.merchant?.businessName || w.merchant?.email || 'Unknown',
        crypto: w.crypto,
        amount: w.amount.toString(),
        amountUsd: Number(w.amountUsd || 0),
        toAddress: w.toAddress,
        status: w.status,
        requiredApprovals: w.requiredApprovals || 1,
        currentApprovals: w.currentApprovals || 0,
        approvals: (w.withdrawalApprovals || []).map((a: any) => ({
          id: a.id,
          withdrawalId: a.withdrawalId,
          adminId: a.adminId,
          adminEmail: a.adminEmail,
          adminRole: a.adminRole as AdminRole,
          action: a.action,
          comment: a.comment,
          createdAt: a.createdAt,
        })),
        coolingEndsAt: w.coolingEndsAt,
        createdAt: w.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get approval history (approved + rejected).
   */
  async getApprovalHistory(options: {
    page?: number;
    limit?: number;
    status?: 'APPROVED' | 'REJECTED';
  } = {}): Promise<{
    withdrawals: PendingWithdrawal[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      status: {
        in: status
          ? [status]
          : ['APPROVED', 'REJECTED', 'COMPLETED', 'PROCESSING'],
      },
      approvalStatus: { not: null },
    };

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        include: {
          merchant: { select: { id: true, email: true, businessName: true } },
          withdrawalApprovals: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.withdrawal.count({ where }),
    ]);

    return {
      withdrawals: withdrawals.map((w: any) => ({
        id: w.id,
        merchantId: w.merchantId,
        merchantName: w.merchant?.businessName || w.merchant?.email || 'Unknown',
        crypto: w.crypto,
        amount: w.amount.toString(),
        amountUsd: Number(w.amountUsd || 0),
        toAddress: w.toAddress,
        status: w.status,
        requiredApprovals: w.requiredApprovals || 1,
        currentApprovals: w.currentApprovals || 0,
        approvals: (w.withdrawalApprovals || []).map((a: any) => ({
          id: a.id,
          withdrawalId: a.withdrawalId,
          adminId: a.adminId,
          adminEmail: a.adminEmail,
          adminRole: a.adminRole,
          action: a.action,
          comment: a.comment,
          createdAt: a.createdAt,
        })),
        coolingEndsAt: w.coolingEndsAt,
        createdAt: w.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update approval thresholds. SUPER_ADMIN only.
   */
  async updateThresholds(
    thresholds: Partial<ApprovalThresholds>,
    adminId: string,
  ): Promise<ApprovalThresholds> {
    const current = await this.getThresholds();
    const updated: ApprovalThresholds = { ...current, ...thresholds };

    // Validate
    if (updated.autoApproveLimit < 0) {
      throw new ValidationError('Auto-approve limit cannot be negative');
    }
    if (updated.singleApprovalLimit <= updated.autoApproveLimit) {
      throw new ValidationError('Single approval limit must be greater than auto-approve limit');
    }
    if (updated.requiredApprovals < 2) {
      throw new ValidationError('Multi-sig requires at least 2 approvals');
    }
    if (updated.coolingPeriodHours < 1) {
      throw new ValidationError('Cooling period must be at least 1 hour');
    }

    await prisma.systemSetting.upsert({
      where: { key: 'approval_thresholds' },
      update: { value: JSON.stringify(updated), updatedBy: adminId },
      create: { key: 'approval_thresholds', value: JSON.stringify(updated), updatedBy: adminId },
    });

    await redis.setex('settings:approval_thresholds', 300, JSON.stringify(updated));

    await auditService.log({
      adminId,
      action: AuditAction.SETTINGS_UPDATED,
      target: 'settings:approval_thresholds',
      targetId: 'approval_thresholds',
      previousValue: JSON.stringify(current),
      newValue: JSON.stringify(updated),
      metadata: {},
      ipAddress: '',
      userAgent: '',
    });

    logger.info('Approval thresholds updated', { adminId, thresholds: updated });

    return updated;
  }
}

export const withdrawalApprovalService = new WithdrawalApprovalService();
