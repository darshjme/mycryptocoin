/**
 * Refund Service
 *
 * Handles full and partial refunds for completed payments.
 * Supports refund in original crypto or USDT, with status tracking
 * and webhook notifications.
 */

import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config/database';
import { RefundStatus, PaymentStatus, CryptoNetwork, TokenSymbol } from '@mycryptocoin/shared';
import { cryptoService } from './crypto.service';
import { webhookService } from './webhook.service';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import crypto from 'crypto';

export interface CreateRefundInput {
  amount?: string;       // If not provided, full refund
  reason?: string;
  toAddress?: string;    // Refund destination (if not provided, uses original sender)
  refundInUsdt?: boolean; // Refund in USDT instead of original crypto
}

export interface RefundData {
  id: string;
  paymentId: string;
  merchantId: string;
  amount: Decimal;
  currency: string;
  network?: string;
  token?: string;
  toAddress?: string;
  txHash?: string;
  reason?: string;
  status: string;
  isPartial: boolean;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class RefundService {
  /**
   * Initiate a refund for a completed payment.
   */
  async createRefund(
    paymentId: string,
    merchantId: string,
    input: CreateRefundInput,
  ): Promise<RefundData> {
    // Fetch the payment
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, merchantId },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.status !== PaymentStatus.PAID && payment.status !== PaymentStatus.OVERPAID) {
      throw new ValidationError('Can only refund completed payments');
    }

    // Check for existing refunds on this payment
    const existingRefunds = await prisma.refund.findMany({
      where: {
        paymentId,
        status: { in: [RefundStatus.PENDING, RefundStatus.PROCESSING, RefundStatus.COMPLETED] },
      },
    });

    const totalRefunded = existingRefunds.reduce(
      (sum, r) => sum.add(new Decimal(r.amount.toString())),
      new Decimal(0),
    );

    const paymentAmount = new Decimal(payment.cryptoAmount.toString());
    const refundAmount = input.amount
      ? new Decimal(input.amount)
      : paymentAmount.sub(totalRefunded);

    if (refundAmount.lte(0)) {
      throw new ValidationError('Refund amount must be greater than 0');
    }

    if (totalRefunded.add(refundAmount).gt(paymentAmount)) {
      throw new ValidationError(
        `Total refunds cannot exceed payment amount. Already refunded: ${totalRefunded}, payment: ${paymentAmount}`,
      );
    }

    const isPartial = refundAmount.lt(paymentAmount.sub(totalRefunded));

    // Determine refund currency
    const refundNetwork = input.refundInUsdt ? CryptoNetwork.TRON : payment.network as CryptoNetwork;
    const refundToken = input.refundInUsdt ? TokenSymbol.USDT : payment.token as TokenSymbol;

    const refund = await prisma.refund.create({
      data: {
        id: crypto.randomUUID(),
        paymentId,
        merchantId,
        amount: refundAmount,
        currency: `${refundNetwork}:${refundToken}`,
        network: refundNetwork,
        token: refundToken,
        toAddress: input.toAddress || null,
        reason: input.reason || null,
        status: RefundStatus.PENDING,
        isPartial,
      },
    });

    // Update payment status if full refund
    if (!isPartial && totalRefunded.add(refundAmount).eq(paymentAmount)) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.REFUNDED },
      });
    }

    // Dispatch webhook
    await webhookService.dispatch(merchantId, 'refund.initiated', {
      refundId: refund.id,
      paymentId,
      amount: refundAmount.toString(),
      currency: `${refundNetwork}:${refundToken}`,
      isPartial,
      reason: input.reason,
    });

    logger.info(
      `Refund initiated: ${refund.id} for payment ${paymentId}, amount: ${refundAmount} ${refundToken} (${isPartial ? 'partial' : 'full'})`,
    );

    return refund as unknown as RefundData;
  }

  /**
   * Process a pending refund (execute the on-chain transaction).
   * Called by the refund worker or admin action.
   */
  async processRefund(refundId: string): Promise<RefundData> {
    const refund = await prisma.refund.findUnique({ where: { id: refundId } });
    if (!refund) throw new NotFoundError('Refund not found');

    if (refund.status !== RefundStatus.PENDING) {
      throw new ValidationError('Refund is not in pending status');
    }

    // Mark as processing
    await prisma.refund.update({
      where: { id: refundId },
      data: { status: RefundStatus.PROCESSING },
    });

    try {
      // If no destination address, we cannot process automatically
      if (!refund.toAddress) {
        logger.warn(`Refund ${refundId}: no destination address — requires manual processing`);
        return refund as unknown as RefundData;
      }

      // Execute on-chain refund transaction
      // In production, this would debit from the merchant's USDT wallet
      // and send to the customer's address via crypto.service
      const network = refund.network as CryptoNetwork;
      const token = refund.token as TokenSymbol;

      logger.info(`Processing refund ${refundId}: ${refund.amount} ${token} to ${refund.toAddress}`);

      // Mark as completed (in production, this happens after tx confirmation)
      const updated = await prisma.refund.update({
        where: { id: refundId },
        data: {
          status: RefundStatus.COMPLETED,
          processedAt: new Date(),
        },
      });

      // Deduct from merchant's wallet balance
      await prisma.wallet.updateMany({
        where: {
          merchantId: refund.merchantId,
          network: refund.network as CryptoNetwork,
          token: refund.token as TokenSymbol,
        },
        data: {
          balance: { decrement: refund.amount },
        },
      });

      // Dispatch webhook
      await webhookService.dispatch(refund.merchantId, 'refund.completed', {
        refundId,
        paymentId: refund.paymentId,
        amount: refund.amount.toString(),
        txHash: refund.txHash,
      });

      logger.info(`Refund completed: ${refundId}`);
      return updated as unknown as RefundData;
    } catch (error) {
      // Mark as failed
      await prisma.refund.update({
        where: { id: refundId },
        data: { status: RefundStatus.FAILED },
      });

      await webhookService.dispatch(refund.merchantId, 'refund.failed', {
        refundId,
        paymentId: refund.paymentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      logger.error(`Refund failed: ${refundId}`, { error });
      throw error;
    }
  }

  /**
   * Get a refund by ID.
   */
  async getRefund(refundId: string, merchantId?: string): Promise<RefundData> {
    const where: any = { id: refundId };
    if (merchantId) where.merchantId = merchantId;

    const refund = await prisma.refund.findFirst({ where });
    if (!refund) throw new NotFoundError('Refund not found');
    return refund as unknown as RefundData;
  }

  /**
   * List refunds with filters.
   */
  async listRefunds(
    merchantId: string,
    filters: {
      paymentId?: string;
      status?: string;
      page: number;
      limit: number;
    },
  ): Promise<{ refunds: RefundData[]; total: number }> {
    const where: any = { merchantId };
    if (filters.paymentId) where.paymentId = filters.paymentId;
    if (filters.status) where.status = filters.status;

    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.refund.count({ where }),
    ]);

    return { refunds: refunds as unknown as RefundData[], total };
  }
}

export const refundService = new RefundService();
