import crypto from 'crypto';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Generate a cryptographically secure unique ID with optional prefix.
 */
export function generateId(prefix?: string, length: number = 24): string {
  const id = crypto.randomBytes(length).toString('hex').slice(0, length);
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Generate a payment ID.
 */
export function generatePaymentId(): string {
  return generateId('pay', 24);
}

/**
 * Generate an API key with the format mcc_live_xxxx or mcc_test_xxxx.
 */
export function generateApiKey(mode: 'live' | 'test'): string {
  const key = crypto.randomBytes(32).toString('hex');
  return `mcc_${mode}_${key}`;
}

/**
 * Generate an API key secret for HMAC signing.
 */
export function generateApiKeySecret(): string {
  return crypto.randomBytes(48).toString('base64url');
}

/**
 * Hash an API key for storage (only store hashed version).
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Format a Date to ISO string.
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Format a Date to a human-readable string.
 */
export function formatDateHuman(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });
}

/**
 * Build pagination metadata.
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function parsePagination(
  page?: number | string,
  limit?: number | string,
): PaginationParams {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  return { page: p, limit: l };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  params: PaginationParams,
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / params.limit);
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}

export function paginationToSkipTake(params: PaginationParams): {
  skip: number;
  take: number;
} {
  return {
    skip: (params.page - 1) * params.limit,
    take: params.limit,
  };
}

/**
 * Safe BigInt/Decimal amount conversion.
 */
export function toDecimal(value: string | number | bigint): Decimal {
  return new Decimal(value.toString());
}

/**
 * Calculate percentage of an amount.
 */
export function calculatePercentage(amount: Decimal, percent: number): Decimal {
  return amount.mul(new Decimal(percent)).div(new Decimal(100));
}

/**
 * Generate HMAC-SHA256 signature.
 */
export function generateHmacSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verify HMAC-SHA256 signature (timing-safe).
 */
export function verifyHmacSignature(
  payload: string,
  secret: string,
  signature: string,
): boolean {
  const expected = generateHmacSignature(payload, secret);
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Sleep for a given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mask a string, showing only first and last N chars.
 */
export function maskString(str: string, showChars: number = 4): string {
  if (str.length <= showChars * 2) return '***';
  return `${str.slice(0, showChars)}...${str.slice(-showChars)}`;
}
