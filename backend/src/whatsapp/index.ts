import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import path from "path";

const sessions = new Map<string, WASocket>();

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
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log(`[WhatsApp] Reconnecting session: ${merchantId}`);
        createWhatsAppSession(merchantId, sessionDir);
      } else {
        console.log(`[WhatsApp] Session logged out: ${merchantId}`);
        sessions.delete(merchantId);
      }
    } else if (connection === "open") {
      console.log(`[WhatsApp] Session connected: ${merchantId}`);
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
): Promise<void> {
  const sock = sessions.get(merchantId);
  if (!sock) {
    console.warn(`[WhatsApp] No active session for merchant: ${merchantId}`);
    return;
  }

  const jid = `${phoneNumber.replace(/[^0-9]/g, "")}@s.whatsapp.net`;

  const message = [
    `*MyCryptoCoin Payment Update*`,
    ``,
    `Payment ID: \`${paymentData.paymentId}\``,
    `Amount: ${paymentData.amount} ${paymentData.token}`,
    `Status: *${paymentData.status}*`,
    ``,
    `View details: https://dashboard.mycrypto.co.in/payments/${paymentData.paymentId}`,
  ].join("\n");

  await sock.sendMessage(jid, { text: message });
}

export function getSession(merchantId: string): WASocket | undefined {
  return sessions.get(merchantId);
}

export function getAllSessions(): Map<string, WASocket> {
  return sessions;
}
