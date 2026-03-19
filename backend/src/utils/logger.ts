/**
 * MyCryptoCoin — Production-Grade Logger
 *
 * Winston-based structured JSON logging with:
 * - Log levels: error, warn, info, http, debug
 * - Transports: console (dev), file with rotation (combined + error), optional remote
 * - Sensitive field masking (passwords, API keys, private keys)
 * - Log rotation: 14 days, 20MB max per file
 * - Request context via child loggers (request ID binding)
 */

import winston from 'winston';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const LOG_DIR = process.env.LOG_DIR || path.resolve(process.cwd(), 'logs');
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
const SERVICE_NAME = process.env.SERVICE_NAME || 'mycryptocoin';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_FILES = 30; // ~14 days of combined + error logs
const FILE_ROTATE_MAX_DAYS = '14d';

// ---------------------------------------------------------------------------
// Sensitive field masking
// ---------------------------------------------------------------------------

const SENSITIVE_KEYS = new Set([
  'password',
  'newpassword',
  'currentpassword',
  'apikey',
  'apisecret',
  'secret',
  'webhooksecret',
  'privatekey',
  'mnemonic',
  'seed',
  'hd_master_seed',
  'token',
  'refreshtoken',
  'accesstoken',
  'authorization',
  'cookie',
  'otp',
  'pin',
  'cvv',
  'cardnumber',
  'ssn',
  'jwt_secret',
  'jwt_refresh_secret',
  'smtp_pass',
  'database_url',
  'redis_url',
  'encryption_master_key',
]);

function maskValue(value: string): string {
  if (value.length <= 8) return '****';
  return value.slice(0, 3) + '*'.repeat(Math.min(value.length - 6, 24)) + value.slice(-3);
}

function maskSensitiveFields(obj: any, depth = 0): any {
  if (depth > 8 || obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return obj;
  if (typeof obj !== 'object') return obj;

  if (obj instanceof Error) {
    return { message: obj.message, stack: obj.stack, name: obj.name };
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => maskSensitiveFields(item, depth + 1));
  }

  const masked: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const normalizedKey = key.toLowerCase().replace(/[_\-]/g, '');
    if (SENSITIVE_KEYS.has(normalizedKey)) {
      masked[key] = typeof value === 'string' ? maskValue(value) : '****';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveFields(value, depth + 1);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

// ---------------------------------------------------------------------------
// Custom Winston format: mask sensitive data in all log entries
// ---------------------------------------------------------------------------

const sensitiveFieldMasker = winston.format((info) => {
  for (const key of Object.keys(info)) {
    if (key === 'level' || key === 'message' || key === 'timestamp' || key === 'service') continue;
    if (typeof info[key] === 'object' && info[key] !== null) {
      info[key] = maskSensitiveFields(info[key]);
    } else if (typeof info[key] === 'string') {
      const normalizedKey = key.toLowerCase().replace(/[_\-]/g, '');
      if (SENSITIVE_KEYS.has(normalizedKey)) {
        info[key] = maskValue(info[key] as string);
      }
    }
  }
  return info;
});

// ---------------------------------------------------------------------------
// Formats
// ---------------------------------------------------------------------------

const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  sensitiveFieldMasker(),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  sensitiveFieldMasker(),
  winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
    const rid = requestId ? ` [${requestId}]` : '';
    const metaKeys = Object.keys(meta).filter((k) => k !== 'service' && k !== 'pid');
    const metaStr =
      metaKeys.length > 0
        ? ` ${JSON.stringify(Object.fromEntries(metaKeys.map((k) => [k, meta[k]])))}`
        : '';
    return `${timestamp} ${level}${rid}: ${message}${metaStr}`;
  }),
);

// ---------------------------------------------------------------------------
// Transports
// ---------------------------------------------------------------------------

const transports: winston.transport[] = [];

// Combined log — all levels at http and above
transports.push(
  new winston.transports.File({
    dirname: LOG_DIR,
    filename: 'combined.log',
    level: 'http',
    format: jsonFormat,
    maxsize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES,
    tailable: true,
  }),
);

// Error log
transports.push(
  new winston.transports.File({
    dirname: LOG_DIR,
    filename: 'error.log',
    level: 'error',
    format: jsonFormat,
    maxsize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES,
    tailable: true,
  }),
);

// Console transport — dev or if explicitly enabled
if (process.env.NODE_ENV !== 'production' || process.env.LOG_CONSOLE === 'true') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: LOG_LEVEL,
    }),
  );
}

// Optional: remote transport (Datadog via HTTP)
if (process.env.DATADOG_API_KEY) {
  transports.push(
    new winston.transports.Http({
      host: 'http-intake.logs.datadoghq.com',
      path: `/api/v2/logs?dd-api-key=${process.env.DATADOG_API_KEY}`,
      ssl: true,
      format: winston.format.combine(
        jsonFormat,
        winston.format((info) => {
          info.ddsource = 'nodejs';
          info.ddtags = `env:${process.env.NODE_ENV},service:${SERVICE_NAME}`;
          return info;
        })(),
      ),
      level: 'warn', // ship warn+ to remote to control costs
    }),
  );
}

// ---------------------------------------------------------------------------
// Logger instance
// ---------------------------------------------------------------------------

export const logger = winston.createLogger({
  level: LOG_LEVEL,
  levels: winston.config.npm.levels,
  defaultMeta: {
    service: SERVICE_NAME,
    pid: process.pid,
  },
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      dirname: LOG_DIR,
      filename: 'exceptions.log',
      maxsize: MAX_FILE_SIZE,
      maxFiles: 10,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      dirname: LOG_DIR,
      filename: 'rejections.log',
      maxsize: MAX_FILE_SIZE,
      maxFiles: 10,
    }),
  ],
  exitOnError: false,
});

// ---------------------------------------------------------------------------
// Child logger helper (already supported by Winston)
//
// Usage:
//   const reqLogger = logger.child({ requestId: req.requestId });
//   reqLogger.info('Processing payment', { paymentId });
// ---------------------------------------------------------------------------
