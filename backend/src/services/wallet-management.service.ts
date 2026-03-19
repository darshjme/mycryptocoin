import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { CryptoSymbol, SUPPORTED_CRYPTOS } from '../config/crypto';
import { cryptoService } from './crypto.service';
import { auditService, AuditAction } from './audit.service';
import { notificationService } from './notification.service';
import { logger } from '../utils/logger';
import { ValidationError, NotFoundError, CryptoError } from '../utils/errors';

// ─────────────────────────────────────────────────────────
// Hot/Cold Wallet Management Service
// Manages operational float and cold storage for all cryptos
// ─────────────────────────────────────────────────────────

export interface WalletThreshold {
  crypto: CryptoSymbol;
  hotMaxPercent: number;         // Max % of total in hot wallet (e.g., 10%)
  hotMinAmount: string;          // Min amount in hot wallet before refill alert
  hotMaxAmount: string;          // Max amount — auto-sweep above this
  autoSweepEnabled: boolean;
}

export interface WalletBalance {
  crypto: CryptoSymbol;
  cryptoName: string;
  hotBalance: string;
  coldBalance: string;
  totalBalance: string;
  hotPercent: number;
  hotAddress: string;
  coldAddress: string;
  status: 'healthy' | 'low' | 'excess' | 'critical';
  lastSweepAt: Date | null;
}

const DEFAULT_THRESHOLDS: Record<string, WalletThreshold> = {
  BTC: {
    crypto: CryptoSymbol.BTC,
    hotMaxPercent: 10,
    hotMinAmount: '0.1',
    hotMaxAmount: '2.0',
    autoSweepEnabled: true,
  },
  ETH: {
    crypto: CryptoSymbol.ETH,
    hotMaxPercent: 15,
    hotMinAmount: '1.0',
    hotMaxAmount: '50.0',
    autoSweepEnabled: true,
  },
  USDT_ERC20: {
    crypto: CryptoSymbol.USDT_ERC20,
    hotMaxPercent: 15,
    hotMinAmount: '5000',
    hotMaxAmount: '100000',
    autoSweepEnabled: true,
  },
  USDT_TRC20: {
    crypto: CryptoSymbol.USDT_TRC20,
    hotMaxPercent: 15,
    hotMinAmount: '5000',
    hotMaxAmount: '100000',
    autoSweepEnabled: true,
  },
  SOL: {
    crypto: CryptoSymbol.SOL,
    hotMaxPercent: 15,
    hotMinAmount: '50',
    hotMaxAmount: '5000',
    autoSweepEnabled: true,
  },
  BNB: {
    crypto: CryptoSymbol.BNB,
    hotMaxPercent: 15,
    hotMinAmount: '5',
    hotMaxAmount: '500',
    autoSweepEnabled: true,
  },
  MATIC: {
    crypto: CryptoSymbol.MATIC,
    hotMaxPercent: 20,
    hotMinAmount: '1000',
    hotMaxAmount: '50000',
    autoSweepEnabled: true,
  },
  LTC: {
    crypto: CryptoSymbol.LTC,
    hotMaxPercent: 15,
    hotMinAmount: '10',
    hotMaxAmount: '500',
    autoSweepEnabled: true,
  },
  DOGE: {
    crypto: CryptoSymbol.DOGE,
    hotMaxPercent: 15,
    hotMinAmount: '10000',
    hotMaxAmount: '500000',
    autoSweepEnabled: true,
  },
  XRP: {
    crypto: CryptoSymbol.XRP,
    hotMaxPercent: 15,
    hotMinAmount: '5000',
    hotMaxAmount: '200000',
    autoSweepEnabled: true,
  },
};

const WALLET_CACHE_KEY = 'wallets:hot_cold:status';
const WALLET_CACHE_TTL = 60; // 1 minute

class WalletManagementService {
  /**
   * Get thresholds for a specific crypto.
   */
  async getThreshold(crypto: CryptoSymbol): Promise<WalletThreshold> {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: `wallet_threshold:${crypto}` },
      });
      if (setting) {
        return JSON.parse(setting.value) as WalletThreshold;
      }
    } catch {
      // Fall through to defaults
    }
    return DEFAULT_THRESHOLDS[crypto] || {
      crypto,
      hotMaxPercent: 15,
      hotMinAmount: '0',
      hotMaxAmount: '999999999',
      autoSweepEnabled: false,
    };
  }

  /**
   * Get all wallet thresholds.
   */
  async getAllThresholds(): Promise<WalletThreshold[]> {
    const thresholds: WalletThreshold[] = [];
    for (const crypto of Object.values(CryptoSymbol)) {
      thresholds.push(await this.getThreshold(crypto));
    }
    return thresholds;
  }

  /**
   * Get hot/cold wallet balance status for all cryptos.
   */
  async getWalletBalances(): Promise<WalletBalance[]> {
    // Check cache first
    try {
      const cached = await redis.get(WALLET_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached) as WalletBalance[];
      }
    } catch {
      // Continue without cache
    }

    const balances: WalletBalance[] = [];

    for (const crypto of Object.values(CryptoSymbol)) {
      const config = SUPPORTED_CRYPTOS[crypto];
      const threshold = await this.getThreshold(crypto);

      // Get platform hot wallet
      const hotWallet = await prisma.platformWallet.findFirst({
        where: { crypto, type: 'HOT' },
      });

      // Get platform cold wallet
      const coldWallet = await prisma.platformWallet.findFirst({
        where: { crypto, type: 'COLD' },
      });

      const hotBalance = hotWallet?.balance?.toString() || '0';
      const coldBalance = coldWallet?.balance?.toString() || '0';
      const totalBalance = new Decimal(hotBalance).plus(coldBalance).toString();
      const total = Number(totalBalance);
      const hot = Number(hotBalance);
      const hotPercent = total > 0 ? (hot / total) * 100 : 0;

      // Determine status
      let status: WalletBalance['status'] = 'healthy';
      const minAmount = Number(threshold.hotMinAmount);
      const maxAmount = Number(threshold.hotMaxAmount);

      if (hot < minAmount * 0.5) {
        status = 'critical';
      } else if (hot < minAmount) {
        status = 'low';
      } else if (hot > maxAmount) {
        status = 'excess';
      }

      balances.push({
        crypto,
        cryptoName: config.name,
        hotBalance,
        coldBalance,
        totalBalance,
        hotPercent: Math.round(hotPercent * 100) / 100,
        hotAddress: hotWallet?.address || '',
        coldAddress: coldWallet?.address || '',
        status,
        lastSweepAt: hotWallet?.lastSweepAt || null,
      });
    }

    // Cache results
    try {
      await redis.setex(WALLET_CACHE_KEY, WALLET_CACHE_TTL, JSON.stringify(balances));
    } catch {
      // Non-critical
    }

    return balances;
  }

  /**
   * Trigger a hot-to-cold sweep for a specific crypto.
   * Moves excess funds from hot wallet to cold wallet.
   */
  async sweepToCold(
    crypto: CryptoSymbol,
    adminId: string,
    amount?: string,
  ): Promise<{
    txHash: string;
    amount: string;
    from: string;
    to: string;
  }> {
    const hotWallet = await prisma.platformWallet.findFirst({
      where: { crypto, type: 'HOT' },
    });

    const coldWallet = await prisma.platformWallet.findFirst({
      where: { crypto, type: 'COLD' },
    });

    if (!hotWallet) {
      throw new NotFoundError(`No hot wallet configured for ${crypto}`);
    }
    if (!coldWallet) {
      throw new NotFoundError(`No cold wallet configured for ${crypto}`);
    }

    const threshold = await this.getThreshold(crypto);
    const hotBalance = new Decimal(hotWallet.balance);
    const maxAmount = new Decimal(threshold.hotMaxAmount);
    const minKeep = new Decimal(threshold.hotMinAmount);

    // Calculate sweep amount
    let sweepAmount: Decimal;
    if (amount) {
      sweepAmount = new Decimal(amount);
    } else {
      // Auto-calculate: sweep to keep hot wallet at minKeep level
      sweepAmount = hotBalance.minus(minKeep);
    }

    if (sweepAmount.lte(0)) {
      throw new ValidationError(
        `Nothing to sweep: hot wallet balance (${hotBalance}) is at or below minimum (${minKeep})`,
      );
    }

    if (sweepAmount.gt(hotBalance)) {
      throw new ValidationError(
        `Sweep amount (${sweepAmount}) exceeds hot wallet balance (${hotBalance})`,
      );
    }

    logger.info('Initiating hot-to-cold sweep', {
      crypto,
      amount: sweepAmount.toString(),
      from: hotWallet.address,
      to: coldWallet.address,
    });

    // Execute the blockchain transfer
    // NOTE: Cold wallet address is stored but private key is NEVER in the system.
    // The hot wallet sends TO the cold wallet address.
    const txHash = await cryptoService.sendTransaction(
      crypto,
      hotWallet.address,
      coldWallet.address,
      sweepAmount.toString(),
    );

    // Update balances in DB
    await prisma.platformWallet.update({
      where: { id: hotWallet.id },
      data: {
        balance: { decrement: sweepAmount },
        lastSweepAt: new Date(),
      },
    });

    await prisma.platformWallet.update({
      where: { id: coldWallet.id },
      data: {
        balance: { increment: sweepAmount },
      },
    });

    // Record sweep in ledger
    await prisma.walletSweep.create({
      data: {
        crypto,
        fromType: 'HOT',
        toType: 'COLD',
        amount: sweepAmount,
        txHash,
        initiatedBy: adminId,
        status: 'COMPLETED',
      },
    });

    // Invalidate cache
    await redis.del(WALLET_CACHE_KEY);

    // Audit
    await auditService.log({
      adminId,
      action: AuditAction.WALLET_SWEEP,
      target: `wallet:${crypto}:hot_to_cold`,
      targetId: crypto,
      previousValue: JSON.stringify({ hotBalance: hotBalance.toString() }),
      newValue: JSON.stringify({ hotBalance: hotBalance.minus(sweepAmount).toString() }),
      metadata: {
        txHash,
        amount: sweepAmount.toString(),
        from: hotWallet.address,
        to: coldWallet.address,
      },
      ipAddress: '',
      userAgent: '',
    });

    logger.info('Hot-to-cold sweep completed', {
      crypto,
      txHash,
      amount: sweepAmount.toString(),
    });

    return {
      txHash,
      amount: sweepAmount.toString(),
      from: hotWallet.address,
      to: coldWallet.address,
    };
  }

  /**
   * Check all hot wallets and trigger auto-sweeps where needed.
   * Called by a scheduled job.
   */
  async autoSweepCheck(): Promise<{
    swept: Array<{ crypto: string; amount: string; txHash: string }>;
    alerts: Array<{ crypto: string; type: string; message: string }>;
  }> {
    const swept: Array<{ crypto: string; amount: string; txHash: string }> = [];
    const alerts: Array<{ crypto: string; type: string; message: string }> = [];

    for (const crypto of Object.values(CryptoSymbol)) {
      try {
        const threshold = await this.getThreshold(crypto);
        if (!threshold.autoSweepEnabled) continue;

        const hotWallet = await prisma.platformWallet.findFirst({
          where: { crypto, type: 'HOT' },
        });

        if (!hotWallet) continue;

        const hotBalance = new Decimal(hotWallet.balance);
        const maxAmount = new Decimal(threshold.hotMaxAmount);
        const minAmount = new Decimal(threshold.hotMinAmount);

        // Check if hot wallet exceeds maximum
        if (hotBalance.gt(maxAmount)) {
          try {
            const result = await this.sweepToCold(crypto, 'SYSTEM_AUTO_SWEEP');
            swept.push({
              crypto,
              amount: result.amount,
              txHash: result.txHash,
            });
          } catch (error) {
            logger.error('Auto-sweep failed', { crypto, error });
            alerts.push({
              crypto,
              type: 'sweep_failed',
              message: `Auto-sweep failed for ${crypto}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
          }
        }

        // Check if hot wallet is below minimum (refill alert)
        if (hotBalance.lt(minAmount)) {
          alerts.push({
            crypto,
            type: 'low_balance',
            message: `Hot wallet ${crypto} balance (${hotBalance}) is below minimum (${minAmount})`,
          });

          try {
            await notificationService.notifyAdmins('hot_wallet_low', {
              crypto,
              currentBalance: hotBalance.toString(),
              minimumRequired: minAmount.toString(),
            });
          } catch {
            // Non-critical notification failure
          }
        }

        // Critical alert: hot wallet nearly empty
        if (hotBalance.lt(minAmount.mul(0.5))) {
          alerts.push({
            crypto,
            type: 'critical_balance',
            message: `CRITICAL: Hot wallet ${crypto} balance (${hotBalance}) is critically low`,
          });
        }
      } catch (error) {
        logger.error('Auto-sweep check failed for crypto', { crypto, error });
      }
    }

    return { swept, alerts };
  }

  /**
   * Update wallet thresholds for a specific crypto.
   */
  async updateThreshold(
    crypto: CryptoSymbol,
    threshold: Partial<WalletThreshold>,
    adminId: string,
  ): Promise<WalletThreshold> {
    const current = await this.getThreshold(crypto);
    const updated: WalletThreshold = { ...current, ...threshold, crypto };

    if (updated.hotMaxPercent < 1 || updated.hotMaxPercent > 50) {
      throw new ValidationError('Hot max percent must be between 1% and 50%');
    }

    await prisma.systemSetting.upsert({
      where: { key: `wallet_threshold:${crypto}` },
      update: { value: JSON.stringify(updated), updatedBy: adminId },
      create: {
        key: `wallet_threshold:${crypto}`,
        value: JSON.stringify(updated),
        updatedBy: adminId,
      },
    });

    await redis.del(WALLET_CACHE_KEY);

    await auditService.log({
      adminId,
      action: AuditAction.SETTINGS_UPDATED,
      target: `wallet_threshold:${crypto}`,
      targetId: crypto,
      previousValue: JSON.stringify(current),
      newValue: JSON.stringify(updated),
      metadata: {},
      ipAddress: '',
      userAgent: '',
    });

    logger.info('Wallet threshold updated', { crypto, threshold: updated, adminId });

    return updated;
  }

  /**
   * Get sweep history.
   */
  async getSweepHistory(options: {
    crypto?: CryptoSymbol;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    sweeps: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { crypto, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (crypto) where.crypto = crypto;

    const [sweeps, total] = await Promise.all([
      prisma.walletSweep.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.walletSweep.count({ where }),
    ]);

    return {
      sweeps,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const walletManagementService = new WalletManagementService();
