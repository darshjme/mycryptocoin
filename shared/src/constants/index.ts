// ============================================
// MyCryptoCoin — Shared Constants
// ============================================

import { CryptoNetwork, TokenSymbol, TransactionStatus, PaymentStatus, WithdrawalStatus } from "../types";

// ---------- Platform ----------

export const PLATFORM_NAME = "MyCryptoCoin";
export const PLATFORM_DOMAIN = "mycrypto.co.in";
export const PLATFORM_URL = "https://mycrypto.co.in";
export const PLATFORM_FEE_RATE = 0.005; // 0.5%

// ---------- Supported Cryptos (30+) ----------

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
  // ── Native Coins ─────────────────────────────
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
  {
    network: CryptoNetwork.POLYGON,
    token: TokenSymbol.MATIC,
    name: "Polygon (MATIC)",
    decimals: 18,
    minDeposit: "0.1",
    minWithdrawal: "1",
    confirmationsRequired: 30,
    isToken: false,
  },
  {
    network: CryptoNetwork.AVALANCHE,
    token: TokenSymbol.AVAX,
    name: "Avalanche",
    decimals: 18,
    minDeposit: "0.01",
    minWithdrawal: "0.1",
    confirmationsRequired: 12,
    isToken: false,
  },
  {
    network: CryptoNetwork.POLKADOT,
    token: TokenSymbol.DOT,
    name: "Polkadot",
    decimals: 10,
    minDeposit: "0.1",
    minWithdrawal: "1",
    confirmationsRequired: 12,
    isToken: false,
  },
  {
    network: CryptoNetwork.DOGECOIN,
    token: TokenSymbol.DOGE,
    name: "Dogecoin",
    decimals: 8,
    minDeposit: "1",
    minWithdrawal: "10",
    confirmationsRequired: 6,
    isToken: false,
  },
  {
    network: CryptoNetwork.XRPL,
    token: TokenSymbol.XRP,
    name: "XRP",
    decimals: 6,
    minDeposit: "0.1",
    minWithdrawal: "1",
    confirmationsRequired: 1,
    isToken: false,
  },
  {
    network: CryptoNetwork.MONERO,
    token: TokenSymbol.XMR,
    name: "Monero",
    decimals: 12,
    minDeposit: "0.001",
    minWithdrawal: "0.01",
    confirmationsRequired: 10,
    isToken: false,
  },
  {
    network: CryptoNetwork.ZCASH,
    token: TokenSymbol.ZEC,
    name: "Zcash",
    decimals: 8,
    minDeposit: "0.001",
    minWithdrawal: "0.01",
    confirmationsRequired: 10,
    isToken: false,
  },
  {
    network: CryptoNetwork.BITCOIN_CASH,
    token: TokenSymbol.BCH,
    name: "Bitcoin Cash",
    decimals: 8,
    minDeposit: "0.001",
    minWithdrawal: "0.01",
    confirmationsRequired: 6,
    isToken: false,
  },
  {
    network: CryptoNetwork.CARDANO,
    token: TokenSymbol.ADA,
    name: "Cardano",
    decimals: 6,
    minDeposit: "1",
    minWithdrawal: "5",
    confirmationsRequired: 15,
    isToken: false,
  },

  // ── L2 / Rollup Native Tokens ────────────────
  {
    network: CryptoNetwork.ARBITRUM,
    token: TokenSymbol.ETH,
    name: "Ethereum (Arbitrum)",
    decimals: 18,
    minDeposit: "0.0001",
    minWithdrawal: "0.001",
    confirmationsRequired: 12,
    isToken: false,
  },
  {
    network: CryptoNetwork.OPTIMISM,
    token: TokenSymbol.ETH,
    name: "Ethereum (Optimism)",
    decimals: 18,
    minDeposit: "0.0001",
    minWithdrawal: "0.001",
    confirmationsRequired: 12,
    isToken: false,
  },
  {
    network: CryptoNetwork.BASE,
    token: TokenSymbol.ETH,
    name: "Ethereum (Base)",
    decimals: 18,
    minDeposit: "0.0001",
    minWithdrawal: "0.001",
    confirmationsRequired: 12,
    isToken: false,
  },

  // ── Stablecoins ──────────────────────────────
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
    network: CryptoNetwork.ETHEREUM,
    token: TokenSymbol.DAI,
    name: "Dai (ERC-20)",
    decimals: 18,
    minDeposit: "1",
    minWithdrawal: "10",
    confirmationsRequired: 12,
    isToken: true,
    contractAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
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

  // ── ERC-20 Tokens ────────────────────────────
  {
    network: CryptoNetwork.ETHEREUM,
    token: TokenSymbol.SHIB,
    name: "Shiba Inu (ERC-20)",
    decimals: 18,
    minDeposit: "100000",
    minWithdrawal: "1000000",
    confirmationsRequired: 12,
    isToken: true,
    contractAddress: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
  },
  {
    network: CryptoNetwork.ETHEREUM,
    token: TokenSymbol.PEPE,
    name: "Pepe (ERC-20)",
    decimals: 18,
    minDeposit: "1000000",
    minWithdrawal: "10000000",
    confirmationsRequired: 12,
    isToken: true,
    contractAddress: "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
  },
  {
    network: CryptoNetwork.ETHEREUM,
    token: TokenSymbol.LINK,
    name: "Chainlink (ERC-20)",
    decimals: 18,
    minDeposit: "0.1",
    minWithdrawal: "1",
    confirmationsRequired: 12,
    isToken: true,
    contractAddress: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
  },
  {
    network: CryptoNetwork.ETHEREUM,
    token: TokenSymbol.UNI,
    name: "Uniswap (ERC-20)",
    decimals: 18,
    minDeposit: "0.1",
    minWithdrawal: "1",
    confirmationsRequired: 12,
    isToken: true,
    contractAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  },
  {
    network: CryptoNetwork.ETHEREUM,
    token: TokenSymbol.AAVE,
    name: "Aave (ERC-20)",
    decimals: 18,
    minDeposit: "0.01",
    minWithdrawal: "0.1",
    confirmationsRequired: 12,
    isToken: true,
    contractAddress: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
  },

  // ── L2 Stablecoins ──────────────────────────
  {
    network: CryptoNetwork.ARBITRUM,
    token: TokenSymbol.USDC,
    name: "USDC (Arbitrum)",
    decimals: 6,
    minDeposit: "1",
    minWithdrawal: "10",
    confirmationsRequired: 12,
    isToken: true,
    contractAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  },
  {
    network: CryptoNetwork.OPTIMISM,
    token: TokenSymbol.USDC,
    name: "USDC (Optimism)",
    decimals: 6,
    minDeposit: "1",
    minWithdrawal: "10",
    confirmationsRequired: 12,
    isToken: true,
    contractAddress: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  },
  {
    network: CryptoNetwork.BASE,
    token: TokenSymbol.USDC,
    name: "USDC (Base)",
    decimals: 6,
    minDeposit: "1",
    minWithdrawal: "10",
    confirmationsRequired: 12,
    isToken: true,
    contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  {
    network: CryptoNetwork.POLYGON,
    token: TokenSymbol.USDC,
    name: "USDC (Polygon)",
    decimals: 6,
    minDeposit: "1",
    minWithdrawal: "10",
    confirmationsRequired: 30,
    isToken: true,
    contractAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  },

  // ── Lightning Network (BTC) ──────────────────
  {
    network: CryptoNetwork.LIGHTNING,
    token: TokenSymbol.BTC,
    name: "Bitcoin (Lightning)",
    decimals: 8,
    minDeposit: "0.000001",
    minWithdrawal: "0.000001",
    confirmationsRequired: 0,
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
  DOGE_ADDRESS: /^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32}$/,
  XRP_ADDRESS: /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/,
  XMR_ADDRESS: /^4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/,
  ZEC_ADDRESS: /^(t1|t3|zs)[a-zA-HJ-NP-Z0-9]{33,94}$/,
  BCH_ADDRESS: /^(bitcoincash:)?[qp][a-z0-9]{41}$/,
  ADA_ADDRESS: /^addr1[a-z0-9]{58,}$/,
  DOT_ADDRESS: /^[1-9A-HJ-NP-Za-km-z]{47,48}$/,
  AVAX_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  ARB_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  OP_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  BASE_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  LIGHTNING_INVOICE: /^ln(bc|tb)[0-9a-z]+$/i,
} as const;

// ---------- API Key ----------

export const API_KEY_PREFIX_LENGTH = 8;
export const API_KEY_LENGTH = 48;

// ---------- Currencies ----------

export const FIAT_CURRENCIES = ["USD", "EUR", "GBP", "INR", "AED", "SGD", "JPY", "AUD", "CAD", "CHF", "CNY", "KRW", "BRL", "MXN", "ZAR", "TRY", "SEK", "NOK", "DKK", "PLN", "THB", "IDR", "MYR", "PHP", "VND", "NGN", "KES", "ARS", "CLP", "COP", "PEN", "UAH", "CZK", "HUF", "ILS", "TWD", "HKD", "NZD", "RUB", "SAR", "QAR", "BHD", "KWD", "OMR", "EGP", "PKR", "BDT", "LKR"] as const;
export type FiatCurrency = (typeof FIAT_CURRENCIES)[number];

// ---------- Display Modes ----------

export const CHECKOUT_DISPLAY_MODES = ["page", "popup", "inline", "hidden"] as const;
export type CheckoutDisplayMode = (typeof CHECKOUT_DISPLAY_MODES)[number];
