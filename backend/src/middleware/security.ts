/**
 * MyCryptoCoin — Security Hardening Middleware
 *
 * CORS whitelist, Helmet, HSTS, CSP, X-Frame-Options, request size limits,
 * parameter pollution protection, XSS sanitization.
 */

import { Request, Response, NextFunction, Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { logger } from '../utils/logger';

// ---------------------------------------------------------------------------
// CORS configuration
// ---------------------------------------------------------------------------

function getCorsOrigins(): (string | RegExp)[] {
  const envOrigins = process.env.CORS_ORIGINS || '';
  const origins: (string | RegExp)[] = envOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // Always allow dashboard and admin in production
  const defaults = [
    process.env.DASHBOARD_URL,
    process.env.ADMIN_URL,
    process.env.WEBSITE_URL,
  ].filter(Boolean) as string[];

  return [...new Set([...origins, ...defaults])];
}

// ---------------------------------------------------------------------------
// XSS sanitization
// ---------------------------------------------------------------------------

const XSS_PATTERNS = [
  /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /data\s*:\s*text\/html/gi,
  /<iframe\b[^>]*>/gi,
  /<object\b[^>]*>/gi,
  /<embed\b[^>]*>/gi,
  /<link\b[^>]*>/gi,
];

function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    let sanitized = value;
    for (const pattern of XSS_PATTERNS) {
      sanitized = sanitized.replace(pattern, '');
    }
    // HTML entity encode critical characters
    sanitized = sanitized
      .replace(/&(?!amp;|lt;|gt;|quot;|#)/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return sanitized;
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (typeof value === 'object' && value !== null) {
    const sanitized: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      sanitized[sanitizeValue(k)] = sanitizeValue(v);
    }
    return sanitized;
  }
  return value;
}

function xssSanitizer() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeValue(req.body);
    }
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          (req.query as any)[key] = sanitizeValue(value);
        }
      }
    }
    if (req.params) {
      for (const [key, value] of Object.entries(req.params)) {
        (req.params as any)[key] = sanitizeValue(value);
      }
    }
    next();
  };
}

// ---------------------------------------------------------------------------
// Parameter pollution protection
// ---------------------------------------------------------------------------

function parameterPollutionProtection() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // For each query parameter, if it's an array, take the last value
    // (prevent HPP attacks that exploit array parameters)
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (Array.isArray(value)) {
          // Allow specific parameters to be arrays
          const allowArrays = new Set(['chains', 'currencies', 'statuses', 'ids']);
          if (!allowArrays.has(key)) {
            (req.query as any)[key] = value[value.length - 1];
          }
        }
      }
    }
    next();
  };
}

// ---------------------------------------------------------------------------
// SQL injection prevention (belt + suspenders — Prisma already parameterises)
// ---------------------------------------------------------------------------

const SQL_INJECTION_PATTERNS = [
  /(\b(union|select|insert|update|delete|drop|alter|create|exec|execute)\b\s+(all\s+)?)/i,
  /(--|#|\/\*)/,
  /(\bor\b\s+\d+\s*=\s*\d+)/i,
  /('\s*(or|and)\s+')/i,
];

function sqlInjectionGuard() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const valuesToCheck = [
      ...Object.values(req.query || {}),
      ...Object.values(req.params || {}),
    ];

    for (const value of valuesToCheck) {
      if (typeof value !== 'string') continue;
      for (const pattern of SQL_INJECTION_PATTERNS) {
        if (pattern.test(value)) {
          logger.warn('Potential SQL injection attempt blocked', {
            path: req.path,
            ip: req.ip,
            value: value.slice(0, 100),
          });
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_INPUT',
              message: 'Request contains invalid characters',
            },
          });
          return;
        }
      }
    }

    next();
  };
}

// ---------------------------------------------------------------------------
// Apply all security middleware
// ---------------------------------------------------------------------------

export function applySecurityMiddleware(app: Express): void {
  // ---- Helmet (all security headers) --------------------------------------
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'wss:', 'https:'],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'none'"],
          frameSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: 'same-origin' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
    }),
  );

  // ---- CORS ---------------------------------------------------------------
  const allowedOrigins = getCorsOrigins();
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, server-to-server, curl)
        if (!origin) return callback(null, true);

        if (
          allowedOrigins.some((allowed) =>
            typeof allowed === 'string'
              ? allowed === origin
              : allowed.test(origin),
          )
        ) {
          return callback(null, true);
        }

        logger.warn('CORS request blocked', { origin });
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-API-Key',
        'X-Request-Id',
        'X-Idempotency-Key',
      ],
      exposedHeaders: [
        'X-Request-Id',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'Retry-After',
      ],
      maxAge: 86400, // Preflight cache: 24 hours
    }),
  );

  // ---- Request body size limits -------------------------------------------
  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ extended: true, limit: '10mb' }));

  // ---- Custom security middleware -----------------------------------------
  app.use(parameterPollutionProtection());
  app.use(xssSanitizer());
  app.use(sqlInjectionGuard());

  // ---- Additional headers -------------------------------------------------
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '0'); // Modern browsers: CSP is preferred
    res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  });

  logger.info('Security middleware applied', {
    corsOrigins: allowedOrigins.length,
  });
}
