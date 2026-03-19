/**
 * Discount / Coupon Service
 *
 * Create and manage discount codes: percentage or fixed amount,
 * usage limits, expiry dates, per-customer limits, and validation.
 */

import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config/database';
import { DiscountType } from '@mycryptocoin/shared';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import crypto from 'crypto';

export interface CreateDiscountInput {
  code?: string;               // Auto-generated if not provided
  type: 'PERCENTAGE' | 'FIXED';
  value: string;               // Percentage (e.g. "10") or fixed amount (e.g. "5.00")
  maxUses?: number;
  perCustomerLimit?: number;
  minOrderAmount?: string;
  applicableCheckoutIds?: string[];
  expiresAt?: string;
}

export interface DiscountData {
  id: string;
  merchantId: string;
  code: string;
  type: string;
  value: Decimal;
  maxUses?: number;
  usedCount: number;
  perCustomerLimit?: number;
  minOrderAmount?: Decimal;
  applicableCheckoutIds?: string[];
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscountValidationResult {
  valid: boolean;
  discountAmount: Decimal;
  finalAmount: Decimal;
  message?: string;
}

export class DiscountService {
  /**
   * Generate a random discount code.
   */
  private generateCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  /**
   * Create a new discount code.
   */
  async createDiscount(merchantId: string, input: CreateDiscountInput): Promise<DiscountData> {
    const code = input.code || this.generateCode();
    const value = new Decimal(input.value);

    if (input.type === 'PERCENTAGE' && (value.lt(0) || value.gt(100))) {
      throw new ValidationError('Percentage discount must be between 0 and 100');
    }
    if (value.lte(0)) {
      throw new ValidationError('Discount value must be positive');
    }

    // Check for duplicate code within merchant
    const existing = await prisma.discount.findFirst({
      where: { merchantId, code: code.toUpperCase() },
    });
    if (existing) {
      throw new ValidationError(`Discount code "${code}" already exists`);
    }

    const discount = await prisma.discount.create({
      data: {
        id: crypto.randomUUID(),
        merchantId,
        code: code.toUpperCase(),
        type: input.type as DiscountType,
        value,
        maxUses: input.maxUses || null,
        usedCount: 0,
        perCustomerLimit: input.perCustomerLimit || null,
        minOrderAmount: input.minOrderAmount ? new Decimal(input.minOrderAmount) : null,
        applicableCheckoutIds: input.applicableCheckoutIds || [],
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        isActive: true,
      },
    });

    logger.info(`Discount created: ${code} (${input.type} ${input.value}) for merchant ${merchantId}`);
    return discount as unknown as DiscountData;
  }

  /**
   * Validate and calculate a discount for a given order.
   */
  async validateDiscount(
    code: string,
    merchantId: string,
    orderAmount: Decimal,
    customerEmail?: string,
    checkoutId?: string,
  ): Promise<DiscountValidationResult> {
    const discount = await prisma.discount.findFirst({
      where: { merchantId, code: code.toUpperCase(), isActive: true },
    });

    if (!discount) {
      return { valid: false, discountAmount: new Decimal(0), finalAmount: orderAmount, message: 'Invalid discount code' };
    }

    // Check expiry
    if (discount.expiresAt && new Date() > discount.expiresAt) {
      return { valid: false, discountAmount: new Decimal(0), finalAmount: orderAmount, message: 'Discount code has expired' };
    }

    // Check max uses
    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
      return { valid: false, discountAmount: new Decimal(0), finalAmount: orderAmount, message: 'Discount code usage limit reached' };
    }

    // Check per-customer limit
    if (discount.perCustomerLimit && customerEmail) {
      const customerUses = await prisma.discountUsage.count({
        where: { discountId: discount.id, customerEmail },
      });
      if (customerUses >= discount.perCustomerLimit) {
        return { valid: false, discountAmount: new Decimal(0), finalAmount: orderAmount, message: 'You have already used this discount code' };
      }
    }

    // Check minimum order amount
    if (discount.minOrderAmount && orderAmount.lt(new Decimal(discount.minOrderAmount.toString()))) {
      return {
        valid: false,
        discountAmount: new Decimal(0),
        finalAmount: orderAmount,
        message: `Minimum order amount is ${discount.minOrderAmount}`,
      };
    }

    // Check applicable checkout IDs
    const applicableIds = (discount.applicableCheckoutIds as string[]) || [];
    if (applicableIds.length > 0 && checkoutId && !applicableIds.includes(checkoutId)) {
      return { valid: false, discountAmount: new Decimal(0), finalAmount: orderAmount, message: 'Discount not applicable to this checkout' };
    }

    // Calculate discount
    let discountAmount: Decimal;
    if (discount.type === DiscountType.PERCENTAGE) {
      discountAmount = orderAmount.mul(new Decimal(discount.value.toString())).div(100);
    } else {
      discountAmount = new Decimal(discount.value.toString());
    }

    // Ensure discount doesn't exceed order amount
    if (discountAmount.gt(orderAmount)) {
      discountAmount = orderAmount;
    }

    const finalAmount = orderAmount.sub(discountAmount);

    return {
      valid: true,
      discountAmount,
      finalAmount,
    };
  }

  /**
   * Apply a discount (increment usage count, record usage).
   */
  async applyDiscount(
    discountId: string,
    paymentId: string,
    customerEmail?: string,
  ): Promise<void> {
    await prisma.$transaction([
      prisma.discount.update({
        where: { id: discountId },
        data: { usedCount: { increment: 1 } },
      }),
      prisma.discountUsage.create({
        data: {
          id: crypto.randomUUID(),
          discountId,
          paymentId,
          customerEmail: customerEmail || null,
          appliedAt: new Date(),
        },
      }),
    ]);

    logger.info(`Discount ${discountId} applied to payment ${paymentId}`);
  }

  /**
   * Get a discount by ID or code.
   */
  async getDiscount(idOrCode: string, merchantId: string): Promise<DiscountData> {
    const discount = await prisma.discount.findFirst({
      where: {
        merchantId,
        OR: [{ id: idOrCode }, { code: idOrCode.toUpperCase() }],
      },
    });

    if (!discount) throw new NotFoundError('Discount not found');
    return discount as unknown as DiscountData;
  }

  /**
   * List discounts for a merchant.
   */
  async listDiscounts(
    merchantId: string,
    filters: { isActive?: boolean; page: number; limit: number },
  ): Promise<{ discounts: DiscountData[]; total: number }> {
    const where: any = { merchantId };
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    const [discounts, total] = await Promise.all([
      prisma.discount.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.discount.count({ where }),
    ]);

    return { discounts: discounts as unknown as DiscountData[], total };
  }

  /**
   * Deactivate a discount code.
   */
  async deactivateDiscount(discountId: string, merchantId: string): Promise<DiscountData> {
    const discount = await this.getDiscount(discountId, merchantId);

    const updated = await prisma.discount.update({
      where: { id: discount.id },
      data: { isActive: false },
    });

    logger.info(`Discount ${discount.code} deactivated`);
    return updated as unknown as DiscountData;
  }
}

export const discountService = new DiscountService();
