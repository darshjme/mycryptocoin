import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import { useWalletStore, WalletBalance, AutoWithdrawConfig } from '@/stores/walletStore';
import { useNotificationStore } from '@/stores/notificationStore';

interface WithdrawPayload {
  crypto: string;
  amount: number;
  destinationAddress: string;
  otp: string;
}

export function useWallets() {
  const queryClient = useQueryClient();
  const { setWallets } = useWalletStore();
  const { addToast } = useNotificationStore();

  const walletsQuery = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const { data } = await api.get<WalletBalance[]>(ENDPOINTS.WALLETS.LIST);
      setWallets(data);
      return data;
    },
    staleTime: 30 * 1000,
  });

  const withdrawMutation = useMutation({
    mutationFn: async (payload: WithdrawPayload) => {
      const { data } = await api.post(ENDPOINTS.WALLETS.WITHDRAW(payload.crypto), payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      addToast({
        type: 'success',
        title: 'Withdrawal initiated',
        message: 'Your withdrawal is being processed',
      });
    },
    onError: (error: Error) => {
      addToast({ type: 'error', title: 'Withdrawal failed', message: error.message });
    },
  });

  const setAutoWithdrawMutation = useMutation({
    mutationFn: async ({
      crypto,
      config,
    }: {
      crypto: string;
      config: Partial<AutoWithdrawConfig>;
    }) => {
      const { data } = await api.put(ENDPOINTS.WALLETS.SET_AUTO_WITHDRAW(crypto), config);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets', 'auto-withdraw'] });
      addToast({ type: 'success', title: 'Auto-withdraw config updated' });
    },
    onError: (error: Error) => {
      addToast({ type: 'error', title: 'Failed to update config', message: error.message });
    },
  });

  return {
    wallets: walletsQuery.data || [],
    isLoading: walletsQuery.isLoading,
    isError: walletsQuery.isError,
    refetch: walletsQuery.refetch,
    withdraw: withdrawMutation.mutateAsync,
    isWithdrawing: withdrawMutation.isPending,
    setAutoWithdraw: setAutoWithdrawMutation.mutateAsync,
    isSettingAutoWithdraw: setAutoWithdrawMutation.isPending,
  };
}
