/**
 * MyCryptoCoin — Redis Caching Layer
 *
 * Caching strategy for:
 * - Exchange rates (TTL: 60s)
 * - Merchant profiles (TTL: 300s)
 * - API key lookups (TTL: 60s)
 * - Blockchain fee estimates (TTL: 30s)
 *
 * Includes cache invalidation on writes and warming on startup.
 */

import { getRedisClient } from './redis';
import { logger } from '../utils/logger';

// ---------------------------------------------------------------------------
// Cache key prefixes
// ---------------------------------------------------------------------------

const PREFIX = {
  EXCHANGE_RATE: 'cache:rate',
  MERCHANT: 'cache:merchant',
  API_KEY: 'cache:apikey',
  FEE_ESTIMATE: 'cache:fee',
} as const;

// ---------------------------------------------------------------------------
// TTLs in seconds
// ---------------------------------------------------------------------------

const TTL = {
  EXCHANGE_RATE: 60,
  MERCHANT: 300,
  API_KEY: 60,
  FEE_ESTIMATE: 30,
} as const;

// ---------------------------------------------------------------------------
// Core cache operations
// ---------------------------------------------------------------------------

/**
 * Get a cached value. Returns null on miss.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedisClient();
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err: any) {
    logger.debug('Cache get error', { key, error: err.message });
    return null;
  }
}

/**
 * Set a cached value with TTL.
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err: any) {
    logger.debug('Cache set error', { key, error: err.message });
  }
}

/**
 * Delete a cached value (explicit invalidation).
 */
export async function cacheDel(key: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.del(key);
  } catch (err: any) {
    logger.debug('Cache del error', { key, error: err.message });
  }
}

/**
 * Delete all keys matching a pattern (e.g., "cache:merchant:*").
 */
export async function cacheInvalidatePattern(pattern: string): Promise<number> {
  try {
    const redis = getRedisClient();
    let cursor = '0';
    let deletedCount = 0;

    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        await redis.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== '0');

    return deletedCount;
  } catch (err: any) {
    logger.error('Cache invalidate pattern error', { pattern, error: err.message });
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Cache-aside pattern helper
// ---------------------------------------------------------------------------

/**
 * Get-or-set: returns cached value or calls fetcher, caches result.
 */
export async function cacheGetOrSet<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const value = await fetcher();
  await cacheSet(key, value, ttlSeconds);
  return value;
}

// ---------------------------------------------------------------------------
// Domain-specific cache functions
// ---------------------------------------------------------------------------

// ---- Exchange Rates -------------------------------------------------------

export interface ExchangeRate {
  chain: string;
  symbol: string;
  usdPrice: number;
  btcPrice: number;
  updatedAt: string;
}

export async function getCachedExchangeRate(chain: string): Promise<ExchangeRate | null> {
  return cacheGet<ExchangeRate>(`${PREFIX.EXCHANGE_RATE}:${chain}`);
}

export async function setCachedExchangeRate(chain: string, rate: ExchangeRate): Promise<void> {
  await cacheSet(`${PREFIX.EXCHANGE_RATE}:${chain}`, rate, TTL.EXCHANGE_RATE);
}

export async function getAllCachedExchangeRates(): Promise<Record<string, ExchangeRate>> {
  const redis = getRedisClient();
  const keys = await redis.keys(`${PREFIX.EXCHANGE_RATE}:*`);
  if (keys.length === 0) return {};

  const pipeline = redis.pipeline();
  for (const key of keys) {
    pipeline.get(key);
  }

  const results = await pipeline.exec();
  const rates: Record<string, ExchangeRate> = {};

  if (results) {
    for (let i = 0; i < keys.length; i++) {
      const [err, raw] = results[i];
      if (!err && raw) {
        const chain = keys[i].replace(`${PREFIX.EXCHANGE_RATE}:`, '');
        try {
          rates[chain] = JSON.parse(raw as string);
        } catch {
          // Skip malformed entries
        }
      }
    }
  }

  return rates;
}

// ---- Merchant Profiles ----------------------------------------------------

export interface CachedMerchant {
  id: string;
  businessName: string;
  tier: string;
  webhookUrl: string | null;
  webhookEnabled: boolean;
  enabledChains: string[];
  feePercent: number;
}

export async function getCachedMerchant(merchantId: string): Promise<CachedMerchant | null> {
  return cacheGet<CachedMerchant>(`${PREFIX.MERCHANT}:${merchantId}`);
}

export async function setCachedMerchant(merchantId: string, merchant: CachedMerchant): Promise<void> {
  await cacheSet(`${PREFIX.MERCHANT}:${merchantId}`, merchant, TTL.MERCHANT);
}

export async function invalidateMerchantCache(merchantId: string): Promise<void> {
  await cacheDel(`${PREFIX.MERCHANT}:${merchantId}`);
  logger.debug('Merchant cache invalidated', { merchantId });
}

// ---- API Key Lookups ------------------------------------------------------

export interface CachedApiKey {
  id: string;
  merchantId: string;
  tier: string;
  permissions: string[];
  active: boolean;
}

export async function getCachedApiKey(keyHash: string): Promise<CachedApiKey | null> {
  return cacheGet<CachedApiKey>(`${PREFIX.API_KEY}:${keyHash}`);
}

export async function setCachedApiKey(keyHash: string, data: CachedApiKey): Promise<void> {
  await cacheSet(`${PREFIX.API_KEY}:${keyHash}`, data, TTL.API_KEY);
}

export async function invalidateApiKeyCache(keyHash: string): Promise<void> {
  await cacheDel(`${PREFIX.API_KEY}:${keyHash}`);
}

// ---- Blockchain Fee Estimates ---------------------------------------------

export interface CachedFeeEstimate {
  chain: string;
  slow: string;
  medium: string;
  fast: string;
  unit: string;
  updatedAt: string;
}

export async function getCachedFeeEstimate(chain: string): Promise<CachedFeeEstimate | null> {
  return cacheGet<CachedFeeEstimate>(`${PREFIX.FEE_ESTIMATE}:${chain}`);
}

export async function setCachedFeeEstimate(chain: string, fee: CachedFeeEstimate): Promise<void> {
  await cacheSet(`${PREFIX.FEE_ESTIMATE}:${chain}`, fee, TTL.FEE_ESTIMATE);
}

// ---------------------------------------------------------------------------
// Cache warming — call on startup
// ---------------------------------------------------------------------------

export async function warmCache(): Promise<void> {
  logger.info('Warming cache...');
  const startTime = Date.now();

  try {
    // Warm exchange rates
    await warmExchangeRates();

    // Warm active merchant profiles (top 100 by recent activity)
    await warmMerchantProfiles();

    // Warm fee estimates
    await warmFeeEstimates();

    const durationMs = Date.now() - startTime;
    logger.info('Cache warming completed', { durationMs });
  } catch (err: any) {
    logger.error('Cache warming failed', { error: err.message });
  }
}

async function warmExchangeRates(): Promise<void> {
  try {
    // Fetch from exchange rate service
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const rates = await prisma.exchangeRate.findMany({
      where: { active: true },
    });

    for (const rate of rates) {
      await setCachedExchangeRate(rate.chain, {
        chain: rate.chain,
        symbol: rate.symbol,
        usdPrice: parseFloat(rate.usdPrice.toString()),
        btcPrice: parseFloat(rate.btcPrice?.toString() || '0'),
        updatedAt: rate.updatedAt.toISOString(),
      });
    }

    logger.debug('Exchange rates warmed', { count: rates.length });
    await prisma.$disconnect();
  } catch (err: any) {
    logger.warn('Failed to warm exchange rates', { error: err.message });
  }
}

async function warmMerchantProfiles(): Promise<void> {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const merchants = await prisma.merchant.findMany({
      where: { active: true },
      take: 100,
      orderBy: { updatedAt: 'desc' },
    });

    for (const m of merchants) {
      await setCachedMerchant(m.id, {
        id: m.id,
        businessName: m.businessName,
        tier: m.tier || 'free',
        webhookUrl: m.webhookUrl,
        webhookEnabled: m.webhookEnabled ?? true,
        enabledChains: m.enabledChains || [],
        feePercent: parseFloat(m.feePercent?.toString() || '0.5'),
      });
    }

    logger.debug('Merchant profiles warmed', { count: merchants.length });
    await prisma.$disconnect();
  } catch (err: any) {
    logger.warn('Failed to warm merchant profiles', { error: err.message });
  }
}

async function warmFeeEstimates(): Promise<void> {
  const chains = ['BTC', 'ETH', 'BSC', 'MATIC', 'SOL', 'TRX'];

  for (const chain of chains) {
    try {
      const adapter = require(`../services/blockchain/${chain.toLowerCase()}.adapter`);
      if (adapter.estimateFees) {
        const fees = await adapter.estimateFees();
        await setCachedFeeEstimate(chain, fees);
      }
    } catch {
      // Not all adapters may be available at startup
    }
  }
}

// ---------------------------------------------------------------------------
// Cache stats (for monitoring)
// ---------------------------------------------------------------------------

export async function getCacheStats(): Promise<Record<string, number>> {
  const redis = getRedisClient();
  const stats: Record<string, number> = {};

  for (const [name, prefix] of Object.entries(PREFIX)) {
    const keys = await redis.keys(`${prefix}:*`);
    stats[name] = keys.length;
  }

  return stats;
}
