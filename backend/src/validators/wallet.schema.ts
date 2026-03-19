import { z } from 'zod';
import { CryptoSymbol } from '../config/crypto';

const cryptoSymbols = Object.values(CryptoSymbol) as [string, ...string[]];

export const walletCryptoParamSchema = z.object({
  crypto: z.enum(cryptoSymbols, {
    errorMap: () => ({ message: 'Unsupported cryptocurrency' }),
  }),
});

export const autoWithdrawSchema = z.object({
  enabled: z.boolean(),
  address: z
    .string()
    .min(1, 'Withdrawal address is required')
    .optional(),
  threshold: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Threshold must be a valid decimal number')
    .optional(),
});

export const withdrawSchema = z.object({
  address: z.string().min(1, 'Withdrawal address is required'),
  amount: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Amount must be a valid decimal number')
    .refine((val) => parseFloat(val) > 0, 'Amount must be greater than 0'),
  memo: z.string().max(200).optional(), // For XRP destination tag, etc.
});

export const listWalletsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(20).optional(),
});

export type WalletCryptoParam = z.infer<typeof walletCryptoParamSchema>;
export type AutoWithdrawInput = z.infer<typeof autoWithdrawSchema>;
export type WithdrawInput = z.infer<typeof withdrawSchema>;
