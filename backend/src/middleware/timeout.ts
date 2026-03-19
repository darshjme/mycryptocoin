/**
 * MyCryptoCoin — Request Timeout Middleware
 *
 * Enforces a configurable timeout on all API requests.
 * Returns 504 Gateway Timeout if the handler doesn't respond in time.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { getRequestId } from './requestId';

// ---------------------------------------------------------------------------
// Default timeout: 30 seconds
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// Per-route timeout overrides
// ---------------------------------------------------------------------------

const ROUTE_TIMEOUTS: Record<string, number> = {
  '/api/v1/payments/create': 60_000,
  '/api/v1/withdrawals/process': 120_000,
  '/api/v1/admin/reconciliation': 300_000,
  '/api/v1/webhooks/test': 35_000,
  '/health': 5_000,
};

/**
 * Get the timeout for a specific route.
 */
function getTimeout(path: string): number {
  // Check exact match first
  if (ROUTE_TIMEOUTS[path]) return ROUTE_TIMEOUTS[path];

  // Check prefix match
  for (const [route, timeout] of Object.entries(ROUTE_TIMEOUTS)) {
    if (path.startsWith(route)) return timeout;
  }

  return DEFAULT_TIMEOUT_MS;
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

interface TimeoutOptions {
  /** Default timeout in ms (overridden by route-specific config) */
  defaultMs?: number;
  /** Additional route overrides */
  routeOverrides?: Record<string, number>;
}

export function timeoutMiddleware(options: TimeoutOptions = {}) {
  const defaultMs = options.defaultMs || DEFAULT_TIMEOUT_MS;

  if (options.routeOverrides) {
    Object.assign(ROUTE_TIMEOUTS, options.routeOverrides);
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    const timeoutMs = getTimeout(req.path);
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;

      const requestId = getRequestId(req);
      logger.warn('Request timed out', {
        requestId,
        method: req.method,
        path: req.path,
        timeoutMs,
      });

      if (!res.headersSent) {
        res.status(504).json({
          success: false,
          error: {
            code: 'REQUEST_TIMEOUT',
            message: `Request timed out after ${timeoutMs}ms. Please try again.`,
            requestId,
          },
        });
      }
    }, timeoutMs);

    // Clear timeout when response finishes
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    // Override res.json / res.send to prevent writing after timeout
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    res.json = function (body: any) {
      if (timedOut) return res;
      return originalJson(body);
    } as any;

    res.send = function (body: any) {
      if (timedOut) return res;
      return originalSend(body);
    } as any;

    // Store timeout value on request for potential inspection
    (req as any).timeoutMs = timeoutMs;

    next();
  };
}
