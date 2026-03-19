import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Request, Response } from 'express';
import { redis } from '../config/redis';

/**
 * Public endpoints rate limiter: 20 req/min per IP.
 */
export const publicRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...(args as [string, ...string[]])) as any,
    prefix: 'rl:public:',
  }),
  keyGenerator: (req: Request) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT',
        message: 'Too many requests. Please try again later.',
        retryAfter: 60,
      },
    });
  },
});

/**
 * Authenticated endpoints rate limiter: 100 req/min per IP or API key.
 */
export const authenticatedRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...(args as [string, ...string[]])) as any,
    prefix: 'rl:auth:',
  }),
  keyGenerator: (req: Request) => {
    // Use API key or merchant ID if authenticated, else IP
    const apiKey = req.headers['x-api-key'] as string;
    if (apiKey) return `apikey:${apiKey.slice(0, 20)}`;
    if (req.merchant?.id) return `merchant:${req.merchant.id}`;
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT',
        message: 'Too many requests. Please try again later.',
        retryAfter: 60,
      },
    });
  },
});

/**
 * Strict rate limiter for sensitive endpoints (login, OTP): 5 req/min.
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...(args as [string, ...string[]])) as any,
    prefix: 'rl:strict:',
  }),
  keyGenerator: (req: Request) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT',
        message: 'Too many attempts. Please wait before trying again.',
        retryAfter: 60,
      },
    });
  },
});
