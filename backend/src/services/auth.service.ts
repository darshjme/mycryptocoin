import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { env } from '../config/env';
import { generateTokens, verifyRefreshToken, JwtPayload } from '../middleware/auth';
import { otpService } from './otp.service';
import { whatsappService } from './whatsapp.service';
import { emailService } from './email.service';
import {
  AuthError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../utils/errors';
import { logger } from '../utils/logger';
import {
  RegisterInput,
  LoginInput,
  VerifyWhatsappOtpInput,
} from '../validators/auth.schema';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

export class AuthService {
  /**
   * Register a new merchant.
   */
  async register(data: RegisterInput): Promise<{
    merchant: { id: string; email: string; businessName: string };
    message: string;
  }> {
    // Check if email already exists
    const existing = await prisma.merchant.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    // Check if phone already exists
    const existingPhone = await prisma.merchant.findFirst({
      where: { phone: data.phone },
    });
    if (existingPhone) {
      throw new ConflictError('An account with this phone number already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create merchant
    const merchant = await prisma.merchant.create({
      data: {
        email: data.email,
        passwordHash,
        businessName: data.businessName,
        phone: data.phone,
        whatsappNumber: data.whatsappNumber || data.phone,
        country: data.country,
        website: data.website,
        role: 'MERCHANT',
        isActive: false, // Activated after verification
        isEmailVerified: false,
        isPhoneVerified: false,
      },
    });

    // Send WhatsApp OTP (primary)
    const whatsappNum = data.whatsappNumber || data.phone;
    const otp = await otpService.generateOTP(whatsappNum, 'registration');
    const whatsappSent = await whatsappService.sendOTP(whatsappNum, otp);

    // Send email verification (secondary)
    const emailToken = crypto.randomBytes(32).toString('hex');
    await redis.setex(`email_verify:${emailToken}`, 86400, merchant.id); // 24h
    await emailService.sendVerificationEmail(
      data.email,
      emailToken,
      data.businessName,
    );

    // If WhatsApp failed, send OTP via email as fallback
    if (!whatsappSent) {
      await emailService.sendOtpEmail(data.email, otp);
      logger.warn(
        `WhatsApp OTP failed for ${whatsappNum}, sent via email as fallback`,
      );
    }

    logger.info(`New merchant registered: ${merchant.id} (${data.email})`);

    return {
      merchant: {
        id: merchant.id,
        email: merchant.email,
        businessName: merchant.businessName,
      },
      message: whatsappSent
        ? 'Registration successful. Please verify your WhatsApp number with the OTP sent.'
        : 'Registration successful. OTP sent to your email (WhatsApp delivery failed). Please also verify your email.',
    };
  }

  /**
   * Login with email and password.
   */
  async login(data: LoginInput): Promise<{
    requiresOTP: boolean;
    otpSentVia: string;
    tempToken?: string;
    tokens?: { accessToken: string; refreshToken: string };
  }> {
    const merchant = await prisma.merchant.findUnique({
      where: { email: data.email },
    });

    if (!merchant) {
      throw new AuthError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      data.password,
      merchant.passwordHash,
    );
    if (!isPasswordValid) {
      throw new AuthError('Invalid email or password');
    }

    if (!merchant.isActive) {
      throw new AuthError(
        'Account not activated. Please complete verification first.',
      );
    }

    // 2FA: Send OTP via WhatsApp (primary)
    const phone = merchant.whatsappNumber || merchant.phone;
    const otp = await otpService.generateOTP(phone, 'login');

    let otpSentVia = 'whatsapp';
    const whatsappSent = await whatsappService.sendOTP(phone, otp);

    if (!whatsappSent) {
      // Fallback to email
      await emailService.sendOtpEmail(merchant.email, otp);
      otpSentVia = 'email';
    }

    // Generate a temporary token for the OTP verification step
    const tempToken = crypto.randomBytes(32).toString('hex');
    await redis.setex(
      `login_temp:${tempToken}`,
      300, // 5 min
      merchant.id,
    );

    return {
      requiresOTP: true,
      otpSentVia,
      tempToken,
    };
  }

  /**
   * Verify WhatsApp OTP (for registration or login 2FA).
   */
  async verifyWhatsappOTP(data: VerifyWhatsappOtpInput & { tempToken?: string }): Promise<{
    tokens?: { accessToken: string; refreshToken: string };
    message: string;
  }> {
    const isValid = await otpService.verifyOTP(data.phone, data.purpose, data.otp);

    if (!isValid) {
      throw new AuthError('Invalid OTP');
    }

    if (data.purpose === 'registration') {
      // Activate merchant
      const merchant = await prisma.merchant.findFirst({
        where: {
          OR: [{ phone: data.phone }, { whatsappNumber: data.phone }],
        },
      });

      if (!merchant) {
        throw new NotFoundError('Merchant not found for this phone number');
      }

      await prisma.merchant.update({
        where: { id: merchant.id },
        data: {
          isPhoneVerified: true,
          isActive: true,
        },
      });

      const payload: JwtPayload = {
        merchantId: merchant.id,
        email: merchant.email,
        role: merchant.role,
      };

      const tokens = generateTokens(payload);
      await this.storeRefreshToken(merchant.id, tokens.refreshToken);

      return {
        tokens,
        message: 'Phone verified. Account activated successfully.',
      };
    }

    if (data.purpose === 'login') {
      if (!data.tempToken) {
        throw new ValidationError('Temporary login token is required');
      }

      const merchantId = await redis.get(`login_temp:${data.tempToken}`);
      if (!merchantId) {
        throw new AuthError('Login session expired. Please login again.');
      }

      await redis.del(`login_temp:${data.tempToken}`);

      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
      });

      if (!merchant) {
        throw new NotFoundError('Merchant not found');
      }

      const payload: JwtPayload = {
        merchantId: merchant.id,
        email: merchant.email,
        role: merchant.role,
      };

      const tokens = generateTokens(payload);
      await this.storeRefreshToken(merchant.id, tokens.refreshToken);

      return {
        tokens,
        message: 'Login successful.',
      };
    }

    return { message: 'OTP verified successfully.' };
  }

  /**
   * Verify email with token.
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const merchantId = await redis.get(`email_verify:${token}`);
    if (!merchantId) {
      throw new AuthError('Invalid or expired verification token');
    }

    await prisma.merchant.update({
      where: { id: merchantId },
      data: { isEmailVerified: true },
    });

    await redis.del(`email_verify:${token}`);

    logger.info(`Email verified for merchant ${merchantId}`);

    return { message: 'Email verified successfully.' };
  }

  /**
   * Refresh access token.
   */
  async refreshToken(refreshTokenValue: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    let decoded: JwtPayload & { type: string };

    try {
      decoded = verifyRefreshToken(refreshTokenValue);
    } catch {
      throw new AuthError('Invalid refresh token');
    }

    if (decoded.type !== 'refresh') {
      throw new AuthError('Invalid token type');
    }

    // Check if refresh token is in Redis (rotation check)
    const storedToken = await redis.get(
      `refresh_token:${decoded.merchantId}`,
    );
    if (!storedToken || storedToken !== refreshTokenValue) {
      // Possible token reuse — invalidate all tokens for this merchant
      await redis.del(`refresh_token:${decoded.merchantId}`);
      throw new AuthError('Refresh token has been revoked');
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: decoded.merchantId },
    });

    if (!merchant || !merchant.isActive) {
      throw new AuthError('Account not found or deactivated');
    }

    const payload: JwtPayload = {
      merchantId: merchant.id,
      email: merchant.email,
      role: merchant.role,
    };

    // Rotate refresh token
    const tokens = generateTokens(payload);
    await this.storeRefreshToken(merchant.id, tokens.refreshToken);

    return tokens;
  }

  /**
   * Logout — invalidate refresh token.
   */
  async logout(merchantId: string): Promise<void> {
    await redis.del(`refresh_token:${merchantId}`);
    logger.info(`Merchant ${merchantId} logged out`);
  }

  /**
   * Forgot password — send reset link.
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const merchant = await prisma.merchant.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!merchant) {
      return {
        message:
          'If an account exists with this email, a password reset link has been sent.',
      };
    }

    const token = crypto.randomBytes(32).toString('hex');
    await redis.setex(`password_reset:${token}`, 3600, merchant.id); // 1 hour

    await emailService.sendPasswordResetEmail(email, token);

    return {
      message:
        'If an account exists with this email, a password reset link has been sent.',
    };
  }

  /**
   * Reset password with token.
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const merchantId = await redis.get(`password_reset:${token}`);
    if (!merchantId) {
      throw new AuthError('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.merchant.update({
      where: { id: merchantId },
      data: { passwordHash },
    });

    // Invalidate the reset token and all refresh tokens
    await redis.del(`password_reset:${token}`);
    await redis.del(`refresh_token:${merchantId}`);

    logger.info(`Password reset for merchant ${merchantId}`);

    return { message: 'Password reset successfully. Please login with your new password.' };
  }

  /**
   * Store refresh token in Redis with TTL.
   */
  private async storeRefreshToken(
    merchantId: string,
    token: string,
  ): Promise<void> {
    await redis.setex(`refresh_token:${merchantId}`, REFRESH_TOKEN_TTL, token);
  }
}

export const authService = new AuthService();
