// ============================================
// MyCryptoCoin — Shared TypeScript Interfaces
// ============================================

// ---------- Enums ----------

export enum CryptoNetwork {
  BITCOIN = "BITCOIN",
  ETHEREUM = "ETHEREUM",
  SOLANA = "SOLANA",
  TRON = "TRON",
  LITECOIN = "LITECOIN",
  BSC = "BSC",
}

export enum TokenSymbol {
  BTC = "BTC",
  ETH = "ETH",
  SOL = "SOL",
  LTC = "LTC",
  USDT = "USDT",
  USDC = "USDC",
  TRX = "TRX",
  BNB = "BNB",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  CONFIRMING = "CONFIRMING",
  CONFIRMED = "CONFIRMED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export enum PaymentStatus {
  AWAITING_PAYMENT = "AWAITING_PAYMENT",
  UNDERPAID = "UNDERPAID",
  PAID = "PAID",
  OVERPAID = "OVERPAID",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export enum WithdrawalStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REJECTED = "REJECTED",
}

export enum UserRole {
  MERCHANT = "MERCHANT",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export enum KycStatus {
  NOT_STARTED = "NOT_STARTED",
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

export enum WebhookEvent {
  PAYMENT_CREATED = "payment.created",
  PAYMENT_CONFIRMING = "payment.confirming",
  PAYMENT_CONFIRMED = "payment.confirmed",
  PAYMENT_COMPLETED = "payment.completed",
  PAYMENT_EXPIRED = "payment.expired",
  PAYMENT_FAILED = "payment.failed",
  WITHDRAWAL_INITIATED = "withdrawal.initiated",
  WITHDRAWAL_COMPLETED = "withdrawal.completed",
  WITHDRAWAL_FAILED = "withdrawal.failed",
}

// ---------- Core Interfaces ----------

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  kycStatus: KycStatus;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Merchant {
  id: string;
  userId: string;
  businessName: string;
  businessUrl?: string;
  logoUrl?: string;
  callbackUrl?: string;
  webhookSecret: string;
  isActive: boolean;
  dailyVolumeLimit: number;
  monthlyVolumeLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  id: string;
  merchantId: string;
  keyHash: string;
  label: string;
  prefix: string;
  permissions: string[];
  isActive: boolean;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface Wallet {
  id: string;
  merchantId: string;
  network: CryptoNetwork;
  token: TokenSymbol;
  balance: string;
  pendingBalance: string;
  totalReceived: string;
  totalWithdrawn: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CryptoAddress {
  id: string;
  walletId: string;
  paymentId?: string;
  network: CryptoNetwork;
  address: string;
  derivationPath?: string;
  derivationIndex?: number;
  isUsed: boolean;
  createdAt: Date;
}

export interface Payment {
  id: string;
  merchantId: string;
  externalId?: string;
  network: CryptoNetwork;
  token: TokenSymbol;
  requestedAmount: string;
  requestedCurrency: string;
  cryptoAmount: string;
  receivedAmount: string;
  exchangeRate: string;
  fee: string;
  feeRate: string;
  status: PaymentStatus;
  depositAddress: string;
  customerEmail?: string;
  metadata?: Record<string, unknown>;
  callbackUrl?: string;
  expiresAt: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  paymentId?: string;
  withdrawalId?: string;
  walletId: string;
  network: CryptoNetwork;
  token: TokenSymbol;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  fee: string;
  confirmations: number;
  requiredConfirmations: number;
  status: TransactionStatus;
  blockNumber?: number;
  blockHash?: string;
  rawData?: Record<string, unknown>;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Withdrawal {
  id: string;
  merchantId: string;
  walletId: string;
  network: CryptoNetwork;
  token: TokenSymbol;
  amount: string;
  fee: string;
  netAmount: string;
  toAddress: string;
  txHash?: string;
  status: WithdrawalStatus;
  reviewedBy?: string;
  reviewNote?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhatsAppSession {
  id: string;
  merchantId: string;
  phoneNumber: string;
  sessionData?: Record<string, unknown>;
  isConnected: boolean;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OtpCode {
  id: string;
  userId: string;
  code: string;
  purpose: "LOGIN" | "WITHDRAWAL" | "EMAIL_VERIFY" | "PASSWORD_RESET";
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export interface WebhookEndpoint {
  id: string;
  merchantId: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookLog {
  id: string;
  endpointId: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
  responseStatus?: number;
  responseBody?: string;
  attempts: number;
  nextRetryAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId?: string;
  merchantId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

export interface FeeRecord {
  id: string;
  paymentId: string;
  merchantId: string;
  network: CryptoNetwork;
  token: TokenSymbol;
  grossAmount: string;
  feeRate: string;
  feeAmount: string;
  netAmount: string;
  settledAt?: Date;
  createdAt: Date;
}

// ---------- API Request / Response ----------

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface CreatePaymentRequest {
  network: CryptoNetwork;
  token: TokenSymbol;
  amount: string;
  currency: string;
  externalId?: string;
  customerEmail?: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface CreatePaymentResponse {
  paymentId: string;
  depositAddress: string;
  cryptoAmount: string;
  exchangeRate: string;
  fee: string;
  expiresAt: string;
  qrCodeDataUrl: string;
}

export interface CreateWithdrawalRequest {
  walletId: string;
  amount: string;
  toAddress: string;
  otpCode: string;
}

export interface DashboardStats {
  totalVolume: string;
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  totalFees: string;
  walletBalances: WalletBalance[];
}

export interface WalletBalance {
  network: CryptoNetwork;
  token: TokenSymbol;
  balance: string;
  pendingBalance: string;
  usdValue: string;
}

// ---------- WebSocket Events ----------

export interface WsPaymentUpdate {
  event: "payment:update";
  paymentId: string;
  status: PaymentStatus;
  receivedAmount?: string;
  txHash?: string;
  confirmations?: number;
}

export interface WsBalanceUpdate {
  event: "balance:update";
  walletId: string;
  balance: string;
  pendingBalance: string;
}

export interface WsWhatsAppMessage {
  event: "whatsapp:message";
  sessionId: string;
  from: string;
  body: string;
  timestamp: number;
}
