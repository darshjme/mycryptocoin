// ─────────────────────────────────────────────────────────────────────────────
// MyCryptoCoin Admin — Mock / Seed Data
// Use with MOCK_MODE (no backend required) for local testing on localhost:3002
// ─────────────────────────────────────────────────────────────────────────────

import type { AdminUser, Merchant, Transaction, Payment, Withdrawal, WhatsAppStatus, SystemHealth, AdminDashboardStats, RevenueSummary } from './api';

// ── Demo credentials ────────────────────────────────────────────────────────
export const ADMIN_DEMO_CREDENTIALS = {
  email: 'admin@mycryptocoin.com',
  password: 'admin123',
  otp: '123456',
};

// ── Authenticated admin ─────────────────────────────────────────────────────
export const ADMIN_USER: AdminUser = {
  id: 'admin_001',
  email: 'admin@mycryptocoin.com',
  name: 'System Admin',
  role: 'SUPER_ADMIN' as any,
  avatar: undefined,
  lastLoginAt: '2026-03-19T08:00:00Z',
};

// ── Helper ──────────────────────────────────────────────────────────────────
function daysAgo(n: number, hour = 12, minute = 0): string {
  const d = new Date('2026-03-19T00:00:00Z');
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
function txHash(prefix: string, i: number): string {
  const hex = '0123456789abcdef';
  let h = prefix;
  for (let j = 0; j < 56; j++) h += hex[(i * 7 + j * 13) % 16];
  return h;
}

// ── 20 Merchants ────────────────────────────────────────────────────────────
export const DEMO_MERCHANTS: Merchant[] = [
  { id: 'mrc_001', userId: 'usr_001', businessName: 'TechMart E-commerce', businessUrl: 'https://techmart.com', email: 'demo@mycryptocoin.com', isActive: true, totalVolume: 351896.42, totalTransactions: 245, createdAt: '2025-12-15T10:00:00Z', updatedAt: '2026-03-19T08:30:00Z', apiKeyCount: 2 },
  { id: 'mrc_002', userId: 'usr_002', businessName: 'ForexPro Trading', businessUrl: 'https://forexpro.io', email: 'ops@forexpro.io', isActive: true, totalVolume: 892451.00, totalTransactions: 1204, createdAt: '2025-10-01T09:00:00Z', updatedAt: '2026-03-19T07:45:00Z', apiKeyCount: 3 },
  { id: 'mrc_003', userId: 'usr_003', businessName: 'Luxury Estates Realty', businessUrl: 'https://luxuryestates.com', email: 'payments@luxuryestates.com', isActive: true, totalVolume: 2450000.00, totalTransactions: 87, createdAt: '2025-11-20T14:00:00Z', updatedAt: '2026-03-18T16:20:00Z', apiKeyCount: 1 },
  { id: 'mrc_004', userId: 'usr_004', businessName: 'SkyHigh Airlines', businessUrl: 'https://skyhigh.aero', email: 'billing@skyhigh.aero', isActive: true, totalVolume: 1567230.50, totalTransactions: 3421, createdAt: '2025-09-15T08:00:00Z', updatedAt: '2026-03-19T06:00:00Z', apiKeyCount: 4 },
  { id: 'mrc_005', userId: 'usr_005', businessName: 'GameVault Studios', businessUrl: 'https://gamevault.gg', email: 'pay@gamevault.gg', isActive: true, totalVolume: 723890.25, totalTransactions: 8934, createdAt: '2025-08-01T12:00:00Z', updatedAt: '2026-03-19T09:00:00Z', apiKeyCount: 2 },
  { id: 'mrc_006', userId: 'usr_006', businessName: 'CryptoExchange Pro', businessUrl: 'https://cexchange.pro', email: 'admin@cexchange.pro', isActive: true, totalVolume: 5234567.80, totalTransactions: 15432, createdAt: '2025-07-10T10:00:00Z', updatedAt: '2026-03-19T09:15:00Z', apiKeyCount: 5 },
  { id: 'mrc_007', userId: 'usr_007', businessName: 'NFT Gallery Deluxe', businessUrl: 'https://nftgallery.art', email: 'team@nftgallery.art', isActive: true, totalVolume: 189450.60, totalTransactions: 567, createdAt: '2026-01-05T09:00:00Z', updatedAt: '2026-03-18T20:00:00Z', apiKeyCount: 1 },
  { id: 'mrc_008', userId: 'usr_008', businessName: 'GreenEnergy Solutions', businessUrl: 'https://greenergy.co', email: 'finance@greenergy.co', isActive: false, totalVolume: 45670.00, totalTransactions: 23, createdAt: '2026-02-01T14:00:00Z', updatedAt: '2026-03-10T08:00:00Z', apiKeyCount: 1 },
  { id: 'mrc_009', userId: 'usr_009', businessName: 'Digital Academy Online', businessUrl: 'https://digiacademy.edu', email: 'billing@digiacademy.edu', isActive: true, totalVolume: 312780.00, totalTransactions: 2345, createdAt: '2025-11-10T11:00:00Z', updatedAt: '2026-03-19T05:30:00Z', apiKeyCount: 2 },
  { id: 'mrc_010', userId: 'usr_010', businessName: 'PharmaDirect', businessUrl: 'https://pharmadirect.health', email: 'pay@pharmadirect.health', isActive: true, totalVolume: 567890.30, totalTransactions: 4521, createdAt: '2025-10-20T08:00:00Z', updatedAt: '2026-03-19T07:00:00Z', apiKeyCount: 2 },
  { id: 'mrc_011', userId: 'usr_011', businessName: 'AutoParts Warehouse', businessUrl: 'https://autoparts.store', email: 'orders@autoparts.store', isActive: true, totalVolume: 234560.10, totalTransactions: 1123, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2026-03-18T18:00:00Z', apiKeyCount: 1 },
  { id: 'mrc_012', userId: 'usr_012', businessName: 'TravelBits Agency', businessUrl: 'https://travelbits.co', email: 'finance@travelbits.co', isActive: true, totalVolume: 890123.45, totalTransactions: 2890, createdAt: '2025-09-05T10:00:00Z', updatedAt: '2026-03-19T04:00:00Z', apiKeyCount: 3 },
  { id: 'mrc_013', userId: 'usr_013', businessName: 'CloudStack SaaS', businessUrl: 'https://cloudstack.dev', email: 'billing@cloudstack.dev', isActive: true, totalVolume: 456780.00, totalTransactions: 3456, createdAt: '2025-08-15T14:00:00Z', updatedAt: '2026-03-19T08:45:00Z', apiKeyCount: 4 },
  { id: 'mrc_014', userId: 'usr_014', businessName: 'FoodChain Delivery', businessUrl: 'https://foodchain.app', email: 'payments@foodchain.app', isActive: true, totalVolume: 123456.78, totalTransactions: 6789, createdAt: '2025-11-25T12:00:00Z', updatedAt: '2026-03-19T09:30:00Z', apiKeyCount: 2 },
  { id: 'mrc_015', userId: 'usr_015', businessName: 'MetaVerse Realty', businessUrl: 'https://metarealty.vr', email: 'sales@metarealty.vr', isActive: false, totalVolume: 78900.00, totalTransactions: 34, createdAt: '2026-01-20T10:00:00Z', updatedAt: '2026-02-28T12:00:00Z', apiKeyCount: 1 },
  { id: 'mrc_016', userId: 'usr_016', businessName: 'CryptoNews Media', businessUrl: 'https://cryptonews.media', email: 'subs@cryptonews.media', isActive: true, totalVolume: 67890.50, totalTransactions: 890, createdAt: '2026-01-15T08:00:00Z', updatedAt: '2026-03-19T07:15:00Z', apiKeyCount: 1 },
  { id: 'mrc_017', userId: 'usr_017', businessName: 'DeFi Insurance Co', businessUrl: 'https://defiinsure.co', email: 'premiums@defiinsure.co', isActive: true, totalVolume: 1234567.00, totalTransactions: 456, createdAt: '2025-10-10T09:00:00Z', updatedAt: '2026-03-18T22:00:00Z', apiKeyCount: 3 },
  { id: 'mrc_018', userId: 'usr_018', businessName: 'StreamPay Entertainment', businessUrl: 'https://streampay.tv', email: 'revenue@streampay.tv', isActive: true, totalVolume: 345678.90, totalTransactions: 7890, createdAt: '2025-09-20T11:00:00Z', updatedAt: '2026-03-19T06:30:00Z', apiKeyCount: 2 },
  { id: 'mrc_019', userId: 'usr_019', businessName: 'PendingMerchant LLC', businessUrl: 'https://pendingmerchant.com', email: 'new@pendingmerchant.com', isActive: false, totalVolume: 0, totalTransactions: 0, createdAt: '2026-03-18T16:00:00Z', updatedAt: '2026-03-18T16:00:00Z', apiKeyCount: 0 },
  { id: 'mrc_020', userId: 'usr_020', businessName: 'QuickBuy Marketplace', businessUrl: 'https://quickbuy.market', email: 'ops@quickbuy.market', isActive: true, totalVolume: 432100.60, totalTransactions: 5678, createdAt: '2025-11-01T10:00:00Z', updatedAt: '2026-03-19T08:00:00Z', apiKeyCount: 2 },
];

// ── Admin Dashboard Stats ───────────────────────────────────────────────────
export const ADMIN_STATS: AdminDashboardStats = {
  totalMerchants: 523,
  activeMerchants: 487,
  pendingMerchants: 12,
  volume24h: '$2,412,567.80',
  volume7d: '$18,745,230.50',
  volume30d: '$72,345,891.20',
  feesEarned24h: '$12,062.84',
  feesEarned7d: '$93,726.15',
  feesEarned30d: '$361,729.46',
  activePayments: 47,
  pendingWithdrawals: 12,
  totalTransactions: 89432,
};

// ── System Health ───────────────────────────────────────────────────────────
export const ADMIN_SYSTEM_HEALTH: SystemHealth = {
  api: { status: 'healthy', latency: 42 },
  blockchain: {
    btc: { status: 'healthy', blockHeight: 892345, lastSync: daysAgo(0, 9, 30) },
    eth: { status: 'healthy', blockHeight: 19234567, lastSync: daysAgo(0, 9, 30) },
    usdt: { status: 'healthy', lastSync: daysAgo(0, 9, 30) },
    sol: { status: 'healthy', blockHeight: 267890123, lastSync: daysAgo(0, 9, 29) },
    trx: { status: 'healthy', blockHeight: 58234567, lastSync: daysAgo(0, 9, 28) },
    ltc: { status: 'healthy', blockHeight: 2567890, lastSync: daysAgo(0, 9, 27) },
    bnb: { status: 'healthy', blockHeight: 38456789, lastSync: daysAgo(0, 9, 30) },
  },
  whatsapp: { status: 'connected' },
  database: { status: 'healthy', connections: 23 },
  redis: { status: 'healthy', memoryUsage: '156MB / 512MB' },
};

// ── WhatsApp Status ─────────────────────────────────────────────────────────
export const ADMIN_WHATSAPP_STATUS: WhatsAppStatus = {
  connected: true,
  status: 'connected',
  pairedNumber: '+1-555-0100',
  lastSeen: daysAgo(0, 9, 30),
  qrCode: undefined,
  messagesSentToday: 142,
};

// ── Revenue Summary ─────────────────────────────────────────────────────────
export const ADMIN_REVENUE: RevenueSummary = {
  totalRevenue: '$361,729.46',
  revenueByCrypto: [
    { network: 'BITCOIN' as any, token: 'BTC' as any, amount: '$173,630.14', percentage: 48 },
    { network: 'ETHEREUM' as any, token: 'ETH' as any, amount: '$65,111.30', percentage: 18 },
    { network: 'ETHEREUM' as any, token: 'USDT' as any, amount: '$47,024.83', percentage: 13 },
    { network: 'SOLANA' as any, token: 'SOL' as any, amount: '$47,024.83', percentage: 13 },
    { network: 'BSC' as any, token: 'BNB' as any, amount: '$28,938.36', percentage: 8 },
  ],
  revenueByPeriod: Array.from({ length: 30 }, (_, i) => {
    const d = new Date('2026-03-19');
    d.setDate(d.getDate() - (29 - i));
    return {
      date: d.toISOString().slice(0, 10),
      amount: `$${(8000 + Math.floor(Math.random() * 12000)).toLocaleString()}`,
    };
  }),
  topMerchants: [
    { id: 'mrc_006', name: 'CryptoExchange Pro', volume: '$5,234,567.80', fees: '$26,172.84' },
    { id: 'mrc_003', name: 'Luxury Estates Realty', volume: '$2,450,000.00', fees: '$12,250.00' },
    { id: 'mrc_004', name: 'SkyHigh Airlines', volume: '$1,567,230.50', fees: '$7,836.15' },
    { id: 'mrc_017', name: 'DeFi Insurance Co', volume: '$1,234,567.00', fees: '$6,172.84' },
    { id: 'mrc_012', name: 'TravelBits Agency', volume: '$890,123.45', fees: '$4,450.62' },
  ],
};

// ── 20 Admin Transactions ───────────────────────────────────────────────────
export const ADMIN_TRANSACTIONS: Transaction[] = [
  { id: 'atx_001', paymentId: 'pay_001', walletId: 'w_001', merchantId: 'mrc_001', merchantName: 'TechMart E-commerce', network: 'BITCOIN' as any, token: 'BTC' as any, amount: '0.52340', txHash: txHash('0x', 301), status: 'COMPLETED' as any, confirmations: 6, requiredConfirmations: 6, createdAt: daysAgo(0, 9, 15), confirmedAt: daysAgo(0, 9, 45) },
  { id: 'atx_002', paymentId: 'pay_002', walletId: 'w_002', merchantId: 'mrc_002', merchantName: 'ForexPro Trading', network: 'ETHEREUM' as any, token: 'ETH' as any, amount: '15.00000', txHash: txHash('0x', 302), status: 'COMPLETED' as any, confirmations: 35, requiredConfirmations: 12, createdAt: daysAgo(0, 8, 0), confirmedAt: daysAgo(0, 8, 8) },
  { id: 'atx_003', paymentId: 'pay_003', walletId: 'w_003', merchantId: 'mrc_004', merchantName: 'SkyHigh Airlines', network: 'ETHEREUM' as any, token: 'USDT' as any, amount: '45000.00', txHash: txHash('0x', 303), status: 'CONFIRMING' as any, confirmations: 5, requiredConfirmations: 12, createdAt: daysAgo(0, 10, 30), confirmedAt: undefined },
  { id: 'atx_004', walletId: 'w_004', merchantId: 'mrc_005', merchantName: 'GameVault Studios', network: 'SOLANA' as any, token: 'SOL' as any, amount: '250.00000', txHash: txHash('0x', 304), status: 'COMPLETED' as any, confirmations: 32, requiredConfirmations: 32, createdAt: daysAgo(0, 7, 20), confirmedAt: daysAgo(0, 7, 21) },
  { id: 'atx_005', withdrawalId: 'awd_001', walletId: 'w_005', merchantId: 'mrc_006', merchantName: 'CryptoExchange Pro', network: 'BITCOIN' as any, token: 'BTC' as any, amount: '5.00000', txHash: txHash('0x', 305), status: 'COMPLETED' as any, confirmations: 6, requiredConfirmations: 6, createdAt: daysAgo(0, 6, 0), confirmedAt: daysAgo(0, 6, 55) },
  { id: 'atx_006', paymentId: 'pay_006', walletId: 'w_006', merchantId: 'mrc_003', merchantName: 'Luxury Estates Realty', network: 'BITCOIN' as any, token: 'BTC' as any, amount: '3.50000', txHash: txHash('0x', 306), status: 'COMPLETED' as any, confirmations: 6, requiredConfirmations: 6, createdAt: daysAgo(1, 14, 0), confirmedAt: daysAgo(1, 14, 50) },
  { id: 'atx_007', paymentId: 'pay_007', walletId: 'w_007', merchantId: 'mrc_009', merchantName: 'Digital Academy Online', network: 'ETHEREUM' as any, token: 'USDT' as any, amount: '5000.00', txHash: txHash('0x', 307), status: 'COMPLETED' as any, confirmations: 12, requiredConfirmations: 12, createdAt: daysAgo(1, 11, 30), confirmedAt: daysAgo(1, 11, 42) },
  { id: 'atx_008', paymentId: 'pay_008', walletId: 'w_008', merchantId: 'mrc_010', merchantName: 'PharmaDirect', network: 'BSC' as any, token: 'BNB' as any, amount: '20.00000', txHash: txHash('0x', 308), status: 'COMPLETED' as any, confirmations: 15, requiredConfirmations: 15, createdAt: daysAgo(1, 9, 0), confirmedAt: daysAgo(1, 9, 1) },
  { id: 'atx_009', paymentId: 'pay_009', walletId: 'w_009', merchantId: 'mrc_012', merchantName: 'TravelBits Agency', network: 'ETHEREUM' as any, token: 'ETH' as any, amount: '8.50000', txHash: txHash('0x', 309), status: 'COMPLETED' as any, confirmations: 35, requiredConfirmations: 12, createdAt: daysAgo(2, 15, 0), confirmedAt: daysAgo(2, 15, 8) },
  { id: 'atx_010', paymentId: 'pay_010', walletId: 'w_010', merchantId: 'mrc_014', merchantName: 'FoodChain Delivery', network: 'SOLANA' as any, token: 'SOL' as any, amount: '50.00000', txHash: txHash('0x', 310), status: 'FAILED' as any, confirmations: 0, requiredConfirmations: 32, createdAt: daysAgo(2, 10, 0), confirmedAt: undefined },
  { id: 'atx_011', paymentId: 'pay_011', walletId: 'w_011', merchantId: 'mrc_005', merchantName: 'GameVault Studios', network: 'ETHEREUM' as any, token: 'USDT' as any, amount: '15000.00', txHash: txHash('0x', 311), status: 'COMPLETED' as any, confirmations: 12, requiredConfirmations: 12, createdAt: daysAgo(3, 8, 0), confirmedAt: daysAgo(3, 8, 12) },
  { id: 'atx_012', walletId: 'w_012', merchantId: 'mrc_013', merchantName: 'CloudStack SaaS', network: 'BITCOIN' as any, token: 'BTC' as any, amount: '0.85000', txHash: txHash('0x', 312), status: 'COMPLETED' as any, confirmations: 6, requiredConfirmations: 6, createdAt: daysAgo(3, 14, 30), confirmedAt: daysAgo(3, 15, 20) },
  { id: 'atx_013', withdrawalId: 'awd_003', walletId: 'w_013', merchantId: 'mrc_002', merchantName: 'ForexPro Trading', network: 'ETHEREUM' as any, token: 'ETH' as any, amount: '25.00000', txHash: txHash('0x', 313), status: 'COMPLETED' as any, confirmations: 12, requiredConfirmations: 12, createdAt: daysAgo(4, 10, 0), confirmedAt: daysAgo(4, 10, 12) },
  { id: 'atx_014', paymentId: 'pay_014', walletId: 'w_014', merchantId: 'mrc_016', merchantName: 'CryptoNews Media', network: 'ETHEREUM' as any, token: 'USDT' as any, amount: '2500.00', txHash: txHash('0x', 314), status: 'COMPLETED' as any, confirmations: 12, requiredConfirmations: 12, createdAt: daysAgo(5, 9, 0), confirmedAt: daysAgo(5, 9, 10) },
  { id: 'atx_015', paymentId: 'pay_015', walletId: 'w_015', merchantId: 'mrc_017', merchantName: 'DeFi Insurance Co', network: 'BITCOIN' as any, token: 'BTC' as any, amount: '2.00000', txHash: txHash('0x', 315), status: 'COMPLETED' as any, confirmations: 6, requiredConfirmations: 6, createdAt: daysAgo(5, 16, 0), confirmedAt: daysAgo(5, 16, 55) },
  { id: 'atx_016', paymentId: 'pay_016', walletId: 'w_016', merchantId: 'mrc_018', merchantName: 'StreamPay Entertainment', network: 'SOLANA' as any, token: 'SOL' as any, amount: '500.00000', txHash: txHash('0x', 316), status: 'COMPLETED' as any, confirmations: 32, requiredConfirmations: 32, createdAt: daysAgo(6, 11, 0), confirmedAt: daysAgo(6, 11, 1) },
  { id: 'atx_017', withdrawalId: 'awd_005', walletId: 'w_017', merchantId: 'mrc_004', merchantName: 'SkyHigh Airlines', network: 'ETHEREUM' as any, token: 'USDT' as any, amount: '100000.00', txHash: txHash('0x', 317), status: 'COMPLETED' as any, confirmations: 12, requiredConfirmations: 12, createdAt: daysAgo(7, 8, 0), confirmedAt: daysAgo(7, 8, 12) },
  { id: 'atx_018', paymentId: 'pay_018', walletId: 'w_018', merchantId: 'mrc_020', merchantName: 'QuickBuy Marketplace', network: 'BSC' as any, token: 'BNB' as any, amount: '35.00000', txHash: txHash('0x', 318), status: 'COMPLETED' as any, confirmations: 15, requiredConfirmations: 15, createdAt: daysAgo(8, 13, 0), confirmedAt: daysAgo(8, 13, 1) },
  { id: 'atx_019', paymentId: 'pay_019', walletId: 'w_019', merchantId: 'mrc_011', merchantName: 'AutoParts Warehouse', network: 'ETHEREUM' as any, token: 'ETH' as any, amount: '6.20000', txHash: txHash('0x', 319), status: 'COMPLETED' as any, confirmations: 35, requiredConfirmations: 12, createdAt: daysAgo(9, 10, 0), confirmedAt: daysAgo(9, 10, 8) },
  { id: 'atx_020', paymentId: 'pay_020', walletId: 'w_020', merchantId: 'mrc_007', merchantName: 'NFT Gallery Deluxe', network: 'SOLANA' as any, token: 'SOL' as any, amount: '180.00000', txHash: txHash('0x', 320), status: 'COMPLETED' as any, confirmations: 32, requiredConfirmations: 32, createdAt: daysAgo(10, 14, 0), confirmedAt: daysAgo(10, 14, 1) },
];

// ── Admin Payments ──────────────────────────────────────────────────────────
export const ADMIN_PAYMENTS: Payment[] = [
  { id: 'ap_001', merchantId: 'mrc_001', merchantName: 'TechMart E-commerce', network: 'BITCOIN' as any, token: 'BTC' as any, requestedAmount: '35860.00', requestedCurrency: 'USD', cryptoAmount: '0.52340', receivedAmount: '0.52340', status: 'COMPLETED' as any, depositAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', createdAt: daysAgo(0, 9, 15), expiresAt: daysAgo(-1, 9, 15), paidAt: daysAgo(0, 9, 45) },
  { id: 'ap_002', merchantId: 'mrc_002', merchantName: 'ForexPro Trading', network: 'ETHEREUM' as any, token: 'ETH' as any, requestedAmount: '49275.00', requestedCurrency: 'USD', cryptoAmount: '15.00000', receivedAmount: '15.00000', status: 'COMPLETED' as any, depositAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68', createdAt: daysAgo(0, 8, 0), expiresAt: daysAgo(-1, 8, 0), paidAt: daysAgo(0, 8, 8) },
  { id: 'ap_003', merchantId: 'mrc_004', merchantName: 'SkyHigh Airlines', network: 'ETHEREUM' as any, token: 'USDT' as any, requestedAmount: '45000.00', requestedCurrency: 'USD', cryptoAmount: '45000.00000', receivedAmount: '0', status: 'AWAITING_PAYMENT' as any, depositAddress: '0x8Fc2A2b4E3F0C6e5D9b7A1c3E5F7a9B2d4C6e8F0', createdAt: daysAgo(0, 10, 30), expiresAt: daysAgo(-1, 10, 30), paidAt: undefined },
  { id: 'ap_004', merchantId: 'mrc_005', merchantName: 'GameVault Studios', network: 'SOLANA' as any, token: 'SOL' as any, requestedAmount: '37500.00', requestedCurrency: 'USD', cryptoAmount: '250.00000', receivedAmount: '250.00000', status: 'COMPLETED' as any, depositAddress: '7RoSF9fUNBVFDp311TnyFz2prhP5FxXFZB7nN8EFcTT8', createdAt: daysAgo(0, 7, 20), expiresAt: daysAgo(-1, 7, 20), paidAt: daysAgo(0, 7, 21) },
  { id: 'ap_005', merchantId: 'mrc_006', merchantName: 'CryptoExchange Pro', network: 'BITCOIN' as any, token: 'BTC' as any, requestedAmount: '342750.00', requestedCurrency: 'USD', cryptoAmount: '5.00000', receivedAmount: '5.00000', status: 'COMPLETED' as any, depositAddress: 'bc1q9h5yjqka3mz2f3hp4x5ds4mfcgkr0z88g7n54v', createdAt: daysAgo(0, 6, 0), expiresAt: daysAgo(-1, 6, 0), paidAt: daysAgo(0, 6, 55) },
];

// ── Admin Withdrawals ───────────────────────────────────────────────────────
export const ADMIN_WITHDRAWALS: Withdrawal[] = [
  { id: 'awd_001', merchantId: 'mrc_006', merchantName: 'CryptoExchange Pro', network: 'BITCOIN' as any, token: 'BTC' as any, amount: '5.00000', fee: '0.00050', netAmount: '4.99950', toAddress: 'bc1q9h5yjqka3mz2f3hp4x5ds4mfcgkr0z88g7n54v', status: 'PENDING' as any, txHash: undefined, reviewedBy: undefined, reviewNote: undefined, processedAt: undefined, createdAt: daysAgo(0, 5, 0) },
  { id: 'awd_002', merchantId: 'mrc_002', merchantName: 'ForexPro Trading', network: 'ETHEREUM' as any, token: 'ETH' as any, amount: '20.00000', fee: '0.01000', netAmount: '19.99000', toAddress: '0xA1b2C3d4E5f6789012345678901234567890AbCd', status: 'PENDING' as any, txHash: undefined, reviewedBy: undefined, reviewNote: undefined, processedAt: undefined, createdAt: daysAgo(0, 4, 30) },
  { id: 'awd_003', merchantId: 'mrc_004', merchantName: 'SkyHigh Airlines', network: 'ETHEREUM' as any, token: 'USDT' as any, amount: '100000.00', fee: '20.00', netAmount: '99980.00', toAddress: '0x8Fc2A2b4E3F0C6e5D9b7A1c3E5F7a9B2d4C6e8F0', status: 'COMPLETED' as any, txHash: txHash('0x', 401), reviewedBy: 'admin_001', reviewNote: 'Approved - verified merchant', processedAt: daysAgo(1, 10, 0), createdAt: daysAgo(1, 8, 0) },
  { id: 'awd_004', merchantId: 'mrc_003', merchantName: 'Luxury Estates Realty', network: 'BITCOIN' as any, token: 'BTC' as any, amount: '10.00000', fee: '0.00100', netAmount: '9.99900', toAddress: 'bc1q9h5yjqka3mz2f3hp4x5ds4mfcgkr0z88g7n54v', status: 'COMPLETED' as any, txHash: txHash('0x', 402), reviewedBy: 'admin_001', reviewNote: 'Large withdrawal - verified', processedAt: daysAgo(2, 14, 0), createdAt: daysAgo(2, 9, 0) },
  { id: 'awd_005', merchantId: 'mrc_005', merchantName: 'GameVault Studios', network: 'SOLANA' as any, token: 'SOL' as any, amount: '500.00000', fee: '0.25000', netAmount: '499.75000', toAddress: 'So1ana7xMerchant9Wa11et4ddre55Here12345678', status: 'PROCESSING' as any, txHash: undefined, reviewedBy: 'admin_001', reviewNote: 'Approved', processedAt: undefined, createdAt: daysAgo(0, 7, 0) },
  { id: 'awd_006', merchantId: 'mrc_012', merchantName: 'TravelBits Agency', network: 'ETHEREUM' as any, token: 'USDT' as any, amount: '50000.00', fee: '10.00', netAmount: '49990.00', toAddress: '0xA1b2C3d4E5f6789012345678901234567890AbCd', status: 'PENDING' as any, txHash: undefined, reviewedBy: undefined, reviewNote: undefined, processedAt: undefined, createdAt: daysAgo(0, 3, 0) },
  { id: 'awd_007', merchantId: 'mrc_017', merchantName: 'DeFi Insurance Co', network: 'BITCOIN' as any, token: 'BTC' as any, amount: '8.00000', fee: '0.00080', netAmount: '7.99920', toAddress: 'bc1q9h5yjqka3mz2f3hp4x5ds4mfcgkr0z88g7n54v', status: 'PENDING' as any, txHash: undefined, reviewedBy: undefined, reviewNote: undefined, processedAt: undefined, createdAt: daysAgo(0, 2, 0) },
  { id: 'awd_008', merchantId: 'mrc_010', merchantName: 'PharmaDirect', network: 'BSC' as any, token: 'BNB' as any, amount: '100.00000', fee: '0.05000', netAmount: '99.95000', toAddress: '0xBb2a35Cc6634C0532925a3b844Bc9e7595f2bD68', status: 'COMPLETED' as any, txHash: txHash('0x', 408), reviewedBy: 'admin_001', reviewNote: 'OK', processedAt: daysAgo(3, 8, 0), createdAt: daysAgo(3, 6, 0) },
];

// ── Fraud Alerts ────────────────────────────────────────────────────────────
export const ADMIN_FRAUD_ALERTS = [
  { id: 'fra_001', type: 'VELOCITY', severity: 'HIGH', merchantId: 'mrc_008', merchantName: 'GreenEnergy Solutions', message: 'Unusual spike: 15 payments in 2 minutes from single IP', status: 'OPEN', createdAt: daysAgo(0, 3, 45) },
  { id: 'fra_002', type: 'AMOUNT', severity: 'MEDIUM', merchantId: 'mrc_015', merchantName: 'MetaVerse Realty', message: 'Payment amount $245,000 exceeds 95th percentile for merchant', status: 'INVESTIGATING', createdAt: daysAgo(1, 10, 0) },
  { id: 'fra_003', type: 'GEO', severity: 'LOW', merchantId: 'mrc_014', merchantName: 'FoodChain Delivery', message: 'Payments from 12 different countries in 1 hour', status: 'RESOLVED', createdAt: daysAgo(3, 14, 20) },
  { id: 'fra_004', type: 'DUST', severity: 'LOW', merchantId: 'mrc_005', merchantName: 'GameVault Studios', message: 'Multiple dust transactions detected (< $0.50)', status: 'RESOLVED', createdAt: daysAgo(5, 9, 0) },
  { id: 'fra_005', type: 'VELOCITY', severity: 'HIGH', merchantId: 'mrc_019', merchantName: 'PendingMerchant LLC', message: 'New merchant attempted 50 API calls before KYC completion', status: 'OPEN', createdAt: daysAgo(0, 16, 0) },
];

// ── Compliance Queue ────────────────────────────────────────────────────────
export const ADMIN_COMPLIANCE_QUEUE = [
  { id: 'comp_001', merchantId: 'mrc_019', merchantName: 'PendingMerchant LLC', type: 'KYC_REVIEW', status: 'PENDING', submittedAt: daysAgo(1, 16, 0), documents: ['business_license.pdf', 'id_verification.jpg'] },
  { id: 'comp_002', merchantId: 'mrc_008', merchantName: 'GreenEnergy Solutions', type: 'REACTIVATION', status: 'PENDING', submittedAt: daysAgo(2, 10, 0), documents: ['appeal_letter.pdf', 'updated_kyc.pdf'] },
  { id: 'comp_003', merchantId: 'mrc_015', merchantName: 'MetaVerse Realty', type: 'VOLUME_INCREASE', status: 'IN_REVIEW', submittedAt: daysAgo(4, 8, 0), documents: ['financials_q4.pdf'] },
];

// ── Audit Logs ──────────────────────────────────────────────────────────────
export const ADMIN_AUDIT_LOGS = [
  { id: 'aud_001', action: 'WITHDRAWAL_APPROVED', actor: 'admin_001', actorName: 'System Admin', target: 'awd_003', details: 'Approved withdrawal of 100,000 USDT for SkyHigh Airlines', ip: '192.168.1.100', createdAt: daysAgo(1, 10, 0) },
  { id: 'aud_002', action: 'MERCHANT_SUSPENDED', actor: 'admin_001', actorName: 'System Admin', target: 'mrc_008', details: 'Suspended GreenEnergy Solutions - suspicious activity', ip: '192.168.1.100', createdAt: daysAgo(9, 8, 0) },
  { id: 'aud_003', action: 'WITHDRAWAL_APPROVED', actor: 'admin_001', actorName: 'System Admin', target: 'awd_004', details: 'Approved withdrawal of 10 BTC for Luxury Estates Realty', ip: '192.168.1.100', createdAt: daysAgo(2, 14, 0) },
  { id: 'aud_004', action: 'SETTINGS_UPDATED', actor: 'admin_001', actorName: 'System Admin', target: 'system', details: 'Updated fee rate from 0.4% to 0.5%', ip: '192.168.1.100', createdAt: daysAgo(5, 14, 0) },
  { id: 'aud_005', action: 'LOGIN', actor: 'admin_001', actorName: 'System Admin', target: 'admin_001', details: 'Admin login from 192.168.1.100', ip: '192.168.1.100', createdAt: daysAgo(0, 8, 0) },
  { id: 'aud_006', action: 'FRAUD_ALERT_RESOLVED', actor: 'admin_001', actorName: 'System Admin', target: 'fra_003', details: 'Resolved geo fraud alert for FoodChain Delivery - legitimate international sales event', ip: '192.168.1.100', createdAt: daysAgo(3, 15, 0) },
  { id: 'aud_007', action: 'MERCHANT_SUSPENDED', actor: 'admin_001', actorName: 'System Admin', target: 'mrc_015', details: 'Suspended MetaVerse Realty - pending volume review', ip: '192.168.1.100', createdAt: daysAgo(19, 12, 0) },
  { id: 'aud_008', action: 'WITHDRAWAL_APPROVED', actor: 'admin_001', actorName: 'System Admin', target: 'awd_008', details: 'Approved withdrawal of 100 BNB for PharmaDirect', ip: '192.168.1.100', createdAt: daysAgo(3, 8, 0) },
  { id: 'aud_009', action: 'WHATSAPP_RECONNECTED', actor: 'admin_001', actorName: 'System Admin', target: 'system', details: 'WhatsApp service reconnected after brief disconnection', ip: '192.168.1.100', createdAt: daysAgo(7, 2, 30) },
  { id: 'aud_010', action: 'API_KEY_REVOKED', actor: 'admin_001', actorName: 'System Admin', target: 'mrc_008', details: 'Revoked API keys for GreenEnergy Solutions during suspension', ip: '192.168.1.100', createdAt: daysAgo(9, 8, 5) },
];

// ── Check if mock mode should be active ─────────────────────────────────────
export function isAdminMockMode(): boolean {
  if (typeof window === 'undefined') return false;
  return !process.env.NEXT_PUBLIC_API_URL || window.location.hostname === 'localhost';
}
