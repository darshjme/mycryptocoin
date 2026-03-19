import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import {
  CryptoNetwork,
  TokenSymbol,
  PaymentStatus,
  TransactionStatus,
  PLATFORM_FEE_RATE,
} from '@mycryptocoin/shared';
import { cryptoKey, SUPPORTED_CRYPTOS } from '../config/crypto';
import { env } from '../config/env';
import { cryptoService } from './crypto.service';
import { walletService } from './wallet.service';
import { feeService } from './fee.service';
import { conversionService } from './conversion.service';
import { webhookService } from './webhook.service';
import { notificationService } from './notification.service';
import { generatePaymentId } from '../utils/helpers';
import { meetsMinimumAmount } from '../utils/crypto';
import { PaymentError, NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { CreatePaymentInput } from '../validators/payment.schema';

export class PaymentService {
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Create a new payment request.
   */
  async createPayment(
    merchantId: string,
    data: CreatePaymentInput,
  ): Promise<any> {
    const network = data.network as CryptoNetwork;
    const token = data.token as TokenSymbol;
    const key = cryptoKey(network, token);
    const config = SUPPORTED_CRYPTOS[key];
    const amount = new Decimal(data.amount);

    // Validate minimum amount
    if (!meetsMinimumAmount(amount, network, token)) {
      throw new ValidationError(
        `Minimum amount for ${token} on ${network} is ${config.minDeposit}`,
      );
    }

    // Generate unique payment address
    const addressData = await walletService.generatePaymentAddress(
      merchantId,
      network,
      token,
    );

    const paymentId = generatePaymentId();
    const expiresAt = new Date(
      Date.now() + (data.expiryMinutes || env.PAYMENT_EXPIRY_MINUTES) * 60 * 1000,
    );

    const payment = await prisma.payment.create({
      data: {
        id: paymentId,
        merchantId,
        externalId: data.externalId,
        network,
        token,
        requestedAmount: amount,
        requestedCurrency: data.currency || 'USD',
        cryptoAmount: amount, // Will be recalculated with exchange rate
        receivedAmount: new Decimal(0),
        exchangeRate: new Decimal(1), // Placeholder — real rate set by exchange service
        fee: new Decimal(0),
        feeRate: new Decimal(PLATFORM_FEE_RATE),
        status: PaymentStatus.AWAITING_PAYMENT,
        depositAddress: addressData.address,
        customerEmail: data.customerEmail,
        callbackUrl: data.callbackUrl,
        expiresAt,
        metadata: data.metadata || {},
      },
    });

    // Add to monitoring set in Redis
    await redis.sadd('payments:monitoring', paymentId);
    await redis.setex(
      `payment:${paymentId}:data`,
      (data.expiryMinutes || env.PAYMENT_EXPIRY_MINUTES) * 60 + 3600, // Extra hour for confirmation monitoring
      JSON.stringify({
        id: paymentId,
        merchantId,
        network,
        token,
        amount: amount.toString(),
        depositAddress: addressData.address,
        confirmationsRequired: config.confirmationsRequired,
        expiresAt: expiresAt.toISOString(),
      }),
    );

    // Send webhook
    await webhookService.dispatch(merchantId, 'payment.created', {
      paymentId,
      amount: amount.toString(),
      network,
      token,
      depositAddress: addressData.address,
      expiresAt: expiresAt.toISOString(),
    });

    logger.info(
      `Payment created: ${paymentId} — ${amount} ${token} (${network}) for merchant ${merchantId}`,
    );

    return payment;
  }

  /**
   * Get a payment by ID.
   */
  async getPayment(paymentId: string, merchantId?: string): Promise<any> {
    const where: any = { id: paymentId };
    if (merchantId) where.merchantId = merchantId;

    const payment = await prisma.payment.findFirst({ where });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    return payment;
  }

  /**
   * List payments with filters.
   */
  async listPayments(
    merchantId: string,
    filters: {
      status?: PaymentStatus;
      network?: CryptoNetwork;
      token?: TokenSymbol;
      startDate?: string;
      endDate?: string;
      externalId?: string;
      page: number;
      limit: number;
    },
  ): Promise<{ payments: any[]; total: number }> {
    const where: any = { merchantId };

    if (filters.status) where.status = filters.status;
    if (filters.network) where.network = filters.network;
    if (filters.token) where.token = filters.token;
    if (filters.externalId) where.externalId = filters.externalId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return { payments, total };
  }

  /**
   * Manually verify a payment with a transaction hash.
   */
  async verifyPayment(
    paymentId: string,
    txHash: string,
    merchantId: string,
  ): Promise<any> {
    const payment = await this.getPayment(paymentId, merchantId);

    if (payment.status === PaymentStatus.PAID || payment.status === PaymentStatus.OVERPAID) {
      throw new PaymentError('Payment already completed');
    }

    if (payment.status === PaymentStatus.EXPIRED) {
      throw new PaymentError('Payment has expired');
    }

    const network = payment.network as CryptoNetwork;
    const token = payment.token as TokenSymbol;
    const key = cryptoKey(network, token);

    // Check transaction confirmations
    const confirmations = await cryptoService.getConfirmations(network, token, txHash);

    const config = SUPPORTED_CRYPTOS[key];
    const isPaid = confirmations >= config.confirmationsRequired;

    // Create a Transaction record
    await prisma.transaction.create({
      data: {
        paymentId,
        walletId: payment.walletId || '', // Resolved from deposit address
        network,
        token,
        txHash,
        fromAddress: '',
        toAddress: payment.depositAddress,
        amount: payment.cryptoAmount,
        fee: new Decimal(0),
        confirmations,
        requiredConfirmations: config.confirmationsRequired,
        status: isPaid ? TransactionStatus.CONFIRMED : TransactionStatus.CONFIRMING,
      },
    });

    const newStatus = isPaid ? PaymentStatus.PAID : PaymentStatus.UNDERPAID;

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: newStatus,
        receivedAmount: payment.cryptoAmount,
        paidAt: isPaid ? new Date() : undefined,
      },
    });

    if (isPaid) {
      await this.processConfirmedPayment(payment);
    } else {
      // Add to confirmation monitoring
      await redis.sadd('payments:confirming', paymentId);
      await webhookService.dispatch(merchantId, 'payment.confirmed', {
        paymentId,
        txHash,
        confirmations,
        confirmationsRequired: config.confirmationsRequired,
      });
    }

    return updated;
  }

  /**
   * Process a confirmed payment: convert to USDT, deduct fee, credit merchant's
   * single USDT TRC-20 wallet, trigger webhook.
   *
   * Flow:
   * 1. Receive payment in original crypto (BTC, ETH, SOL, etc.)
   * 2. Fetch exchange rate at confirmation time (crypto -> USDT)
   * 3. Calculate USDT equivalent amount
   * 4. Deduct 0.5% platform fee from USDT amount
   * 5. Credit merchant's single USDT TRC-20 balance
   *
   * Uses a Prisma interactive transaction with idempotency check to prevent
   * double-credits when concurrent monitoring loops or manual verification
   * both attempt to complete the same payment.
   */
  private async processConfirmedPayment(payment: any): Promise<void> {
    const network = payment.network as CryptoNetwork;
    const token = payment.token as TokenSymbol;
    const originalAmount = new Decimal(payment.cryptoAmount || payment.amount);

    // Convert received crypto to USDT equivalent at current rate
    const { usdtAmount, rate: exchangeRate } = await conversionService.convertToUsdt(
      originalAmount,
      token,
    );

    // Calculate fee on the USDT amount (0.5%)
    const { netAmount, feeAmount } = feeService.calculateFee(usdtAmount);

    // Atomic transaction: check status + record fee + credit USDT balance + mark paid
    // This prevents double-credits from concurrent calls.
    const alreadyCompleted = await prisma.$transaction(async (tx) => {
      // Re-read payment inside transaction to check current status (idempotency guard)
      const current = await tx.payment.findUnique({
        where: { id: payment.id },
      });

      if (!current || current.status === PaymentStatus.PAID || current.status === PaymentStatus.OVERPAID) {
        // Already processed — no-op
        return true;
      }

      // Record fee in USDT
      await tx.feeRecord.create({
        data: {
          paymentId: payment.id,
          merchantId: payment.merchantId,
          network: 'TRON' as CryptoNetwork,
          token: 'USDT' as TokenSymbol,
          grossAmount: usdtAmount,
          feeRate: new Decimal(PLATFORM_FEE_RATE),
          feeAmount,
          netAmount,
        },
      });

      // Credit merchant's SINGLE USDT TRC-20 wallet balance atomically
      // All merchants now settle in USDT regardless of which crypto was received
      await tx.wallet.updateMany({
        where: { merchantId: payment.merchantId, network: 'TRON' as CryptoNetwork, token: 'USDT' as TokenSymbol },
        data: {
          balance: { increment: netAmount },
          totalReceived: { increment: netAmount },
        },
      });

      // Update payment status to PAID with conversion details
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          fee: feeAmount,
          exchangeRate,
          receivedAmount: originalAmount,
          paidAt: new Date(),
        },
      });

      return false;
    });

    if (alreadyCompleted) {
      logger.info(`Payment ${payment.id} already completed — skipping duplicate processing`);
      return;
    }

    // Non-critical post-processing outside transaction (idempotent or best-effort)
    // Remove from monitoring
    await redis.srem('payments:monitoring', payment.id);
    await redis.srem('payments:confirming', payment.id);

    // Dispatch webhook with conversion details
    await webhookService.dispatch(payment.merchantId, 'payment.completed', {
      paymentId: payment.id,
      originalCrypto: token,
      originalAmount: originalAmount.toString(),
      exchangeRate: exchangeRate.toString(),
      usdtAmount: usdtAmount.toString(),
      feeAmount: feeAmount.toString(),
      netCredited: netAmount.toString(),
      settlementCurrency: 'USDT',
      settlementNetwork: 'TRC-20',
      network,
      token,
      txHash: payment.txHash,
    });

    // Send notifications
    const merchant = await prisma.merchant.findUnique({
      where: { id: payment.merchantId },
    });

    if (merchant) {
      await notificationService.sendPaymentNotification(merchant, {
        paymentId: payment.id,
        amount: originalAmount.toString(),
        network,
        token,
        status: PaymentStatus.PAID,
        txHash: payment.txHash,
      });
    }

    logger.info(
      `Payment completed: ${payment.id} — ${originalAmount} ${token} -> ${usdtAmount} USDT (fee: ${feeAmount} USDT, net: ${netAmount} USDT)`,
    );
  }

  /**
   * Start the payment monitoring loop.
   * Polls blockchain for incoming payments and confirmation updates.
   */
  startMonitoring(): void {
    if (this.monitoringInterval) return;

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkPendingPayments();
        await this.checkConfirmingPayments();
        await this.checkExpiredPayments();
      } catch (error) {
        logger.error('Payment monitoring error', { error });
      }
    }, 30000); // Every 30 seconds

    logger.info('Payment monitoring started');
  }

  /**
   * Stop the monitoring loop.
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Payment monitoring stopped');
    }
  }

  /**
   * Check pending payments for incoming transactions.
   */
  private async checkPendingPayments(): Promise<void> {
    const paymentIds = await redis.smembers('payments:monitoring');

    for (const paymentId of paymentIds) {
      try {
        const cached = await redis.get(`payment:${paymentId}:data`);
        if (!cached) {
          await redis.srem('payments:monitoring', paymentId);
          continue;
        }

        const paymentData = JSON.parse(cached);
        const network = paymentData.network as CryptoNetwork;
        const token = paymentData.token as TokenSymbol;

        // Check if funds have arrived at the deposit address
        const balance = await cryptoService.getBalance(
          network,
          token,
          paymentData.depositAddress,
        );

        if (balance.gt(0)) {
          // Payment detected
          const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
          });

          if (payment && payment.status === PaymentStatus.AWAITING_PAYMENT) {
            await prisma.payment.update({
              where: { id: paymentId },
              data: { status: PaymentStatus.UNDERPAID, receivedAmount: balance },
            });

            await redis.srem('payments:monitoring', paymentId);
            await redis.sadd('payments:confirming', paymentId);

            await walletService.addPendingBalance(
              paymentData.merchantId,
              network,
              token,
              balance,
            );

            await webhookService.dispatch(
              paymentData.merchantId,
              'payment.confirmed',
              {
                paymentId,
                receivedAmount: balance.toString(),
                network,
                token,
              },
            );

            logger.info(
              `Payment detected: ${paymentId} — ${balance} ${token} at ${paymentData.depositAddress}`,
            );
          }
        }
      } catch (error) {
        logger.error(`Error checking payment ${paymentId}`, { error });
      }
    }
  }

  /**
   * Check confirming payments for sufficient confirmations.
   */
  private async checkConfirmingPayments(): Promise<void> {
    const paymentIds = await redis.smembers('payments:confirming');

    for (const paymentId of paymentIds) {
      try {
        const payment = await prisma.payment.findUnique({
          where: { id: paymentId },
        });

        if (!payment || (payment.status !== PaymentStatus.UNDERPAID && payment.status !== PaymentStatus.AWAITING_PAYMENT)) {
          await redis.srem('payments:confirming', paymentId);
          continue;
        }

        // Look up the associated transaction to check confirmations
        const transactions = await prisma.transaction.findMany({
          where: { paymentId },
          orderBy: { createdAt: 'desc' },
          take: 1,
        });

        const tx = transactions[0];
        if (!tx?.txHash) continue;

        const network = payment.network as CryptoNetwork;
        const token = payment.token as TokenSymbol;
        const key = cryptoKey(network, token);
        const config = SUPPORTED_CRYPTOS[key];

        const confirmations = await cryptoService.getConfirmations(
          network,
          token,
          tx.txHash,
        );

        // Update confirmation count on Transaction
        await prisma.transaction.update({
          where: { id: tx.id },
          data: {
            confirmations,
            status: confirmations >= config.confirmationsRequired
              ? TransactionStatus.CONFIRMED
              : TransactionStatus.CONFIRMING,
          },
        });

        if (confirmations >= config.confirmationsRequired) {
          await this.processConfirmedPayment(payment);
        }
      } catch (error) {
        logger.error(`Error checking confirmations for ${paymentId}`, {
          error,
        });
      }
    }
  }

  /**
   * Check and expire payments that have passed their expiry time.
   */
  private async checkExpiredPayments(): Promise<void> {
    const expired = await prisma.payment.updateMany({
      where: {
        status: PaymentStatus.AWAITING_PAYMENT,
        expiresAt: { lt: new Date() },
      },
      data: { status: PaymentStatus.EXPIRED },
    });

    if (expired.count > 0) {
      logger.info(`Expired ${expired.count} pending payments`);

      // Get expired payment IDs to clean up Redis and send webhooks
      const expiredPayments = await prisma.payment.findMany({
        where: {
          status: PaymentStatus.EXPIRED,
          expiresAt: {
            lt: new Date(),
            gte: new Date(Date.now() - 60000), // Only recently expired
          },
        },
      });

      for (const payment of expiredPayments) {
        await redis.srem('payments:monitoring', payment.id);
        await webhookService.dispatch(payment.merchantId, 'payment.expired', {
          paymentId: payment.id,
          network: payment.network,
          token: payment.token,
          requestedAmount: payment.requestedAmount.toString(),
        });
      }
    }
  }
}

export const paymentService = new PaymentService();
