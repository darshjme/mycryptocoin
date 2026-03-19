/**
 * MyCryptoCoin — BullMQ Job Queue Configuration
 *
 * Centralised queue definitions with proper concurrency, retry policies,
 * dead-letter handling, and priority ordering.
 */

import { Queue, Worker, QueueEvents, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

// ---------------------------------------------------------------------------
// Shared Redis connection for all queues
// ---------------------------------------------------------------------------

const REDIS_OPTS: IORedis.RedisOptions = {
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck: false,
  retryStrategy(times: number) {
    return Math.min(times * 500, 5_000);
  },
};

export function createQueueRedis(): IORedis {
  return new IORedis(env.REDIS_URL, REDIS_OPTS);
}

const connection = createQueueRedis();

// ---------------------------------------------------------------------------
// Queue name constants
// ---------------------------------------------------------------------------

export const QUEUE_NAMES = {
  PAYMENT_PROCESSING: 'payment-processing',
  WITHDRAWAL_PROCESSING: 'withdrawal-processing',
  WEBHOOK_DELIVERY: 'webhook-delivery',
  BLOCKCHAIN_MONITORING: 'blockchain-monitoring',
  EMAIL_SENDING: 'email-sending',
  WHATSAPP_SENDING: 'whatsapp-sending',
  RECONCILIATION: 'reconciliation',
  CONVERSION_PROCESSING: 'conversion-processing',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// ---------------------------------------------------------------------------
// Default job options per queue
// ---------------------------------------------------------------------------

interface QueueConfig {
  name: string;
  concurrency: number;
  defaultJobOpts: JobsOptions;
  /** Lower number = higher priority (BullMQ convention) */
  defaultPriority: number;
}

const QUEUE_CONFIGS: QueueConfig[] = [
  {
    name: QUEUE_NAMES.PAYMENT_PROCESSING,
    concurrency: 10,
    defaultPriority: 2,
    defaultJobOpts: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: { age: 86_400, count: 5_000 },
      removeOnFail: false,
    },
  },
  {
    name: QUEUE_NAMES.WITHDRAWAL_PROCESSING,
    concurrency: 5,
    defaultPriority: 1, // highest — withdrawals are critical
    defaultJobOpts: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 10_000 },
      removeOnComplete: { age: 172_800, count: 2_000 },
      removeOnFail: false,
    },
  },
  {
    name: QUEUE_NAMES.WEBHOOK_DELIVERY,
    concurrency: 20,
    defaultPriority: 3,
    defaultJobOpts: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 10_000 }, // ~10s, ~20s, ~40s
      removeOnComplete: { age: 604_800, count: 50_000 },
      removeOnFail: false,
    },
  },
  {
    name: QUEUE_NAMES.BLOCKCHAIN_MONITORING,
    concurrency: 8,
    defaultPriority: 2,
    defaultJobOpts: {
      attempts: 10,
      backoff: { type: 'exponential', delay: 3_000 },
      removeOnComplete: { age: 86_400, count: 10_000 },
      removeOnFail: false,
    },
  },
  {
    name: QUEUE_NAMES.EMAIL_SENDING,
    concurrency: 15,
    defaultPriority: 4,
    defaultJobOpts: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: { age: 259_200, count: 20_000 },
      removeOnFail: false,
    },
  },
  {
    name: QUEUE_NAMES.WHATSAPP_SENDING,
    concurrency: 5,
    defaultPriority: 4,
    defaultJobOpts: {
      attempts: 2,
      backoff: { type: 'exponential', delay: 10_000 },
      removeOnComplete: { age: 259_200, count: 10_000 },
      removeOnFail: false,
    },
  },
  {
    name: QUEUE_NAMES.RECONCILIATION,
    concurrency: 1, // serial — only one reconciliation at a time
    defaultPriority: 5,
    defaultJobOpts: {
      attempts: 2,
      backoff: { type: 'fixed', delay: 60_000 },
      removeOnComplete: { age: 2_592_000, count: 100 },
      removeOnFail: false,
    },
  },
  {
    name: QUEUE_NAMES.CONVERSION_PROCESSING,
    concurrency: 5,
    defaultPriority: 2, // same as payment processing
    defaultJobOpts: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 10_000 },
      removeOnComplete: { age: 604_800, count: 10_000 }, // 7 days
      removeOnFail: false,
    },
  },
];

// ---------------------------------------------------------------------------
// Queue registry
// ---------------------------------------------------------------------------

const queues = new Map<string, Queue>();
const queueEvents = new Map<string, QueueEvents>();

export function getQueue(name: QueueName): Queue {
  if (queues.has(name)) return queues.get(name)!;

  const cfg = QUEUE_CONFIGS.find((c) => c.name === name);
  if (!cfg) throw new Error(`Unknown queue: ${name}`);

  const queue = new Queue(name, {
    connection: createQueueRedis(),
    defaultJobOptions: {
      ...cfg.defaultJobOpts,
      priority: cfg.defaultPriority,
    },
  });

  queues.set(name, queue);
  return queue;
}

/**
 * Start scheduler for a queue.
 * In BullMQ v5+, QueueScheduler was removed — its functionality is
 * built into the Worker itself. This is now a no-op kept for API
 * compatibility with worker startup code.
 */
export function startScheduler(_name: QueueName): void {
  // No-op: BullMQ v5+ handles delayed/repeated jobs inside the Worker.
}

/**
 * Get QueueEvents for monitoring.
 */
export function getQueueEvents(name: QueueName): QueueEvents {
  if (queueEvents.has(name)) return queueEvents.get(name)!;

  const events = new QueueEvents(name, { connection: createQueueRedis() });
  queueEvents.set(name, events);
  return events;
}

/**
 * Get concurrency setting for a queue.
 */
export function getQueueConcurrency(name: QueueName): number {
  const cfg = QUEUE_CONFIGS.find((c) => c.name === name);
  return cfg?.concurrency ?? 1;
}

// ---------------------------------------------------------------------------
// Dead-letter queue helpers
// ---------------------------------------------------------------------------

const DLQ_PREFIX = 'dlq';

export function getDLQName(name: QueueName): string {
  return `${DLQ_PREFIX}:${name}`;
}

/**
 * Move a permanently failed job to the dead-letter queue.
 * Called from individual workers after exhausting retries.
 */
export async function moveToDLQ(
  queueName: QueueName,
  jobData: Record<string, unknown>,
  failureReason: string,
): Promise<void> {
  const dlqName = getDLQName(queueName);
  let dlq = queues.get(dlqName);
  if (!dlq) {
    dlq = new Queue(dlqName, { connection: createQueueRedis() });
    queues.set(dlqName, dlq);
  }

  await dlq.add('dead-letter', {
    originalQueue: queueName,
    data: jobData,
    failureReason,
    movedAt: new Date().toISOString(),
  });

  logger.warn('Job moved to DLQ', { queue: queueName, failureReason });
}

// ---------------------------------------------------------------------------
// Scheduled / repeating jobs
// ---------------------------------------------------------------------------

/**
 * Register repeating jobs (call once at startup from the primary worker process).
 */
export async function registerScheduledJobs(): Promise<void> {
  // Blockchain monitoring — poll every 15 seconds
  const blockchainQueue = getQueue(QUEUE_NAMES.BLOCKCHAIN_MONITORING);
  await blockchainQueue.add(
    'poll-all-chains',
    {},
    {
      repeat: { every: 15_000 },
      jobId: 'blockchain-poll-recurring',
    },
  );

  // Daily reconciliation at 02:00 UTC
  const reconQueue = getQueue(QUEUE_NAMES.RECONCILIATION);
  await reconQueue.add(
    'daily-reconciliation',
    {},
    {
      repeat: { pattern: '0 2 * * *' },
      jobId: 'daily-recon-recurring',
    },
  );

  logger.info('Scheduled jobs registered');
}

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

export async function closeAllQueues(): Promise<void> {
  const closeOps: Promise<void>[] = [];

  for (const [, q] of queues) closeOps.push(q.close());
  for (const [, e] of queueEvents) closeOps.push(e.close());

  await Promise.allSettled(closeOps);
  await connection.quit();
  logger.info('All queues closed');
}
