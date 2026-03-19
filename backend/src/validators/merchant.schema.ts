import { z } from 'zod';

export const updateProfileSchema = z.object({
  businessName: z.string().min(2).max(200).optional(),
  website: z.string().url().optional(),
  country: z.string().min(2).max(2).optional(),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/)
    .optional(),
  whatsappNumber: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/)
    .optional(),
  notificationPreferences: z
    .object({
      paymentReceived: z.boolean().optional(),
      paymentConfirmed: z.boolean().optional(),
      withdrawalCompleted: z.boolean().optional(),
      whatsappEnabled: z.boolean().optional(),
      emailEnabled: z.boolean().optional(),
    })
    .optional(),
  webhookUrl: z.string().url().optional(),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  mode: z.enum(['live', 'test']),
  permissions: z
    .array(z.enum(['payments:read', 'payments:write', 'wallets:read', 'wallets:write', 'transactions:read', 'webhooks:manage']))
    .min(1, 'At least one permission is required'),
  ipWhitelist: z.array(z.string().ip()).optional(),
});

export const deleteApiKeyParamSchema = z.object({
  id: z.string().min(1, 'API key ID is required'),
});

export const webhookSchema = z.object({
  url: z.string().url('Invalid webhook URL'),
  events: z
    .array(
      z.enum([
        'payment.created',
        'payment.confirming',
        'payment.confirmed',
        'payment.completed',
        'payment.expired',
        'payment.failed',
        'withdrawal.initiated',
        'withdrawal.completed',
        'withdrawal.failed',
      ]),
    )
    .min(1, 'At least one event is required'),
  isActive: z.boolean().default(true),
});

export const webhookUpdateSchema = webhookSchema.partial();

export const webhookParamSchema = z.object({
  id: z.string().min(1, 'Webhook ID is required'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type WebhookInput = z.infer<typeof webhookSchema>;
export type WebhookUpdateInput = z.infer<typeof webhookUpdateSchema>;
