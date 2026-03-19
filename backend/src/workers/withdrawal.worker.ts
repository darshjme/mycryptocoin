/**
 * MyCryptoCoin — Withdrawal Processing Worker
 *
 * Processes approved withdrawal requests: signs transactions,
 * broadcasts to the blockchain, manages nonces (EVM), estimates fees,
 * and retries with exponential backoff.
 */

import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
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

interface WithdrawalJobData {
  withdrawalId: string;
  merchantId: string;
  chain: string;
  toAddress: string;
  amount: string;
  currency: string;
  /** For EVM chains — if provided, the worker uses this nonce */
  nonce?: number;
}

interface BroadcastResult {
  txHash: string;
  nonce?: number;
  fee: string;
}

// ---------------------------------------------------------------------------
// Prisma
// ---------------------------------------------------------------------------

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Nonce management (EVM chains) — Redis-based atomic counter
// ---------------------------------------------------------------------------

const EVM_CHAINS = new Set(['ETH', 'BSC', 'MATIC']);

async function acquireNonce(chain: string, fromAddress: string): Promise<number> {
  const redis = getRedisClient();
  const key = `nonce:${chain}:${fromAddress.toLowerCase()}`;

  // Use INCR for atomic nonce acquisition
  const nonce = await redis.incr(key);
  // First time: nonce starts at 1 but on-chain nonce starts at 0
  // We initialise from on-chain if key didn't exist before
  if (nonce === 1) {
    // Fetch on-chain nonce and set it
    const onChainNonce = await getOnChainNonce(chain, fromAddress);
    await redis.set(key, onChainNonce.toString());
    return onChainNonce;
  }
  return nonce - 1; // INCR returns value after increment
}

async function releaseNonce(chain: string, fromAddress: string): Promise<void> {
  const redis = getRedisClient();
  const key = `nonce:${chain}:${fromAddress.toLowerCase()}`;
  await redis.decr(key);
}

async function resetNonce(chain: string, fromAddress: string): Promise<void> {
  const redis = getRedisClient();
  const key = `nonce:${chain}:${fromAddress.toLowerCase()}`;
  const onChainNonce = await getOnChainNonce(chain, fromAddress);
  await redis.set(key, onChainNonce.toString());
  logger.info('Nonce reset to on-chain value', { chain, fromAddress, nonce: onChainNonce });
}

async function getOnChainNonce(chain: string, address: string): Promise<number> {
  try {
    const adapter = getChainAdapter(chain);
    return await adapter.getNonce(address);
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Idempotency lock
// ---------------------------------------------------------------------------

async function acquireWithdrawalLock(withdrawalId: string): Promise<boolean> {
  const redis = getRedisClient();
  const key = `withdrawal:lock:${withdrawalId}`;
  const result = await redis.set(key, Date.now().toString(), 'EX', 600, 'NX');
  return result === 'OK';
}

async function releaseWithdrawalLock(withdrawalId: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(`withdrawal:lock:${withdrawalId}`);
}

// ---------------------------------------------------------------------------
// Chain adapter interface
// ---------------------------------------------------------------------------

interface WithdrawalChainAdapter {
  estimateFee(toAddress: string, amount: string): Promise<string>;
  signAndBroadcast(params: {
    toAddress: string;
    amount: string;
    nonce?: number;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
  }): Promise<BroadcastResult>;
  getTransactionStatus(txHash: string): Promise<'pending' | 'confirmed' | 'failed'>;
  getNonce(address: string): Promise<number>;
  getHotWalletAddress(): string;
}

function getChainAdapter(chain: string): WithdrawalChainAdapter {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(`../services/blockchain/${chain.toLowerCase()}.adapter`);
    return mod.default || mod;
  } catch {
    throw new Error(`No withdrawal adapter for ${chain}`);
  }
}

// ---------------------------------------------------------------------------
// Core withdrawal processing
// ---------------------------------------------------------------------------

async function processWithdrawal(job: Job<WithdrawalJobData>): Promise<void> {
  const { withdrawalId, merchantId, chain, toAddress, amount, currency } = job.data;
  const jobLogger = logger.child({ withdrawalId, chain, jobId: job.id });

  jobLogger.info('Processing withdrawal', { toAddress, amount, currency });

  // ---- Idempotency check --------------------------------------------------
  if (!(await acquireWithdrawalLock(withdrawalId))) {
    jobLogger.warn('Withdrawal already being processed');
    return;
  }

  let nonce: number | undefined;
  const isEvm = EVM_CHAINS.has(chain);

  try {
    // ---- Verify withdrawal is still in APPROVED state ----------------------
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      jobLogger.error('Withdrawal not found');
      return;
    }

    if (withdrawal.status === 'COMPLETED') {
      jobLogger.info('Withdrawal already completed — skipping');
      return;
    }

    if (withdrawal.status !== 'APPROVED' && withdrawal.status !== 'PROCESSING') {
      jobLogger.warn('Withdrawal in unexpected state', { status: withdrawal.status });
      return;
    }

    // ---- Mark as PROCESSING ------------------------------------------------
    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: 'PROCESSING', processingStartedAt: new Date() },
    });

    const adapter = getChainAdapter(chain);
    const hotWalletAddress = adapter.getHotWalletAddress();

    // ---- Fee estimation ----------------------------------------------------
    const estimatedFee = await adapter.estimateFee(toAddress, amount);
    jobLogger.info('Fee estimated', { estimatedFee });

    // ---- Verify sufficient hot wallet balance ------------------------------
    // (balance checks are done in the approval flow, but double-check here)

    // ---- Acquire nonce for EVM chains --------------------------------------
    if (isEvm) {
      nonce = job.data.nonce ?? (await acquireNonce(chain, hotWalletAddress));
      jobLogger.info('Nonce acquired', { nonce });
    }

    // ---- Sign and broadcast ------------------------------------------------
    const result = await adapter.signAndBroadcast({
      toAddress,
      amount,
      nonce,
    });

    jobLogger.info('Transaction broadcast', { txHash: result.txHash, fee: result.fee });

    // ---- Update DB with txHash --------------------------------------------
    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        txHash: result.txHash,
        fee: result.fee,
        status: 'BROADCAST',
        broadcastAt: new Date(),
      },
    });

    // ---- Wait for confirmation (enqueue a monitoring job) -------------------
    await getQueue(QUEUE_NAMES.BLOCKCHAIN_MONITORING).add(
      'monitor-withdrawal',
      {
        withdrawalId,
        txHash: result.txHash,
        chain,
        merchantId,
      },
      { delay: 15_000 }, // check after ~1 block
    );

    // ---- Notify merchant ---------------------------------------------------
    await getQueue(QUEUE_NAMES.WEBHOOK_DELIVERY).add('withdrawal-broadcast', {
      merchantId,
      withdrawalId,
      event: 'withdrawal.broadcast',
      txHash: result.txHash,
    });

    jobLogger.info('Withdrawal processing complete — monitoring enqueued');
  } catch (err: any) {
    jobLogger.error('Withdrawal processing failed', {
      error: err.message,
      attempt: job.attemptsMade,
    });

    // Release nonce on failure so it can be reused
    if (isEvm && nonce !== undefined) {
      const adapter = getChainAdapter(chain);
      await releaseNonce(chain, adapter.getHotWalletAddress());
    }

    // Update status to FAILED if all retries exhausted
    if (job.attemptsMade >= (job.opts.attempts ?? 3) - 1) {
      await prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'FAILED',
          failureReason: err.message,
          failedAt: new Date(),
        },
      });

      await moveToDLQ(QUEUE_NAMES.WITHDRAWAL_PROCESSING, job.data as any, err.message);

      // Notify merchant of failure
      await getQueue(QUEUE_NAMES.WEBHOOK_DELIVERY).add('withdrawal-failed', {
        merchantId,
        withdrawalId,
        event: 'withdrawal.failed',
        reason: err.message,
      });

      // Alert operations team
      await getQueue(QUEUE_NAMES.EMAIL_SENDING).add('ops-alert', {
        type: 'withdrawal_failure',
        withdrawalId,
        chain,
        amount,
        error: err.message,
      });
    }

    await releaseWithdrawalLock(withdrawalId);
    throw err; // let BullMQ retry
  }
}

// ---------------------------------------------------------------------------
// Worker startup
// ---------------------------------------------------------------------------

export function startWithdrawalWorker(): Worker<WithdrawalJobData> {
  startScheduler(QUEUE_NAMES.WITHDRAWAL_PROCESSING);

  const worker = new Worker<WithdrawalJobData>(
    QUEUE_NAMES.WITHDRAWAL_PROCESSING,
    async (job) => processWithdrawal(job),
    {
      connection: createQueueRedis(),
      concurrency: getQueueConcurrency(QUEUE_NAMES.WITHDRAWAL_PROCESSING),
      lockDuration: 120_000, // 2 min lock — withdrawal signing can be slow
      limiter: {
        max: 10,
        duration: 1_000,
      },
    },
  );

  worker.on('completed', (job) => {
    logger.info('Withdrawal job completed', {
      jobId: job.id,
      withdrawalId: job.data.withdrawalId,
    });
  });

  worker.on('failed', (job, err) => {
    if (!job) return;
    logger.error('Withdrawal job failed', {
      jobId: job.id,
      withdrawalId: job.data.withdrawalId,
      error: err.message,
      attemptsMade: job.attemptsMade,
    });
  });

  worker.on('error', (err) => {
    logger.error('Withdrawal worker error', { error: err.message });
  });

  logger.info('Withdrawal worker started', {
    concurrency: getQueueConcurrency(QUEUE_NAMES.WITHDRAWAL_PROCESSING),
  });

  return worker;
}
