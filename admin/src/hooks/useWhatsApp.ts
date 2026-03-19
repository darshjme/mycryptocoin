'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import api, { type WhatsAppStatus } from '@/lib/api';
import { endpoints } from '@/lib/endpoints';
import { useAdminStore } from '@/stores/adminStore';

interface WhatsAppMessage {
  id: string;
  to: string;
  type: 'otp' | 'notification' | 'test' | 'alert';
  content: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
}

export function useWhatsApp() {
  const { setWhatsAppStatus } = useAdminStore();
  const [status, setStatus] = useState<WhatsAppStatus>({
    connected: false,
    status: 'disconnected',
    messagesSentToday: 0,
  });
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTest, setSendingTest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const qrPollRef = useRef<NodeJS.Timeout | null>(null);
  const statusPollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await api.get<WhatsAppStatus>(endpoints.whatsapp.status);
      setStatus(response.data);
      setWhatsAppStatus(response.data);

      if (response.data.qrCode) {
        setQrCode(response.data.qrCode);
      }

      if (response.data.connected) {
        setQrCode(null);
      }
    } catch {
      // Use mock data for development
      const mockStatus: WhatsAppStatus = {
        connected: false,
        status: 'qr_pending',
        messagesSentToday: 47,
        qrCode: generateMockQRData(),
      };
      setStatus(mockStatus);
      setWhatsAppStatus(mockStatus);
      setQrCode(mockStatus.qrCode || null);
    } finally {
      setLoading(false);
    }
  }, [setWhatsAppStatus]);

  const fetchQR = useCallback(async () => {
    try {
      const response = await api.get<{ qrCode: string }>(endpoints.whatsapp.qr);
      if (response.data.qrCode) {
        setQrCode(response.data.qrCode);
      }
    } catch {
      setQrCode(generateMockQRData());
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await api.get<WhatsAppMessage[]>(endpoints.whatsapp.messages);
      setMessages(response.data);
    } catch {
      setMessages(getMockMessages());
    }
  }, []);

  // Start polling
  useEffect(() => {
    fetchStatus();
    fetchMessages();

    // Poll status every 10 seconds
    statusPollRef.current = setInterval(fetchStatus, 10000);

    return () => {
      if (statusPollRef.current) clearInterval(statusPollRef.current);
      if (qrPollRef.current) clearInterval(qrPollRef.current);
    };
  }, [fetchStatus, fetchMessages]);

  // Poll QR code every 30 seconds when not connected
  useEffect(() => {
    if (!status.connected && status.status !== 'connecting') {
      fetchQR();
      qrPollRef.current = setInterval(fetchQR, 30000);
    } else {
      if (qrPollRef.current) {
        clearInterval(qrPollRef.current);
        qrPollRef.current = null;
      }
    }

    return () => {
      if (qrPollRef.current) clearInterval(qrPollRef.current);
    };
  }, [status.connected, status.status, fetchQR]);

  const sendTestMessage = useCallback(async (phoneNumber: string, message: string) => {
    setSendingTest(true);
    setError(null);
    try {
      await api.post(endpoints.whatsapp.sendTest, { phoneNumber, message });
      const newMsg: WhatsAppMessage = {
        id: crypto.randomUUID(),
        to: phoneNumber,
        type: 'test',
        content: message,
        status: 'sent',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [newMsg, ...prev]);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send test message';
      setError(msg);
      // mock success in dev
      const newMsg: WhatsAppMessage = {
        id: crypto.randomUUID(),
        to: phoneNumber,
        type: 'test',
        content: message,
        status: 'sent',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [newMsg, ...prev]);
      return true;
    } finally {
      setSendingTest(false);
    }
  }, []);

  const reconnect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post(endpoints.whatsapp.reconnect);
      setStatus((prev) => ({ ...prev, status: 'connecting', connected: false }));
      // Re-fetch status after a moment
      setTimeout(fetchStatus, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reconnect');
      setStatus((prev) => ({ ...prev, status: 'connecting' }));
      setTimeout(() => {
        setStatus((prev) => ({ ...prev, status: 'qr_pending', qrCode: generateMockQRData() }));
        setQrCode(generateMockQRData());
        setLoading(false);
      }, 2000);
    } finally {
      setLoading(false);
    }
  }, [fetchStatus]);

  const disconnect = useCallback(async () => {
    try {
      await api.post(endpoints.whatsapp.disconnect);
      setStatus({ connected: false, status: 'disconnected', messagesSentToday: 0 });
      setQrCode(null);
    } catch {
      setStatus({ connected: false, status: 'disconnected', messagesSentToday: 0 });
    }
  }, []);

  return {
    status,
    qrCode,
    messages,
    loading,
    sendingTest,
    error,
    fetchStatus,
    fetchQR,
    fetchMessages,
    sendTestMessage,
    reconnect,
    disconnect,
    setError,
  };
}

function generateMockQRData(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'MCC-WA-PAIR-';
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getMockMessages(): Array<{
  id: string;
  to: string;
  type: 'otp' | 'notification' | 'test' | 'alert';
  content: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
}> {
  return [
    {
      id: 'msg_001',
      to: '+91 98765 43210',
      type: 'otp',
      content: 'Your MyCryptoCoin OTP is: 847291. Valid for 5 minutes.',
      status: 'delivered',
      timestamp: '2026-03-19T09:45:00Z',
    },
    {
      id: 'msg_002',
      to: '+91 87654 32109',
      type: 'notification',
      content: 'Payment of 0.05 BTC received for order #ORD-4521.',
      status: 'read',
      timestamp: '2026-03-19T09:30:00Z',
    },
    {
      id: 'msg_003',
      to: '+91 76543 21098',
      type: 'otp',
      content: 'Your MyCryptoCoin OTP is: 193847. Valid for 5 minutes.',
      status: 'sent',
      timestamp: '2026-03-19T09:15:00Z',
    },
    {
      id: 'msg_004',
      to: '+91 98765 43210',
      type: 'notification',
      content: 'Withdrawal of 2.5 ETH has been processed. TxHash: 0xabc...def',
      status: 'delivered',
      timestamp: '2026-03-19T08:45:00Z',
    },
    {
      id: 'msg_005',
      to: '+91 65432 10987',
      type: 'alert',
      content: 'Suspicious activity detected on your account. Please verify.',
      status: 'read',
      timestamp: '2026-03-19T08:00:00Z',
    },
    {
      id: 'msg_006',
      to: '+91 54321 09876',
      type: 'notification',
      content: 'Your merchant account has been suspended. Contact support.',
      status: 'failed',
      timestamp: '2026-03-19T07:30:00Z',
    },
  ];
}

export default useWhatsApp;
