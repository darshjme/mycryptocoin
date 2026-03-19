import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import { useNotificationStore } from '@/stores/notificationStore';

export interface Payment {
  id: string;
  orderId: string;
  crypto: string;
  amount: number;
  amountUsd: number;
  fee: number;
  feeUsd: number;
  status: 'confirmed' | 'pending' | 'failed' | 'expired';
  senderAddress: string;
  receiverAddress: string;
  txHash: string;
  confirmations: number;
  requiredConfirmations: number;
  createdAt: string;
  confirmedAt?: string;
  metadata?: Record<string, string>;
}

interface PaymentsResponse {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaymentFilters {
  page?: number;
  limit?: number;
  crypto?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  search?: string;
}

export function usePayments(filters: PaymentFilters = {}) {
  const queryClient = useQueryClient();
  const { addToast } = useNotificationStore();

  const paymentsQuery = useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          params.append(key, String(value));
        }
      });
      const { data } = await api.get<PaymentsResponse>(
        `${ENDPOINTS.PAYMENTS.LIST}?${params.toString()}`
      );
      return data;
    },
    staleTime: 30 * 1000,
  });

  const paymentDetailQuery = (id: string) =>
    useQuery({
      queryKey: ['payment', id],
      queryFn: async () => {
        const { data } = await api.get<Payment>(ENDPOINTS.PAYMENTS.DETAIL(id));
        return data;
      },
      enabled: !!id,
    });

  const createPaymentLinkMutation = useMutation({
    mutationFn: async (payload: {
      amount: number;
      crypto: string;
      orderId: string;
      callbackUrl?: string;
      metadata?: Record<string, string>;
    }) => {
      const { data } = await api.post(ENDPOINTS.PAYMENTS.CREATE, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      addToast({ type: 'success', title: 'Payment link created' });
    },
    onError: (error: Error) => {
      addToast({ type: 'error', title: 'Failed to create payment', message: error.message });
    },
  });

  return {
    payments: paymentsQuery.data?.payments || [],
    total: paymentsQuery.data?.total || 0,
    totalPages: paymentsQuery.data?.totalPages || 1,
    isLoading: paymentsQuery.isLoading,
    isError: paymentsQuery.isError,
    refetch: paymentsQuery.refetch,
    getPaymentDetail: paymentDetailQuery,
    createPayment: createPaymentLinkMutation.mutateAsync,
    isCreating: createPaymentLinkMutation.isPending,
  };
}
