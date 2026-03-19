import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../middleware/auth';
import { logger } from '../utils/logger';

let wsServer: WebSocketServer | null = null;

// ---------------------------------------------------------------------------
// Connection limits
// ---------------------------------------------------------------------------
const MAX_CONNECTIONS_PER_MERCHANT = 10;
const MAX_CONNECTIONS_PER_IP = 20;

export class WebSocketServer {
  private io: SocketIOServer;
  private merchantConnectionCounts = new Map<string, number>();
  private ipConnectionCounts = new Map<string, number>();

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: env.CORS_ORIGINS.split(',').map((s) => s.trim()),
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
      maxHttpBufferSize: 64 * 1024, // 64KB max message size (prevent memory abuse)
    });

    this.setupMiddleware();
    this.setupHandlers();
  }

  private setupMiddleware(): void {
    // Auth middleware
    this.io.use((socket: Socket, next) => {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
        (socket as any).merchant = decoded;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });

    // Connection limit middleware — prevent resource exhaustion
    this.io.use((socket: Socket, next) => {
      const merchant = (socket as any).merchant as JwtPayload;
      const ip = socket.handshake.address;

      // Per-merchant limit
      const merchantCount = this.merchantConnectionCounts.get(merchant.merchantId) || 0;
      if (merchantCount >= MAX_CONNECTIONS_PER_MERCHANT) {
        logger.warn('WebSocket connection limit per merchant exceeded', {
          merchantId: merchant.merchantId,
          count: merchantCount,
        });
        return next(new Error(`Connection limit exceeded: max ${MAX_CONNECTIONS_PER_MERCHANT} per merchant`));
      }

      // Per-IP limit
      const ipCount = this.ipConnectionCounts.get(ip) || 0;
      if (ipCount >= MAX_CONNECTIONS_PER_IP) {
        logger.warn('WebSocket connection limit per IP exceeded', { ip, count: ipCount });
        return next(new Error(`Connection limit exceeded: max ${MAX_CONNECTIONS_PER_IP} per IP`));
      }

      next();
    });
  }

  private trackConnection(merchantId: string, ip: string): void {
    this.merchantConnectionCounts.set(
      merchantId,
      (this.merchantConnectionCounts.get(merchantId) || 0) + 1,
    );
    this.ipConnectionCounts.set(ip, (this.ipConnectionCounts.get(ip) || 0) + 1);
  }

  private untrackConnection(merchantId: string, ip: string): void {
    const mc = (this.merchantConnectionCounts.get(merchantId) || 1) - 1;
    if (mc <= 0) this.merchantConnectionCounts.delete(merchantId);
    else this.merchantConnectionCounts.set(merchantId, mc);

    const ic = (this.ipConnectionCounts.get(ip) || 1) - 1;
    if (ic <= 0) this.ipConnectionCounts.delete(ip);
    else this.ipConnectionCounts.set(ip, ic);
  }

  private setupHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const merchant = (socket as any).merchant as JwtPayload;
      const merchantRoom = `merchant:${merchant.merchantId}`;
      const ip = socket.handshake.address;

      // Track connection counts
      this.trackConnection(merchant.merchantId, ip);

      // Join merchant-specific room
      socket.join(merchantRoom);

      logger.info(
        `WebSocket connected: merchant ${merchant.merchantId} (socket: ${socket.id})`,
      );

      // Handle subscription to specific payment updates
      socket.on('subscribe:payment', (paymentId: string) => {
        socket.join(`payment:${paymentId}`);
        logger.debug(
          `Merchant ${merchant.merchantId} subscribed to payment ${paymentId}`,
        );
      });

      socket.on('unsubscribe:payment', (paymentId: string) => {
        socket.leave(`payment:${paymentId}`);
      });

      // Subscribe to wallet balance updates
      socket.on('subscribe:balances', () => {
        socket.join(`${merchantRoom}:balances`);
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      socket.on('disconnect', (reason) => {
        this.untrackConnection(merchant.merchantId, ip);
        logger.info(
          `WebSocket disconnected: merchant ${merchant.merchantId} (reason: ${reason})`,
        );
      });

      socket.on('error', (error) => {
        logger.error('WebSocket error', {
          merchantId: merchant.merchantId,
          error: error.message,
        });
      });

      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to MyCryptoCoin real-time updates',
        merchantId: merchant.merchantId,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Emit an event to a specific merchant's room.
   */
  emitToMerchant(merchantId: string, event: string, data: any): void {
    this.io.to(`merchant:${merchantId}`).emit(event, data);
  }

  /**
   * Emit an event to a specific payment room.
   */
  emitToPayment(paymentId: string, event: string, data: any): void {
    this.io.to(`payment:${paymentId}`).emit(event, data);
  }

  /**
   * Emit a balance update to subscribers.
   */
  emitBalanceUpdate(
    merchantId: string,
    data: { walletId: string; balance: string; pendingBalance: string },
  ): void {
    this.io.to(`merchant:${merchantId}:balances`).emit('balance:update', data);
  }

  /**
   * Emit an event to all connected clients.
   */
  emitToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  /**
   * Get the count of connected sockets.
   */
  async getConnectionCount(): Promise<number> {
    const sockets = await this.io.fetchSockets();
    return sockets.length;
  }

  /**
   * Get the underlying Socket.IO server instance.
   */
  getIO(): SocketIOServer {
    return this.io;
  }

  /**
   * Disconnect all clients and close the server.
   */
  close(): void {
    this.io.close();
    logger.info('WebSocket server closed');
  }
}

export function initWebSocket(httpServer: HttpServer): WebSocketServer {
  wsServer = new WebSocketServer(httpServer);
  logger.info('WebSocket server initialized');
  return wsServer;
}

export function getWebSocketServer(): WebSocketServer | null {
  return wsServer;
}
