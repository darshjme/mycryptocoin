import crypto from 'crypto';
import { redis } from '../config/redis';
import { OTPError, RateLimitError } from '../utils/errors';
import { logger } from '../utils/logger';

const OTP_TTL = 300; // 5 minutes
const OTP_RATE_LIMIT_TTL = 60; // 1 minute between OTP requests
const OTP_MAX_ATTEMPTS = 5;
const OTP_HOURLY_MAX = 5; // Max OTP requests per identifier per hour
const OTP_HOURLY_TTL = 3600; // 1 hour

export class OTPService {
  /**
   * Generate a 6-digit OTP and store in Redis.
   */
  async generateOTP(
    identifier: string,
    purpose: string,
  ): Promise<string> {
    const key = this.getKey(identifier, purpose);
    const rateLimitKey = `${key}:ratelimit`;
    const attemptsKey = `${key}:attempts`;
    const hourlyKey = `${key}:hourly`;

    // Check per-request rate limit (1 min cooldown)
    const rateLimited = await redis.exists(rateLimitKey);
    if (rateLimited) {
      const ttl = await redis.ttl(rateLimitKey);
      throw new RateLimitError(
        `Please wait ${ttl} seconds before requesting a new OTP`,
      );
    }

    // Check hourly rate limit
    const hourlyCount = parseInt((await redis.get(hourlyKey)) || '0', 10);
    if (hourlyCount >= OTP_HOURLY_MAX) {
      const ttl = await redis.ttl(hourlyKey);
      throw new RateLimitError(
        `Maximum OTP requests per hour exceeded. Try again in ${ttl} seconds.`,
      );
    }

    // Generate 6-digit OTP
    const otp = this.generateSecureOTP();

    // Store OTP with TTL
    await redis.setex(key, OTP_TTL, otp);

    // Set per-request rate limit
    await redis.setex(rateLimitKey, OTP_RATE_LIMIT_TTL, '1');

    // Increment hourly counter
    const newCount = await redis.incr(hourlyKey);
    if (newCount === 1) {
      await redis.expire(hourlyKey, OTP_HOURLY_TTL);
    }

    // Reset attempt counter
    await redis.del(attemptsKey);

    const maskedId = identifier.slice(0, 4) + '****' + identifier.slice(-2);
    logger.info(`OTP generated for ${maskedId} (purpose: ${purpose})`);

    return otp;
  }

  /**
   * Verify an OTP.
   */
  async verifyOTP(
    identifier: string,
    purpose: string,
    otp: string,
  ): Promise<boolean> {
    const key = this.getKey(identifier, purpose);
    const attemptsKey = `${key}:attempts`;

    // Check attempt count
    const attempts = parseInt((await redis.get(attemptsKey)) || '0', 10);
    if (attempts >= OTP_MAX_ATTEMPTS) {
      // Delete the OTP after max attempts
      await redis.del(key);
      await redis.del(attemptsKey);
      throw new OTPError(
        'Maximum verification attempts exceeded. Please request a new OTP.',
      );
    }

    // Increment attempts
    await redis.incr(attemptsKey);
    await redis.expire(attemptsKey, OTP_TTL);

    // Get stored OTP
    const storedOTP = await redis.get(key);
    if (!storedOTP) {
      throw new OTPError('OTP has expired or was not generated');
    }

    // Timing-safe comparison.
    // SECURITY: timingSafeEqual throws if buffers differ in length.
    // Guard against that to prevent DoS via malformed OTP input.
    const otpBuf = Buffer.from(otp);
    const storedBuf = Buffer.from(storedOTP);
    const isValid =
      otpBuf.length === storedBuf.length &&
      crypto.timingSafeEqual(otpBuf, storedBuf);

    if (isValid) {
      // Delete OTP after successful verification
      await redis.del(key);
      await redis.del(attemptsKey);
      logger.info(`OTP verified for ${identifier} (purpose: ${purpose})`);
      return true;
    }

    const remaining = OTP_MAX_ATTEMPTS - attempts - 1;
    logger.warn(
      `OTP verification failed for ${identifier} (${remaining} attempts remaining)`,
    );

    return false;
  }

  /**
   * Invalidate an existing OTP.
   */
  async invalidateOTP(identifier: string, purpose: string): Promise<void> {
    const key = this.getKey(identifier, purpose);
    await redis.del(key);
    await redis.del(`${key}:attempts`);
    await redis.del(`${key}:ratelimit`);
  }

  /**
   * Check if an OTP exists for the given identifier.
   */
  async hasActiveOTP(identifier: string, purpose: string): Promise<boolean> {
    const key = this.getKey(identifier, purpose);
    return (await redis.exists(key)) === 1;
  }

  private getKey(identifier: string, purpose: string): string {
    return `otp:${purpose}:${identifier}`;
  }

  private generateSecureOTP(): string {
    // Generate cryptographically secure 6-digit OTP
    const buffer = crypto.randomBytes(4);
    const num = buffer.readUInt32BE(0) % 1000000;
    return num.toString().padStart(6, '0');
  }
}

export const otpService = new OTPService();
