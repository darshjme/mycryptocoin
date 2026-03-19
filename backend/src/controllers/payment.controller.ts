import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { asyncHandler } from '../middleware/errorHandler';
import { parsePagination, buildPaginatedResult } from '../utils/helpers';

export const createPayment = asyncHandler(async (req: Request, res: Response) => {
  const merchantId = req.merchant!.id;
  const payment = await paymentService.createPayment(merchantId, req.body);

  res.status(201).json({
    success: true,
    data: {
      id: payment.id,
      crypto: payment.crypto,
      amount: payment.amount.toString(),
      depositAddress: payment.depositAddress,
      status: payment.status,
      confirmationsRequired: payment.confirmationsRequired,
      expiresAt: payment.expiresAt,
      createdAt: payment.createdAt,
    },
  });
});

export const getPayment = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentService.getPayment(
    req.params.id,
    req.merchant!.id,
  );

  res.status(200).json({
    success: true,
    data: {
      id: payment.id,
      crypto: payment.crypto,
      amount: payment.amount.toString(),
      currency: payment.currency,
      description: payment.description,
      orderId: payment.orderId,
      customerEmail: payment.customerEmail,
      customerName: payment.customerName,
      depositAddress: payment.depositAddress,
      status: payment.status,
      txHash: payment.txHash,
      confirmations: payment.confirmations,
      confirmationsRequired: payment.confirmationsRequired,
      feeAmount: payment.feeAmount?.toString(),
      netAmount: payment.netAmount?.toString(),
      expiresAt: payment.expiresAt,
      completedAt: payment.completedAt,
      createdAt: payment.createdAt,
      metadata: payment.metadata,
    },
  });
});

export const listPayments = asyncHandler(async (req: Request, res: Response) => {
  const pagination = parsePagination(
    req.query.page as string,
    req.query.limit as string,
  );

  const { payments, total } = await paymentService.listPayments(
    req.merchant!.id,
    {
      status: req.query.status as string,
      crypto: req.query.crypto as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      orderId: req.query.orderId as string,
      ...pagination,
    },
  );

  const result = buildPaginatedResult(
    payments.map((p) => ({
      id: p.id,
      crypto: p.crypto,
      amount: p.amount.toString(),
      status: p.status,
      txHash: p.txHash,
      confirmations: p.confirmations,
      feeAmount: p.feeAmount?.toString(),
      netAmount: p.netAmount?.toString(),
      orderId: p.orderId,
      expiresAt: p.expiresAt,
      completedAt: p.completedAt,
      createdAt: p.createdAt,
    })),
    total,
    pagination,
  );

  res.status(200).json({
    success: true,
    ...result,
  });
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentService.verifyPayment(
    req.params.id,
    req.body.txHash,
    req.merchant!.id,
  );

  res.status(200).json({
    success: true,
    data: {
      id: payment.id,
      status: payment.status,
      txHash: payment.txHash,
      confirmations: payment.confirmations,
      confirmationsRequired: payment.confirmationsRequired,
    },
    message:
      payment.status === 'CONFIRMED'
        ? 'Payment confirmed and processed'
        : 'Payment is being confirmed. We will notify you when complete.',
  });
});
