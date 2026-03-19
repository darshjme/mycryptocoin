// ============================================
// MyCryptoCoin — Shared Constants
// ============================================

import { CryptoNetwork, TokenSymbol, TransactionStatus, PaymentStatus, WithdrawalStatus } from "../types";

// ---------- Platform ----------

export const PLATFORM_NAME = "MyCryptoCoin";
export const PLATFORM_DOMAIN = "mycrypto.co.in";
export const PLATFORM_URL = "https://mycrypto.co.in";
export const PLATFORM_FEE_RATE = 0.005; // 0.5%

// ---------- Supported Cryptos ----------

export interface SupportedCrypto {
  network: CryptoNetwork;
  token: TokenSymbol;
  name: string;
  decimals: number;
  minDeposit: string;
  minWithdrawal: string;
  confirmationsRequired: number;
  isToken: boolean;
  contractAddress?: string;
}

export const SUPPORTED_CRYPTOS: SupportedCrypto[] = [
  {
    network: CryptoNetwork.BITCOIN,
    token: TokenSymbol.BTC,
    name: "Bitcoin",
    decimals: 8,
    minDeposit: "0.00001",
    minWithdrawal: "0.0001",
    confirmationsRequired: 3,
    isToken: false,
  },
  {
    network: CryptoNetwork.ETHEREUM,
    token: TokenSymbol.ETH,
    name: "Ethereum",
    decimals: 18,
    minDeposit: "0.0001",
    minWithdrawal: "0.001",
    confirmationsRequired: 12,
    isToken: false,
  },
  {
    network: CryptoNetwork.ETHEREUM,
    token: TokenSymbol.USDT,
    name: "Tether (ERC-20)",
    decimals: 6,
    minDeposit: "1",
    minWithdrawal: "10",
    confirmationsRequired: 12,
    isToken: true,
    contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  },
  {
    network: CryptoNetwork.ETHEREUM,
    token: TokenSymbol.USDC,
    name: "USD Coin (ERC-20)",
    decimals: 6,
    minDeposit: "1",
    minWithdrawal: "10",
    confirmationsRequired: 12,
    isToken: true,
    contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  },
  {
    network: CryptoNetwork.SOLANA,
    token: TokenSymbol.SOL,
    name: "Solana",
    decimals: 9,
    minDeposit: "0.001",
    minWithdrawal: "0.01",
    confirmationsRequired: 1,
    isToken: false,
  },
  {
    network: CryptoNetwork.TRON,
    token: TokenSymbol.TRX,
    name: "TRON",
    decimals: 6,
    minDeposit: "1",
    minWithdrawal: "10",
    confirmationsRequired: 20,
    isToken: false,
  },
  {
    network: CryptoNetwork.TRON,
    token: TokenSymbol.USDT,
    name: "Tether (TRC-20)",
    decimals: 6,
    minDeposit: "1",
    minWithdrawal: "10",
    confirmationsRequired: 20,
    isToken: true,
    contractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  },
  {
    network: CryptoNetwork.LITECOIN,
    token: TokenSymbol.LTC,
    name: "Litecoin",
    decimals: 8,
    minDeposit: "0.001",
    minWithdrawal: "0.01",
    confirmationsRequired: 6,
    isToken: false,
  },
  {
    network: CryptoNetwork.BSC,
    token: TokenSymbol.BNB,
    name: "BNB (BSC)",
    decimals: 18,
    minDeposit: "0.001",
    minWithdrawal: "0.01",
    confirmationsRequired: 15,
    isToken: false,
  },
];

// ---------- Status Lists ----------

export const ACTIVE_TRANSACTION_STATUSES: TransactionStatus[] = [
  TransactionStatus.PENDING,
  TransactionStatus.CONFIRMING,
];

export const TERMINAL_TRANSACTION_STATUSES: TransactionStatus[] = [
  TransactionStatus.COMPLETED,
  TransactionStatus.FAILED,
  TransactionStatus.EXPIRED,
  TransactionStatus.CANCELLED,
  TransactionStatus.REFUNDED,
];

export const ACTIVE_PAYMENT_STATUSES: PaymentStatus[] = [
  PaymentStatus.AWAITING_PAYMENT,
  PaymentStatus.UNDERPAID,
];

export const TERMINAL_PAYMENT_STATUSES: PaymentStatus[] = [
  PaymentStatus.PAID,
  PaymentStatus.OVERPAID,
  PaymentStatus.EXPIRED,
  PaymentStatus.CANCELLED,
  PaymentStatus.REFUNDED,
];

export const ACTIVE_WITHDRAWAL_STATUSES: WithdrawalStatus[] = [
  WithdrawalStatus.PENDING,
  WithdrawalStatus.PROCESSING,
];

// ---------- Timing ----------

export const PAYMENT_EXPIRY_MINUTES = 30;
export const OTP_EXPIRY_MINUTES = 5;
export const SESSION_EXPIRY_DAYS = 7;
export const REFRESH_TOKEN_EXPIRY_DAYS = 30;
export const WEBHOOK_TIMEOUT_MS = 10_000;
export const WEBHOOK_MAX_RETRIES = 5;

// ---------- Rate Limits ----------

export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = 100;
export const RATE_LIMIT_AUTH_WINDOW_MS = 15 * 60 * 1000;
export const RATE_LIMIT_AUTH_MAX_REQUESTS = 10;

// ---------- Pagination ----------

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ---------- Regex Patterns ----------

export const REGEX = {
  BTC_ADDRESS: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
  ETH_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  SOL_ADDRESS: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  TRX_ADDRESS: /^T[a-zA-HJ-NP-Z0-9]{33}$/,
  LTC_ADDRESS: /^(ltc1|[LM3])[a-zA-HJ-NP-Z0-9]{25,62}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const;

// ---------- API Key ----------

export const API_KEY_PREFIX_LENGTH = 8;
export const API_KEY_LENGTH = 48;

// ---------- Currencies ----------

export const FIAT_CURRENCIES = ["USD", "EUR", "GBP", "INR", "AED", "SGD", "JPY", "AUD", "CAD"] as const;
export type FiatCurrency = (typeof FIAT_CURRENCIES)[number];
