const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/admin';

export const endpoints = {
  // Auth
  auth: {
    login: `${API_BASE}/auth/login`,
    verify2FA: `${API_BASE}/auth/verify-2fa`,
    logout: `${API_BASE}/auth/logout`,
    me: `${API_BASE}/auth/me`,
    refresh: `${API_BASE}/auth/refresh`,
  },

  // Dashboard
  dashboard: {
    stats: `${API_BASE}/dashboard/stats`,
    volume: `${API_BASE}/dashboard/volume`,
    revenue: `${API_BASE}/dashboard/revenue`,
    health: `${API_BASE}/dashboard/health`,
    recentActivity: `${API_BASE}/dashboard/recent-activity`,
  },

  // Merchants
  merchants: {
    list: `${API_BASE}/merchants`,
    detail: (id: string) => `${API_BASE}/merchants/${id}`,
    approve: (id: string) => `${API_BASE}/merchants/${id}/approve`,
    suspend: (id: string) => `${API_BASE}/merchants/${id}/suspend`,
    activate: (id: string) => `${API_BASE}/merchants/${id}/activate`,
    transactions: (id: string) => `${API_BASE}/merchants/${id}/transactions`,
    wallets: (id: string) => `${API_BASE}/merchants/${id}/wallets`,
    apiKeys: (id: string) => `${API_BASE}/merchants/${id}/api-keys`,
    activityLog: (id: string) => `${API_BASE}/merchants/${id}/activity-log`,
  },

  // Transactions
  transactions: {
    list: `${API_BASE}/transactions`,
    detail: (id: string) => `${API_BASE}/transactions/${id}`,
    export: `${API_BASE}/transactions/export`,
  },

  // Payments
  payments: {
    list: `${API_BASE}/payments`,
    detail: (id: string) => `${API_BASE}/payments/${id}`,
  },

  // Withdrawals
  withdrawals: {
    list: `${API_BASE}/withdrawals`,
    detail: (id: string) => `${API_BASE}/withdrawals/${id}`,
    approve: (id: string) => `${API_BASE}/withdrawals/${id}/approve`,
    reject: (id: string) => `${API_BASE}/withdrawals/${id}/reject`,
  },

  // Revenue
  revenue: {
    summary: `${API_BASE}/revenue/summary`,
    byCrypto: `${API_BASE}/revenue/by-crypto`,
    byPeriod: `${API_BASE}/revenue/by-period`,
    topMerchants: `${API_BASE}/revenue/top-merchants`,
    chart: `${API_BASE}/revenue/chart`,
  },

  // WhatsApp
  whatsapp: {
    status: `${API_BASE}/whatsapp/status`,
    qr: `${API_BASE}/whatsapp/qr`,
    pair: `${API_BASE}/whatsapp/pair`,
    disconnect: `${API_BASE}/whatsapp/disconnect`,
    reconnect: `${API_BASE}/whatsapp/reconnect`,
    sendTest: `${API_BASE}/whatsapp/send-test`,
    messages: `${API_BASE}/whatsapp/messages`,
  },

  // Settings
  settings: {
    general: `${API_BASE}/settings`,
    fees: `${API_BASE}/settings/fees`,
    withdrawalLimits: `${API_BASE}/settings/withdrawal-limits`,
    maintenance: `${API_BASE}/settings/maintenance`,
    notifications: `${API_BASE}/settings/notifications`,
  },

  // Security & Admin Controls
  security: {
    settings: `${API_BASE}/security/settings`,
    settingsUpdate: `${API_BASE}/security/settings`,
    auditLog: `${API_BASE}/security/audit-log`,
    auditExport: `${API_BASE}/security/audit-log/export`,
    emergencyStatus: `${API_BASE}/security/emergency/status`,
    freezeGlobal: `${API_BASE}/security/emergency/freeze-global`,
    freezeMerchant: (id: string) => `${API_BASE}/security/emergency/freeze-merchant/${id}`,
    freezeCrypto: (symbol: string) => `${API_BASE}/security/emergency/freeze-crypto/${symbol}`,
    maintenance: `${API_BASE}/security/emergency/maintenance`,
    reconciliation: `${API_BASE}/security/reconciliation`,
    reconciliationRun: `${API_BASE}/security/reconciliation/run`,
    proofOfReserves: `${API_BASE}/security/proof-of-reserves`,
    walletsHotCold: `${API_BASE}/security/wallets/hot-cold`,
    walletsSweep: `${API_BASE}/security/wallets/sweep`,
    complianceMerchants: `${API_BASE}/security/compliance/merchants`,
    complianceMerchant: (id: string) => `${API_BASE}/security/compliance/merchants/${id}`,
    fraudAlerts: `${API_BASE}/security/fraud/alerts`,
    fraudAlertCounts: `${API_BASE}/security/fraud/alerts/counts`,
    fraudAlert: (id: string) => `${API_BASE}/security/fraud/alerts/${id}`,
    fraudRules: `${API_BASE}/security/fraud/rules`,
    withdrawalsPending: `${API_BASE}/security/withdrawals/pending`,
    withdrawalsHistory: `${API_BASE}/security/withdrawals/history`,
    withdrawalApprove: (id: string) => `${API_BASE}/security/withdrawals/${id}/approve`,
    withdrawalReject: (id: string) => `${API_BASE}/security/withdrawals/${id}/reject`,
    sessions: `${API_BASE}/security/sessions`,
    sessionDelete: (id: string) => `${API_BASE}/security/sessions/${id}`,
    loginHistory: `${API_BASE}/security/login-history`,
    ipWhitelist: `${API_BASE}/security/ip-whitelist`,
    ipWhitelistDelete: (id: string) => `${API_BASE}/security/ip-whitelist/${id}`,
  },
} as const;

export default endpoints;
