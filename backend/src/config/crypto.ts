import { CryptoNetwork, TokenSymbol } from '@mycryptocoin/shared';

// Re-export shared types
export { CryptoNetwork, TokenSymbol };

/**
 * Backward-compatible CryptoSymbol enum.
 * Legacy code (crypto.service, wallet.service, etc.) uses CryptoSymbol.BTC style.
 * Maps to CryptoKey internally.
 */
export enum CryptoSymbol {
  BTC = 'BITCOIN:BTC',
  ETH = 'ETHEREUM:ETH',
  USDT_ERC20 = 'ETHEREUM:USDT',
  USDC_ERC20 = 'ETHEREUM:USDC',
  USDT_TRC20 = 'TRON:USDT',
  TRX = 'TRON:TRX',
  BNB = 'BSC:BNB',
  SOL = 'SOLANA:SOL',
  MATIC = 'POLYGON:MATIC',
  LTC = 'LITECOIN:LTC',
  DOGE = 'DOGECOIN:DOGE',
  XRP = 'XRPL:XRP',
}

export interface CryptoConfig {
  network: CryptoNetwork;
  token: TokenSymbol;
  name: string;
  chainId?: number;
  isToken: boolean;
  tokenContract?: string;
  decimals: number;
  minDeposit: string;
  minWithdrawal: string;
  confirmationsRequired: number;
  averageBlockTime: number; // seconds
  derivationPath: string;
  addressRegex: RegExp;
  explorerUrl: string;
  explorerTxUrl: string;
}

/**
 * Unique key for a supported crypto (network + token combination).
 * Using string template literals to support tokens on multiple networks
 * (e.g. USDT on Ethereum vs USDT on TRON).
 */
export type CryptoKey =
  | 'BITCOIN:BTC'
  | 'ETHEREUM:ETH'
  | 'ETHEREUM:USDT'
  | 'ETHEREUM:USDC'
  | 'TRON:TRX'
  | 'TRON:USDT'
  | 'SOLANA:SOL'
  | 'LITECOIN:LTC'
  | 'BSC:BNB';

export function cryptoKey(network: CryptoNetwork, token: TokenSymbol): CryptoKey {
  return `${network}:${token}` as CryptoKey;
}

export const SUPPORTED_CRYPTOS: Record<string, CryptoConfig> = {
  'BITCOIN:BTC': {
    network: CryptoNetwork.BITCOIN,
    token: TokenSymbol.BTC,
    name: 'Bitcoin',
    isToken: false,
    decimals: 8,
    minDeposit: '0.00001',
    minWithdrawal: '0.0001',
    confirmationsRequired: 3,
    averageBlockTime: 600,
    derivationPath: "m/84'/0'/0'/0",
    addressRegex: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
    explorerUrl: 'https://blockstream.info',
    explorerTxUrl: 'https://blockstream.info/tx/',
  },
  'ETHEREUM:ETH': {
    network: CryptoNetwork.ETHEREUM,
    token: TokenSymbol.ETH,
    name: 'Ethereum',
    chainId: 1,
    isToken: false,
    decimals: 18,
    minDeposit: '0.0001',
    minWithdrawal: '0.001',
    confirmationsRequired: 12,
    averageBlockTime: 12,
    derivationPath: "m/44'/60'/0'/0",
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
    explorerUrl: 'https://etherscan.io',
    explorerTxUrl: 'https://etherscan.io/tx/',
  },
  'ETHEREUM:USDT': {
    network: CryptoNetwork.ETHEREUM,
    token: TokenSymbol.USDT,
    name: 'Tether (ERC-20)',
    chainId: 1,
    isToken: true,
    tokenContract: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
    minDeposit: '1',
    minWithdrawal: '10',
    confirmationsRequired: 12,
    averageBlockTime: 12,
    derivationPath: "m/44'/60'/0'/0",
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
    explorerUrl: 'https://etherscan.io',
    explorerTxUrl: 'https://etherscan.io/tx/',
  },
  'ETHEREUM:USDC': {
    network: CryptoNetwork.ETHEREUM,
    token: TokenSymbol.USDC,
    name: 'USD Coin (ERC-20)',
    chainId: 1,
    isToken: true,
    tokenContract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6,
    minDeposit: '1',
    minWithdrawal: '10',
    confirmationsRequired: 12,
    averageBlockTime: 12,
    derivationPath: "m/44'/60'/0'/0",
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
    explorerUrl: 'https://etherscan.io',
    explorerTxUrl: 'https://etherscan.io/tx/',
  },
  'SOLANA:SOL': {
    network: CryptoNetwork.SOLANA,
    token: TokenSymbol.SOL,
    name: 'Solana',
    isToken: false,
    decimals: 9,
    minDeposit: '0.001',
    minWithdrawal: '0.01',
    confirmationsRequired: 1,
    averageBlockTime: 0.4,
    derivationPath: "m/44'/501'/0'/0'",
    addressRegex: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    explorerUrl: 'https://solscan.io',
    explorerTxUrl: 'https://solscan.io/tx/',
  },
  'TRON:TRX': {
    network: CryptoNetwork.TRON,
    token: TokenSymbol.TRX,
    name: 'TRON',
    isToken: false,
    decimals: 6,
    minDeposit: '1',
    minWithdrawal: '10',
    confirmationsRequired: 20,
    averageBlockTime: 3,
    derivationPath: "m/44'/195'/0'/0",
    addressRegex: /^T[a-zA-HJ-NP-Z0-9]{33}$/,
    explorerUrl: 'https://tronscan.org',
    explorerTxUrl: 'https://tronscan.org/#/transaction/',
  },
  'TRON:USDT': {
    network: CryptoNetwork.TRON,
    token: TokenSymbol.USDT,
    name: 'Tether (TRC-20)',
    isToken: true,
    tokenContract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    decimals: 6,
    minDeposit: '1',
    minWithdrawal: '10',
    confirmationsRequired: 20,
    averageBlockTime: 3,
    derivationPath: "m/44'/195'/0'/0",
    addressRegex: /^T[a-zA-HJ-NP-Z0-9]{33}$/,
    explorerUrl: 'https://tronscan.org',
    explorerTxUrl: 'https://tronscan.org/#/transaction/',
  },
  'LITECOIN:LTC': {
    network: CryptoNetwork.LITECOIN,
    token: TokenSymbol.LTC,
    name: 'Litecoin',
    isToken: false,
    decimals: 8,
    minDeposit: '0.001',
    minWithdrawal: '0.01',
    confirmationsRequired: 6,
    averageBlockTime: 150,
    derivationPath: "m/84'/2'/0'/0",
    addressRegex: /^(ltc1|[LM3])[a-zA-HJ-NP-Z0-9]{25,62}$/,
    explorerUrl: 'https://blockchair.com/litecoin',
    explorerTxUrl: 'https://blockchair.com/litecoin/transaction/',
  },
  'BSC:BNB': {
    network: CryptoNetwork.BSC,
    token: TokenSymbol.BNB,
    name: 'BNB (BSC)',
    chainId: 56,
    isToken: false,
    decimals: 18,
    minDeposit: '0.001',
    minWithdrawal: '0.01',
    confirmationsRequired: 15,
    averageBlockTime: 3,
    derivationPath: "m/44'/60'/0'/0",
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
    explorerUrl: 'https://bscscan.com',
    explorerTxUrl: 'https://bscscan.com/tx/',
  },
};

export function getCryptoConfig(network: CryptoNetwork, token: TokenSymbol): CryptoConfig {
  const key = cryptoKey(network, token);
  const config = SUPPORTED_CRYPTOS[key];
  if (!config) {
    throw new Error(`Unsupported cryptocurrency: ${network}:${token}`);
  }
  return config;
}

export function isSupportedCrypto(network: string, token: string): boolean {
  const key = `${network}:${token}` as CryptoKey;
  return key in SUPPORTED_CRYPTOS;
}

export function getAllSupportedCryptos(): CryptoConfig[] {
  return Object.values(SUPPORTED_CRYPTOS);
}
