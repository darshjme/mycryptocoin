import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/,
      'Password must include uppercase, lowercase, number, and special character',
    ),
  businessName: z.string().min(2).max(200),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, 'Phone must be in international format (e.g., +1234567890)'),
  whatsappNumber: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, 'WhatsApp number must be in international format')
    .optional(),
  country: z.string().min(2).max(2).optional(),
  website: z.string().url().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const verifyWhatsappOtpSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/),
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must be numeric'),
  purpose: z.enum(['registration', 'login', '2fa']),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/,
      'Password must include uppercase, lowercase, number, and special character',
    ),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyWhatsappOtpInput = z.infer<typeof verifyWhatsappOtpSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
