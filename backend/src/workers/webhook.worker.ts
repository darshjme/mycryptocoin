/**
 * MyCryptoCoin — Webhook Delivery Worker
 *
 * Sends signed webhook notifications to merchant callback URLs.
 * 3 retry attempts with exponential backoff (10s, 60s, 300s).
 * HMAC-SHA256 signature on every payload. 30s timeout per attempt.
 * Full audit logging of all attempts and responses.
 */

import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';
import https from 'node:https';
import http from 'node:http';
import {
  QUEUE_NAMES,
  createQueueRedis,
  getQueueConcurrency,
  startScheduler,
  moveToDLQ,
} from '../config/queue';
import { logger } from '../utils/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WebhookJobData {
  merchantId: string;
  event: string;
  paymentId?: string;
  withdrawalId?: string;
  txHash?: string;
  reason?: string;
  [key: string]: unknown;
}

interface WebhookAttempt {
  attemptNumber: number;
  url: string;
  statusCode: number | null;
  responseBody: string | null;
  error: string | null;
  durationMs: number;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RETRY_DELAYS_MS = [10_000, 60_000, 300_000]; // 10s, 60s, 5min
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RESPONSE_BODY_LOG = 2_048; // bytes

// ---------------------------------------------------------------------------
// Prisma
// ---------------------------------------------------------------------------

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// HMAC signature generation
// ---------------------------------------------------------------------------

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

// ---------------------------------------------------------------------------
// HTTP request helper with timeout
// ---------------------------------------------------------------------------

function sendWebhookRequest(
  url: string,
  body: string,
  signature: string,
  timeoutMs: number,
): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const transport = parsed.protocol === 'https:' ? https : http;

    const req = transport.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'User-Agent': 'MyCryptoCoin-Webhook/1.0',
          'X-MyCryptoCoin-Signature': signature,
          'X-MyCryptoCoin-Timestamp': Date.now().toString(),
        },
        timeout: timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = [];
        let totalSize = 0;

        res.on('data', (chunk: Buffer) => {
          totalSize += chunk.length;
          if (totalSize <= MAX_RESPONSE_BODY_LOG) {
            chunks.push(chunk);
          }
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode || 0,
            body: Buffer.concat(chunks).toString('utf8').slice(0, MAX_RESPONSE_BODY_LOG),
          });
        });
      },
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Webhook request timed out after ${timeoutMs}ms`));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Core delivery logic
// ---------------------------------------------------------------------------

async function processWebhook(job: Job<WebhookJobData>): Promise<void> {
  const { merchantId, event, ...eventData } = job.data;
  const jobLogger = logger.child({ merchantId, event, jobId: job.id });

  jobLogger.info('Delivering webhook');

  // ---- Fetch merchant webhook configuration --------------------------------
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      id: true,
      webhookUrl: true,
      webhookSecret: true,
      webhookEnabled: true,
      businessName: true,
    },
  });

  if (!merchant) {
    jobLogger.warn('Merchant not found — dropping webhook');
    return;
  }

  if (!merchant.webhookUrl || !merchant.webhookEnabled) {
    jobLogger.info('Merchant has no webhook URL or webhooks disabled');
    return;
  }

  if (!merchant.webhookSecret) {
    jobLogger.warn('Merchant has no webhook secret — cannot sign payload');
    return;
  }

  // ---- Build payload -------------------------------------------------------
  const payload = {
    id: crypto.randomUUID(),
    event,
    timestamp: new Date().toISOString(),
    data: eventData,
  };

  const payloadStr = JSON.stringify(payload);
  const signature = signPayload(payloadStr, merchant.webhookSecret);

  // ---- Attempt delivery ----------------------------------------------------
  const attemptNumber = job.attemptsMade + 1;
  const startTime = Date.now();
  const attempt: WebhookAttempt = {
    attemptNumber,
    url: merchant.webhookUrl,
    statusCode: null,
    responseBody: null,
    error: null,
    durationMs: 0,
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await sendWebhookRequest(
      merchant.webhookUrl,
      payloadStr,
      signature,
      REQUEST_TIMEOUT_MS,
    );

    attempt.statusCode = response.statusCode;
    attempt.responseBody = response.body;
    attempt.durationMs = Date.now() - startTime;

    // Log the attempt
    await logWebhookAttempt(job.data, attempt);

    // Consider 2xx as success
    if (response.statusCode >= 200 && response.statusCode < 300) {
      jobLogger.info('Webhook delivered successfully', {
        statusCode: response.statusCode,
        durationMs: attempt.durationMs,
        attempt: attemptNumber,
      });
      return;
    }

    // Non-2xx is a failure — retry
    jobLogger.warn('Webhook returned non-2xx status', {
      statusCode: response.statusCode,
      responseBody: response.body.slice(0, 200),
      attempt: attemptNumber,
    });

    throw new Error(`Webhook returned HTTP ${response.statusCode}`);
  } catch (err: any) {
    attempt.error = err.message;
    attempt.durationMs = Date.now() - startTime;

    await logWebhookAttempt(job.data, attempt);

    jobLogger.error('Webhook delivery failed', {
      error: err.message,
      attempt: attemptNumber,
      durationMs: attempt.durationMs,
    });

    // If all retries exhausted
    if (attemptNumber >= 3) {
      jobLogger.error('All webhook retry attempts exhausted', {
        merchantId,
        event,
      });
      await moveToDLQ(QUEUE_NAMES.WEBHOOK_DELIVERY, job.data as any, err.message);
    }

    throw err; // BullMQ will retry with our custom backoff
  }
}

// ---------------------------------------------------------------------------
// Audit logging — persist every attempt to DB
// ---------------------------------------------------------------------------

async function logWebhookAttempt(
  jobData: WebhookJobData,
  attempt: WebhookAttempt,
): Promise<void> {
  try {
    await prisma.webhookDelivery.create({
      data: {
        webhookId: jobData.webhookId || jobData.merchantId, // Best-effort mapping
        event: jobData.event,
        payload: {
          url: attempt.url,
          merchantId: jobData.merchantId,
          paymentId: jobData.paymentId || null,
          withdrawalId: jobData.withdrawalId || null,
          responseBody: attempt.responseBody?.slice(0, 1_000),
          durationMs: attempt.durationMs,
        },
        statusCode: attempt.statusCode || 0,
        success: (attempt.statusCode || 0) >= 200 && (attempt.statusCode || 0) < 300,
        attempt: attempt.attemptNumber,
        error: attempt.error,
      },
    });
  } catch (dbErr: any) {
    // Don't fail the webhook job because of a logging error
    logger.error('Failed to log webhook attempt', {
      error: dbErr.message,
      merchantId: jobData.merchantId,
    });
  }
}

// ---------------------------------------------------------------------------
// Custom backoff strategy: 10s, 60s, 300s
// ---------------------------------------------------------------------------

function webhookBackoffStrategy(attemptsMade: number): number {
  if (attemptsMade < RETRY_DELAYS_MS.length) {
    return RETRY_DELAYS_MS[attemptsMade];
  }
  return RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
}

// ---------------------------------------------------------------------------
// Worker startup
// ---------------------------------------------------------------------------

export function startWebhookWorker(): Worker<WebhookJobData> {
  startScheduler(QUEUE_NAMES.WEBHOOK_DELIVERY);

  const worker = new Worker<WebhookJobData>(
    QUEUE_NAMES.WEBHOOK_DELIVERY,
    async (job) => processWebhook(job),
    {
      connection: createQueueRedis(),
      concurrency: getQueueConcurrency(QUEUE_NAMES.WEBHOOK_DELIVERY),
    },
  );

  worker.on('completed', (job) => {
    logger.info('Webhook job completed', {
      jobId: job.id,
      event: job.data.event,
      merchantId: job.data.merchantId,
    });
  });

  worker.on('failed', (job, err) => {
    if (!job) return;
    logger.error('Webhook job failed', {
      jobId: job.id,
      event: job.data.event,
      merchantId: job.data.merchantId,
      error: err.message,
      attemptsMade: job.attemptsMade,
    });
  });

  worker.on('error', (err) => {
    logger.error('Webhook worker error', { error: err.message });
  });

  logger.info('Webhook worker started', {
    concurrency: getQueueConcurrency(QUEUE_NAMES.WEBHOOK_DELIVERY),
  });

  return worker;
}
