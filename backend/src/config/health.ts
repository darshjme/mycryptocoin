/**
 * MyCryptoCoin — Health Check Endpoint
 *
 * Reports dependency status: Database, Redis, blockchain nodes,
 * WhatsApp, disk space, and memory. Returns degraded/unhealthy
 * if any critical dependency fails.
 */

import { Request, Response, Router } from 'express';
import { getRedisClient } from './redis';
import { logger } from '../utils/logger';
import os from 'node:os';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DependencyStatus = 'healthy' | 'degraded' | 'unhealthy';

interface DependencyCheck {
  name: string;
  status: DependencyStatus;
  latencyMs?: number;
  message?: string;
  details?: Record<string, unknown>;
}

interface HealthResponse {
  status: DependencyStatus;
  timestamp: string;
  uptime: number;
  version: string;
  dependencies: DependencyCheck[];
}

// ---------------------------------------------------------------------------
// Prisma client — reuse the application singleton instead of creating a new one.
// Creating a separate PrismaClient here leaks a connection pool (20+ connections)
// that never gets closed on shutdown.
// ---------------------------------------------------------------------------

import { prisma } from './database';

// ---------------------------------------------------------------------------
// Individual checks
// ---------------------------------------------------------------------------

async function checkDatabase(): Promise<DependencyCheck> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      name: 'database',
      status: 'healthy',
      latencyMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      name: 'database',
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      message: err.message,
    };
  }
}

async function checkRedis(): Promise<DependencyCheck> {
  const start = Date.now();
  try {
    const redis = getRedisClient();
    const pong = await redis.ping();
    return {
      name: 'redis',
      status: pong === 'PONG' ? 'healthy' : 'degraded',
      latencyMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      name: 'redis',
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      message: err.message,
    };
  }
}

async function checkBlockchainNodes(): Promise<DependencyCheck> {
  const chains: Record<string, string> = {
    ETH: process.env.ETH_RPC_URL || '',
    BSC: process.env.BSC_RPC_URL || '',
    MATIC: process.env.MATIC_RPC_URL || '',
    SOL: process.env.SOL_RPC_URL || '',
    TRX: process.env.TRON_RPC_URL || '',
  };

  const results: Record<string, unknown> = {};
  let healthyCount = 0;
  let totalCount = 0;

  for (const [chain, url] of Object.entries(chains)) {
    if (!url) continue;
    totalCount++;

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5_000);

      // Simple JSON-RPC call or HTTP HEAD to check reachability
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: chain === 'SOL' ? 'getHealth' : 'eth_blockNumber',
          params: [],
          id: 1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        healthyCount++;
        results[chain] = { status: 'reachable', latencyMs: Date.now() - start };
      } else {
        results[chain] = { status: 'error', httpStatus: response.status, latencyMs: Date.now() - start };
      }
    } catch (err: any) {
      results[chain] = { status: 'unreachable', error: err.message, latencyMs: Date.now() - start };
    }
  }

  let status: DependencyStatus = 'healthy';
  if (healthyCount === 0 && totalCount > 0) status = 'unhealthy';
  else if (healthyCount < totalCount) status = 'degraded';

  return {
    name: 'blockchain_nodes',
    status,
    message: `${healthyCount}/${totalCount} nodes reachable`,
    details: results,
  };
}

async function checkWhatsApp(): Promise<DependencyCheck> {
  if (process.env.WHATSAPP_ENABLED === 'false') {
    return { name: 'whatsapp', status: 'healthy', message: 'disabled' };
  }

  try {
    // Check if the WhatsApp session file exists (Baileys stores sessions on disk)
    const sessionPath = process.env.WHATSAPP_SESSION_PATH || './whatsapp-sessions';
    const { stdout } = await execAsync(`ls "${sessionPath}" 2>/dev/null | wc -l`);
    const fileCount = parseInt(stdout.trim(), 10);

    return {
      name: 'whatsapp',
      status: fileCount > 0 ? 'healthy' : 'degraded',
      message: fileCount > 0 ? 'session active' : 'no active session',
    };
  } catch {
    return {
      name: 'whatsapp',
      status: 'degraded',
      message: 'could not check session status',
    };
  }
}

async function checkDiskSpace(): Promise<DependencyCheck> {
  try {
    const { stdout } = await execAsync("df -k / | awk 'NR==2 {print $4, $5}'");
    const parts = stdout.trim().split(/\s+/);
    const availableKB = parseInt(parts[0], 10);
    const usedPercent = parseInt(parts[1], 10);
    const availableGB = (availableKB / 1_048_576).toFixed(2);

    let status: DependencyStatus = 'healthy';
    if (usedPercent > 95 || availableKB < 512_000) status = 'unhealthy';
    else if (usedPercent > 85 || availableKB < 2_097_152) status = 'degraded';

    return {
      name: 'disk_space',
      status,
      message: `${availableGB} GB available (${usedPercent}% used)`,
      details: { availableKB, usedPercent },
    };
  } catch (err: any) {
    return {
      name: 'disk_space',
      status: 'degraded',
      message: `check failed: ${err.message}`,
    };
  }
}

function checkMemory(): DependencyCheck {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);
  const processMemMB = Math.round(process.memoryUsage().heapUsed / 1_048_576);

  let status: DependencyStatus = 'healthy';
  if (usedPercent > 95 || processMemMB > 1_500) status = 'unhealthy';
  else if (usedPercent > 85 || processMemMB > 1_000) status = 'degraded';

  return {
    name: 'memory',
    status,
    message: `system: ${usedPercent}% used, process: ${processMemMB} MB heap`,
    details: {
      systemTotalMB: Math.round(totalMem / 1_048_576),
      systemFreeMB: Math.round(freeMem / 1_048_576),
      systemUsedPercent: usedPercent,
      processHeapMB: processMemMB,
      processRssMB: Math.round(process.memoryUsage().rss / 1_048_576),
    },
  };
}

// ---------------------------------------------------------------------------
// Aggregate health status
// ---------------------------------------------------------------------------

function aggregateStatus(checks: DependencyCheck[]): DependencyStatus {
  const hasUnhealthy = checks.some((c) => c.status === 'unhealthy');
  const hasDegraded = checks.some((c) => c.status === 'degraded');

  // Database and Redis are critical — if either is unhealthy, overall is unhealthy
  const criticalDeps = ['database', 'redis'];
  const criticalUnhealthy = checks.some(
    (c) => criticalDeps.includes(c.name) && c.status === 'unhealthy',
  );

  if (criticalUnhealthy) return 'unhealthy';
  if (hasUnhealthy) return 'degraded';
  if (hasDegraded) return 'degraded';
  return 'healthy';
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export function createHealthRouter(): Router {
  const router = Router();

  // Simple liveness probe
  router.get('/healthz', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  // Readiness probe (checks dependencies)
  router.get('/ready', async (_req: Request, res: Response) => {
    try {
      const [db, redis] = await Promise.all([checkDatabase(), checkRedis()]);
      const allHealthy = db.status === 'healthy' && redis.status === 'healthy';
      res.status(allHealthy ? 200 : 503).json({
        ready: allHealthy,
        database: db.status,
        redis: redis.status,
      });
    } catch {
      res.status(503).json({ ready: false });
    }
  });

  // Full health check
  router.get('/health', async (_req: Request, res: Response) => {
    try {
      const checks = await Promise.all([
        checkDatabase(),
        checkRedis(),
        checkBlockchainNodes(),
        checkWhatsApp(),
        checkDiskSpace(),
        Promise.resolve(checkMemory()),
      ]);

      const overallStatus = aggregateStatus(checks);

      const response: HealthResponse = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.APP_VERSION || '1.0.0',
        dependencies: checks,
      };

      const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

      // Log if not healthy
      if (overallStatus !== 'healthy') {
        logger.warn('Health check returned non-healthy status', {
          status: overallStatus,
          unhealthy: checks.filter((c) => c.status !== 'healthy').map((c) => c.name),
        });
      }

      res.status(httpStatus).json(response);
    } catch (err: any) {
      logger.error('Health check failed', { error: err.message });
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: err.message,
      });
    }
  });

  return router;
}
