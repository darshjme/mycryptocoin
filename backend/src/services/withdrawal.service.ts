import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import {
  CryptoNetwork,
  TokenSymbol,
  WithdrawalStatus,
} from '@mycryptocoin/shared';
import { cryptoKey, SUPPORTED_CRYPTOS } from '../config/crypto';
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
    network: CryptoNetwork,
    token: TokenSymbol,
    data: {
      address: string;
      amount: string;
    },
  ): Promise<any> {
    const key = cryptoKey(network, token);
    const config = SUPPORTED_CRYPTOS[key];
    const amount = new Decimal(data.amount);

    // Validate address
    if (!validateCryptoAddress(data.address, network)) {
      throw new ValidationError(`Invalid ${token} address on ${network}: ${data.address}`);
    }

    // Validate minimum amount
    if (!meetsMinimumAmount(amount, network, token)) {
      throw new ValidationError(
        `Minimum withdrawal for ${token} on ${network} is ${config.minWithdrawal}`,
      );
    }

    // Check balance
    const wallet = await walletService.getOrCreateWallet(merchantId, network, token);
    if (wallet.balance.lt(amount)) {
      throw new WithdrawalError(
        `Insufficient balance. Available: ${wallet.balance.toString()} ${token}`,
      );
    }

    // Estimate network fee
    const estimatedFee = await cryptoService.estimateFee(network, token, data.address, amount);
    const netAmount = amount.sub(estimatedFee);

    // Create withdrawal record
    const withdrawal = await prisma.withdrawal.create({
      data: {
        id: generateId('wd'),
        merchantId,
        walletId: wallet.id,
        network,
        token,
        amount,
        fee: estimatedFee,
        netAmount,
        toAddress: data.address,
        status: WithdrawalStatus.PENDING,
      },
    });

    // Debit balance immediately (reserve funds)
    await walletService.debitBalance(merchantId, network, token, amount);

    // Queue for processing
    await redis.lpush(
      'withdrawal:queue',
      JSON.stringify({
        withdrawalId: withdrawal.id,
        walletId: wallet.id,
        merchantId,
        network,
        token,
        amount: amount.toString(),
        address: data.address,
      }),
    );

    // Dispatch webhook
    await webhookService.dispatch(merchantId, 'withdrawal.completed', {
      withdrawalId: withdrawal.id,
      amount: amount.toString(),
      network,
      token,
      toAddress: data.address,
      estimatedFee: estimatedFee.toString(),
    });

    logger.info(
      `Withdrawal requested: ${withdrawal.id} — ${amount} ${token} (${network}) to ${data.address}`,
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
          status: WithdrawalStatus.FAILED,
          reviewNote: (error as Error).message,
        },
      });

      // Refund the balance
      const network = data.network as CryptoNetwork;
      const token = data.token as TokenSymbol;
      await walletService.creditBalance(
        data.merchantId,
        network,
        token,
        new Decimal(data.amount),
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
    network: string;
    token: string;
    amount: string;
    address: string;
  }): Promise<void> {
    const network = data.network as CryptoNetwork;
    const token = data.token as TokenSymbol;
    const amount = new Decimal(data.amount);

    // Update status to PROCESSING
    await prisma.withdrawal.update({
      where: { id: data.withdrawalId },
      data: { status: WithdrawalStatus.PROCESSING },
    });

    // Send the transaction
    const result = await cryptoService.sendTransaction(network, token, {
      toAddress: data.address,
      amount,
    });

    // Update withdrawal record
    await prisma.withdrawal.update({
      where: { id: data.withdrawalId },
      data: {
        txHash: result.txHash,
        fee: result.fee,
        netAmount: amount.sub(result.fee),
        status: WithdrawalStatus.COMPLETED,
        processedAt: new Date(),
      },
    });

    // Dispatch webhook
    await webhookService.dispatch(data.merchantId, 'withdrawal.completed', {
      withdrawalId: data.withdrawalId,
      amount: data.amount,
      network,
      token,
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
        network,
        token,
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
      network?: CryptoNetwork;
      token?: TokenSymbol;
      status?: WithdrawalStatus;
      page: number;
      limit: number;
    },
  ): Promise<{ withdrawals: any[]; total: number }> {
    const where: any = { merchantId };
    if (filters.network) where.network = filters.network;
    if (filters.token) where.token = filters.token;
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
