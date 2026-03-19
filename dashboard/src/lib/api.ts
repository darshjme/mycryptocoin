import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import {
  isMockMode,
  DEMO_USER,
  DEMO_WALLETS,
  DEMO_TRANSACTIONS,
  DEMO_PAYMENTS,
  DEMO_WITHDRAWALS,
  DEMO_API_KEYS,
  DEMO_WEBHOOKS,
  DEMO_DASHBOARD_STATS,
  DEMO_ACTIVITY,
  DEMO_CREDENTIALS,
} from './mockData';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mycrypto.co.in/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Mock interceptor ────────────────────────────────────────────────────────
// When in mock mode, intercept ALL outgoing requests and return seed data
// so the dashboard works fully without a backend.
if (typeof window !== 'undefined' && isMockMode()) {
  api.interceptors.request.use((config) => {
    const url = config.url || '';
    const method = (config.method || 'get').toUpperCase();

    // Determine mock response based on URL pattern
    let mockData: unknown = { message: 'OK' };
    let statusCode = 200;

    // Auth
    if (url.includes('/auth/login')) {
      mockData = {
        user: {
          id: DEMO_USER.id,
          email: DEMO_USER.email,
          role: DEMO_USER.role,
          businessName: DEMO_USER.businessName,
          businessUrl: DEMO_USER.businessUrl,
          logoUrl: DEMO_USER.logoUrl,
          isEmailVerified: DEMO_USER.isEmailVerified,
          twoFactorEnabled: DEMO_USER.twoFactorEnabled,
          kycStatus: DEMO_USER.kycStatus,
          lastLoginAt: DEMO_USER.lastLoginAt,
          createdAt: DEMO_USER.createdAt,
        },
        accessToken: 'mock-access-token-demo-001',
        refreshToken: 'mock-refresh-token-demo-001',
      };
    } else if (url.includes('/auth/refresh-token')) {
      mockData = { accessToken: 'mock-access-token-refreshed', refreshToken: 'mock-refresh-token-refreshed' };
    } else if (url.includes('/auth/logout')) {
      mockData = { message: 'Logged out' };
    } else if (url.includes('/auth/register')) {
      mockData = {
        user: {
          id: DEMO_USER.id,
          email: DEMO_USER.email,
          role: DEMO_USER.role,
          businessName: DEMO_USER.businessName,
          businessUrl: DEMO_USER.businessUrl,
          logoUrl: DEMO_USER.logoUrl,
          isEmailVerified: false,
          twoFactorEnabled: false,
          kycStatus: 'PENDING',
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        accessToken: 'mock-access-token-new',
        refreshToken: 'mock-refresh-token-new',
      };
    }
    // Merchant profile
    else if (url.includes('/merchant/profile')) {
      if (method === 'GET') {
        mockData = {
          id: DEMO_USER.id,
          email: DEMO_USER.email,
          role: DEMO_USER.role,
          businessName: DEMO_USER.businessName,
          businessUrl: DEMO_USER.businessUrl,
          logoUrl: DEMO_USER.logoUrl,
          isEmailVerified: DEMO_USER.isEmailVerified,
          twoFactorEnabled: DEMO_USER.twoFactorEnabled,
          kycStatus: DEMO_USER.kycStatus,
          lastLoginAt: DEMO_USER.lastLoginAt,
          createdAt: DEMO_USER.createdAt,
        };
      } else {
        mockData = { message: 'Profile updated' };
      }
    }
    // API Keys
    else if (url.includes('/merchant/api-keys')) {
      if (method === 'GET') {
        mockData = DEMO_API_KEYS;
      } else if (method === 'POST') {
        mockData = { id: 'key_new', name: 'New Key', prefix: 'mcc_live_Xx1Y', secret: 'mcc_live_Xx1Y_sk_DEMO_SECRET_KEY_12345', createdAt: new Date().toISOString(), lastUsed: null, status: 'active' };
      } else {
        mockData = { message: 'API key deleted' };
      }
    }
    // Wallets
    else if (url.includes('/wallets')) {
      if (url.match(/\/wallets\/[A-Z]+\/auto-withdraw/)) {
        mockData = { message: 'Auto-withdraw settings updated' };
      } else if (url.match(/\/wallets\/[A-Z]+\/withdraw/)) {
        mockData = { message: 'Withdrawal initiated', withdrawalId: 'wd_new_001' };
      } else if (url.match(/\/wallets\/[A-Z]+$/)) {
        const crypto = url.split('/wallets/')[1]?.split('/')[0];
        mockData = DEMO_WALLETS.find((w) => w.crypto === crypto) || DEMO_WALLETS[0];
      } else {
        mockData = DEMO_WALLETS;
      }
    }
    // Payments
    else if (url.includes('/payments')) {
      if (url.match(/\/payments\/[a-z_0-9]+\/verify/)) {
        mockData = { verified: true };
      } else if (url.match(/\/payments\/[a-z_0-9]+$/)) {
        const id = url.split('/payments/')[1];
        mockData = DEMO_PAYMENTS.find((p) => p.id === id) || DEMO_PAYMENTS[0];
      } else if (method === 'POST') {
        mockData = { id: 'pay_new_001', status: 'AWAITING_PAYMENT', depositAddress: 'bc1q_new_mock_address', expiresAt: new Date(Date.now() + 3600000).toISOString() };
      } else {
        mockData = DEMO_PAYMENTS;
      }
    }
    // Transactions
    else if (url.includes('/transactions')) {
      mockData = DEMO_TRANSACTIONS;
    }
    // Webhooks
    else if (url.includes('/webhooks')) {
      if (method === 'GET') {
        mockData = DEMO_WEBHOOKS;
      } else if (method === 'POST') {
        mockData = { id: 'wh_new', url: 'https://example.com/webhook', events: ['payment.confirmed'], status: 'active' };
      } else {
        mockData = { message: 'Webhook updated' };
      }
    }
    // Health
    else if (url.includes('/health')) {
      mockData = { status: 'healthy', uptime: '14d 6h 32m' };
    }

    // Return a resolved promise with mock data (cancel the real request)
    const mockResponse = {
      data: mockData,
      status: statusCode,
      statusText: 'OK',
      headers: {},
      config,
    };

    return Promise.reject({
      __MOCK__: true,
      response: mockResponse,
    });
  });

  // In the response error handler, check for our mock flag and resolve instead
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.__MOCK__) {
        return Promise.resolve(error.response);
      }
      return Promise.reject(error);
    }
  );
} else {
  // ── Normal (non-mock) interceptors ──────────────────────────────────────

  // Request interceptor: attach auth token
  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = useAuthStore.getState().token;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor: handle token refresh and errors
  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Token expired — attempt refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = useAuthStore.getState().refreshToken;

        if (refreshToken) {
          try {
            const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, {
              refreshToken,
            });
            useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
            }
            return api(originalRequest);
          } catch (refreshError) {
            useAuthStore.getState().logout();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        } else {
          useAuthStore.getState().logout();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      }

      // Format error message
      const message =
        (error.response?.data as { message?: string })?.message ||
        error.message ||
        'An unexpected error occurred';

      return Promise.reject(new Error(message));
    }
  );
}

export default api;
