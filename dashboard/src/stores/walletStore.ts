import { create } from 'zustand';

export interface WalletBalance {
  crypto: string;
  symbol: string;
  balance: number;
  balanceUsd: number;
  totalReceived: number;
  totalWithdrawn: number;
  pending: number;
  pendingUsd: number;
  address: string;
}

export interface AutoWithdrawConfig {
  crypto: string;
  enabled: boolean;
  destinationAddress: string;
  threshold: number;
  lastTriggered?: string;
}

interface WalletState {
  wallets: WalletBalance[];
  autoWithdrawConfigs: AutoWithdrawConfig[];
  isLoading: boolean;
  selectedCrypto: string | null;

  setWallets: (wallets: WalletBalance[]) => void;
  setAutoWithdrawConfigs: (configs: AutoWithdrawConfig[]) => void;
  setLoading: (loading: boolean) => void;
  setSelectedCrypto: (crypto: string | null) => void;
  updateAutoWithdraw: (crypto: string, config: Partial<AutoWithdrawConfig>) => void;
  getTotalBalanceUsd: () => number;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallets: [],
  autoWithdrawConfigs: [],
  isLoading: false,
  selectedCrypto: null,

  setWallets: (wallets) => set({ wallets }),

  setAutoWithdrawConfigs: (autoWithdrawConfigs) => set({ autoWithdrawConfigs }),

  setLoading: (isLoading) => set({ isLoading }),

  setSelectedCrypto: (selectedCrypto) => set({ selectedCrypto }),

  updateAutoWithdraw: (crypto, config) =>
    set((state) => ({
      autoWithdrawConfigs: state.autoWithdrawConfigs.map((c) =>
        c.crypto === crypto ? { ...c, ...config } : c
      ),
    })),

  getTotalBalanceUsd: () => {
    const { wallets } = get();
    return wallets.reduce((sum, w) => sum + w.balanceUsd, 0);
  },
}));
