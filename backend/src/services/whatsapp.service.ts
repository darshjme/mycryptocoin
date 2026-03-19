import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  ConnectionState,
  proto,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import QRCode from 'qrcode';

export class WhatsAppService {
  private socket: WASocket | null = null;
  private qrCode: string | null = null;
  private isConnected: boolean = false;
  private connectionListeners: Set<(state: Partial<ConnectionState>) => void> = new Set();
  private reconnectAttempts: number = 0;
  private static readonly MAX_RECONNECT_ATTEMPTS = 10;
  private static readonly BASE_RECONNECT_DELAY_MS = 2000;
  private static readonly MAX_RECONNECT_DELAY_MS = 60000;
  private static readonly MAX_LISTENERS = 50;

  async initialize(): Promise<void> {
    if (!env.WHATSAPP_ENABLED) {
      logger.info('WhatsApp service disabled');
      return;
    }

    try {
      const { state, saveCreds } = await useMultiFileAuthState(
        env.WHATSAPP_SESSION_PATH,
      );

      this.socket = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ['MyCryptoCoin', 'Server', '1.0.0'],
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
      });

      this.socket.ev.on('creds.update', saveCreds);

      this.socket.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrCode = qr;
          logger.info('WhatsApp QR code generated — scan to pair device');
        }

        if (connection === 'close') {
          this.isConnected = false;
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          logger.warn(`WhatsApp connection closed (status: ${statusCode})`);

          if (shouldReconnect) {
            if (this.reconnectAttempts >= WhatsAppService.MAX_RECONNECT_ATTEMPTS) {
              logger.error(
                `WhatsApp max reconnect attempts (${WhatsAppService.MAX_RECONNECT_ATTEMPTS}) reached — giving up`,
              );
              return;
            }

            const delay = Math.min(
              WhatsAppService.BASE_RECONNECT_DELAY_MS *
                Math.pow(2, this.reconnectAttempts),
              WhatsAppService.MAX_RECONNECT_DELAY_MS,
            );
            this.reconnectAttempts++;

            logger.info(
              `Reconnecting to WhatsApp in ${delay}ms (attempt ${this.reconnectAttempts}/${WhatsAppService.MAX_RECONNECT_ATTEMPTS})`,
            );
            setTimeout(() => this.initialize(), delay);
          } else {
            logger.warn('WhatsApp logged out — manual re-initialization required');
          }
        }

        if (connection === 'open') {
          this.isConnected = true;
          this.qrCode = null;
          this.reconnectAttempts = 0;
          logger.info('WhatsApp connected successfully');
        }

        // Notify listeners
        for (const listener of this.connectionListeners) {
          try {
            listener(update);
          } catch (err) {
            logger.error('WhatsApp connection listener threw', { error: err });
          }
        }
      });
    } catch (error) {
      logger.error('Failed to initialize WhatsApp', { error });
    }
  }

  /**
   * Get the QR code as a data URI for display.
   */
  async getQRCode(): Promise<string | null> {
    if (!this.qrCode) return null;
    try {
      return await QRCode.toDataURL(this.qrCode);
    } catch {
      return this.qrCode;
    }
  }

  /**
   * Check connection status.
   */
  getConnectionStatus(): {
    connected: boolean;
    hasQR: boolean;
  } {
    return {
      connected: this.isConnected,
      hasQR: !!this.qrCode,
    };
  }

  /**
   * Send an OTP message via WhatsApp.
   */
  async sendOTP(phone: string, otp: string): Promise<boolean> {
    if (!this.isConnected || !this.socket) {
      logger.warn('WhatsApp not connected, cannot send OTP');
      return false;
    }

    const jid = this.formatJid(phone);
    if (!jid) {
      logger.warn('Invalid phone number format for WhatsApp OTP');
      return false;
    }

    try {
      await this.socket.sendMessage(jid, {
        text:
          `*MyCryptoCoin Verification*\n\n` +
          `Your verification code is: *${otp}*\n\n` +
          `This code expires in 5 minutes.\n` +
          `Do not share this code with anyone.`,
      });

      const maskedPhone = phone.slice(0, 4) + '****' + phone.slice(-2);
      logger.info(`WhatsApp OTP sent to ${maskedPhone}`);
      return true;
    } catch (error) {
      logger.error('Failed to send WhatsApp OTP', {
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Send a payment notification.
   */
  async sendPaymentNotification(
    phone: string,
    data: {
      paymentId: string;
      amount: string;
      crypto: string;
      status: string;
      txHash?: string;
    },
  ): Promise<boolean> {
    if (!this.isConnected || !this.socket) return false;

    const jid = this.formatJid(phone);
    if (!jid) return false;

    try {
      let message =
        `*MyCryptoCoin Payment Update*\n\n` +
        `Payment: ${data.paymentId}\n` +
        `Amount: ${data.amount} ${data.crypto}\n` +
        `Status: *${data.status}*`;

      if (data.txHash) {
        message += `\nTx Hash: ${data.txHash}`;
      }

      await this.socket.sendMessage(jid, { text: message });

      logger.info(`Payment notification sent via WhatsApp to ${phone}`);
      return true;
    } catch (error) {
      logger.error('Failed to send WhatsApp payment notification', {
        phone,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Send a withdrawal confirmation.
   */
  async sendWithdrawalConfirmation(
    phone: string,
    data: {
      amount: string;
      crypto: string;
      address: string;
      txHash: string;
      fee: string;
    },
  ): Promise<boolean> {
    if (!this.isConnected || !this.socket) return false;

    const jid = this.formatJid(phone);
    if (!jid) return false;

    try {
      const message =
        `*MyCryptoCoin Withdrawal Confirmed*\n\n` +
        `Amount: ${data.amount} ${data.crypto}\n` +
        `Fee: ${data.fee} ${data.crypto}\n` +
        `To: ${data.address}\n` +
        `Tx Hash: ${data.txHash}`;

      await this.socket.sendMessage(jid, { text: message });

      logger.info(`Withdrawal confirmation sent via WhatsApp to ${phone}`);
      return true;
    } catch (error) {
      logger.error('Failed to send WhatsApp withdrawal confirmation', {
        phone,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Send a generic message.
   */
  async sendMessage(phone: string, text: string): Promise<boolean> {
    if (!this.isConnected || !this.socket) return false;

    const jid = this.formatJid(phone);
    if (!jid) return false;

    try {
      await this.socket.sendMessage(jid, { text });
      return true;
    } catch (error) {
      logger.error('Failed to send WhatsApp message', {
        phone,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Add a connection state listener.
   */
  onConnectionUpdate(listener: (state: Partial<ConnectionState>) => void): void {
    if (this.connectionListeners.size >= WhatsAppService.MAX_LISTENERS) {
      logger.warn('WhatsApp connection listener limit reached, ignoring new listener');
      return;
    }
    this.connectionListeners.add(listener);
  }

  removeConnectionListener(listener: (state: Partial<ConnectionState>) => void): void {
    this.connectionListeners.delete(listener);
  }

  /**
   * Disconnect and clean up.
   */
  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.end(undefined);
      this.socket = null;
      this.isConnected = false;
      this.qrCode = null;
      logger.info('WhatsApp disconnected');
    }
  }

  /**
   * Format a phone number to a WhatsApp JID.
   */
  private formatJid(phone: string): string | null {
    // Remove '+' prefix and non-digit characters, validate E.164-ish format
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length < 7 || cleaned.length > 15) {
      return null;
    }
    return `${cleaned}@s.whatsapp.net`;
  }
}

export const whatsappService = new WhatsAppService();
