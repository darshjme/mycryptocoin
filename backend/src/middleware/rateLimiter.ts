import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Public endpoints rate limiter: 20 req/min per IP.
 * Uses in-memory store (the global advancedRateLimiter handles Redis-backed limiting).
 */
export const publicRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
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
  keyGenerator: (req: Request) => {
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
