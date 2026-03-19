import { endpoints } from './endpoints';
import {
  isAdminMockMode,
  ADMIN_USER,
  ADMIN_DEMO_CREDENTIALS,
  DEMO_MERCHANTS,
  ADMIN_STATS,
  ADMIN_SYSTEM_HEALTH,
  ADMIN_WHATSAPP_STATUS,
  ADMIN_REVENUE,
  ADMIN_TRANSACTIONS,
  ADMIN_PAYMENTS,
  ADMIN_WITHDRAWALS,
  ADMIN_FRAUD_ALERTS,
  ADMIN_COMPLIANCE_QUEUE,
  ADMIN_AUDIT_LOGS,
} from './mockData';

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

class AdminApiClient {
  private baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('admin_token');
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
    }
  }

  private clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    }
  }

  private buildUrl(url: string, params?: Record<string, string | number | boolean | undefined>): string {
    if (!params) return url;
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  // ── Mock data resolver ──────────────────────────────────────────────────
  private getMockResponse<T>(url: string, method: string, body?: unknown): ApiResponse<T> {
    // Auth endpoints
    if (url.includes('/auth/login')) {
      return { success: true, data: { requiresOtp: true, tempToken: 'mock-temp-token' } as unknown as T };
    }
    if (url.includes('/auth/verify-2fa')) {
      this.setToken('mock-admin-token-001');
      localStorage.setItem('admin_user', JSON.stringify(ADMIN_USER));
      return { success: true, data: { token: 'mock-admin-token-001', user: ADMIN_USER } as unknown as T };
    }
    if (url.includes('/auth/logout')) {
      return { success: true, data: { message: 'Logged out' } as unknown as T };
    }
    if (url.includes('/auth/me')) {
      return { success: true, data: ADMIN_USER as unknown as T };
    }

    // Dashboard
    if (url.includes('/dashboard/stats')) {
      return { success: true, data: ADMIN_STATS as unknown as T };
    }
    if (url.includes('/dashboard/health')) {
      return { success: true, data: ADMIN_SYSTEM_HEALTH as unknown as T };
    }
    if (url.includes('/dashboard/revenue')) {
      return { success: true, data: ADMIN_REVENUE as unknown as T };
    }
    if (url.includes('/dashboard/volume')) {
      return { success: true, data: ADMIN_REVENUE.revenueByPeriod as unknown as T };
    }
    if (url.includes('/dashboard/recent-activity')) {
      return { success: true, data: ADMIN_AUDIT_LOGS.slice(0, 5) as unknown as T };
    }

    // Merchants
    if (url.match(/\/merchants\/[a-z_0-9]+\/(transactions|wallets|api-keys|activity-log)/)) {
      return { success: true, data: [] as unknown as T };
    }
    if (url.match(/\/merchants\/[a-z_0-9]+\/(approve|suspend|activate)/)) {
      return { success: true, data: { message: 'Updated' } as unknown as T };
    }
    if (url.match(/\/merchants\/[a-z_0-9]+$/)) {
      const id = url.split('/merchants/')[1]?.split('?')[0];
      const merchant = DEMO_MERCHANTS.find((m) => m.id === id) || DEMO_MERCHANTS[0];
      return { success: true, data: merchant as unknown as T };
    }
    if (url.includes('/merchants')) {
      return { success: true, data: DEMO_MERCHANTS as unknown as T, pagination: { page: 1, limit: 20, total: DEMO_MERCHANTS.length, totalPages: 1 } };
    }

    // Transactions
    if (url.match(/\/transactions\/[a-z_0-9]+$/)) {
      const id = url.split('/transactions/')[1]?.split('?')[0];
      return { success: true, data: (ADMIN_TRANSACTIONS.find((t) => t.id === id) || ADMIN_TRANSACTIONS[0]) as unknown as T };
    }
    if (url.includes('/transactions')) {
      return { success: true, data: ADMIN_TRANSACTIONS as unknown as T, pagination: { page: 1, limit: 20, total: ADMIN_TRANSACTIONS.length, totalPages: 1 } };
    }

    // Payments
    if (url.match(/\/payments\/[a-z_0-9]+$/)) {
      const id = url.split('/payments/')[1]?.split('?')[0];
      return { success: true, data: (ADMIN_PAYMENTS.find((p) => p.id === id) || ADMIN_PAYMENTS[0]) as unknown as T };
    }
    if (url.includes('/payments')) {
      return { success: true, data: ADMIN_PAYMENTS as unknown as T, pagination: { page: 1, limit: 20, total: ADMIN_PAYMENTS.length, totalPages: 1 } };
    }

    // Withdrawals
    if (url.match(/\/withdrawals\/[a-z_0-9]+\/(approve|reject)/)) {
      return { success: true, data: { message: 'Updated' } as unknown as T };
    }
    if (url.match(/\/withdrawals\/[a-z_0-9]+$/)) {
      const id = url.split('/withdrawals/')[1]?.split('?')[0];
      return { success: true, data: (ADMIN_WITHDRAWALS.find((w) => w.id === id) || ADMIN_WITHDRAWALS[0]) as unknown as T };
    }
    if (url.includes('/withdrawals/pending') || url.includes('/withdrawals/history')) {
      return { success: true, data: ADMIN_WITHDRAWALS as unknown as T, pagination: { page: 1, limit: 20, total: ADMIN_WITHDRAWALS.length, totalPages: 1 } };
    }
    if (url.includes('/withdrawals')) {
      return { success: true, data: ADMIN_WITHDRAWALS as unknown as T, pagination: { page: 1, limit: 20, total: ADMIN_WITHDRAWALS.length, totalPages: 1 } };
    }

    // Revenue
    if (url.includes('/revenue')) {
      return { success: true, data: ADMIN_REVENUE as unknown as T };
    }

    // WhatsApp
    if (url.includes('/whatsapp/status')) {
      return { success: true, data: ADMIN_WHATSAPP_STATUS as unknown as T };
    }
    if (url.includes('/whatsapp/messages')) {
      return { success: true, data: [] as unknown as T };
    }
    if (url.includes('/whatsapp')) {
      return { success: true, data: { message: 'OK' } as unknown as T };
    }

    // Security / Fraud / Compliance / Audit
    if (url.includes('/fraud/alerts/counts')) {
      return { success: true, data: { open: 2, investigating: 1, resolved: 2 } as unknown as T };
    }
    if (url.includes('/fraud/alerts')) {
      return { success: true, data: ADMIN_FRAUD_ALERTS as unknown as T };
    }
    if (url.includes('/fraud/rules')) {
      return { success: true, data: [] as unknown as T };
    }
    if (url.includes('/compliance/merchants')) {
      return { success: true, data: ADMIN_COMPLIANCE_QUEUE as unknown as T };
    }
    if (url.includes('/audit-log')) {
      return { success: true, data: ADMIN_AUDIT_LOGS as unknown as T, pagination: { page: 1, limit: 20, total: ADMIN_AUDIT_LOGS.length, totalPages: 1 } };
    }
    if (url.includes('/emergency/status')) {
      return { success: true, data: { globalFrozen: false, maintenanceMode: false, frozenCryptos: [], frozenMerchants: [] } as unknown as T };
    }
    if (url.includes('/proof-of-reserves')) {
      return { success: true, data: { totalLiabilities: '$15,234,567', totalReserves: '$15,892,340', ratio: 1.043 } as unknown as T };
    }
    if (url.includes('/reconciliation')) {
      return { success: true, data: { lastRun: new Date().toISOString(), discrepancies: 0, status: 'CLEAN' } as unknown as T };
    }
    if (url.includes('/wallets/hot-cold')) {
      return { success: true, data: [] as unknown as T };
    }
    if (url.includes('/sessions')) {
      return { success: true, data: [] as unknown as T };
    }
    if (url.includes('/login-history')) {
      return { success: true, data: ADMIN_AUDIT_LOGS.filter(l => l.action === 'LOGIN') as unknown as T };
    }
    if (url.includes('/ip-whitelist')) {
      return { success: true, data: [{ id: 'ip_001', ip: '192.168.1.100', label: 'Office', createdAt: '2026-01-01' }] as unknown as T };
    }

    // Settings
    if (url.includes('/settings')) {
      return { success: true, data: { feeRate: 0.005, minWithdrawals: { BTC: '0.001', ETH: '0.01', USDT: '10', SOL: '1', BNB: '0.1' }, maintenanceMode: false, notifications: { emailEnabled: true, whatsappEnabled: true, slackWebhook: '' } } as unknown as T };
    }

    // Fallback
    return { success: true, data: {} as T, message: 'Mock fallback' };
  }

  async request<T>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { method = 'GET', body, params, headers = {}, signal } = options;

    // ── Mock mode: return seed data immediately ───────────────────────────
    if (isAdminMockMode()) {
      await new Promise((r) => setTimeout(r, 150)); // simulate latency
      return this.getMockResponse<T>(url, method, body);
    }

    // ── Real mode ─────────────────────────────────────────────────────────
    const token = this.getToken();
    const finalHeaders: Record<string, string> = {
      ...this.baseHeaders,
      ...headers,
    };

    if (token) {
      finalHeaders['Authorization'] = `Bearer ${token}`;
    }

    const finalUrl = this.buildUrl(url, params);

    try {
      const response = await fetch(finalUrl, {
        method,
        headers: finalHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal,
      });

      if (response.status === 401) {
        this.clearToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      throw error;
    }
  }

  async get<T>(url: string, params?: Record<string, string | number | boolean | undefined>, signal?: AbortSignal): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET', params, signal });
  }

  async post<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'POST', body });
  }

  async put<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'PUT', body });
  }

  async patch<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'PATCH', body });
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE' });
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.post<{ requiresOtp: boolean; tempToken: string }>(
      endpoints.auth.login,
      { email, password }
    );
    if (response.data.tempToken) {
      this.setToken(response.data.tempToken);
    }
    return response;
  }

  async verify2FA(otp: string) {
    const response = await this.post<{ token: string; user: AdminUser }>(
      endpoints.auth.verify2FA,
      { otp }
    );
    if (response.data.token) {
      this.setToken(response.data.token);
      localStorage.setItem('admin_user', JSON.stringify(response.data.user));
    }
    return response;
  }

  async logout() {
    try {
      await this.post(endpoints.auth.logout);
    } finally {
      this.clearToken();
    }
  }

  async getMe() {
    return this.get<AdminUser>(endpoints.auth.me);
  }
}

import type {
  UserRole,
  PaymentStatus,
  TransactionStatus,
  WithdrawalStatus,
  CryptoNetwork,
  TokenSymbol,
} from '@mycryptocoin/shared';

/**
 * Admin-facing user. Uses the shared UserRole enum.
 */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  lastLoginAt: string;
}

/**
 * Admin-facing Merchant view. Aligned with shared Merchant interface
 * plus aggregated read-only stats.
 */
export interface Merchant {
  id: string;
  userId: string;
  businessName: string;
  businessUrl?: string;
  email: string;
  isActive: boolean;
  totalVolume: number;
  totalTransactions: number;
  createdAt: string;
  updatedAt: string;
  apiKeyCount: number;
}

/**
 * Admin-facing Transaction view. Status values match shared TransactionStatus enum.
 */
export interface Transaction {
  id: string;
  paymentId?: string;
  withdrawalId?: string;
  walletId: string;
  merchantId: string;
  merchantName: string;
  network: CryptoNetwork;
  token: TokenSymbol;
  amount: string;
  txHash?: string;
  status: TransactionStatus;
  confirmations: number;
  requiredConfirmations: number;
  createdAt: string;
  confirmedAt?: string;
}

/**
 * Admin-facing Payment view. Status values match shared PaymentStatus enum.
 */
export interface Payment {
  id: string;
  merchantId: string;
  merchantName: string;
  externalId?: string;
  network: CryptoNetwork;
  token: TokenSymbol;
  requestedAmount: string;
  requestedCurrency: string;
  cryptoAmount: string;
  receivedAmount: string;
  status: PaymentStatus;
  depositAddress: string;
  createdAt: string;
  expiresAt: string;
  paidAt?: string;
}

/**
 * Admin-facing Withdrawal view. Status values match shared WithdrawalStatus enum.
 */
export interface Withdrawal {
  id: string;
  merchantId: string;
  merchantName: string;
  network: CryptoNetwork;
  token: TokenSymbol;
  amount: string;
  fee: string;
  netAmount: string;
  toAddress: string;
  status: WithdrawalStatus;
  txHash?: string;
  reviewedBy?: string;
  reviewNote?: string;
  processedAt?: string;
  createdAt: string;
}

export interface WhatsAppStatus {
  connected: boolean;
  status: 'connected' | 'disconnected' | 'connecting' | 'qr_pending';
  pairedNumber?: string;
  lastSeen?: string;
  qrCode?: string;
  messagesSentToday: number;
}

export interface SystemHealth {
  api: { status: 'healthy' | 'degraded' | 'down'; latency: number };
  blockchain: {
    btc: { status: 'healthy' | 'degraded' | 'down'; blockHeight: number; lastSync: string };
    eth: { status: 'healthy' | 'degraded' | 'down'; blockHeight: number; lastSync: string };
    usdt: { status: 'healthy' | 'degraded' | 'down'; lastSync: string };
    sol: { status: 'healthy' | 'degraded' | 'down'; blockHeight: number; lastSync: string };
    trx: { status: 'healthy' | 'degraded' | 'down'; blockHeight: number; lastSync: string };
    ltc: { status: 'healthy' | 'degraded' | 'down'; blockHeight: number; lastSync: string };
    bnb: { status: 'healthy' | 'degraded' | 'down'; blockHeight: number; lastSync: string };
  };
  whatsapp: { status: 'connected' | 'disconnected' | 'connecting' };
  database: { status: 'healthy' | 'degraded' | 'down'; connections: number };
  redis: { status: 'healthy' | 'degraded' | 'down'; memoryUsage: string };
}

export interface AdminDashboardStats {
  totalMerchants: number;
  activeMerchants: number;
  pendingMerchants: number;
  volume24h: string;
  volume7d: string;
  volume30d: string;
  feesEarned24h: string;
  feesEarned7d: string;
  feesEarned30d: string;
  activePayments: number;
  pendingWithdrawals: number;
  totalTransactions: number;
}

/** @deprecated Use AdminDashboardStats instead */
export type DashboardStats = AdminDashboardStats;

export interface RevenueSummary {
  totalRevenue: string;
  revenueByCrypto: Array<{ network: CryptoNetwork; token: TokenSymbol; amount: string; percentage: number }>;
  revenueByPeriod: Array<{ date: string; amount: string }>;
  topMerchants: Array<{ id: string; name: string; volume: string; fees: string }>;
}

export interface SystemSettings {
  feeRate: number;
  minWithdrawals: Record<string, string>;
  maintenanceMode: boolean;
  notifications: {
    emailEnabled: boolean;
    whatsappEnabled: boolean;
    slackWebhook: string;
  };
}

export const api = new AdminApiClient();
export default api;
