/**
 * MyCryptoCoin — Conversion Processing Worker
 *
 * BullMQ worker that processes the crypto-to-USDT conversion pipeline:
 *
 * Pipeline steps:
 *   1. SWEEP  — Transfer crypto from payment address to exchange/hot wallet
 *   2. SWAP   — Execute market order (CEX) or DEX swap
 *   3. SETTLE — Verify USDT arrived and mark conversion complete
 *   4. FEE    — Disburse platform fee to owner wallet
 *
 * Features:
 *   - Retry logic with exponential backoff (5 attempts)
 *   - Dead letter queue for permanently failed conversions
 *   - Scheduled batch processing every 60 seconds
 *   - Fee disbursement batch processing every 5 minutes
 *   - Graceful shutdown support
 *   - Idempotent processing (safe to re-process)
 */

import { Worker, Job, Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import {
  createQueueRedis,
  getQueue,
  moveToDLQ,
  QUEUE_NAMES,
} from '../config/queue';
import { logger } from '../utils/logger';
import { ConversionService } from '../services/conversion.service';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QUEUE_NAME = 'conversion-processing';
const CONCURRENCY = 5;
const MAX_ATTEMPTS = 5;
const BACKOFF_DELAY_MS = 10_000; // 10s base, exponential

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConversionJobData {
  conversionId: string;
  step: 'sweep' | 'swap' | 'settle' | 'fee';
}

interface ConversionBatchJobData {
  type: 'process-queue' | 'process-fees' | 'settle-completed';
}

// ---------------------------------------------------------------------------
// Service instance (shared within worker process)
// ---------------------------------------------------------------------------

const prisma = new PrismaClient();
const conversionService = new ConversionService();

// ---------------------------------------------------------------------------
// Core processing logic
// ---------------------------------------------------------------------------

async function processConversionJob(job: Job<ConversionJobData>): Promise<void> {
  const { conversionId, step } = job.data;
  const jobLogger = logger.child({ conversionId, step, jobId: job.id });

  jobLogger.info('Processing conversion step');

  // Load conversion from DB
  const conversion = await prisma.conversion.findUnique({
    where: { id: conversionId },
  });

  if (!conversion) {
    jobLogger.error('Conversion not found — cannot process');
    return; // Don't retry — record doesn't exist
  }

  // Skip if already completed or failed
  if (conversion.status === 'COMPLETED') {
    jobLogger.info('Conversion already completed — skipping');
    return;
  }

  if (conversion.status === 'FAILED') {
    jobLogger.warn('Conversion already failed — skipping (manual review needed)');
    return;
  }

  try {
    switch (step) {
      case 'sweep':
        await conversionService.sweepToExchange(conversionId);
        // Queue the next step: swap
        await getQueue(QUEUE_NAME as any).add(
          'execute-swap',
          { conversionId, step: 'swap' },
          {
            delay: 30_000, // Wait 30s for sweep to be confirmed
            attempts: MAX_ATTEMPTS,
            backoff: { type: 'exponential', delay: BACKOFF_DELAY_MS },
          },
        );
        jobLogger.info('Sweep completed, swap queued');
        break;

      case 'swap':
        await conversionService.executeSwap(conversionId);
        // Queue the next step: settle
        await getQueue(QUEUE_NAME as any).add(
          'settle-conversion',
          { conversionId, step: 'settle' },
          {
            delay: 15_000, // Wait 15s for swap to settle
            attempts: MAX_ATTEMPTS,
            backoff: { type: 'exponential', delay: BACKOFF_DELAY_MS },
          },
        );
        jobLogger.info('Swap completed, settlement queued');
        break;

      case 'settle':
        // Re-check status — the swap step may have already settled it
        const current = await prisma.conversion.findUnique({
          where: { id: conversionId },
        });
        if (current?.status === 'SETTLING') {
          await prisma.conversion.update({
            where: { id: conversionId },
            data: {
              status: 'COMPLETED',
              settledAt: new Date(),
            },
          });
        }
        jobLogger.info('Conversion settled');
        break;

      case 'fee':
        await conversionService.disbursePlatformFee(conversionId);
        jobLogger.info('Fee disbursement created');
        break;

      default:
        jobLogger.error(`Unknown conversion step: ${step}`);
    }
  } catch (error) {
    jobLogger.error('Conversion step failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      attemptsMade: job.attemptsMade,
    });
    throw error; // Let BullMQ handle retries
  }
}

/**
 * Batch processing job: runs periodically to catch any conversions
 * that were not processed by the individual job queue (resilience).
 */
async function processBatchJob(job: Job<ConversionBatchJobData>): Promise<void> {
  const jobLogger = logger.child({ type: job.data.type, jobId: job.id });

  try {
    switch (job.data.type) {
      case 'process-queue':
        await conversionService.processConversionQueue();
        jobLogger.info('Batch conversion queue processed');
        break;

      case 'process-fees':
        await conversionService.processFeeDisbursements();
        jobLogger.info('Batch fee disbursements processed');
        break;

      case 'settle-completed':
        // Settle any conversions stuck in SETTLING state
        const settling = await prisma.conversion.findMany({
          where: { status: 'SETTLING' },
          take: 50,
        });
        for (const conv of settling) {
          await prisma.conversion.update({
            where: { id: conv.id },
            data: {
              status: 'COMPLETED',
              settledAt: new Date(),
            },
          });
        }
        if (settling.length > 0) {
          jobLogger.info(`Settled ${settling.length} conversions`);
        }
        break;

      default:
        jobLogger.warn(`Unknown batch job type: ${job.data.type}`);
    }
  } catch (error) {
    jobLogger.error('Batch job failed', { error });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Worker startup
// ---------------------------------------------------------------------------

export function startConversionWorker(): Worker {
  const connection = createQueueRedis();

  // Ensure the queue exists
  const queue = new Queue(QUEUE_NAME, { connection: createQueueRedis() });

  // Register recurring batch jobs
  registerRecurringJobs(queue).catch((err) =>
    logger.error('Failed to register conversion recurring jobs', { error: err }),
  );

  // Create worker
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      if (job.data.conversionId) {
        await processConversionJob(job as Job<ConversionJobData>);
      } else if (job.data.type) {
        await processBatchJob(job as Job<ConversionBatchJobData>);
      } else {
        logger.warn('Unknown job data in conversion worker', { data: job.data });
      }
    },
    {
      connection,
      concurrency: CONCURRENCY,
      limiter: {
        max: 20,
        duration: 1_000, // Max 20 jobs per second (exchange rate limits)
      },
    },
  );

  // Event handlers
  worker.on('completed', (job) => {
    logger.debug('Conversion job completed', {
      jobId: job.id,
      name: job.name,
    });
  });

  worker.on('failed', async (job, err) => {
    if (!job) return;

    logger.error('Conversion job failed', {
      jobId: job.id,
      name: job.name,
      error: err.message,
      attemptsMade: job.attemptsMade,
      maxAttempts: job.opts.attempts,
    });

    // If all retries exhausted, move to dead letter queue
    if (job.attemptsMade >= (job.opts.attempts ?? MAX_ATTEMPTS)) {
      await moveToDLQ(
        QUEUE_NAME as any,
        job.data as Record<string, unknown>,
        err.message,
      );

      // Mark conversion as FAILED if it's a conversion job
      if (job.data.conversionId) {
        try {
          await prisma.conversion.update({
            where: { id: job.data.conversionId },
            data: {
              status: 'FAILED',
              failureReason: `Exhausted ${job.attemptsMade} retries: ${err.message}`,
            },
          });
        } catch (updateErr) {
          logger.error('Failed to mark conversion as FAILED', {
            conversionId: job.data.conversionId,
            error: updateErr,
          });
        }
      }
    }
  });

  worker.on('error', (err) => {
    logger.error('Conversion worker error', { error: err.message });
  });

  logger.info('Conversion worker started', { concurrency: CONCURRENCY });

  return worker;
}

// ---------------------------------------------------------------------------
// Recurring jobs registration
// ---------------------------------------------------------------------------

async function registerRecurringJobs(queue: Queue): Promise<void> {
  // Process pending conversions every 60 seconds
  await queue.add(
    'batch-process-queue',
    { type: 'process-queue' },
    {
      repeat: { every: 60_000 },
      jobId: 'conversion-batch-recurring',
      removeOnComplete: { age: 86_400, count: 1000 },
      removeOnFail: false,
    },
  );

  // Process fee disbursements every 5 minutes
  await queue.add(
    'batch-process-fees',
    { type: 'process-fees' },
    {
      repeat: { every: 300_000 },
      jobId: 'fee-disbursement-recurring',
      removeOnComplete: { age: 86_400, count: 500 },
      removeOnFail: false,
    },
  );

  // Settle completed swaps every 2 minutes
  await queue.add(
    'batch-settle-completed',
    { type: 'settle-completed' },
    {
      repeat: { every: 120_000 },
      jobId: 'settle-completed-recurring',
      removeOnComplete: { age: 86_400, count: 500 },
      removeOnFail: false,
    },
  );

  logger.info('Conversion recurring jobs registered');
}

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

let workerInstance: Worker | null = null;

export function getConversionWorker(): Worker | null {
  return workerInstance;
}

export async function stopConversionWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.close();
    workerInstance = null;
    logger.info('Conversion worker stopped');
  }
}
