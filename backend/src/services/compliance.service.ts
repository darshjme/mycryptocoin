import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { auditService, AuditAction } from './audit.service';
import { notificationService } from './notification.service';
import { logger } from '../utils/logger';
import { ValidationError, NotFoundError } from '../utils/errors';

// ─────────────────────────────────────────────────────────
// KYC/AML Compliance Service
// Manages merchant verification tiers, document tracking,
// and AML screening
// ─────────────────────────────────────────────────────────

export enum KYCTier {
  TIER_0 = 0,    // Unverified — $1K limit
  TIER_1 = 1,    // Basic — $10K limit
  TIER_2 = 2,    // Full — Unlimited
}

export enum KYCStatus {
  NOT_SUBMITTED = 'not_submitted',
  PENDING_REVIEW = 'pending_review',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  ADDITIONAL_INFO_REQUIRED = 'additional_info_required',
}

export enum DocumentType {
  GOVERNMENT_ID = 'government_id',
  PASSPORT = 'passport',
  DRIVERS_LICENSE = 'drivers_license',
  BUSINESS_REGISTRATION = 'business_registration',
  ADDRESS_PROOF = 'address_proof',
  TAX_CERTIFICATE = 'tax_certificate',
  BANK_STATEMENT = 'bank_statement',
  SELFIE = 'selfie',
  UTILITY_BILL = 'utility_bill',
}

export interface KYCSubmission {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantEmail: string;
  currentTier: KYCTier;
  requestedTier: KYCTier;
  status: KYCStatus;
  documents: KYCDocument[];
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
  rejectionReason: string | null;
  expiresAt: Date | null;
}

export interface KYCDocument {
  id: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  verified: boolean;
  verifiedAt: Date | null;
  verifiedBy: string | null;
}

// Tier limits in USD
const TIER_LIMITS: Record<KYCTier, number> = {
  [KYCTier.TIER_0]: 1000,
  [KYCTier.TIER_1]: 10000,
  [KYCTier.TIER_2]: Infinity,
};

// Required documents per tier
const TIER_REQUIREMENTS: Record<KYCTier, DocumentType[]> = {
  [KYCTier.TIER_0]: [],
  [KYCTier.TIER_1]: [DocumentType.GOVERNMENT_ID, DocumentType.SELFIE],
  [KYCTier.TIER_2]: [
    DocumentType.GOVERNMENT_ID,
    DocumentType.SELFIE,
    DocumentType.BUSINESS_REGISTRATION,
    DocumentType.ADDRESS_PROOF,
  ],
};

class ComplianceService {
  /**
   * Get withdrawal limit for a merchant based on their KYC tier.
   */
  getWithdrawalLimit(tier: KYCTier): number {
    return TIER_LIMITS[tier] ?? TIER_LIMITS[KYCTier.TIER_0];
  }

  /**
   * Get required documents for a KYC tier.
   */
  getRequiredDocuments(tier: KYCTier): DocumentType[] {
    return TIER_REQUIREMENTS[tier] || [];
  }

  /**
   * Check if a merchant can withdraw a specific USD amount.
   */
  async canWithdraw(merchantId: string, amountUsd: number): Promise<{
    allowed: boolean;
    currentTier: KYCTier;
    limit: number;
    remainingLimit: number;
  }> {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { kycTier: true, kycStatus: true },
    });

    if (!merchant) {
      throw new NotFoundError('Merchant not found');
    }

    const tier = (merchant.kycTier ?? 0) as KYCTier;
    const limit = this.getWithdrawalLimit(tier);

    // Calculate total withdrawn in the current period (rolling 30 days)
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - 30);

    const totalWithdrawn = await prisma.withdrawal.aggregate({
      where: {
        merchantId,
        status: { in: ['COMPLETED', 'APPROVED', 'PROCESSING'] },
        createdAt: { gte: periodStart },
      },
      _sum: { amountUsd: true },
    });

    const withdrawn = Number(totalWithdrawn._sum.amountUsd || 0);
    const remainingLimit = Math.max(0, limit - withdrawn);

    return {
      allowed: amountUsd <= remainingLimit,
      currentTier: tier,
      limit,
      remainingLimit,
    };
  }

  /**
   * Get KYC review queue — submissions pending review.
   */
  async getReviewQueue(options: {
    status?: KYCStatus;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    submissions: KYCSubmission[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { status, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    } else {
      where.status = { in: [KYCStatus.PENDING_REVIEW, KYCStatus.UNDER_REVIEW] };
    }

    const [submissions, total] = await Promise.all([
      prisma.kycSubmission.findMany({
        where,
        include: {
          merchant: {
            select: { id: true, email: true, businessName: true, kycTier: true },
          },
          documents: {
            orderBy: { uploadedAt: 'desc' },
          },
        },
        orderBy: { submittedAt: 'asc' }, // FIFO — oldest first
        skip,
        take: limit,
      }),
      prisma.kycSubmission.count({ where }),
    ]);

    return {
      submissions: submissions.map((s: any) => ({
        id: s.id,
        merchantId: s.merchantId,
        merchantName: s.merchant?.businessName || s.merchant?.email || 'Unknown',
        merchantEmail: s.merchant?.email || '',
        currentTier: (s.merchant?.kycTier ?? 0) as KYCTier,
        requestedTier: s.requestedTier as KYCTier,
        status: s.status as KYCStatus,
        documents: (s.documents || []).map((d: any) => ({
          id: d.id,
          type: d.type as DocumentType,
          fileName: d.fileName,
          fileUrl: d.fileUrl,
          uploadedAt: d.uploadedAt,
          verified: d.verified,
          verifiedAt: d.verifiedAt,
          verifiedBy: d.verifiedBy,
        })),
        submittedAt: s.submittedAt,
        reviewedAt: s.reviewedAt,
        reviewedBy: s.reviewedBy,
        reviewNotes: s.reviewNotes,
        rejectionReason: s.rejectionReason,
        expiresAt: s.expiresAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Approve a KYC submission — upgrade merchant tier.
   */
  async approveSubmission(
    submissionId: string,
    adminId: string,
    notes?: string,
  ): Promise<void> {
    const submission = await prisma.kycSubmission.findUnique({
      where: { id: submissionId },
      include: { merchant: true },
    });

    if (!submission) {
      throw new NotFoundError('KYC submission not found');
    }

    if (submission.status !== KYCStatus.PENDING_REVIEW && submission.status !== KYCStatus.UNDER_REVIEW) {
      throw new ValidationError(
        `Cannot approve submission with status: ${submission.status}`,
      );
    }

    const previousTier = submission.merchant.kycTier ?? 0;
    const newTier = submission.requestedTier;

    // Set expiry (KYC valid for 1 year)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Update submission
    await prisma.kycSubmission.update({
      where: { id: submissionId },
      data: {
        status: KYCStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedBy: adminId,
        reviewNotes: notes || null,
        expiresAt,
      },
    });

    // Upgrade merchant tier
    await prisma.merchant.update({
      where: { id: submission.merchantId },
      data: {
        kycTier: newTier,
        kycStatus: KYCStatus.APPROVED,
        kycExpiresAt: expiresAt,
      },
    });

    // Audit
    await auditService.log({
      adminId,
      action: AuditAction.KYC_APPROVED,
      target: `kyc:${submissionId}`,
      targetId: submissionId,
      previousValue: JSON.stringify({ tier: previousTier }),
      newValue: JSON.stringify({ tier: newTier, expiresAt }),
      metadata: { merchantId: submission.merchantId, notes },
      ipAddress: '',
      userAgent: '',
    });

    // Notify merchant
    try {
      await notificationService.notifyMerchant(
        submission.merchantId,
        'kyc_approved',
        { newTier, limit: this.getWithdrawalLimit(newTier as KYCTier) },
      );
    } catch {
      // Non-critical
    }

    logger.info('KYC submission approved', {
      submissionId,
      merchantId: submission.merchantId,
      previousTier,
      newTier,
    });
  }

  /**
   * Reject a KYC submission.
   */
  async rejectSubmission(
    submissionId: string,
    adminId: string,
    reason: string,
    notes?: string,
  ): Promise<void> {
    if (!reason || reason.trim().length < 5) {
      throw new ValidationError('Rejection reason must be at least 5 characters');
    }

    const submission = await prisma.kycSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new NotFoundError('KYC submission not found');
    }

    await prisma.kycSubmission.update({
      where: { id: submissionId },
      data: {
        status: KYCStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedBy: adminId,
        reviewNotes: notes || null,
        rejectionReason: reason,
      },
    });

    await prisma.merchant.update({
      where: { id: submission.merchantId },
      data: { kycStatus: KYCStatus.REJECTED },
    });

    await auditService.log({
      adminId,
      action: AuditAction.KYC_REJECTED,
      target: `kyc:${submissionId}`,
      targetId: submissionId,
      previousValue: JSON.stringify({ status: submission.status }),
      newValue: JSON.stringify({ status: 'rejected', reason }),
      metadata: { merchantId: submission.merchantId },
      ipAddress: '',
      userAgent: '',
    });

    try {
      await notificationService.notifyMerchant(
        submission.merchantId,
        'kyc_rejected',
        { reason },
      );
    } catch {
      // Non-critical
    }

    logger.info('KYC submission rejected', {
      submissionId,
      merchantId: submission.merchantId,
      reason,
    });
  }

  /**
   * Request additional information for a KYC submission.
   */
  async requestAdditionalInfo(
    submissionId: string,
    adminId: string,
    requirements: string,
  ): Promise<void> {
    const submission = await prisma.kycSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new NotFoundError('KYC submission not found');
    }

    await prisma.kycSubmission.update({
      where: { id: submissionId },
      data: {
        status: KYCStatus.ADDITIONAL_INFO_REQUIRED,
        reviewedBy: adminId,
        reviewNotes: requirements,
      },
    });

    try {
      await notificationService.notifyMerchant(
        submission.merchantId,
        'kyc_additional_info',
        { requirements },
      );
    } catch {
      // Non-critical
    }

    logger.info('Additional KYC info requested', {
      submissionId,
      merchantId: submission.merchantId,
    });
  }

  /**
   * AML screening: check a withdrawal address against sanction lists.
   */
  async screenAddress(address: string): Promise<{
    clean: boolean;
    matches: Array<{
      list: string;
      entity: string;
      confidence: number;
    }>;
  }> {
    // Check internal blacklist first
    const blacklisted = await prisma.addressBlacklist.findFirst({
      where: { address: address.toLowerCase() },
    });

    if (blacklisted) {
      return {
        clean: false,
        matches: [
          {
            list: 'internal_blacklist',
            entity: blacklisted.reason || 'Blacklisted address',
            confidence: 1.0,
          },
        ],
      };
    }

    // Check against cached sanction lists
    const sanctionMatch = await redis.get(`aml:sanction:${address.toLowerCase()}`);
    if (sanctionMatch) {
      return {
        clean: false,
        matches: JSON.parse(sanctionMatch),
      };
    }

    // In production: integrate with Chainalysis, Elliptic, or CipherTrace
    // For now, return clean
    return { clean: true, matches: [] };
  }

  /**
   * Check for expired KYC and downgrade merchants.
   * Called by scheduled job.
   */
  async checkExpiredKYC(): Promise<{
    expired: number;
    downgraded: string[];
  }> {
    const expired = await prisma.merchant.findMany({
      where: {
        kycExpiresAt: { lte: new Date() },
        kycTier: { gt: 0 },
        kycStatus: KYCStatus.APPROVED,
      },
      select: { id: true, email: true, kycTier: true },
    });

    const downgraded: string[] = [];

    for (const merchant of expired) {
      await prisma.merchant.update({
        where: { id: merchant.id },
        data: {
          kycTier: 0,
          kycStatus: KYCStatus.EXPIRED,
        },
      });

      downgraded.push(merchant.id);

      try {
        await notificationService.notifyMerchant(merchant.id, 'kyc_expired', {
          previousTier: merchant.kycTier,
        });
      } catch {
        // Non-critical
      }
    }

    if (downgraded.length > 0) {
      logger.info('KYC expirations processed', {
        count: downgraded.length,
        merchantIds: downgraded,
      });
    }

    return { expired: downgraded.length, downgraded };
  }

  /**
   * Generate compliance report.
   */
  async generateReport(options: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    period: { start: Date; end: Date };
    summary: {
      totalSubmissions: number;
      approved: number;
      rejected: number;
      pending: number;
      expired: number;
    };
    tierDistribution: Record<number, number>;
    flaggedTransactions: number;
    amlScreenings: number;
  }> {
    const { startDate, endDate } = options;
    const where = {
      submittedAt: { gte: startDate, lte: endDate },
    };

    const [total, approved, rejected, pending] = await Promise.all([
      prisma.kycSubmission.count({ where }),
      prisma.kycSubmission.count({ where: { ...where, status: KYCStatus.APPROVED } }),
      prisma.kycSubmission.count({ where: { ...where, status: KYCStatus.REJECTED } }),
      prisma.kycSubmission.count({
        where: { ...where, status: { in: [KYCStatus.PENDING_REVIEW, KYCStatus.UNDER_REVIEW] } },
      }),
    ]);

    const tierDistribution: Record<number, number> = {};
    for (const tier of [0, 1, 2]) {
      tierDistribution[tier] = await prisma.merchant.count({
        where: { kycTier: tier },
      });
    }

    const flaggedTransactions = await prisma.fraudAlert.count({
      where: { createdAt: { gte: startDate, lte: endDate } },
    });

    return {
      period: { start: startDate, end: endDate },
      summary: {
        totalSubmissions: total,
        approved,
        rejected,
        pending,
        expired: total - approved - rejected - pending,
      },
      tierDistribution,
      flaggedTransactions,
      amlScreenings: 0, // Track externally
    };
  }
}

export const complianceService = new ComplianceService();
