import { whatsappService } from './whatsapp.service';
import { emailService } from './email.service';
import { getWebSocketServer } from '../websocket';
import { logger } from '../utils/logger';

export class NotificationService {
  /**
   * Send payment notification via all channels.
   */
  async sendPaymentNotification(
    merchant: {
      id: string;
      email: string;
      phone: string;
      whatsappNumber?: string | null;
    },
    data: {
      paymentId: string;
      amount: string;
      crypto: string;
      status: string;
      txHash?: string;
    },
  ): Promise<void> {
    const tasks: Promise<any>[] = [];

    // WhatsApp (primary)
    const whatsappNum = merchant.whatsappNumber || merchant.phone;
    if (whatsappNum) {
      tasks.push(
        whatsappService
          .sendPaymentNotification(whatsappNum, data)
          .catch((err) =>
            logger.error('WhatsApp payment notification failed', { error: err }),
          ),
      );
    }

    // Email
    tasks.push(
      emailService
        .sendPaymentReceiptEmail(merchant.email, {
          paymentId: data.paymentId,
          amount: data.amount,
          crypto: data.crypto,
          status: data.status,
          createdAt: new Date(),
          txHash: data.txHash,
        })
        .catch((err) =>
          logger.error('Email payment notification failed', { error: err }),
        ),
    );

    // WebSocket real-time push
    try {
      const wsServer = getWebSocketServer();
      if (wsServer) {
        wsServer.emitToMerchant(merchant.id, 'payment:update', {
          paymentId: data.paymentId,
          amount: data.amount,
          crypto: data.crypto,
          status: data.status,
          txHash: data.txHash,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      logger.error('WebSocket notification failed', { error: err });
    }

    await Promise.allSettled(tasks);
  }

  /**
   * Send withdrawal notification via all channels.
   */
  async sendWithdrawalNotification(
    merchant: {
      id: string;
      email: string;
      phone: string;
      whatsappNumber?: string | null;
    },
    data: {
      amount: string;
      crypto: string;
      address: string;
      txHash: string;
      fee: string;
    },
  ): Promise<void> {
    const tasks: Promise<any>[] = [];

    // WhatsApp
    const whatsappNum = merchant.whatsappNumber || merchant.phone;
    if (whatsappNum) {
      tasks.push(
        whatsappService
          .sendWithdrawalConfirmation(whatsappNum, data)
          .catch((err) =>
            logger.error('WhatsApp withdrawal notification failed', {
              error: err,
            }),
          ),
      );
    }

    // Email
    tasks.push(
      emailService
        .sendWithdrawalConfirmationEmail(merchant.email, data)
        .catch((err) =>
          logger.error('Email withdrawal notification failed', { error: err }),
        ),
    );

    // WebSocket
    try {
      const wsServer = getWebSocketServer();
      if (wsServer) {
        wsServer.emitToMerchant(merchant.id, 'withdrawal:update', {
          ...data,
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      logger.error('WebSocket withdrawal notification failed', { error: err });
    }

    await Promise.allSettled(tasks);
  }

  /**
   * Send a general alert to a merchant via WhatsApp, email fallback, and WebSocket.
   */
  async sendAlert(
    merchant: {
      id: string;
      email: string;
      phone: string;
      whatsappNumber?: string | null;
    },
    subject: string,
    message: string,
  ): Promise<void> {
    let whatsappSent = false;
    const whatsappNum = merchant.whatsappNumber || merchant.phone;
    if (whatsappNum) {
      whatsappSent = await whatsappService
        .sendMessage(whatsappNum, `*${subject}*\n\n${message}`)
        .catch(() => false);
    }

    // Email fallback if WhatsApp failed or unavailable
    if (!whatsappSent) {
      await emailService
        .sendOtpEmail(merchant.email, `${subject}\n\n${message}`)
        .catch((err) =>
          logger.error('Email alert fallback failed', { error: err }),
        );
    }

    try {
      const wsServer = getWebSocketServer();
      if (wsServer) {
        wsServer.emitToMerchant(merchant.id, 'alert', {
          subject,
          message,
          timestamp: new Date().toISOString(),
        });
      }
    } catch {
      // Silently ignore WebSocket errors for alerts
    }
  }
}

export const notificationService = new NotificationService();
