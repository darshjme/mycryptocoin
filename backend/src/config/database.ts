import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from '../utils/logger';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// ---------------------------------------------------------------------------
// Connection pool sizing
// ---------------------------------------------------------------------------
// Prisma uses the `connection_limit` query parameter on DATABASE_URL.
// If not set, we append a sensible default for a high-throughput payment API.
// Formula: NUM_PHYSICAL_CPUS * 2 + 1  (PostgreSQL rule of thumb).
// In cluster mode each worker gets its own pool, so keep per-worker pool modest.
// ---------------------------------------------------------------------------

function buildDatabaseUrl(): string {
  const baseUrl = env.DATABASE_URL;
  // Only add connection_limit if the user hasn't already set it
  if (baseUrl.includes('connection_limit')) return baseUrl;
  const separator = baseUrl.includes('?') ? '&' : '?';
  // 20 connections per worker, 10s connect timeout, 15s query timeout
  return `${baseUrl}${separator}connection_limit=20&connect_timeout=10&pool_timeout=15`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: buildDatabaseUrl(),
      },
    },
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'info' },
            { emit: 'stdout', level: 'warn' },
            { emit: 'stdout', level: 'error' },
          ]
        : [
            { emit: 'stdout', level: 'warn' },
            { emit: 'stdout', level: 'error' },
          ],
  });

if (env.NODE_ENV === 'development') {
  (prisma as any).$on('query', (e: any) => {
    logger.debug(`Query: ${e.query} — Duration: ${e.duration}ms`);
    // Flag slow queries (>500ms) for optimisation
    if (e.duration > 500) {
      logger.warn(`SLOW QUERY (${e.duration}ms): ${e.query}`);
    }
  });
}

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database', { error });
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
