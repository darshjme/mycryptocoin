import { z } from 'zod';
import { CryptoNetwork, TokenSymbol } from '@mycryptocoin/shared';

const networkValues = Object.values(CryptoNetwork) as [string, ...string[]];
const tokenValues = Object.values(TokenSymbol) as [string, ...string[]];

export const walletParamSchema = z.object({
  network: z.enum(networkValues, {
    errorMap: () => ({ message: 'Unsupported network' }),
  }),
  token: z.enum(tokenValues, {
    errorMap: () => ({ message: 'Unsupported token' }),
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
});

export const listWalletsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(20).optional(),
});

export type WalletParam = z.infer<typeof walletParamSchema>;
export type AutoWithdrawInput = z.infer<typeof autoWithdrawSchema>;
export type WithdrawInput = z.infer<typeof withdrawSchema>;
