/**
 * MyCryptoCoin — Payment Processing Worker
 *
 * Processes incoming payment confirmations from the blockchain.
 * Polls for confirmations, handles chain reorganisations, and
 * guarantees idempotent processing (no double-credits).
 */

import { Worker, Job } from 'bullmq';
import { PrismaClient, Prisma } from '@prisma/client';
import {
  QUEUE_NAMES,
  createQueueRedis,
  getQueueConcurrency,
  startScheduler,
  getQueue,
  moveToDLQ,
} from '../config/queue';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaymentJobData {
  paymentId: string;
  txHash: string;
  chain: string;
  expectedAmount: string;
  merchantId: string;
  address: string;
  /** Retry counter injected by the worker for reorg handling */
  _confirmationAttempt?: number;
}

interface ChainAdapter {
  getTransaction(txHash: string): Promise<ChainTx | null>;
  getConfirmations(txHash: string): Promise<number>;
  getCurrentBlockHeight(): Promise<number>;
}

interface ChainTx {
  hash: string;
  to: string;
  amount: string;
  blockNumber: number | null;
  confirmed: boolean;
}

// ---------------------------------------------------------------------------
// Required confirmations per chain
// ---------------------------------------------------------------------------

const REQUIRED_CONFIRMATIONS: Record<string, number> = {
  BTC: 3,
  ETH: 12,
  BSC: 15,
  MATIC: 30,
  SOL: 32,
  TRX: 20,
  LTC: 6,
  DOGE: 10,
  XRP: 1,
};

// ---------------------------------------------------------------------------
// Prisma client (shared within worker process)
// ---------------------------------------------------------------------------

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Idempotency: Redis-backed processing lock
// ---------------------------------------------------------------------------

const IDEMPOTENCY_TTL = 86_400; // 24 hours

async function acquireProcessingLock(paymentId: string): Promise<boolean> {
  const redis = getRedisClient();
  const key = `payment:lock:${paymentId}`;
  const result = await redis.set(key, Date.now().toString(), 'EX', IDEMPOTENCY_TTL, 'NX');
  return result === 'OK';
}

async function releaseProcessingLock(paymentId: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(`payment:lock:${paymentId}`);
}

async function isAlreadyCredited(paymentId: string): Promise<boolean> {
  const redis = getRedisClient();
  return (await redis.exists(`payment:credited:${paymentId}`)) === 1;
}

async function markAsCredited(paymentId: string): Promise<void> {
  const redis = getRedisClient();
  await redis.set(`payment:credited:${paymentId}`, '1', 'EX', 7 * 86_400);
}

// ---------------------------------------------------------------------------
// Chain adapter factory (stubbed — real implementations live in services/)
// ---------------------------------------------------------------------------

function getChainAdapter(chain: string): ChainAdapter {
  // In production these delegate to ethers / bitcoinjs / solana/web3 etc.
  // The full implementations are in backend/src/services/blockchain/*.ts
  // Here we define the interface contract the worker depends on.
  try {
    // Dynamic import from services (expected path)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(`../services/blockchain/${chain.toLowerCase()}.adapter`);
    return mod.default || mod;
  } catch {
    throw new Error(`No chain adapter for ${chain}`);
  }
}

// ---------------------------------------------------------------------------
// Core processing logic
// ---------------------------------------------------------------------------

async function processPayment(job: Job<PaymentJobData>): Promise<void> {
  const { paymentId, txHash, chain, expectedAmount, merchantId, address } = job.data;
  const jobLogger = logger.child({ paymentId, txHash, chain, jobId: job.id });

  jobLogger.info('Processing payment confirmation');

  // ---- Idempotency check --------------------------------------------------
  if (await isAlreadyCredited(paymentId)) {
    jobLogger.info('Payment already credited — skipping');
    return;
  }

  if (!(await acquireProcessingLock(paymentId))) {
    jobLogger.warn('Payment is being processed by another worker — skipping');
    return;
  }

  try {
    // ---- Fetch on-chain data ------------------------------------------------
    const adapter = getChainAdapter(chain);
    const tx = await adapter.getTransaction(txHash);

    if (!tx) {
      jobLogger.warn('Transaction not found on chain — may be pending or dropped');
      throw new Error('TX_NOT_FOUND');
    }

    // ---- Validate receiving address -----------------------------------------
    if (tx.to.toLowerCase() !== address.toLowerCase()) {
      jobLogger.error('Transaction recipient mismatch', {
        expected: address,
        received: tx.to,
      });
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'FAILED', failureReason: 'ADDRESS_MISMATCH' },
      });
      return;
    }

    // ---- Validate amount ----------------------------------------------------
    const receivedBig = BigInt(tx.amount);
    const expectedBig = BigInt(expectedAmount);
    // Allow up to 0.5% underpayment for floating point / gas deductions
    const tolerance = expectedBig / 200n;
    if (receivedBig < expectedBig - tolerance) {
      jobLogger.warn('Underpayment detected', {
        expected: expectedAmount,
        received: tx.amount,
      });
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'UNDERPAID',
          receivedAmount: tx.amount,
        },
      });
      // Enqueue a webhook for underpayment notification
      await getQueue(QUEUE_NAMES.WEBHOOK_DELIVERY).add('underpaid', {
        paymentId,
        merchantId,
        event: 'payment.underpaid',
      });
      return;
    }

    // ---- Check confirmations ------------------------------------------------
    const required = REQUIRED_CONFIRMATIONS[chain] ?? 12;
    const confirmations = await adapter.getConfirmations(txHash);

    if (confirmations < required) {
      jobLogger.info('Insufficient confirmations — will retry', {
        confirmations,
        required,
      });
      // Re-enqueue with a delay proportional to block time
      const delayMs = getBlockTimeDelayMs(chain);
      throw new Error(`INSUFFICIENT_CONFIRMATIONS:${confirmations}/${required}`);
    }

    // ---- Chain reorganisation detection --------------------------------------
    const currentBlock = await adapter.getCurrentBlockHeight();
    if (tx.blockNumber && currentBlock - tx.blockNumber < required) {
      jobLogger.warn('Possible reorg window — waiting for more blocks');
      throw new Error('REORG_WINDOW');
    }

    // ---- Credit merchant (idempotent via DB transaction) ---------------------
    await prisma.$transaction(async (tx_db) => {
      // Double-check payment status inside the transaction
      const payment = await tx_db.payment.findUnique({ where: { id: paymentId } });
      if (!payment || payment.status === 'COMPLETED') {
        jobLogger.info('Payment already completed in DB — no-op');
        return;
      }

      // Update payment status
      await tx_db.payment.update({
        where: { id: paymentId },
        data: {
          status: 'COMPLETED',
          receivedAmount: tx.amount,
          confirmations,
          completedAt: new Date(),
        },
      });

      // Credit merchant balance using Decimal (never parseFloat for money)
      await tx_db.merchant.update({
        where: { id: merchantId },
        data: {
          balance: { increment: new Prisma.Decimal(tx.amount) },
        },
      });

      jobLogger.info('Payment credited successfully', {
        amount: tx.amount,
        confirmations,
      });
    });

    await markAsCredited(paymentId);

    // ---- Enqueue downstream jobs -------------------------------------------
    await getQueue(QUEUE_NAMES.WEBHOOK_DELIVERY).add('payment-completed', {
      paymentId,
      merchantId,
      event: 'payment.completed',
    });

    await getQueue(QUEUE_NAMES.EMAIL_SENDING).add('payment-receipt', {
      paymentId,
      merchantId,
      type: 'payment_receipt',
    });
  } catch (err) {
    await releaseProcessingLock(paymentId);
    throw err; // let BullMQ handle retries
  }
}

// ---------------------------------------------------------------------------
// Chain-specific block time delays (ms) for retry scheduling
// ---------------------------------------------------------------------------

function getBlockTimeDelayMs(chain: string): number {
  const times: Record<string, number> = {
    BTC: 120_000,
    ETH: 15_000,
    BSC: 3_000,
    MATIC: 2_500,
    SOL: 500,
    TRX: 3_000,
    LTC: 150_000,
    DOGE: 60_000,
    XRP: 4_000,
  };
  return times[chain] ?? 15_000;
}

// ---------------------------------------------------------------------------
// Worker startup
// ---------------------------------------------------------------------------

export function startPaymentWorker(): Worker<PaymentJobData> {
  startScheduler(QUEUE_NAMES.PAYMENT_PROCESSING);

  const worker = new Worker<PaymentJobData>(
    QUEUE_NAMES.PAYMENT_PROCESSING,
    async (job) => processPayment(job),
    {
      connection: createQueueRedis(),
      concurrency: getQueueConcurrency(QUEUE_NAMES.PAYMENT_PROCESSING),
      limiter: {
        max: 50,
        duration: 1_000,
      },
    },
  );

  worker.on('completed', (job) => {
    logger.info('Payment job completed', { jobId: job.id, paymentId: job.data.paymentId });
  });

  worker.on('failed', async (job, err) => {
    if (!job) return;
    logger.error('Payment job failed', {
      jobId: job.id,
      paymentId: job.data.paymentId,
      error: err.message,
      attemptsMade: job.attemptsMade,
    });

    // If all retries exhausted, move to DLQ
    if (job.attemptsMade >= (job.opts.attempts ?? 5)) {
      await moveToDLQ(QUEUE_NAMES.PAYMENT_PROCESSING, job.data as any, err.message);
    }
  });

  worker.on('error', (err) => {
    logger.error('Payment worker error', { error: err.message });
  });

  logger.info('Payment worker started', {
    concurrency: getQueueConcurrency(QUEUE_NAMES.PAYMENT_PROCESSING),
  });

  return worker;
}
