import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { whatsappService } from '../services/whatsapp.service';
import { otpService } from '../services/otp.service';
import { feeService } from '../services/fee.service';
import { parsePagination, buildPaginatedResult } from '../utils/helpers';

export const getMerchants = asyncHandler(async (req: Request, res: Response) => {
  const pagination = parsePagination(
    req.query.page as string,
    req.query.limit as string,
  );

  const search = req.query.search as string | undefined;
  const where: any = {};

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { businessName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [merchants, total] = await Promise.all([
    prisma.merchant.findMany({
      where,
      select: {
        id: true,
        email: true,
        businessName: true,
        phone: true,
        country: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: true,
        _count: {
          select: {
            payments: true,
            wallets: true,
            apiKeys: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    }),
    prisma.merchant.count({ where }),
  ]);

  const result = buildPaginatedResult(merchants, total, pagination);

  res.status(200).json({
    success: true,
    ...result,
  });
});

export const getTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const pagination = parsePagination(
      req.query.page as string,
      req.query.limit as string,
    );

    const merchantId = req.query.merchantId as string | undefined;
    const crypto = req.query.crypto as string | undefined;
    const status = req.query.status as string | undefined;

    const where: any = {};
    if (merchantId) where.merchantId = merchantId;
    if (crypto) where.crypto = crypto;
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          merchant: {
            select: { id: true, email: true, businessName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.payment.count({ where }),
    ]);

    const result = buildPaginatedResult(
      payments.map((p) => ({
        id: p.id,
        merchantId: p.merchantId,
        merchantEmail: p.merchant.email,
        merchantName: p.merchant.businessName,
        crypto: p.crypto,
        amount: p.amount.toString(),
        status: p.status,
        txHash: p.txHash,
        feeAmount: p.feeAmount?.toString(),
        netAmount: p.netAmount?.toString(),
        createdAt: p.createdAt,
        completedAt: p.completedAt,
      })),
      total,
      pagination,
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  },
);

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const [
    totalMerchants,
    activeMerchants,
    totalPayments,
    completedPayments,
    pendingPayments,
    totalWithdrawals,
  ] = await Promise.all([
    prisma.merchant.count(),
    prisma.merchant.count({ where: { isActive: true } }),
    prisma.payment.count(),
    prisma.payment.count({ where: { status: 'COMPLETED' } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.withdrawal.count(),
  ]);

  // Volume by crypto
  const volumeByCrypto = await prisma.payment.groupBy({
    by: ['crypto'],
    where: { status: 'COMPLETED' },
    _sum: { amount: true, feeAmount: true },
    _count: { id: true },
  });

  res.status(200).json({
    success: true,
    data: {
      merchants: {
        total: totalMerchants,
        active: activeMerchants,
      },
      payments: {
        total: totalPayments,
        completed: completedPayments,
        pending: pendingPayments,
      },
      withdrawals: {
        total: totalWithdrawals,
      },
      volume: volumeByCrypto.map((v) => ({
        crypto: v.crypto,
        totalAmount: v._sum.amount?.toString() || '0',
        totalFees: v._sum.feeAmount?.toString() || '0',
        count: v._count.id,
      })),
    },
  });
});

export const initWhatsapp = asyncHandler(
  async (_req: Request, res: Response) => {
    await whatsappService.initialize();

    res.status(200).json({
      success: true,
      message: 'WhatsApp initialization started',
    });
  },
);

export const getWhatsappQr = asyncHandler(
  async (_req: Request, res: Response) => {
    const status = whatsappService.getConnectionStatus();
    const qr = await whatsappService.getQRCode();

    res.status(200).json({
      success: true,
      data: {
        connected: status.connected,
        hasQR: status.hasQR,
        qrCode: qr,
      },
    });
  },
);

export const sendWhatsappOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const { phone, purpose } = req.body;

    // Validate phone number format
    if (!phone || typeof phone !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Phone number is required' },
      });
      return;
    }

    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length < 7 || cleaned.length > 15) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid phone number format (expected 7-15 digits)',
        },
      });
      return;
    }

    const otp = await otpService.generateOTP(cleaned, purpose || 'admin');
    const sent = await whatsappService.sendOTP(cleaned, otp);

    res.status(200).json({
      success: true,
      data: { sent },
      message: sent
        ? 'OTP sent via WhatsApp'
        : 'Failed to send OTP via WhatsApp',
    });
  },
);

export const getRevenue = asyncHandler(async (req: Request, res: Response) => {
  const crypto = req.query.crypto as string | undefined;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;

  let revenue;
  if (startDate && endDate) {
    revenue = await feeService.getRevenueByDateRange(
      new Date(startDate),
      new Date(endDate),
      crypto,
    );
  } else {
    revenue = await feeService.getTotalRevenue(crypto);
  }

  res.status(200).json({
    success: true,
    data: revenue.map((r) => ({
      crypto: r.crypto,
      totalFees: r.totalFees.toString(),
      paymentCount: r.paymentCount,
      ...('totalGross' in r
        ? { totalGross: (r as any).totalGross.toString() }
        : {}),
    })),
  });
});
