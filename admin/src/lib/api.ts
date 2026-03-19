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

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'viewer';
  avatar?: string;
  lastLogin: string;
}

export interface Merchant {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  status: 'active' | 'suspended' | 'pending';
  totalVolume: number;
  totalTransactions: number;
  joinedAt: string;
  lastActive: string;
  businessType: string;
  apiKeyCount: number;
}

export interface Transaction {
  id: string;
  merchantId: string;
  merchantName: string;
  type: 'payment' | 'withdrawal' | 'deposit';
  crypto: string;
  amount: number;
  amountUsd: number;
  status: 'pending' | 'confirmed' | 'completed' | 'failed' | 'expired';
  txHash?: string;
  createdAt: string;
  confirmedAt?: string;
}

export interface Payment {
  id: string;
  merchantId: string;
  merchantName: string;
  orderId: string;
  crypto: string;
  amount: number;
  amountUsd: number;
  status: 'awaiting_payment' | 'confirming' | 'confirmed' | 'completed' | 'expired' | 'failed';
  walletAddress: string;
  confirmations: number;
  requiredConfirmations: number;
  createdAt: string;
  expiresAt: string;
}

export interface Withdrawal {
  id: string;
  merchantId: string;
  merchantName: string;
  crypto: string;
  amount: number;
  amountUsd: number;
  fee: number;
  destinationAddress: string;
  status: 'pending_approval' | 'approved' | 'processing' | 'completed' | 'failed' | 'rejected';
  txHash?: string;
  requestedAt: string;
  processedAt?: string;
  adminNote?: string;
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
  };
  whatsapp: { status: 'connected' | 'disconnected' | 'connecting' };
  database: { status: 'healthy' | 'degraded' | 'down'; connections: number };
  redis: { status: 'healthy' | 'degraded' | 'down'; memoryUsage: string };
}

export interface DashboardStats {
  totalMerchants: number;
  activeMerchants: number;
  pendingMerchants: number;
  volume24h: number;
  volume7d: number;
  volume30d: number;
  feesEarned24h: number;
  feesEarned7d: number;
  feesEarned30d: number;
  activePayments: number;
  pendingWithdrawals: number;
  totalTransactions: number;
}

export interface RevenueSummary {
  totalRevenue: number;
  revenueByCrypto: Array<{ crypto: string; amount: number; percentage: number }>;
  revenueByPeriod: Array<{ date: string; amount: number }>;
  topMerchants: Array<{ id: string; name: string; volume: number; fees: number }>;
}

export interface SystemSettings {
  feePercentage: number;
  minWithdrawals: Record<string, number>;
  maintenanceMode: boolean;
  notifications: {
    emailEnabled: boolean;
    whatsappEnabled: boolean;
    slackWebhook: string;
  };
}

export const api = new AdminApiClient();
export default api;
