import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { CryptoSymbol, SUPPORTED_CRYPTOS } from '../config/crypto';
import { cryptoService } from './crypto.service';
import { auditService, AuditAction } from './audit.service';
import { notificationService } from './notification.service';
import { logger } from '../utils/logger';

// ─────────────────────────────────────────────────────────
// Fund Segregation & Reconciliation Service
// Tracks merchant balances vs blockchain reality
// ─────────────────────────────────────────────────────────

export interface ReconciliationResult {
  crypto: CryptoSymbol;
  cryptoName: string;
  dbBalance: string;                // Sum of all merchant balances in DB
  blockchainBalance: string;        // Actual balance on blockchain (hot + cold)
  hotWalletBalance: string;
  coldWalletBalance: string;
  discrepancy: string;              // Difference
  discrepancyPercent: number;
  status: 'matched' | 'minor_discrepancy' | 'major_discrepancy' | 'critical';
  checkedAt: Date;
}

export interface ProofOfReserves {
  timestamp: Date;
  cryptos: Array<{
    crypto: CryptoSymbol;
    cryptoName: string;
    totalLiabilities: string;       // Sum of all merchant balances (what we owe)
    totalAssets: string;            // Hot + cold wallet (what we have)
    coverageRatio: number;          // Assets / Liabilities (should be >= 1.0)
    surplus: string;                // Assets - Liabilities
    status: 'fully_covered' | 'under_covered' | 'critical';
  }>;
  overallStatus: 'healthy' | 'warning' | 'critical';
  lastReconciliation: Date | null;
}

export interface ReconciliationReport {
  id: string;
  runAt: Date;
  runBy: string;
  type: 'manual' | 'scheduled';
  results: ReconciliationResult[];
  overallStatus: 'clean' | 'discrepancies_found' | 'critical';
  totalDiscrepancyUsd: number;
  duration: number;               // milliseconds
}

const DISCREPANCY_THRESHOLD = 0.01;       // 0.01% minor
const CRITICAL_DISCREPANCY_THRESHOLD = 1; // 1% critical
const RECONCILIATION_CACHE_KEY = 'reconciliation:latest';
const RECONCILIATION_CACHE_TTL = 300;

class ReconciliationService {
  /**
   * Run full reconciliation across all cryptos.
   * Compares DB merchant balances vs actual blockchain balances.
   */
  async runReconciliation(
    runBy: string = 'SYSTEM',
    type: 'manual' | 'scheduled' = 'manual',
  ): Promise<ReconciliationReport> {
    const startTime = Date.now();
    const results: ReconciliationResult[] = [];
    let hasDiscrepancies = false;
    let hasCritical = false;

    logger.info('Starting reconciliation', { runBy, type });

    for (const crypto of Object.values(CryptoSymbol)) {
      try {
        const result = await this.reconcileCrypto(crypto);
        results.push(result);

        if (result.status !== 'matched') {
          hasDiscrepancies = true;
        }
        if (result.status === 'critical') {
          hasCritical = true;
        }
      } catch (error) {
        logger.error('Reconciliation failed for crypto', { crypto, error });
        results.push({
          crypto,
          cryptoName: SUPPORTED_CRYPTOS[crypto]?.name || crypto,
          dbBalance: 'ERROR',
          blockchainBalance: 'ERROR',
          hotWalletBalance: 'ERROR',
          coldWalletBalance: 'ERROR',
          discrepancy: 'ERROR',
          discrepancyPercent: -1,
          status: 'critical',
          checkedAt: new Date(),
        });
        hasCritical = true;
      }
    }

    const duration = Date.now() - startTime;
    const overallStatus = hasCritical
      ? 'critical'
      : hasDiscrepancies
      ? 'discrepancies_found'
      : 'clean';

    // Store report in DB
    const report = await prisma.reconciliationReport.create({
      data: {
        runBy,
        type,
        results: JSON.stringify(results),
        overallStatus,
        totalDiscrepancyUsd: 0, // Would need price feed for USD conversion
        duration,
      },
    });

    // Cache latest result
    const cachedReport: ReconciliationReport = {
      id: report.id,
      runAt: report.createdAt,
      runBy,
      type,
      results,
      overallStatus: overallStatus as any,
      totalDiscrepancyUsd: 0,
      duration,
    };

    await redis.setex(
      RECONCILIATION_CACHE_KEY,
      RECONCILIATION_CACHE_TTL,
      JSON.stringify(cachedReport),
    );

    // Alert if discrepancies found
    if (hasDiscrepancies) {
      const discrepantCryptos = results.filter((r) => r.status !== 'matched');

      try {
        await notificationService.notifyAdmins('reconciliation_discrepancy', {
          status: overallStatus,
          discrepancies: discrepantCryptos.map((r) => ({
            crypto: r.crypto,
            discrepancy: r.discrepancy,
            percent: r.discrepancyPercent,
          })),
        });
      } catch {
        // Non-critical
      }
    }

    // Audit log
    await auditService.log({
      adminId: runBy,
      action: AuditAction.RECONCILIATION_RUN,
      target: 'reconciliation',
      targetId: report.id,
      previousValue: '',
      newValue: JSON.stringify({ overallStatus, duration }),
      metadata: { type, discrepancyCount: results.filter((r) => r.status !== 'matched').length },
      ipAddress: '',
      userAgent: '',
    });

    logger.info('Reconciliation completed', {
      reportId: report.id,
      overallStatus,
      duration,
      discrepancies: results.filter((r) => r.status !== 'matched').length,
    });

    return cachedReport;
  }

  /**
   * Reconcile a single crypto.
   */
  private async reconcileCrypto(crypto: CryptoSymbol): Promise<ReconciliationResult> {
    const config = SUPPORTED_CRYPTOS[crypto];

    // 1. Sum all merchant balances from DB (what we owe merchants)
    const merchantBalances = await prisma.wallet.aggregate({
      where: { crypto },
      _sum: { balance: true, pendingBalance: true },
    });

    const dbBalance = new Decimal(merchantBalances._sum.balance?.toString() || '0')
      .plus(merchantBalances._sum.pendingBalance?.toString() || '0');

    // 2. Get actual blockchain balances for hot and cold wallets
    let hotBalance = new Decimal(0);
    let coldBalance = new Decimal(0);

    const hotWallet = await prisma.platformWallet.findFirst({
      where: { crypto, type: 'HOT' },
    });
    const coldWallet = await prisma.platformWallet.findFirst({
      where: { crypto, type: 'COLD' },
    });

    if (hotWallet) {
      try {
        const chainBalance = await cryptoService.getBalance(crypto, hotWallet.address);
        hotBalance = new Decimal(chainBalance);
      } catch {
        // Fall back to DB balance
        hotBalance = new Decimal(hotWallet.balance?.toString() || '0');
      }
    }

    if (coldWallet) {
      try {
        const chainBalance = await cryptoService.getBalance(crypto, coldWallet.address);
        coldBalance = new Decimal(chainBalance);
      } catch {
        coldBalance = new Decimal(coldWallet.balance?.toString() || '0');
      }
    }

    const blockchainBalance = hotBalance.plus(coldBalance);
    const discrepancy = blockchainBalance.minus(dbBalance);
    const discrepancyPercent = dbBalance.gt(0)
      ? Number(discrepancy.abs().div(dbBalance).mul(100).toFixed(4))
      : 0;

    let status: ReconciliationResult['status'] = 'matched';
    if (discrepancyPercent > CRITICAL_DISCREPANCY_THRESHOLD) {
      status = 'critical';
    } else if (discrepancyPercent > DISCREPANCY_THRESHOLD) {
      status = 'major_discrepancy';
    } else if (discrepancyPercent > 0 && !discrepancy.isZero()) {
      status = 'minor_discrepancy';
    }

    return {
      crypto,
      cryptoName: config?.name || crypto,
      dbBalance: dbBalance.toString(),
      blockchainBalance: blockchainBalance.toString(),
      hotWalletBalance: hotBalance.toString(),
      coldWalletBalance: coldBalance.toString(),
      discrepancy: discrepancy.toString(),
      discrepancyPercent,
      status,
      checkedAt: new Date(),
    };
  }

  /**
   * Get Proof of Reserves — total liabilities vs total assets per crypto.
   */
  async getProofOfReserves(): Promise<ProofOfReserves> {
    const cryptos: ProofOfReserves['cryptos'] = [];
    let hasWarning = false;
    let hasCritical = false;

    for (const crypto of Object.values(CryptoSymbol)) {
      const config = SUPPORTED_CRYPTOS[crypto];

      // Total liabilities: sum of all merchant wallet balances
      const merchantBalances = await prisma.wallet.aggregate({
        where: { crypto },
        _sum: { balance: true, pendingBalance: true },
      });
      const totalLiabilities = new Decimal(merchantBalances._sum.balance?.toString() || '0')
        .plus(merchantBalances._sum.pendingBalance?.toString() || '0');

      // Total assets: hot + cold wallet balances
      const platformWallets = await prisma.platformWallet.findMany({
        where: { crypto },
      });

      let totalAssets = new Decimal(0);
      for (const w of platformWallets) {
        totalAssets = totalAssets.plus(w.balance?.toString() || '0');
      }

      const coverageRatio = totalLiabilities.gt(0)
        ? Number(totalAssets.div(totalLiabilities).toFixed(4))
        : totalAssets.gt(0) ? 999 : 1;

      const surplus = totalAssets.minus(totalLiabilities);

      let status: 'fully_covered' | 'under_covered' | 'critical' = 'fully_covered';
      if (coverageRatio < 0.95) {
        status = 'critical';
        hasCritical = true;
      } else if (coverageRatio < 1.0) {
        status = 'under_covered';
        hasWarning = true;
      }

      cryptos.push({
        crypto,
        cryptoName: config?.name || crypto,
        totalLiabilities: totalLiabilities.toString(),
        totalAssets: totalAssets.toString(),
        coverageRatio,
        surplus: surplus.toString(),
        status,
      });
    }

    // Get last reconciliation timestamp
    const lastRecon = await prisma.reconciliationReport.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    return {
      timestamp: new Date(),
      cryptos,
      overallStatus: hasCritical ? 'critical' : hasWarning ? 'warning' : 'healthy',
      lastReconciliation: lastRecon?.createdAt || null,
    };
  }

  /**
   * Get latest reconciliation report (cached).
   */
  async getLatestReport(): Promise<ReconciliationReport | null> {
    try {
      const cached = await redis.get(RECONCILIATION_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached) as ReconciliationReport;
      }
    } catch {
      // Continue without cache
    }

    const latest = await prisma.reconciliationReport.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!latest) return null;

    return {
      id: latest.id,
      runAt: latest.createdAt,
      runBy: latest.runBy,
      type: latest.type as 'manual' | 'scheduled',
      results: JSON.parse(latest.results as string),
      overallStatus: latest.overallStatus as any,
      totalDiscrepancyUsd: latest.totalDiscrepancyUsd || 0,
      duration: latest.duration,
    };
  }

  /**
   * Get reconciliation history.
   */
  async getReportHistory(options: {
    page?: number;
    limit?: number;
  } = {}): Promise<{
    reports: ReconciliationReport[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      prisma.reconciliationReport.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.reconciliationReport.count(),
    ]);

    return {
      reports: reports.map((r: any) => ({
        id: r.id,
        runAt: r.createdAt,
        runBy: r.runBy,
        type: r.type,
        results: JSON.parse(r.results),
        overallStatus: r.overallStatus,
        totalDiscrepancyUsd: r.totalDiscrepancyUsd || 0,
        duration: r.duration,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get per-merchant balance breakdown for a specific crypto.
   */
  async getMerchantBalances(crypto: CryptoSymbol): Promise<Array<{
    merchantId: string;
    merchantName: string;
    balance: string;
    pendingBalance: string;
    totalBalance: string;
  }>> {
    const wallets = await prisma.wallet.findMany({
      where: { crypto },
      include: {
        merchant: { select: { id: true, email: true, businessName: true } },
      },
      orderBy: { balance: 'desc' },
    });

    return wallets.map((w: any) => ({
      merchantId: w.merchantId,
      merchantName: w.merchant?.businessName || w.merchant?.email || 'Unknown',
      balance: w.balance.toString(),
      pendingBalance: w.pendingBalance.toString(),
      totalBalance: new Decimal(w.balance).plus(w.pendingBalance).toString(),
    }));
  }
}

export const reconciliationService = new ReconciliationService();
