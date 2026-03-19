import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useQueryClient } from '@tanstack/react-query';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://ws.mycrypto.co.in';

interface PaymentUpdateData {
  paymentId: string;
  status: string;
  amount?: number;
  crypto?: string;
  receivedAmount?: string;
  txHash?: string;
  confirmations?: number;
}

interface BalanceUpdateData {
  walletId: string;
  crypto: string;
  balance: string;
  pendingBalance: string;
}

interface WithdrawalUpdateData {
  withdrawalId: string;
  status: string;
  amount: number;
  crypto: string;
  txHash?: string;
}

interface UseWebSocketOptions {
  onPaymentUpdate?: (data: PaymentUpdateData) => void;
  onBalanceUpdate?: (data: BalanceUpdateData) => void;
  onWithdrawalUpdate?: (data: WithdrawalUpdateData) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { token, user } = useAuthStore();
  const { addNotification, addToast } = useNotificationStore();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    if (!token || !user) return;
    if (socketRef.current?.connected) return;

    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[WS] Connected to MyCryptoCoin');
      // Subscribe to merchant-specific channels
      socket.emit('subscribe:payments', user.id);
      socket.emit('subscribe:balances', user.id);
      socket.emit('subscribe:withdrawals', user.id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('[WS] Disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('[WS] Connection error:', error.message);
      setIsConnected(false);
    });

    // Payment events
    socket.on('payment:update', (data: PaymentUpdateData) => {
      optionsRef.current.onPaymentUpdate?.(data);

      if (data.status === 'confirmed') {
        addNotification({
          id: `notif-payment-${Date.now()}`,
          type: 'payment',
          title: 'Payment Confirmed',
          message: `${data.amount || data.receivedAmount} ${data.crypto} payment confirmed`,
          isRead: false,
          createdAt: new Date().toISOString(),
          link: `/payments?id=${data.paymentId}`,
        });
        addToast({
          type: 'success',
          title: 'Payment Confirmed',
          message: `${data.amount || data.receivedAmount} ${data.crypto} received`,
        });
      } else if (data.status === 'pending') {
        addNotification({
          id: `notif-payment-${Date.now()}`,
          type: 'payment',
          title: 'New Payment Detected',
          message: `${data.amount || data.receivedAmount} ${data.crypto} payment pending (${data.confirmations || 0} confirmations)`,
          isRead: false,
          createdAt: new Date().toISOString(),
          link: `/payments?id=${data.paymentId}`,
        });
      } else if (data.status === 'failed') {
        addToast({
          type: 'error',
          title: 'Payment Failed',
          message: `Payment ${data.paymentId} has failed`,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    // Balance events
    socket.on('balance:update', (data: BalanceUpdateData) => {
      optionsRef.current.onBalanceUpdate?.(data);
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    });

    // Withdrawal events
    socket.on('withdrawal:update', (data: WithdrawalUpdateData) => {
      optionsRef.current.onWithdrawalUpdate?.(data);

      if (data.status === 'completed') {
        addNotification({
          id: `notif-withdrawal-${Date.now()}`,
          type: 'withdrawal',
          title: 'Withdrawal Complete',
          message: `${data.amount} ${data.crypto} sent successfully`,
          isRead: false,
          createdAt: new Date().toISOString(),
          link: `/withdrawals`,
        });
        addToast({
          type: 'success',
          title: 'Withdrawal Complete',
          message: `${data.amount} ${data.crypto} sent successfully`,
        });
      } else if (data.status === 'failed') {
        addToast({
          type: 'error',
          title: 'Withdrawal Failed',
          message: `Withdrawal of ${data.amount} ${data.crypto} failed`,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
    });

    socketRef.current = socket;
  }, [token, user, addNotification, addToast, queryClient]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
    emit,
  };
}
