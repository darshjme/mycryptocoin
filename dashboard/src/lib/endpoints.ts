export const ENDPOINTS = {
  // Auth — matches backend auth.routes.ts
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY_WHATSAPP_OTP: '/auth/verify-whatsapp-otp',
    VERIFY_EMAIL: '/auth/verify-email',
    REFRESH: '/auth/refresh-token',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // Merchant profile — matches backend merchant.routes.ts
  MERCHANT: {
    PROFILE: '/merchant/profile',
    UPDATE_PROFILE: '/merchant/profile',
  },

  // Payments — matches backend payment.routes.ts
  PAYMENTS: {
    LIST: '/payments',
    DETAIL: (id: string) => `/payments/${id}`,
    CREATE: '/payments/create',
    VERIFY: (id: string) => `/payments/${id}/verify`,
  },

  // Transactions — matches backend transaction.routes.ts
  TRANSACTIONS: {
    LIST: '/transactions',
  },

  // Wallets — matches backend wallet.routes.ts
  WALLETS: {
    LIST: '/wallets',
    DETAIL: (crypto: string) => `/wallets/${crypto}`,
    SET_AUTO_WITHDRAW: (crypto: string) => `/wallets/${crypto}/auto-withdraw`,
    WITHDRAW: (crypto: string) => `/wallets/${crypto}/withdraw`,
  },

  // API Keys — matches backend merchant.routes.ts
  API_KEYS: {
    LIST: '/merchant/api-keys',
    CREATE: '/merchant/api-keys',
    DELETE: (id: string) => `/merchant/api-keys/${id}`,
  },

  // Webhooks — matches backend webhook.routes.ts
  WEBHOOKS: {
    LIST: '/webhooks',
    CREATE: '/webhooks',
    UPDATE: (id: string) => `/webhooks/${id}`,
    DELETE: (id: string) => `/webhooks/${id}`,
  },

  // Health
  HEALTH: '/health',
} as const;
