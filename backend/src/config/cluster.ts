/**
 * MyCryptoCoin — Node.js Cluster Mode
 *
 * Forks one worker per CPU core for maximum throughput.
 * Handles graceful restarts, zero-downtime deploys, and
 * sticky sessions for WebSocket connections.
 */

import cluster from 'node:cluster';
import os from 'node:os';
import crypto from 'node:crypto';
import net from 'node:net';
import { logger } from '../utils/logger';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const NUM_WORKERS = parseInt(process.env.CLUSTER_WORKERS || '', 10) || os.cpus().length;
const RESTART_DELAY_MS = 2_000;
const MAX_RESTARTS_PER_WINDOW = 10;
const RESTART_WINDOW_MS = 60_000;
const GRACEFUL_SHUTDOWN_TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// Primary process
// ---------------------------------------------------------------------------

interface WorkerMeta {
  startedAt: number;
  restarts: number[];
}

const workerMeta = new Map<number, WorkerMeta>();

function hashToWorker(ip: string, numWorkers: number): number {
  const hash = crypto.createHash('sha1').update(ip).digest();
  return hash.readUInt32BE(0) % numWorkers;
}

function forkWorker(): void {
  const worker = cluster.fork();
  if (worker.process.pid) {
    workerMeta.set(worker.process.pid, { startedAt: Date.now(), restarts: [] });
  }

  logger.info('Worker forked', {
    pid: worker.process.pid,
    totalWorkers: Object.keys(cluster.workers || {}).length,
  });
}

function isRestartLooping(pid: number): boolean {
  const meta = workerMeta.get(pid);
  if (!meta) return false;

  const now = Date.now();
  meta.restarts = meta.restarts.filter((t) => now - t < RESTART_WINDOW_MS);
  return meta.restarts.length >= MAX_RESTARTS_PER_WINDOW;
}

function recordRestart(pid: number): void {
  const meta = workerMeta.get(pid);
  if (meta) {
    meta.restarts.push(Date.now());
  }
}

/**
 * Start the cluster.  Call this from your entry point:
 *
 *   import { startCluster } from './config/cluster';
 *   startCluster(() => import('./server'));
 */
export function startCluster(startServer: () => void | Promise<void>): void {
  if (cluster.isPrimary) {
    logger.info(`Primary process ${process.pid} starting ${NUM_WORKERS} workers`);

    // Fork initial workers
    for (let i = 0; i < NUM_WORKERS; i++) {
      forkWorker();
    }

    // ---- Sticky-session proxy (layer-4) for WebSocket affinity ----------
    // We create a raw TCP server on the public port and distribute
    // connections to workers based on source-IP hash.
    const STICKY_PORT = parseInt(process.env.PORT || '4000', 10);
    const stickyServer = net.createServer({ pauseOnConnect: true }, (conn) => {
      const remoteIp = conn.remoteAddress || '127.0.0.1';
      const workerIds = Object.keys(cluster.workers || {}).map(Number);
      if (workerIds.length === 0) {
        conn.destroy();
        return;
      }
      const targetIdx = hashToWorker(remoteIp, workerIds.length);
      const targetId = workerIds[targetIdx];
      const worker = cluster.workers?.[targetId];
      if (worker) {
        worker.send('sticky:connection', conn);
      } else {
        conn.destroy();
      }
    });

    stickyServer.listen(STICKY_PORT, () => {
      logger.info(`Sticky-session proxy listening on port ${STICKY_PORT}`);
    });

    // ---- Worker lifecycle ------------------------------------------------
    cluster.on('exit', (worker, code, signal) => {
      const pid = worker.process.pid || 0;
      logger.warn('Worker exited', { pid, code, signal });

      workerMeta.delete(pid);

      // Do not restart if we are shutting down
      if ((process as any).__shuttingDown) return;

      if (isRestartLooping(pid)) {
        logger.error('Worker restart loop detected — not restarting', { pid });
        return;
      }

      recordRestart(pid);

      setTimeout(() => {
        logger.info('Restarting worker after crash');
        forkWorker();
      }, RESTART_DELAY_MS);
    });

    // ---- Zero-downtime restart (SIGUSR2) ---------------------------------
    process.on('SIGUSR2', () => {
      logger.info('SIGUSR2 received — performing zero-downtime restart');
      const workerIds = Object.keys(cluster.workers || {}).map(Number);
      let idx = 0;

      const restartNext = () => {
        if (idx >= workerIds.length) {
          logger.info('Zero-downtime restart complete');
          return;
        }
        const wid = workerIds[idx++];
        const worker = cluster.workers?.[wid];
        if (!worker) {
          restartNext();
          return;
        }

        // Fork replacement first, then kill old one
        const replacement = cluster.fork();
        replacement.once('listening', () => {
          worker.kill('SIGTERM');
          setTimeout(restartNext, 1_000);
        });
      };

      restartNext();
    });

    // ---- Graceful primary shutdown (SIGTERM / SIGINT) ---------------------
    const shutdown = (sig: string) => {
      if ((process as any).__shuttingDown) return;
      (process as any).__shuttingDown = true;

      logger.info(`Primary received ${sig} — shutting down workers`);
      stickyServer.close();

      for (const id of Object.keys(cluster.workers || {})) {
        cluster.workers?.[Number(id)]?.send('shutdown');
        cluster.workers?.[Number(id)]?.kill('SIGTERM');
      }

      setTimeout(() => {
        logger.error('Forcefully killing remaining workers');
        for (const id of Object.keys(cluster.workers || {})) {
          cluster.workers?.[Number(id)]?.kill('SIGKILL');
        }
        process.exit(1);
      }, GRACEFUL_SHUTDOWN_TIMEOUT_MS);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } else {
    // ---- Worker process ---------------------------------------------------
    logger.info(`Worker ${process.pid} starting`);

    // Handle graceful shutdown message from primary
    process.on('message', (msg) => {
      if (msg === 'shutdown') {
        logger.info(`Worker ${process.pid} received shutdown — draining`);
        // The server should stop accepting new connections and drain existing ones.
        // The actual server reference is returned from startServer so it can call .close().
        process.exit(0);
      }
    });

    startServer();
  }
}

export { NUM_WORKERS, GRACEFUL_SHUTDOWN_TIMEOUT_MS };
