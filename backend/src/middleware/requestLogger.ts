/**
 * MyCryptoCoin — Request Logger Middleware
 *
 * Logs every API request with method, path, status, response time,
 * request ID, and masked API key. Skips health check. Masks sensitive fields.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { getRequestId } from './requestId';

// ---------------------------------------------------------------------------
// Sensitive field masking
// ---------------------------------------------------------------------------

const SENSITIVE_FIELDS = new Set([
  'password',
  'newPassword',
  'currentPassword',
  'confirmPassword',
  'apiKey',
  'apiSecret',
  'secret',
  'webhookSecret',
  'privateKey',
  'mnemonic',
  'seed',
  'token',
  'refreshToken',
  'accessToken',
  'authorization',
  'otp',
  'pin',
  'cvv',
  'cardNumber',
  'ssn',
]);

function maskObject(obj: any, depth = 0): any {
  if (depth > 5 || obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => maskObject(item, depth + 1));
  }

  const masked: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.has(key) || SENSITIVE_FIELDS.has(lowerKey)) {
      if (typeof value === 'string') {
        masked[key] = value.length > 4
          ? value.slice(0, 2) + '*'.repeat(Math.min(value.length - 4, 20)) + value.slice(-2)
          : '****';
      } else {
        masked[key] = '****';
      }
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskObject(value, depth + 1);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

function maskApiKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  if (key.length <= 8) return '****';
  return key.slice(0, 4) + '****' + key.slice(-4);
}

// ---------------------------------------------------------------------------
// Paths to skip
// ---------------------------------------------------------------------------

const SKIP_PATHS = new Set(['/health', '/healthz', '/ready', '/favicon.ico']);

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

interface RequestLoggerOptions {
  /** Additional paths to skip */
  skipPaths?: string[];
  /** Log request body for non-GET requests (default: true) */
  logBody?: boolean;
  /** Max body log size in chars (default: 2000) */
  maxBodySize?: number;
}

export function requestLoggerMiddleware(options: RequestLoggerOptions = {}) {
  const skipSet = new Set([...SKIP_PATHS, ...(options.skipPaths || [])]);
  const logBody = options.logBody !== false;
  const maxBodySize = options.maxBodySize || 2_000;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (skipSet.has(req.path)) {
      return next();
    }

    const startTime = process.hrtime.bigint();
    const requestId = getRequestId(req);

    // Capture response data
    const originalEnd = res.end;
    let responseBody: string | undefined;

    (res as any).end = function (chunk: any, ...args: any[]) {
      // Only capture JSON responses for error logging
      if (res.statusCode >= 400 && chunk) {
        try {
          responseBody = typeof chunk === 'string'
            ? chunk.slice(0, 500)
            : Buffer.isBuffer(chunk)
              ? chunk.toString('utf8').slice(0, 500)
              : undefined;
        } catch {
          // Ignore
        }
      }
      return originalEnd.call(res, chunk, ...args);
    };

    // Log on response finish
    res.on('finish', () => {
      const durationNs = process.hrtime.bigint() - startTime;
      const durationMs = Number(durationNs / 1_000_000n);

      const logData: Record<string, any> = {
        requestId,
        method: req.method,
        path: req.originalUrl || req.path,
        statusCode: res.statusCode,
        durationMs,
        contentLength: res.get('content-length'),
        userAgent: req.get('user-agent')?.slice(0, 200),
        ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress,
        apiKey: maskApiKey(req.headers['x-api-key'] as string),
      };

      // Log request body for non-GET requests (masked)
      if (logBody && req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
        const bodyStr = JSON.stringify(maskObject(req.body));
        logData.requestBody = bodyStr.length > maxBodySize
          ? bodyStr.slice(0, maxBodySize) + '...[truncated]'
          : bodyStr;
      }

      // Include response body snippet for errors
      if (res.statusCode >= 400 && responseBody) {
        logData.responseBody = responseBody;
      }

      // Choose log level based on status code
      if (res.statusCode >= 500) {
        logger.error('API request', logData);
      } else if (res.statusCode >= 400) {
        logger.warn('API request', logData);
      } else {
        logger.http('API request', logData);
      }
    });

    next();
  };
}
