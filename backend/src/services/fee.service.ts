import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config/database';
import { PLATFORM_FEE_RATE } from '@mycryptocoin/shared';
import { logger } from '../utils/logger';

export class FeeService {
  private readonly feeRate: Decimal;

  constructor() {
    // PLATFORM_FEE_RATE is 0.005 (i.e. 0.5%)
    this.feeRate = new Decimal(PLATFORM_FEE_RATE);
  }

  /**
   * Calculate the platform fee (0.5% default) on an incoming payment amount.
   * Returns { netAmount, feeAmount }.
   */
  calculateFee(grossAmount: Decimal): {
    netAmount: Decimal;
    feeAmount: Decimal;
  } {
    const feeAmount = grossAmount
      .mul(this.feeRate)
      .toDecimalPlaces(18, Decimal.ROUND_UP);

    const netAmount = grossAmount.sub(feeAmount);

    return { netAmount, feeAmount };
  }

  /**
   * Record a fee transaction in the database.
   */
  async recordFee(params: {
    paymentId: string;
    merchantId: string;
    crypto: string;
    grossAmount: Decimal;
    feeAmount: Decimal;
    netAmount: Decimal;
  }): Promise<void> {
    await prisma.feeRecord.create({
      data: {
        paymentId: params.paymentId,
        merchantId: params.merchantId,
        crypto: params.crypto,
        grossAmount: params.grossAmount,
        feeAmount: params.feeAmount,
        netAmount: params.netAmount,
      },
    });

    logger.info(
      `Fee recorded: ${params.feeAmount.toString()} ${params.crypto} from payment ${params.paymentId}`,
    );
  }

  /**
   * Get total fee revenue across all cryptos or for a specific one.
   */
  async getTotalRevenue(crypto?: string): Promise<
    Array<{
      crypto: string;
      totalFees: Decimal;
      totalGross: Decimal;
      paymentCount: number;
    }>
  > {
    const where = crypto ? { crypto } : {};

    const result = await prisma.feeRecord.groupBy({
      by: ['crypto'],
      where,
      _sum: {
        feeAmount: true,
        grossAmount: true,
      },
      _count: {
        id: true,
      },
    });

    return result.map((r) => ({
      crypto: r.crypto,
      totalFees: r._sum.feeAmount || new Decimal(0),
      totalGross: r._sum.grossAmount || new Decimal(0),
      paymentCount: r._count.id,
    }));
  }

  /**
   * Get fee revenue for a specific date range.
   */
  async getRevenueByDateRange(
    startDate: Date,
    endDate: Date,
    crypto?: string,
  ): Promise<
    Array<{
      crypto: string;
      totalFees: Decimal;
      paymentCount: number;
    }>
  > {
    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };
    if (crypto) where.crypto = crypto;

    const result = await prisma.feeRecord.groupBy({
      by: ['crypto'],
      where,
      _sum: {
        feeAmount: true,
      },
      _count: {
        id: true,
      },
    });

    return result.map((r) => ({
      crypto: r.crypto,
      totalFees: r._sum.feeAmount || new Decimal(0),
      paymentCount: r._count.id,
    }));
  }

  /**
   * Get fee records for a specific merchant.
   */
  async getMerchantFees(
    merchantId: string,
    options: { page: number; limit: number },
  ): Promise<{
    records: any[];
    total: number;
  }> {
    const [records, total] = await Promise.all([
      prisma.feeRecord.findMany({
        where: { merchantId },
        orderBy: { createdAt: 'desc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      prisma.feeRecord.count({ where: { merchantId } }),
    ]);

    return { records, total };
  }
}

export const feeService = new FeeService();
