import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { CryptoSymbol, SUPPORTED_CRYPTOS } from '../config/crypto';
import { cryptoService } from './crypto.service';
import { walletService } from './wallet.service';
import { webhookService } from './webhook.service';
import { notificationService } from './notification.service';
import { validateCryptoAddress, meetsMinimumAmount } from '../utils/crypto';
import { generateId } from '../utils/helpers';
import { WithdrawalError, ValidationError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export class WithdrawalService {
  private processingInterval: NodeJS.Timeout | null = null;

  /**
   * Request a manual withdrawal.
   */
  async requestWithdrawal(
    merchantId: string,
    crypto: CryptoSymbol,
    data: {
      address: string;
      amount: string;
      memo?: string;
    },
  ): Promise<any> {
    const config = SUPPORTED_CRYPTOS[crypto];
    const amount = new Decimal(data.amount);

    // Validate address
    if (!validateCryptoAddress(data.address, crypto)) {
      throw new ValidationError(`Invalid ${crypto} address: ${data.address}`);
    }

    // Validate minimum amount
    if (!meetsMinimumAmount(amount, crypto)) {
      throw new ValidationError(
        `Minimum withdrawal for ${crypto} is ${config.minAmount}`,
      );
    }

    // Check balance
    const wallet = await walletService.getOrCreateWallet(merchantId, crypto);
    if (wallet.balance.lt(amount)) {
      throw new WithdrawalError(
        `Insufficient balance. Available: ${wallet.balance.toString()} ${crypto}`,
      );
    }

    // Estimate network fee
    const estimatedFee = await cryptoService.estimateFee(crypto, data.address, amount);
    const totalDebit = amount; // Network fee is deducted from the sent amount

    // Create withdrawal record
    const withdrawal = await prisma.withdrawal.create({
      data: {
        id: generateId('wd'),
        merchantId,
        walletId: wallet.id,
        crypto: crypto as string,
        amount,
        toAddress: data.address,
        memo: data.memo,
        estimatedFee,
        status: 'PENDING',
        type: 'manual',
      },
    });

    // Debit balance immediately (reserve funds)
    await walletService.debitBalance(merchantId, crypto, amount);

    // Queue for processing
    await redis.lpush(
      'withdrawal:queue',
      JSON.stringify({
        withdrawalId: withdrawal.id,
        walletId: wallet.id,
        merchantId,
        crypto,
        amount: amount.toString(),
        address: data.address,
        memo: data.memo,
        type: 'manual',
        derivationIndex: wallet.derivationIndex,
      }),
    );

    // Dispatch webhook
    await webhookService.dispatch(merchantId, 'withdrawal.initiated', {
      withdrawalId: withdrawal.id,
      amount: amount.toString(),
      crypto: crypto as string,
      toAddress: data.address,
      estimatedFee: estimatedFee.toString(),
    });

    logger.info(
      `Withdrawal requested: ${withdrawal.id} — ${amount} ${crypto} to ${data.address}`,
    );

    return withdrawal;
  }

  /**
   * Process pending withdrawals from the queue.
   */
  async processWithdrawalQueue(): Promise<void> {
    const item = await redis.rpop('withdrawal:queue');
    if (!item) return;

    const data = JSON.parse(item);

    try {
      await this.executeWithdrawal(data);
    } catch (error) {
      logger.error(`Withdrawal processing failed: ${data.withdrawalId}`, {
        error,
      });

      // Update status to FAILED
      await prisma.withdrawal.update({
        where: { id: data.withdrawalId },
        data: {
          status: 'FAILED',
          error: (error as Error).message,
        },
      });

      // Refund the balance
      await walletService.creditBalance(
        data.merchantId,
        data.crypto as CryptoSymbol,
        new Decimal(data.amount),
        `refund:${data.withdrawalId}`,
      );

      // Notify
      await webhookService.dispatch(data.merchantId, 'withdrawal.failed', {
        withdrawalId: data.withdrawalId,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Execute a withdrawal on the blockchain.
   */
  private async executeWithdrawal(data: {
    withdrawalId: string;
    walletId: string;
    merchantId: string;
    crypto: string;
    amount: string;
    address: string;
    memo?: string;
    derivationIndex: number;
  }): Promise<void> {
    const crypto = data.crypto as CryptoSymbol;
    const amount = new Decimal(data.amount);

    // Update status to PROCESSING
    await prisma.withdrawal.update({
      where: { id: data.withdrawalId },
      data: { status: 'PROCESSING' },
    });

    // Get the private key for the wallet's main address (index 0)
    const privateKey = cryptoService.derivePrivateKey(
      crypto,
      data.derivationIndex,
      0,
    );

    // Send the transaction
    const result = await cryptoService.sendTransaction(crypto, {
      fromPrivateKey: privateKey,
      toAddress: data.address,
      amount,
      memo: data.memo,
    });

    // Update withdrawal record
    await prisma.withdrawal.update({
      where: { id: data.withdrawalId },
      data: {
        txHash: result.txHash,
        networkFee: result.fee,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Dispatch webhook
    await webhookService.dispatch(data.merchantId, 'withdrawal.completed', {
      withdrawalId: data.withdrawalId,
      amount: data.amount,
      crypto: data.crypto,
      toAddress: data.address,
      txHash: result.txHash,
      networkFee: result.fee.toString(),
    });

    // Send notifications
    const merchant = await prisma.merchant.findUnique({
      where: { id: data.merchantId },
    });

    if (merchant) {
      await notificationService.sendWithdrawalNotification(merchant, {
        amount: data.amount,
        crypto: data.crypto,
        address: data.address,
        txHash: result.txHash,
        fee: result.fee.toString(),
      });
    }

    logger.info(
      `Withdrawal completed: ${data.withdrawalId} — tx: ${result.txHash}`,
    );
  }

  /**
   * Get withdrawal history for a merchant.
   */
  async getWithdrawals(
    merchantId: string,
    filters: {
      crypto?: string;
      status?: string;
      page: number;
      limit: number;
    },
  ): Promise<{ withdrawals: any[]; total: number }> {
    const where: any = { merchantId };
    if (filters.crypto) where.crypto = filters.crypto;
    if (filters.status) where.status = filters.status;

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.withdrawal.count({ where }),
    ]);

    return { withdrawals, total };
  }

  /**
   * Start withdrawal queue processing loop.
   */
  startProcessing(): void {
    if (this.processingInterval) return;

    this.processingInterval = setInterval(async () => {
      try {
        const queueLength = await redis.llen('withdrawal:queue');
        if (queueLength > 0) {
          await this.processWithdrawalQueue();
        }
      } catch (error) {
        logger.error('Withdrawal queue processing error', { error });
      }
    }, 10000); // Every 10 seconds

    logger.info('Withdrawal processing started');
  }

  /**
   * Stop the processing loop.
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      logger.info('Withdrawal processing stopped');
    }
  }
}

export const withdrawalService = new WithdrawalService();
