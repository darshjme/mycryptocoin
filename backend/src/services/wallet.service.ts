import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { CryptoSymbol, SUPPORTED_CRYPTOS } from '../config/crypto';
import { cryptoService } from './crypto.service';
import { NotFoundError, ValidationError, CryptoError } from '../utils/errors';
import { validateCryptoAddress, meetsMinimumAmount } from '../utils/crypto';
import { logger } from '../utils/logger';

export class WalletService {
  /**
   * Get or create a wallet for a merchant + crypto combination.
   */
  async getOrCreateWallet(
    merchantId: string,
    crypto: CryptoSymbol,
  ): Promise<any> {
    let wallet = await prisma.wallet.findFirst({
      where: { merchantId, crypto },
    });

    if (!wallet) {
      // Get merchant's index for HD derivation
      const merchantRecord = await prisma.merchant.findUnique({
        where: { id: merchantId },
      });
      if (!merchantRecord) {
        throw new NotFoundError('Merchant not found');
      }

      // Use merchant's sequential index for HD derivation
      const merchantCount = await prisma.wallet.count({
        where: { crypto },
      });
      const merchantIndex = merchantCount; // Sequential index per crypto

      // Generate the main deposit address
      const addressData = await cryptoService.generateAddress(
        crypto,
        merchantIndex,
        0, // Base address index
      );

      wallet = await prisma.wallet.create({
        data: {
          merchantId,
          crypto,
          address: addressData.address,
          publicKey: addressData.publicKey,
          derivationPath: addressData.derivationPath,
          derivationIndex: merchantIndex,
          balance: new Decimal(0),
          pendingBalance: new Decimal(0),
          totalReceived: new Decimal(0),
          totalWithdrawn: new Decimal(0),
          autoWithdrawEnabled: false,
          autoWithdrawAddress: null,
          autoWithdrawThreshold: null,
        },
      });

      logger.info(
        `Wallet created for merchant ${merchantId}: ${crypto} (${addressData.address})`,
      );
    }

    return wallet;
  }

  /**
   * Generate a unique payment address for a specific payment.
   *
   * Uses an atomic counter (Redis INCR) to guarantee unique payment indices
   * even under concurrent requests. This prevents two payments from getting
   * the same derivation index and thus the same deposit address.
   */
  async generatePaymentAddress(
    merchantId: string,
    crypto: CryptoSymbol,
  ): Promise<{
    address: string;
    derivationPath: string;
  }> {
    const wallet = await this.getOrCreateWallet(merchantId, crypto);

    // Atomic counter for payment index — prevents duplicate addresses under concurrency
    const counterKey = `wallet:${wallet.id}:payment_index`;
    const paymentIndex = await redis.incr(counterKey);

    // If this is a fresh counter (first use), seed it from DB count to stay consistent
    if (paymentIndex === 1) {
      const existingCount = await prisma.payment.count({
        where: { merchantId, crypto },
      });
      if (existingCount > 0) {
        await redis.set(counterKey, existingCount + 1);
        const correctedIndex = existingCount + 1;
        const addressData = await cryptoService.generateAddress(
          crypto,
          wallet.derivationIndex,
          correctedIndex,
        );
        return {
          address: addressData.address,
          derivationPath: addressData.derivationPath,
        };
      }
    }

    const addressData = await cryptoService.generateAddress(
      crypto,
      wallet.derivationIndex,
      paymentIndex,
    );

    return {
      address: addressData.address,
      derivationPath: addressData.derivationPath,
    };
  }

  /**
   * Get all wallets for a merchant.
   */
  async getMerchantWallets(merchantId: string): Promise<any[]> {
    const wallets = await prisma.wallet.findMany({
      where: { merchantId },
      orderBy: { crypto: 'asc' },
    });

    // Enrich with real-time balance checks from cache or blockchain
    const enriched = await Promise.all(
      wallets.map(async (wallet) => {
        const cacheKey = `balance:${wallet.crypto}:${wallet.address}`;
        const cachedBalance = await redis.get(cacheKey);

        let liveBalance: Decimal;
        if (cachedBalance) {
          liveBalance = new Decimal(cachedBalance);
        } else {
          try {
            liveBalance = await cryptoService.getBalance(
              wallet.crypto as CryptoSymbol,
              wallet.address,
            );
            // Cache for 60 seconds
            await redis.setex(cacheKey, 60, liveBalance.toString());
          } catch {
            liveBalance = wallet.balance;
          }
        }

        return {
          ...wallet,
          liveBalance: liveBalance.toString(),
        };
      }),
    );

    return enriched;
  }

  /**
   * Get a specific wallet.
   */
  async getWallet(
    merchantId: string,
    crypto: CryptoSymbol,
  ): Promise<any> {
    const wallet = await this.getOrCreateWallet(merchantId, crypto);

    // Get live balance
    let liveBalance: Decimal;
    try {
      liveBalance = await cryptoService.getBalance(crypto, wallet.address);
      await redis.setex(
        `balance:${crypto}:${wallet.address}`,
        60,
        liveBalance.toString(),
      );
    } catch {
      liveBalance = wallet.balance;
    }

    return {
      ...wallet,
      liveBalance: liveBalance.toString(),
    };
  }

  /**
   * Credit a merchant's wallet balance after a confirmed payment.
   */
  async creditBalance(
    merchantId: string,
    crypto: CryptoSymbol,
    amount: Decimal,
    paymentId: string,
  ): Promise<void> {
    const wallet = await this.getOrCreateWallet(merchantId, crypto);

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: amount },
        totalReceived: { increment: amount },
      },
    });

    // Check auto-withdraw
    if (wallet.autoWithdrawEnabled && wallet.autoWithdrawAddress && wallet.autoWithdrawThreshold) {
      const updatedWallet = await prisma.wallet.findUnique({
        where: { id: wallet.id },
      });

      if (
        updatedWallet &&
        updatedWallet.balance.gte(updatedWallet.autoWithdrawThreshold!)
      ) {
        // Queue auto-withdrawal (handled by withdrawal service)
        await redis.lpush(
          'withdrawal:queue',
          JSON.stringify({
            walletId: wallet.id,
            merchantId,
            crypto,
            amount: updatedWallet.balance.toString(),
            address: wallet.autoWithdrawAddress,
            type: 'auto',
          }),
        );

        logger.info(
          `Auto-withdraw triggered for merchant ${merchantId}: ${updatedWallet.balance} ${crypto}`,
        );
      }
    }

    logger.info(
      `Balance credited: ${amount} ${crypto} to merchant ${merchantId} (payment: ${paymentId})`,
    );
  }

  /**
   * Debit a merchant's wallet balance for withdrawal.
   *
   * Uses a conditional update (balance >= amount) to atomically check-and-debit,
   * preventing race conditions where two concurrent withdrawals both pass
   * the balance check before either debit executes.
   */
  async debitBalance(
    merchantId: string,
    crypto: CryptoSymbol,
    amount: Decimal,
  ): Promise<void> {
    const wallet = await this.getOrCreateWallet(merchantId, crypto);

    // Atomic check-and-debit: only succeeds if balance >= amount at execution time
    const result = await prisma.wallet.updateMany({
      where: {
        id: wallet.id,
        balance: { gte: amount },
      },
      data: {
        balance: { decrement: amount },
        totalWithdrawn: { increment: amount },
      },
    });

    if (result.count === 0) {
      // Re-read for accurate error message
      const current = await prisma.wallet.findUnique({ where: { id: wallet.id } });
      throw new ValidationError(
        `Insufficient balance. Available: ${current?.balance?.toString() ?? '0'} ${crypto}`,
      );
    }
  }

  /**
   * Configure auto-withdrawal for a wallet.
   */
  async configureAutoWithdraw(
    merchantId: string,
    crypto: CryptoSymbol,
    config: {
      enabled: boolean;
      address?: string;
      threshold?: string;
    },
  ): Promise<any> {
    const wallet = await this.getOrCreateWallet(merchantId, crypto);

    if (config.enabled) {
      if (!config.address) {
        throw new ValidationError('Withdrawal address is required for auto-withdraw');
      }

      if (!validateCryptoAddress(config.address, crypto)) {
        throw new ValidationError(`Invalid ${crypto} address`);
      }

      if (!config.threshold) {
        throw new ValidationError('Threshold is required for auto-withdraw');
      }

      const threshold = new Decimal(config.threshold);
      const cryptoConfig = SUPPORTED_CRYPTOS[crypto];
      const minAmount = new Decimal(cryptoConfig.minAmount);

      if (threshold.lt(minAmount)) {
        throw new ValidationError(
          `Threshold must be at least ${cryptoConfig.minAmount} ${crypto}`,
        );
      }
    }

    const updated = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        autoWithdrawEnabled: config.enabled,
        autoWithdrawAddress: config.enabled ? config.address : null,
        autoWithdrawThreshold: config.enabled
          ? new Decimal(config.threshold!)
          : null,
      },
    });

    logger.info(
      `Auto-withdraw ${config.enabled ? 'enabled' : 'disabled'} for ${crypto} wallet of merchant ${merchantId}`,
    );

    return updated;
  }

  /**
   * Move pending balance to confirmed balance.
   */
  async confirmPendingBalance(
    merchantId: string,
    crypto: CryptoSymbol,
    amount: Decimal,
  ): Promise<void> {
    const wallet = await this.getOrCreateWallet(merchantId, crypto);

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        pendingBalance: { decrement: amount },
        balance: { increment: amount },
      },
    });
  }

  /**
   * Add to pending balance when a payment is detected but not yet confirmed.
   */
  async addPendingBalance(
    merchantId: string,
    crypto: CryptoSymbol,
    amount: Decimal,
  ): Promise<void> {
    const wallet = await this.getOrCreateWallet(merchantId, crypto);

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        pendingBalance: { increment: amount },
      },
    });
  }
}

export const walletService = new WalletService();
