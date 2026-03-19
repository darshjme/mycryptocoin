import { z } from 'zod';
import {
  CryptoNetwork,
  TokenSymbol,
  PaymentStatus,
} from '@mycryptocoin/shared';

const networkValues = Object.values(CryptoNetwork) as [string, ...string[]];
const tokenValues = Object.values(TokenSymbol) as [string, ...string[]];
const paymentStatusValues = Object.values(PaymentStatus) as [string, ...string[]];

export const createPaymentSchema = z.object({
  network: z.enum(networkValues, {
    errorMap: () => ({ message: 'Unsupported network' }),
  }),
  token: z.enum(tokenValues, {
    errorMap: () => ({ message: 'Unsupported token' }),
  }),
  amount: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Amount must be a valid decimal number')
    .refine((val) => parseFloat(val) > 0, 'Amount must be greater than 0'),
  currency: z.string().min(3).max(3).default('USD').optional(),
  description: z.string().max(500).optional(),
  externalId: z.string().max(100).optional(),
  customerEmail: z.string().email().optional(),
  callbackUrl: z.string().url().optional(),
  expiryMinutes: z.coerce.number().min(5).max(1440).default(30).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const getPaymentSchema = z.object({
  id: z.string().min(1, 'Payment ID is required'),
});

export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(20).optional(),
  status: z.enum(paymentStatusValues).optional(),
  network: z.enum(networkValues).optional(),
  token: z.enum(tokenValues).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  externalId: z.string().optional(),
});

export const verifyPaymentSchema = z.object({
  txHash: z.string().min(1, 'Transaction hash is required'),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type GetPaymentInput = z.infer<typeof getPaymentSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
