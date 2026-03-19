/**
 * MyCryptoCoin — Advanced Redis-based Sliding Window Rate Limiter
 *
 * Per-API-key limits with tiered pricing, burst allowance,
 * and proper rate-limit headers.
 */

import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

// ---------------------------------------------------------------------------
// Tier configuration
// ---------------------------------------------------------------------------

export enum RateLimitTier {
  FREE = 'free',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
  INTERNAL = 'internal',
}

interface TierConfig {
  requestsPerMinute: number;
  burstMultiplier: number;
  burstWindowSeconds: number;
}

const TIER_CONFIGS: Record<RateLimitTier, TierConfig> = {
  [RateLimitTier.FREE]: {
    requestsPerMinute: 100,
    burstMultiplier: 2,
    burstWindowSeconds: 10,
  },
  [RateLimitTier.BUSINESS]: {
    requestsPerMinute: 1_000,
    burstMultiplier: 2,
    burstWindowSeconds: 10,
  },
  [RateLimitTier.ENTERPRISE]: {
    requestsPerMinute: 10_000,
    burstMultiplier: 2,
    burstWindowSeconds: 10,
  },
  [RateLimitTier.INTERNAL]: {
    requestsPerMinute: 100_000,
    burstMultiplier: 5,
    burstWindowSeconds: 10,
  },
};

// ---------------------------------------------------------------------------
// Sliding window counter (Redis sorted set)
// ---------------------------------------------------------------------------

const WINDOW_SIZE_MS = 60_000; // 1 minute

/**
 * Lua script for atomic sliding-window rate limiting.
 * Uses a sorted set where members are request timestamps.
 *
 * KEYS[1] = rate limit key
 * ARGV[1] = current timestamp (ms)
 * ARGV[2] = window start (current - window size)
 * ARGV[3] = max requests
 * ARGV[4] = TTL in seconds
 *
 * Returns: [currentCount, isAllowed (0 or 1)]
 */
const SLIDING_WINDOW_LUA = `
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local window_start = tonumber(ARGV[2])
  local max_requests = tonumber(ARGV[3])
  local ttl = tonumber(ARGV[4])

  -- Remove expired entries
  redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)

  -- Count current requests in window
  local count = redis.call('ZCARD', key)

  if count < max_requests then
    -- Add new request
    redis.call('ZADD', key, now, now .. '-' .. math.random(1000000))
    redis.call('EXPIRE', key, ttl)
    return {count + 1, 1}
  else
    redis.call('EXPIRE', key, ttl)
    return {count, 0}
  end
`;

// ---------------------------------------------------------------------------
// Burst detection
// ---------------------------------------------------------------------------

const BURST_WINDOW_LUA = `
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local window_start = tonumber(ARGV[2])

  redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)
  return redis.call('ZCARD', key)
`;

// ---------------------------------------------------------------------------
// Key extraction: API key > authenticated user > IP
// ---------------------------------------------------------------------------

function extractIdentifier(req: Request): { id: string; tier: RateLimitTier } {
  // Check for API key in header
  const apiKey = req.headers['x-api-key'] as string | undefined;
  if (apiKey && (req as any).apiKeyData) {
    return {
      id: `apikey:${apiKey.slice(0, 8)}`, // Use prefix for privacy
      tier: ((req as any).apiKeyData.tier as RateLimitTier) || RateLimitTier.FREE,
    };
  }

  // Check for authenticated user
  if ((req as any).user?.id) {
    const userTier = (req as any).user.tier || RateLimitTier.FREE;
    return {
      id: `user:${(req as any).user.id}`,
      tier: userTier,
    };
  }

  // Fallback to IP
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown';

  return {
    id: `ip:${ip}`,
    tier: RateLimitTier.FREE,
  };
}

// ---------------------------------------------------------------------------
// Middleware factory
// ---------------------------------------------------------------------------

interface RateLimiterOptions {
  /** Override tier detection — use a fixed tier */
  fixedTier?: RateLimitTier;
  /** Additional key prefix (for route-specific limits) */
  keyPrefix?: string;
  /** Skip rate limiting for these paths */
  skipPaths?: string[];
}

export function advancedRateLimiter(options: RateLimiterOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip health check
    if (options.skipPaths?.includes(req.path) || req.path === '/health') {
      return next();
    }

    const redis = getRedisClient();
    const { id, tier } = options.fixedTier
      ? { ...extractIdentifier(req), tier: options.fixedTier }
      : extractIdentifier(req);

    const config = TIER_CONFIGS[tier];
    const prefix = options.keyPrefix ? `rl:${options.keyPrefix}` : 'rl';
    const key = `${prefix}:${id}`;
    const burstKey = `${prefix}:burst:${id}`;

    const now = Date.now();
    const windowStart = now - WINDOW_SIZE_MS;
    const ttlSeconds = Math.ceil(WINDOW_SIZE_MS / 1_000) + 1;

    try {
      // ---- Check burst rate -----------------------------------------------
      const burstWindowStart = now - config.burstWindowSeconds * 1_000;
      const burstCount = (await redis.eval(
        BURST_WINDOW_LUA,
        1,
        burstKey,
        now.toString(),
        burstWindowStart.toString(),
      )) as number;

      const burstLimit = Math.ceil(
        (config.requestsPerMinute / 60) * config.burstWindowSeconds * config.burstMultiplier,
      );

      // ---- Check sliding window -------------------------------------------
      const result = (await redis.eval(
        SLIDING_WINDOW_LUA,
        1,
        key,
        now.toString(),
        windowStart.toString(),
        config.requestsPerMinute.toString(),
        ttlSeconds.toString(),
      )) as [number, number];

      const [currentCount, isAllowed] = result;
      const remaining = Math.max(0, config.requestsPerMinute - currentCount);

      // Calculate reset time (end of current window)
      const oldestEntry = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const resetMs = oldestEntry.length >= 2
        ? parseInt(oldestEntry[1], 10) + WINDOW_SIZE_MS
        : now + WINDOW_SIZE_MS;

      // ---- Set rate limit headers -----------------------------------------
      res.set({
        'X-RateLimit-Limit': config.requestsPerMinute.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(resetMs / 1_000).toString(),
        'X-RateLimit-Tier': tier,
      });

      // ---- Enforce limits -------------------------------------------------
      if (!isAllowed || burstCount >= burstLimit) {
        const retryAfterSeconds = Math.ceil((resetMs - now) / 1_000);

        res.set({
          'Retry-After': Math.max(1, retryAfterSeconds).toString(),
          'X-RateLimit-Remaining': '0',
        });

        logger.warn('Rate limit exceeded', {
          identifier: id,
          tier,
          currentCount,
          limit: config.requestsPerMinute,
          burstCount,
          burstLimit,
          path: req.path,
        });

        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Rate limit exceeded. You are allowed ${config.requestsPerMinute} requests per minute on the ${tier} tier.`,
            retryAfter: Math.max(1, retryAfterSeconds),
          },
        });
        return;
      }

      // Track burst
      await redis.eval(
        SLIDING_WINDOW_LUA,
        1,
        burstKey,
        now.toString(),
        burstWindowStart.toString(),
        burstLimit.toString(),
        (config.burstWindowSeconds + 1).toString(),
      );

      next();
    } catch (err: any) {
      // If Redis is down, allow the request through (fail open)
      logger.error('Rate limiter error — allowing request', {
        error: err.message,
        identifier: id,
      });
      next();
    }
  };
}

// ---------------------------------------------------------------------------
// Utility: get current usage for an identifier
// ---------------------------------------------------------------------------

export async function getRateLimitUsage(
  identifier: string,
  keyPrefix = 'rl',
): Promise<{ count: number; limit: number; remaining: number }> {
  const redis = getRedisClient();
  const key = `${keyPrefix}:${identifier}`;
  const now = Date.now();
  const windowStart = now - WINDOW_SIZE_MS;

  await redis.zremrangebyscore(key, '-inf', windowStart.toString());
  const count = await redis.zcard(key);

  return {
    count,
    limit: TIER_CONFIGS[RateLimitTier.FREE].requestsPerMinute,
    remaining: Math.max(0, TIER_CONFIGS[RateLimitTier.FREE].requestsPerMinute - count),
  };
}
