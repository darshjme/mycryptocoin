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

/**
 * SECURITY: Validate webhook URLs to prevent SSRF.
 * Block internal/private IP ranges and cloud metadata endpoints.
 */
function isSafeWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Must be HTTPS in production
    if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
      return false;
    }
    // Block private/reserved hostnames and IPs
    const hostname = parsed.hostname.toLowerCase();
    const blockedPatterns = [
      /^localhost$/,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,           // AWS metadata
      /^0\./,
      /^fc00:/i,               // IPv6 private
      /^fe80:/i,               // IPv6 link-local
      /^::1$/,                 // IPv6 loopback
      /^fd/i,                  // IPv6 unique local
      /metadata\.google/,      // GCP metadata
      /\.internal$/,
      /\.local$/,
    ];
    return !blockedPatterns.some((p) => p.test(hostname));
  } catch {
    return false;
  }
}

export const webhookSchema = z.object({
  url: z.string().url('Invalid webhook URL').refine(isSafeWebhookUrl, {
    message: 'Webhook URL must be a public HTTPS endpoint. Private/internal addresses are not allowed.',
  }),
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
