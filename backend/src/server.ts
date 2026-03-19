import { createServer } from 'http';
import { app } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { initWebSocket, getWebSocketServer } from './websocket';
import { whatsappService } from './services/whatsapp.service';
import { paymentService } from './services/payment.service';
import { withdrawalService } from './services/withdrawal.service';
import { logger } from './utils/logger';

const httpServer = createServer(app);

// Store server reference on process for cluster graceful-drain support
(process as any).__httpServer = httpServer;

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Connect to Redis
    await connectRedis();

    // Initialize WebSocket
    initWebSocket(httpServer);

    // Initialize WhatsApp (non-blocking)
    if (env.WHATSAPP_ENABLED) {
      whatsappService.initialize().catch((err) => {
        logger.error('WhatsApp initialization failed (non-fatal)', { error: err });
      });
    }

    // Start payment monitoring
    paymentService.startMonitoring();

    // Start withdrawal processing
    withdrawalService.startProcessing();

    // Start HTTP server
    httpServer.listen(env.PORT, () => {
      logger.info(`MyCryptoCoin API running on port ${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${env.PORT}/api/v1/health`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// ---------- Graceful Shutdown ----------
let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return; // Prevent double-shutdown
  isShuttingDown = true;

  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Force exit after 30s if drain doesn't complete
  const forceTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out after 30s — force exiting');
    process.exit(1);
  }, 30_000).unref();

  // Stop accepting new connections and drain in-flight requests
  await new Promise<void>((resolve) => {
    httpServer.close(() => {
      logger.info('HTTP server closed — all in-flight requests drained');
      resolve();
    });
  });

  // Stop background processes
  paymentService.stopMonitoring();
  withdrawalService.stopProcessing();

  // Close WebSocket
  const wsServer = getWebSocketServer();
  if (wsServer) {
    wsServer.close();
  }

  // Close job queues (waits for active jobs to finish)
  try {
    const { closeAllQueues } = require('./config/queue');
    await closeAllQueues();
  } catch {
    // Queue module may not be loaded in all configurations
  }

  // Disconnect WhatsApp
  await whatsappService.disconnect();

  // Disconnect database and Redis
  await disconnectDatabase();
  await disconnectRedis();

  clearTimeout(forceTimer);
  logger.info('Graceful shutdown complete');
  process.exit(0);
}

// Handle termination signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', {
    message: error.message,
    stack: error.stack,
  });
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled rejection', { reason });
  shutdown('unhandledRejection');
});

// Start the server
startServer();

export { httpServer };
