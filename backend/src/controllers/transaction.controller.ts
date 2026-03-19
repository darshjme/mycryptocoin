import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { parsePagination, buildPaginatedResult } from '../utils/helpers';

export const listTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const merchantId = req.merchant!.id;
    const pagination = parsePagination(
      req.query.page as string,
      req.query.limit as string,
    );

    const type = req.query.type as string | undefined;
    const crypto = req.query.crypto as string | undefined;
    const status = req.query.status as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    // Fetch payments and withdrawals, merge them as "transactions"
    const results: any[] = [];
    let totalCount = 0;

    if (!type || type === 'payment') {
      const paymentWhere: any = { merchantId };
      if (crypto) paymentWhere.crypto = crypto;
      if (status) paymentWhere.status = status;
      if (hasDateFilter) paymentWhere.createdAt = dateFilter;

      const [payments, paymentCount] = await Promise.all([
        prisma.payment.findMany({
          where: paymentWhere,
          orderBy: { createdAt: 'desc' },
          skip: type === 'payment' ? (pagination.page - 1) * pagination.limit : 0,
          take: type === 'payment' ? pagination.limit : Math.ceil(pagination.limit / 2),
        }),
        prisma.payment.count({ where: paymentWhere }),
      ]);

      results.push(
        ...payments.map((p) => ({
          id: p.id,
          type: 'payment' as const,
          crypto: p.crypto,
          amount: p.amount.toString(),
          status: p.status,
          txHash: p.txHash,
          feeAmount: p.feeAmount?.toString(),
          netAmount: p.netAmount?.toString(),
          description: p.description,
          orderId: p.orderId,
          createdAt: p.createdAt,
          completedAt: p.completedAt,
        })),
      );
      totalCount += paymentCount;
    }

    if (!type || type === 'withdrawal') {
      const withdrawalWhere: any = { merchantId };
      if (crypto) withdrawalWhere.crypto = crypto;
      if (status) withdrawalWhere.status = status;
      if (hasDateFilter) withdrawalWhere.createdAt = dateFilter;

      const [withdrawals, withdrawalCount] = await Promise.all([
        prisma.withdrawal.findMany({
          where: withdrawalWhere,
          orderBy: { createdAt: 'desc' },
          skip:
            type === 'withdrawal'
              ? (pagination.page - 1) * pagination.limit
              : 0,
          take:
            type === 'withdrawal'
              ? pagination.limit
              : Math.ceil(pagination.limit / 2),
        }),
        prisma.withdrawal.count({ where: withdrawalWhere }),
      ]);

      results.push(
        ...withdrawals.map((w) => ({
          id: w.id,
          type: 'withdrawal' as const,
          crypto: w.crypto,
          amount: w.amount.toString(),
          status: w.status,
          txHash: w.txHash,
          toAddress: w.toAddress,
          networkFee: w.networkFee?.toString(),
          memo: w.memo,
          createdAt: w.createdAt,
          completedAt: w.completedAt,
        })),
      );
      totalCount += withdrawalCount;
    }

    // Sort merged results by date descending
    results.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Apply pagination to merged results if both types
    const paginatedResults =
      !type
        ? results.slice(0, pagination.limit)
        : results;

    const paginatedResponse = buildPaginatedResult(
      paginatedResults,
      totalCount,
      pagination,
    );

    res.status(200).json({
      success: true,
      ...paginatedResponse,
    });
  },
);
