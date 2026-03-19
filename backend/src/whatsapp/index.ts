import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import path from "path";
import { logger } from "../utils/logger";

const sessions = new Map<string, WASocket>();
const reconnectAttempts = new Map<string, number>();

const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_DELAY_MS = 60000;

export async function createWhatsAppSession(
  merchantId: string,
  sessionDir: string = process.env.WHATSAPP_SESSION_DIR || "./whatsapp-sessions"
): Promise<WASocket> {
  const sessionPath = path.join(sessionDir, merchantId);
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: ["MyCryptoCoin", "Server", "1.0.0"],
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const statusCode =
        (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        const attempts = reconnectAttempts.get(merchantId) || 0;
        if (attempts >= MAX_RECONNECT_ATTEMPTS) {
          logger.error(
            `[WhatsApp] Max reconnect attempts reached for session: ${merchantId}`
          );
          sessions.delete(merchantId);
          reconnectAttempts.delete(merchantId);
          return;
        }

        const delay = Math.min(
          BASE_RECONNECT_DELAY_MS * Math.pow(2, attempts),
          MAX_RECONNECT_DELAY_MS
        );
        reconnectAttempts.set(merchantId, attempts + 1);

        logger.info(
          `[WhatsApp] Reconnecting session ${merchantId} in ${delay}ms (attempt ${attempts + 1}/${MAX_RECONNECT_ATTEMPTS})`
        );
        setTimeout(() => createWhatsAppSession(merchantId, sessionDir), delay);
      } else {
        logger.info(`[WhatsApp] Session logged out: ${merchantId}`);
        sessions.delete(merchantId);
        reconnectAttempts.delete(merchantId);
      }
    } else if (connection === "open") {
      logger.info(`[WhatsApp] Session connected: ${merchantId}`);
      reconnectAttempts.delete(merchantId);
    }
  });

  sessions.set(merchantId, sock);
  return sock;
}

export async function sendPaymentNotification(
  merchantId: string,
  phoneNumber: string,
  paymentData: {
    paymentId: string;
    amount: string;
    token: string;
    status: string;
  }
): Promise<boolean> {
  const sock = sessions.get(merchantId);
  if (!sock) {
    logger.warn(`[WhatsApp] No active session for merchant: ${merchantId}`);
    return false;
  }

  const cleaned = phoneNumber.replace(/[^0-9]/g, "");
  if (!cleaned || cleaned.length < 7 || cleaned.length > 15) {
    logger.warn(`[WhatsApp] Invalid phone number format for merchant: ${merchantId}`);
    return false;
  }

  const jid = `${cleaned}@s.whatsapp.net`;

  const message = [
    `*MyCryptoCoin Payment Update*`,
    ``,
    `Payment ID: \`${paymentData.paymentId}\``,
    `Amount: ${paymentData.amount} ${paymentData.token}`,
    `Status: *${paymentData.status}*`,
    ``,
    `View details: https://dashboard.mycrypto.co.in/payments/${paymentData.paymentId}`,
  ].join("\n");

  try {
    await sock.sendMessage(jid, { text: message });
    return true;
  } catch (error) {
    logger.error(`[WhatsApp] Failed to send payment notification`, {
      merchantId,
      error: (error as Error).message,
    });
    return false;
  }
}

export function getSession(merchantId: string): WASocket | undefined {
  return sessions.get(merchantId);
}

export function getActiveSessionCount(): number {
  return sessions.size;
}
