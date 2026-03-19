import { endpoints } from './endpoints';

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

  async request<T>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { method = 'GET', body, params, headers = {}, signal } = options;
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
