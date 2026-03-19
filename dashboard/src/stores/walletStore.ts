import { create } from 'zustand';
import type {
  WalletBalance as SharedWalletBalance,
  CryptoNetwork,
  TokenSymbol,
} from '@mycryptocoin/shared';

/**
 * Dashboard WalletBalance extends the shared type with UI-specific fields.
 */
export interface WalletBalance extends SharedWalletBalance {
  /** Total received in string decimal form */
  totalReceived: string;
  /** Total withdrawn in string decimal form */
  totalWithdrawn: string;
  /** Deposit address for this wallet */
  address?: string;
}

export interface AutoWithdrawConfig {
  network: CryptoNetwork;
  token: TokenSymbol;
  enabled: boolean;
  destinationAddress: string;
  threshold: string;
  lastTriggered?: string;
}

interface WalletState {
  wallets: WalletBalance[];
  autoWithdrawConfigs: AutoWithdrawConfig[];
  isLoading: boolean;
  selectedToken: TokenSymbol | null;

  setWallets: (wallets: WalletBalance[]) => void;
  setAutoWithdrawConfigs: (configs: AutoWithdrawConfig[]) => void;
  setLoading: (loading: boolean) => void;
  setSelectedToken: (token: TokenSymbol | null) => void;
  updateAutoWithdraw: (network: CryptoNetwork, token: TokenSymbol, config: Partial<AutoWithdrawConfig>) => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallets: [],
  autoWithdrawConfigs: [],
  isLoading: false,
  selectedToken: null,

  setWallets: (wallets) => set({ wallets }),

  setAutoWithdrawConfigs: (autoWithdrawConfigs) => set({ autoWithdrawConfigs }),

  setLoading: (isLoading) => set({ isLoading }),

  setSelectedToken: (selectedToken) => set({ selectedToken }),

  updateAutoWithdraw: (network, token, config) =>
    set((state) => ({
      autoWithdrawConfigs: state.autoWithdrawConfigs.map((c) =>
        c.network === network && c.token === token ? { ...c, ...config } : c
      ),
    })),
}));
