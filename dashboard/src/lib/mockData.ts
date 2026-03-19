// ─────────────────────────────────────────────────────────────────────────────
// MyCryptoCoin Dashboard — Mock / Seed Data
// Use with MOCK_MODE (no backend required) for local testing on localhost:3001
// ─────────────────────────────────────────────────────────────────────────────

// ── Demo credentials ────────────────────────────────────────────────────────
export const DEMO_CREDENTIALS = {
  merchant: {
    phone: '+1234567890',
    email: 'demo@mycryptocoin.com',
    password: 'demo123',
    otp: '123456',
  },
};

// ── Authenticated user ──────────────────────────────────────────────────────
export const DEMO_USER = {
  id: 'usr_demo_001',
  email: 'demo@mycryptocoin.com',
  phone: '+1234567890',
  businessName: 'TechMart E-commerce',
  businessType: 'ecommerce',
  businessUrl: 'https://techmart.com',
  logoUrl: null,
  role: 'MERCHANT' as const,
  kycTier: 2,
  kycStatus: 'APPROVED' as const,
  isEmailVerified: true,
  twoFactorEnabled: true,
  lastLoginAt: '2026-03-19T08:30:00Z',
  createdAt: '2025-12-15T10:00:00Z',
  avatar: null,
};

// ── Wallets ─────────────────────────────────────────────────────────────────
// Merchants have a SINGLE USDT TRC-20 settlement wallet.
// All received crypto is auto-converted to USDT at confirmation time.
export const DEMO_WALLETS = [
  {
    crypto: 'USDT',
    network: 'TRON',
    networkDisplay: 'TRC-20',
    balance: '350136.94',
    pendingBalance: '5000.00',
    totalReceived: '892451.00',
    totalWithdrawn: '537314.06',
    usdValue: 350136.94,
    depositAddress: 'TX8kR5f9bM3qJh4LnWs2TpYc7vXdZeK6Fg',
    autoWithdraw: { enabled: true, address: 'TQnLF7pVcR8kBxN3mZj6Yw4sHdX9tLfG2e', threshold: '50000' },
  },
];

// Deposit addresses for customers to pay in various cryptos (still per-crypto)
export const DEMO_DEPOSIT_ADDRESSES = [
  { crypto: 'BTC', network: 'BITCOIN', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
  { crypto: 'ETH', network: 'ETHEREUM', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68' },
  { crypto: 'USDT', network: 'TRON', address: 'TX8kR5f9bM3qJh4LnWs2TpYc7vXdZeK6Fg' },
  { crypto: 'BNB', network: 'BSC', address: '0xBb2a35Cc6634C0532925a3b844Bc9e7595f2bD68' },
  { crypto: 'SOL', network: 'SOLANA', address: '7RoSF9fUNBVFDp311TnyFz2prhP5FxXFZB7nN8EFcTT8' },
];

// ── Helper: date N days ago ─────────────────────────────────────────────────
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

// ── 50 Transactions ─────────────────────────────────────────────────────────
export const DEMO_TRANSACTIONS = [
  { id: 'tx_001', type: 'DEPOSIT', crypto: 'BTC', network: 'BITCOIN', amount: '0.52340', usdValue: 35860.12, status: 'COMPLETED', txHash: txHash('0x', 1), confirmations: 6, requiredConfirmations: 6, createdAt: daysAgo(0, 9, 15), confirmedAt: daysAgo(0, 9, 45) },
  { id: 'tx_002', type: 'DEPOSIT', crypto: 'ETH', network: 'ETHEREUM', amount: '3.20000', usdValue: 10512.00, status: 'COMPLETED', txHash: txHash('0x', 2), confirmations: 35, requiredConfirmations: 12, createdAt: daysAgo(0, 7, 30), confirmedAt: daysAgo(0, 7, 38) },
  { id: 'tx_003', type: 'DEPOSIT', crypto: 'USDT', network: 'ETHEREUM', amount: '12500.00', usdValue: 12500.00, status: 'CONFIRMING', txHash: txHash('0x', 3), confirmations: 4, requiredConfirmations: 12, createdAt: daysAgo(0, 11, 20), confirmedAt: null },
  { id: 'tx_004', type: 'WITHDRAWAL', crypto: 'BTC', network: 'BITCOIN', amount: '1.00000', usdValue: 68550.00, status: 'COMPLETED', txHash: txHash('0x', 4), confirmations: 6, requiredConfirmations: 6, createdAt: daysAgo(0, 6, 0), confirmedAt: daysAgo(0, 6, 55) },
  { id: 'tx_005', type: 'FEE', crypto: 'ETH', network: 'ETHEREUM', amount: '0.00250', usdValue: 8.21, status: 'COMPLETED', txHash: null, confirmations: 0, requiredConfirmations: 0, createdAt: daysAgo(0, 7, 38), confirmedAt: daysAgo(0, 7, 38) },
  { id: 'tx_006', type: 'DEPOSIT', crypto: 'SOL', network: 'SOLANA', amount: '85.00000', usdValue: 12750.00, status: 'COMPLETED', txHash: txHash('0x', 6), confirmations: 32, requiredConfirmations: 32, createdAt: daysAgo(1, 14, 10), confirmedAt: daysAgo(1, 14, 11) },
  { id: 'tx_007', type: 'DEPOSIT', crypto: 'BNB', network: 'BSC', amount: '12.50000', usdValue: 7500.00, status: 'COMPLETED', txHash: txHash('0x', 7), confirmations: 20, requiredConfirmations: 15, createdAt: daysAgo(1, 10, 5), confirmedAt: daysAgo(1, 10, 6) },
  { id: 'tx_008', type: 'WITHDRAWAL', crypto: 'ETH', network: 'ETHEREUM', amount: '5.00000', usdValue: 16425.00, status: 'PENDING', txHash: null, confirmations: 0, requiredConfirmations: 12, createdAt: daysAgo(1, 8, 0), confirmedAt: null },
  { id: 'tx_009', type: 'DEPOSIT', crypto: 'USDT', network: 'ETHEREUM', amount: '8200.00', usdValue: 8200.00, status: 'COMPLETED', txHash: txHash('0x', 9), confirmations: 35, requiredConfirmations: 12, createdAt: daysAgo(1, 16, 30), confirmedAt: daysAgo(1, 16, 38) },
  { id: 'tx_010', type: 'FEE', crypto: 'BTC', network: 'BITCOIN', amount: '0.00050', usdValue: 34.28, status: 'COMPLETED', txHash: null, confirmations: 0, requiredConfirmations: 0, createdAt: daysAgo(1, 14, 11), confirmedAt: daysAgo(1, 14, 11) },
  { id: 'tx_011', type: 'DEPOSIT', crypto: 'BTC', network: 'BITCOIN', amount: '0.15000', usdValue: 10282.50, status: 'PENDING', txHash: txHash('0x', 11), confirmations: 2, requiredConfirmations: 6, createdAt: daysAgo(0, 12, 45), confirmedAt: null },
  { id: 'tx_012', type: 'DEPOSIT', crypto: 'ETH', network: 'ETHEREUM', amount: '2.50000', usdValue: 8212.50, status: 'CONFIRMING', txHash: txHash('0x', 12), confirmations: 8, requiredConfirmations: 12, createdAt: daysAgo(0, 13, 30), confirmedAt: null },
  { id: 'tx_013', type: 'WITHDRAWAL', crypto: 'USDT', network: 'ETHEREUM', amount: '25000.00', usdValue: 25000.00, status: 'COMPLETED', txHash: txHash('0x', 13), confirmations: 12, requiredConfirmations: 12, createdAt: daysAgo(2, 9, 0), confirmedAt: daysAgo(2, 9, 15) },
  { id: 'tx_014', type: 'DEPOSIT', crypto: 'SOL', network: 'SOLANA', amount: '150.00000', usdValue: 22500.00, status: 'COMPLETED', txHash: txHash('0x', 14), confirmations: 32, requiredConfirmations: 32, createdAt: daysAgo(2, 11, 45), confirmedAt: daysAgo(2, 11, 46) },
  { id: 'tx_015', type: 'DEPOSIT', crypto: 'BTC', network: 'BITCOIN', amount: '0.75000', usdValue: 51412.50, status: 'COMPLETED', txHash: txHash('0x', 15), confirmations: 6, requiredConfirmations: 6, createdAt: daysAgo(2, 15, 20), confirmedAt: daysAgo(2, 16, 15) },
  { id: 'tx_016', type: 'DEPOSIT', crypto: 'ETH', network: 'ETHEREUM', amount: '4.80000', usdValue: 15768.00, status: 'COMPLETED', txHash: txHash('0x', 16), confirmations: 35, requiredConfirmations: 12, createdAt: daysAgo(3, 8, 10), confirmedAt: daysAgo(3, 8, 18) },
  { id: 'tx_017', type: 'FEE', crypto: 'SOL', network: 'SOLANA', amount: '0.15000', usdValue: 22.50, status: 'COMPLETED', txHash: null, confirmations: 0, requiredConfirmations: 0, createdAt: daysAgo(3, 11, 46), confirmedAt: daysAgo(3, 11, 46) },
  { id: 'tx_018', type: 'WITHDRAWAL', crypto: 'BNB', network: 'BSC', amount: '20.00000', usdValue: 12000.00, status: 'COMPLETED', txHash: txHash('0x', 18), confirmations: 15, requiredConfirmations: 15, createdAt: daysAgo(3, 14, 0), confirmedAt: daysAgo(3, 14, 5) },
  { id: 'tx_019', type: 'DEPOSIT', crypto: 'USDT', network: 'ETHEREUM', amount: '5000.00', usdValue: 5000.00, status: 'COMPLETED', txHash: txHash('0x', 19), confirmations: 12, requiredConfirmations: 12, createdAt: daysAgo(3, 17, 50), confirmedAt: daysAgo(3, 18, 0) },
  { id: 'tx_020', type: 'DEPOSIT', crypto: 'BTC', network: 'BITCOIN', amount: '0.32100', usdValue: 22004.55, status: 'COMPLETED', txHash: txHash('0x', 20), confirmations: 6, requiredConfirmations: 6, createdAt: daysAgo(4, 9, 30), confirmedAt: daysAgo(4, 10, 25) },
  { id: 'tx_021', type: 'DEPOSIT', crypto: 'SOL', network: 'SOLANA', amount: '200.00000', usdValue: 30000.00, status: 'FAILED', txHash: txHash('0x', 21), confirmations: 0, requiredConfirmations: 32, createdAt: daysAgo(4, 12, 15), confirmedAt: null },
  { id: 'tx_022', type: 'WITHDRAWAL', crypto: 'ETH', network: 'ETHEREUM', amount: '10.00000', usdValue: 32850.00, status: 'COMPLETED', txHash: txHash('0x', 22), confirmations: 12, requiredConfirmations: 12, createdAt: daysAgo(5, 8, 0), confirmedAt: daysAgo(5, 8, 10) },
  { id: 'tx_023', type: 'DEPOSIT', crypto: 'BNB', network: 'BSC', amount: '8.40000', usdValue: 5040.00, status: 'COMPLETED', txHash: txHash('0x', 23), confirmations: 15, requiredConfirmations: 15, createdAt: daysAgo(5, 10, 30), confirmedAt: daysAgo(5, 10, 31) },
  { id: 'tx_024', type: 'FEE', crypto: 'USDT', network: 'ETHEREUM', amount: '25.00', usdValue: 25.00, status: 'COMPLETED', txHash: null, confirmations: 0, requiredConfirmations: 0, createdAt: daysAgo(5, 10, 31), confirmedAt: daysAgo(5, 10, 31) },
  { id: 'tx_025', type: 'DEPOSIT', crypto: 'USDT', network: 'ETHEREUM', amount: '15000.00', usdValue: 15000.00, status: 'COMPLETED', txHash: txHash('0x', 25), confirmations: 12, requiredConfirmations: 12, createdAt: daysAgo(5, 14, 45), confirmedAt: daysAgo(5, 14, 55) },
  { id: 'tx_026', type: 'DEPOSIT', crypto: 'BTC', network: 'BITCOIN', amount: '1.20000', usdValue: 82260.00, status: 'COMPLETED', txHash: txHash('0x', 26), confirmations: 6, requiredConfirmations: 6, createdAt: daysAgo(6, 7, 0), confirmedAt: daysAgo(6, 7, 55) },
  { id: 'tx_027', type: 'WITHDRAWAL', crypto: 'SOL', network: 'SOLANA', amount: '100.00000', usdValue: 15000.00, status: 'COMPLETED', txHash: txHash('0x', 27), confirmations: 32, requiredConfirmations: 32, createdAt: daysAgo(6, 10, 0), confirmedAt: daysAgo(6, 10, 1) },
  { id: 'tx_028', type: 'DEPOSIT', crypto: 'ETH', network: 'ETHEREUM', amount: '7.50000', usdValue: 24637.50, status: 'COMPLETED', txHash: txHash('0x', 28), confirmations: 35, requiredConfirmations: 12, createdAt: daysAgo(7, 9, 20), confirmedAt: daysAgo(7, 9, 28) },
  { id: 'tx_029', type: 'FEE', crypto: 'BNB', network: 'BSC', amount: '0.08400', usdValue: 50.40, status: 'COMPLETED', txHash: null, confirmations: 0, requiredConfirmations: 0, createdAt: daysAgo(7, 10, 0), confirmedAt: daysAgo(7, 10, 0) },
  { id: 'tx_030', type: 'DEPOSIT', crypto: 'USDT', network: 'ETHEREUM', amount: '20000.00', usdValue: 20000.00, status: 'COMPLETED', txHash: txHash('0x', 30), confirmations: 12, requiredConfirmations: 12, createdAt: daysAgo(8, 11, 0), confirmedAt: daysAgo(8, 11, 12) },
  { id: 'tx_031', type: 'DEPOSIT', crypto: 'BTC', network: 'BITCOIN', amount: '0.08500', usdValue: 5826.75, status: 'COMPLETED', txHash: txHash('0x', 31), confirmations: 6, requiredConfirmations: 6, createdAt: daysAgo(9, 8, 40), confirmedAt: daysAgo(9, 9, 35) },
  { id: 'tx_032', type: 'WITHDRAWAL', crypto: 'USDT', network: 'ETHEREUM', amount: '50000.00', usdValue: 50000.00, status: 'COMPLETED', txHash: txHash('0x', 32), confirmations: 12, requiredConfirmations: 12, createdAt: daysAgo(10, 10, 0), confirmedAt: daysAgo(10, 10, 12) },
  { id: 'tx_033', type: 'DEPOSIT', crypto: 'SOL', network: 'SOLANA', amount: '450.00000', usdValue: 67500.00, status: 'COMPLETED', txHash: txHash('0x', 33), confirmations: 32, requiredConfirmations: 32, createdAt: daysAgo(10, 14, 30), confirmedAt: daysAgo(10, 14, 31) },
  { id: 'tx_034', type: 'DEPOSIT', crypto: 'BNB', network: 'BSC', amount: '15.20000', usdValue: 9120.00, status: 'COMPLETED', txHash: txHash('0x', 34), confirmations: 15, requiredConfirmations: 15, createdAt: daysAgo(11, 9, 10), confirmedAt: daysAgo(11, 9, 11) },
  { id: 'tx_035', type: 'FEE', crypto: 'ETH', network: 'ETHEREUM', amount: '0.00750', usdValue: 24.64, status: 'COMPLETED', txHash: null, confirmations: 0, requiredConfirmations: 0, createdAt: daysAgo(11, 9, 28), confirmedAt: daysAgo(11, 9, 28) },
  { id: 'tx_036', type: 'DEPOSIT', crypto: 'ETH', network: 'ETHEREUM', amount: '12.00000', usdValue: 39420.00, status: 'COMPLETED', txHash: txHash('0x', 36), confirmations: 35, requiredConfirmations: 12, createdAt: daysAgo(12, 13, 0), confirmedAt: daysAgo(12, 13, 8) },
  { id: 'tx_037', type: 'WITHDRAWAL', crypto: 'BTC', network: 'BITCOIN', amount: '2.00000', usdValue: 137100.00, status: 'COMPLETED', txHash: txHash('0x', 37), confirmations: 6, requiredConfirmations: 6, createdAt: daysAgo(13, 7, 0), confirmedAt: daysAgo(13, 7, 50) },
  { id: 'tx_038', type: 'DEPOSIT', crypto: 'USDT', network: 'ETHEREUM', amount: '32000.00', usdValue: 32000.00, status: 'COMPLETED', txHash: txHash('0x', 38), confirmations: 12, requiredConfirmations: 12, createdAt: daysAgo(14, 10, 15), confirmedAt: daysAgo(14, 10, 27) },
  { id: 'tx_039', type: 'DEPOSIT', crypto: 'BTC', network: 'BITCOIN', amount: '0.42000', usdValue: 28791.00, status: 'COMPLETED', txHash: txHash('0x', 39), confirmations: 6, requiredConfirmations: 6, createdAt: daysAgo(15, 11, 30), confirmedAt: daysAgo(15, 12, 25) },
  { id: 'tx_040', type: 'FEE', crypto: 'BTC', network: 'BITCOIN', amount: '0.00042', usdValue: 28.79, status: 'COMPLETED', txHash: null, confirmations: 0, requiredConfirmations: 0, createdAt: daysAgo(15, 12, 25), confirmedAt: daysAgo(15, 12, 25) },
  { id: 'tx_041', type: 'DEPOSIT', crypto: 'SOL', network: 'SOLANA', amount: '320.00000', usdValue: 48000.00, status: 'COMPLETED', txHash: txHash('0x', 41), confirmations: 32, requiredConfirmations: 32, createdAt: daysAgo(17, 8, 45), confirmedAt: daysAgo(17, 8, 46) },
  { id: 'tx_042', type: 'WITHDRAWAL', crypto: 'ETH', network: 'ETHEREUM', amount: '15.00000', usdValue: 49275.00, status: 'COMPLETED', txHash: txHash('0x', 42), confirmations: 12, requiredConfirmations: 12, createdAt: daysAgo(18, 14, 0), confirmedAt: daysAgo(18, 14, 12) },
  { id: 'tx_043', type: 'DEPOSIT', crypto: 'BNB', network: 'BSC', amount: '25.00000', usdValue: 15000.00, status: 'COMPLETED', txHash: txHash('0x', 43), confirmations: 15, requiredConfirmations: 15, createdAt: daysAgo(19, 10, 20), confirmedAt: daysAgo(19, 10, 21) },
  { id: 'tx_044', type: 'DEPOSIT', crypto: 'USDT', network: 'ETHEREUM', amount: '45000.00', usdValue: 45000.00, status: 'COMPLETED', txHash: txHash('0x', 44), confirmations: 12, requiredConfirmations: 12, createdAt: daysAgo(20, 16, 0), confirmedAt: daysAgo(20, 16, 10) },
  { id: 'tx_045', type: 'DEPOSIT', crypto: 'BTC', network: 'BITCOIN', amount: '0.95000', usdValue: 65122.50, status: 'COMPLETED', txHash: txHash('0x', 45), confirmations: 6, requiredConfirmations: 6, createdAt: daysAgo(22, 9, 0), confirmedAt: daysAgo(22, 9, 50) },
  { id: 'tx_046', type: 'WITHDRAWAL', crypto: 'SOL', network: 'SOLANA', amount: '200.00000', usdValue: 30000.00, status: 'COMPLETED', txHash: txHash('0x', 46), confirmations: 32, requiredConfirmations: 32, createdAt: daysAgo(23, 12, 0), confirmedAt: daysAgo(23, 12, 1) },
  { id: 'tx_047', type: 'DEPOSIT', crypto: 'ETH', network: 'ETHEREUM', amount: '20.00000', usdValue: 65700.00, status: 'COMPLETED', txHash: txHash('0x', 47), confirmations: 35, requiredConfirmations: 12, createdAt: daysAgo(25, 8, 30), confirmedAt: daysAgo(25, 8, 38) },
  { id: 'tx_048', type: 'FEE', crypto: 'SOL', network: 'SOLANA', amount: '0.32000', usdValue: 48.00, status: 'COMPLETED', txHash: null, confirmations: 0, requiredConfirmations: 0, createdAt: daysAgo(25, 8, 38), confirmedAt: daysAgo(25, 8, 38) },
  { id: 'tx_049', type: 'DEPOSIT', crypto: 'USDT', network: 'ETHEREUM', amount: '75000.00', usdValue: 75000.00, status: 'COMPLETED', txHash: txHash('0x', 49), confirmations: 12, requiredConfirmations: 12, createdAt: daysAgo(27, 15, 0), confirmedAt: daysAgo(27, 15, 10) },
  { id: 'tx_050', type: 'DEPOSIT', crypto: 'BTC', network: 'BITCOIN', amount: '1.50000', usdValue: 102825.00, status: 'COMPLETED', txHash: txHash('0x', 50), confirmations: 6, requiredConfirmations: 6, createdAt: daysAgo(29, 10, 0), confirmedAt: daysAgo(29, 10, 55) },
];

// ── 30 Payments ─────────────────────────────────────────────────────────────
// Each payment now tracks: originalCrypto, originalAmount, exchangeRate, usdtAmount, fee, netCredited
export const DEMO_PAYMENTS = [
  { id: 'pay_001', crypto: 'BTC', network: 'BITCOIN', amount: '0.52340', requestedAmount: '35860.00', requestedCurrency: 'USD', exchangeRate: '68550.00', usdtAmount: '35860.82', fee: '179.30', netCredited: '35681.52', status: 'COMPLETED', customerEmail: 'alice@example.com', description: 'Order #10421 - Electronics Bundle', metadata: { orderId: '10421', items: 3 }, txHash: txHash('0x', 101), createdAt: daysAgo(0, 9, 15), paidAt: daysAgo(0, 9, 45), expiresAt: daysAgo(0, 8, 15) },
  { id: 'pay_002', crypto: 'ETH', network: 'ETHEREUM', amount: '3.20000', requestedAmount: '10512.00', requestedCurrency: 'USD', exchangeRate: '3285.00', usdtAmount: '10512.00', fee: '52.56', netCredited: '10459.44', status: 'COMPLETED', customerEmail: 'bob@techcorp.io', description: 'Order #10422 - Server Rack', metadata: { orderId: '10422', items: 1 }, txHash: txHash('0x', 102), createdAt: daysAgo(0, 7, 30), paidAt: daysAgo(0, 7, 38), expiresAt: daysAgo(0, 6, 30) },
  { id: 'pay_003', crypto: 'USDT', network: 'TRON', amount: '12500.00', requestedAmount: '12500.00', requestedCurrency: 'USD', exchangeRate: '1.00', usdtAmount: '12500.00', fee: '62.50', netCredited: '12437.50', status: 'CONFIRMING', customerEmail: 'chen@globalfreight.com', description: 'Order #10423 - Bulk Components', metadata: { orderId: '10423', items: 50 }, txHash: txHash('0x', 103), createdAt: daysAgo(0, 11, 20), paidAt: null, expiresAt: daysAgo(-1, 11, 20) },
  { id: 'pay_004', crypto: 'SOL', network: 'SOLANA', amount: '85.00000', requestedAmount: '12750.00', requestedCurrency: 'USD', status: 'COMPLETED', customerEmail: 'diana@startupinc.co', description: 'Order #10424 - SaaS License Annual', metadata: { orderId: '10424', plan: 'enterprise' }, txHash: txHash('0x', 104), createdAt: daysAgo(1, 14, 10), paidAt: daysAgo(1, 14, 11), expiresAt: daysAgo(0, 14, 10) },
  { id: 'pay_005', crypto: 'BNB', network: 'BSC', amount: '12.50000', requestedAmount: '7500.00', requestedCurrency: 'USD', status: 'COMPLETED', customerEmail: 'eric@devagency.com', description: 'Order #10425 - Consulting Package', metadata: { orderId: '10425', hours: 40 }, txHash: txHash('0x', 105), createdAt: daysAgo(1, 10, 5), paidAt: daysAgo(1, 10, 6), expiresAt: daysAgo(0, 10, 5) },
  { id: 'pay_006', crypto: 'BTC', network: 'BITCOIN', amount: '0.15000', requestedAmount: '10282.50', requestedCurrency: 'USD', status: 'AWAITING_PAYMENT', customerEmail: 'frank@bigretail.com', description: 'Order #10426 - Inventory Restock', metadata: { orderId: '10426', items: 120 }, txHash: null, createdAt: daysAgo(0, 12, 45), paidAt: null, expiresAt: daysAgo(-1, 12, 45) },
  { id: 'pay_007', crypto: 'ETH', network: 'ETHEREUM', amount: '2.50000', requestedAmount: '8212.50', requestedCurrency: 'USD', status: 'AWAITING_PAYMENT', customerEmail: 'grace@designstudio.art', description: 'Order #10427 - Design Toolkits', metadata: { orderId: '10427', items: 5 }, txHash: null, createdAt: daysAgo(0, 13, 30), paidAt: null, expiresAt: daysAgo(-1, 13, 30) },
  { id: 'pay_008', crypto: 'USDT', network: 'ETHEREUM', amount: '8200.00', requestedAmount: '8200.00', requestedCurrency: 'USD', status: 'COMPLETED', customerEmail: 'henry@logistics.co', description: 'Order #10428 - Shipping Label Software', metadata: { orderId: '10428', licenses: 10 }, txHash: txHash('0x', 108), createdAt: daysAgo(1, 16, 30), paidAt: daysAgo(1, 16, 38), expiresAt: daysAgo(0, 16, 30) },
  { id: 'pay_009', crypto: 'BTC', network: 'BITCOIN', amount: '0.75000', requestedAmount: '51412.50', requestedCurrency: 'USD', status: 'COMPLETED', customerEmail: 'ivan@luxwatch.com', description: 'Order #10429 - Premium Watch', metadata: { orderId: '10429', items: 1 }, txHash: txHash('0x', 109), createdAt: daysAgo(2, 15, 20), paidAt: daysAgo(2, 16, 15), expiresAt: daysAgo(1, 15, 20) },
  { id: 'pay_010', crypto: 'ETH', network: 'ETHEREUM', amount: '4.80000', requestedAmount: '15768.00', requestedCurrency: 'USD', status: 'COMPLETED', customerEmail: 'julia@elearn.edu', description: 'Order #10430 - Course Platform License', metadata: { orderId: '10430', students: 500 }, txHash: txHash('0x', 110), createdAt: daysAgo(3, 8, 10), paidAt: daysAgo(3, 8, 18), expiresAt: daysAgo(2, 8, 10) },
  { id: 'pay_011', crypto: 'USDT', network: 'ETHEREUM', amount: '5000.00', requestedAmount: '5000.00', requestedCurrency: 'USD', status: 'COMPLETED', customerEmail: 'kevin@saasly.io', description: 'Order #10431 - API Credits', metadata: { orderId: '10431', credits: 1000000 }, txHash: txHash('0x', 111), createdAt: daysAgo(3, 17, 50), paidAt: daysAgo(3, 18, 0), expiresAt: daysAgo(2, 17, 50) },
  { id: 'pay_012', crypto: 'BTC', network: 'BITCOIN', amount: '0.32100', requestedAmount: '22004.55', requestedCurrency: 'USD', status: 'COMPLETED', customerEmail: 'liam@nftmarket.xyz', description: 'Order #10432 - NFT Marketplace License', metadata: { orderId: '10432' }, txHash: txHash('0x', 112), createdAt: daysAgo(4, 9, 30), paidAt: daysAgo(4, 10, 25), expiresAt: daysAgo(3, 9, 30) },
  { id: 'pay_013', crypto: 'SOL', network: 'SOLANA', amount: '150.00000', requestedAmount: '22500.00', requestedCurrency: 'USD', status: 'COMPLETED', customerEmail: 'mia@gamedev.gg', description: 'Order #10433 - Game Engine License', metadata: { orderId: '10433', tier: 'studio' }, txHash: txHash('0x', 113), createdAt: daysAgo(2, 11, 45), paidAt: daysAgo(2, 11, 46), expiresAt: daysAgo(1, 11, 45) },
  { id: 'pay_014', crypto: 'SOL', network: 'SOLANA', amount: '200.00000', requestedAmount: '30000.00', requestedCurrency: 'USD', status: 'EXPIRED', customerEmail: 'noah@oldclient.com', description: 'Order #10434 - Expired Invoice', metadata: { orderId: '10434' }, txHash: null, createdAt: daysAgo(4, 12, 15), paidAt: null, expiresAt: daysAgo(3, 12, 15) },
  { id: 'pay_015', crypto: 'USDT', network: 'ETHEREUM', amount: '15000.00', requestedAmount: '15000.00', requestedCurrency: 'USD', status: 'COMPLETED', customerEmail: 'olivia@retailchain.com', description: 'Order #10435 - POS Terminals', metadata: { orderId: '10435', terminals: 15 }, txHash: txHash('0x', 115), createdAt: daysAgo(5, 14, 45), paidAt: daysAgo(5, 14, 55), expiresAt: daysAgo(4, 14, 45) },
  { id: 'pay_016', crypto: 'BTC', network: 'BITCOIN', amount: '1.20000', requestedAmount: '82260.00', requestedCurrency: 'USD', status: 'COMPLETED', customerEmail: 'peter@whalebuyer.io', description: 'Order #10436 - Mining Equipment', metadata: { orderId: '10436', units: 5 }, txHash: txHash('0x', 116), createdAt: daysAgo(6, 7, 0), paidAt: daysAgo(6, 7, 55), expiresAt: daysAgo(5, 7, 0) },
  { id: 'pay_017', crypto: 'ETH', network: 'ETHEREUM', amount: '7.50000', requestedAmount: '24637.50', requestedCurrency: 'USD', status: 'COMPLETED', customerEmail: 'quinn@cryptofund.vc', description: 'Order #10437 - Analytics Suite', metadata: { orderId: '10437', plan: 'pro' }, txHash: txHash('0x', 117), createdAt: daysAgo(7, 9, 20), paidAt: daysAgo(7, 9, 28), expiresAt: daysAgo(6, 9, 20) },
  { id: 'pay_018', crypto: 'BNB', network: 'BSC', amount: '8.40000', requestedAmount: '5040.00', requestedCurrency: 'USD', status: 'COMPLETED', customerEmail: 'rachel@smb.co', description: 'Order #10438 - Marketing Tools', metadata: { orderId: '10438', months: 12 }, txHash: txHash('0x', 118), createdAt: daysAgo(5, 10, 30), paidAt: daysAgo(5, 10, 31), expiresAt: daysAgo(4, 10, 30) },
  { id: 'pay_019', crypto: 'USDT', network: 'ETHEREUM', amount: '20000.00', requestedAmount: '20000.00', requestedCurrency: 'USD', status: 'COMPLETED', customerEmail: 'sam@enterprise.co', description: 'Order #10439 - Enterprise Support', metadata: { orderId: '10439', tickets: 'unlimited' }, txHash: txHash('0x', 119), createdAt: daysAgo(8, 11, 0), paidAt: daysAgo(8, 11, 12), expiresAt: daysAgo(7, 11, 0) },
  { id: 'pay_020', crypto: 'BTC', network: 'BITCOIN', amount: '0.08500', requestedAmount: '5826.75', requestedCurrency: 'USD', status: 'COMPLETED', customerEmail: 'tina@freelancer.me', description: 'Order #10440 - Freelancer Premium', metadata: { orderId: '10440' }, txHash: txHash('0x', 120), createdAt: daysAgo(9, 8, 40), paidAt: daysAgo(9, 9, 35), expiresAt: daysAgo(8, 8, 40) },
  { id: 'pay_021', crypto: 'SOL', network: 'SOLANA', amount: '450.00000', requestedAmount: '67500.00', requestedCurrency: 'USD', status: 'COMPLETED', customerEmail: 'ulysses@defi.capital', description: 'Order #10441 - Institutional License', metadata: { orderId: '10441' }, txHash: txHash('0x', 121), createdAt: daysAgo(10, 14, 30), paidAt: daysAgo(10, 14, 31), expiresAt: daysAgo(9, 14, 30) },
  { id: 'pay_022', crypto: 'BNB', network: 'BSC', amount: '15.20000', requestedAmount: '9120.00', requestedCurrency: 'USD', status: 'COMPLETED', customerEmail: 'vera@shopchain.io', description: 'Order #10442 - Plugin Bundle', metadata: { orderId: '10442', plugins: 8 }, txHash: txHash('0x', 122), createdAt: daysAgo(11, 9, 10), paidAt: daysAgo(11, 9, 11), expiresAt: daysAgo(10, 9, 10) },
  { id: 'pay_023', crypto: 'ETH', network: 'ETHEREUM', amount: '12.00000', requestedAmount: '39420.00', requestedCurrency: 'USD', status: 'COMPLETED', customerEmail: 'will@mega.tech', description: 'Order #10443 - Cloud Hosting Annual', metadata: { orderId: '10443', instances: 20 }, txHash: txHash('0x', 123), createdAt: daysAgo(12, 13, 0), paidAt: daysAgo(12, 13, 8), expiresAt: daysAgo(11, 13, 0) },
  { id: 'pay_024', crypto: 'USDT', network: 'ETHEREUM', amount: '32000.00', requestedAmount: '32000.00', requestedCurrency: 'USD', status: 'COMPLETED', customerEmail: 'xena@globalimports.com', description: 'Order #10444 - Import Duty Payment', metadata: { orderId: '10444' }, txHash: txHash('0x', 124), createdAt: daysAgo(14, 10, 15), paidAt: daysAgo(14, 10, 27), expiresAt: daysAgo(13, 10, 15) },
  { id: 'pay_025', crypto: 'BTC', network: 'BITCOIN', amount: '0.42000', requestedAmount: '28791.00', requestedCurrency: 'USD', status: 'COMPLETED', customerEmail: 'yuri@cryptotrader.pro', description: 'Order #10445 - Trading Bot Access', metadata: { orderId: '10445', bots: 3 }, txHash: txHash('0x', 125), createdAt: daysAgo(15, 11, 30), paidAt: daysAgo(15, 12, 25), expiresAt: daysAgo(14, 11, 30) },
  { id: 'pay_026', crypto: 'SOL', network: 'SOLANA', amount: '320.00000', requestedAmount: '48000.00', requestedCurrency: 'USD', status: 'COMPLETED', customerEmail: 'zara@nftgallery.art', description: 'Order #10446 - Gallery Minting Suite', metadata: { orderId: '10446' }, txHash: txHash('0x', 126), createdAt: daysAgo(17, 8, 45), paidAt: daysAgo(17, 8, 46), expiresAt: daysAgo(16, 8, 45) },
  { id: 'pay_027', crypto: 'ETH', network: 'ETHEREUM', amount: '20.00000', requestedAmount: '65700.00', requestedCurrency: 'USD', status: 'COMPLETED', customerEmail: 'adam@blocktower.fund', description: 'Order #10447 - OTC Trade Settlement', metadata: { orderId: '10447' }, txHash: txHash('0x', 127), createdAt: daysAgo(25, 8, 30), paidAt: daysAgo(25, 8, 38), expiresAt: daysAgo(24, 8, 30) },
  { id: 'pay_028', crypto: 'USDT', network: 'ETHEREUM', amount: '75000.00', requestedAmount: '75000.00', requestedCurrency: 'USD', status: 'COMPLETED', customerEmail: 'betty@megacorp.com', description: 'Order #10448 - Quarterly License', metadata: { orderId: '10448', quarter: 'Q1-2026' }, txHash: txHash('0x', 128), createdAt: daysAgo(27, 15, 0), paidAt: daysAgo(27, 15, 10), expiresAt: daysAgo(26, 15, 0) },
  { id: 'pay_029', crypto: 'BTC', network: 'BITCOIN', amount: '1.50000', requestedAmount: '102825.00', requestedCurrency: 'USD', status: 'COMPLETED', customerEmail: 'carl@treasury.fund', description: 'Order #10449 - Treasury Purchase', metadata: { orderId: '10449' }, txHash: txHash('0x', 129), createdAt: daysAgo(29, 10, 0), paidAt: daysAgo(29, 10, 55), expiresAt: daysAgo(28, 10, 0) },
  { id: 'pay_030', crypto: 'BNB', network: 'BSC', amount: '25.00000', requestedAmount: '15000.00', requestedCurrency: 'USD', status: 'COMPLETED', customerEmail: 'dora@web3agency.io', description: 'Order #10450 - Agency Retainer', metadata: { orderId: '10450', months: 3 }, txHash: txHash('0x', 130), createdAt: daysAgo(19, 10, 20), paidAt: daysAgo(19, 10, 21), expiresAt: daysAgo(18, 10, 20) },
];

// ── 10 Withdrawals ──────────────────────────────────────────────────────────
// All withdrawals are now USDT TRC-20 to TRON addresses
export const DEMO_WITHDRAWALS = [
  { id: 'wd_001', crypto: 'USDT', network: 'TRON', amount: '68550.00', fee: '1.00', netAmount: '68549.00', toAddress: 'TQnLF7pVcR8kBxN3mZj6Yw4sHdX9tLfG2e', status: 'COMPLETED', txHash: txHash('0x', 201), createdAt: daysAgo(0, 6, 0), processedAt: daysAgo(0, 6, 55) },
  { id: 'wd_002', crypto: 'USDT', network: 'TRON', amount: '16425.00', fee: '1.00', netAmount: '16424.00', toAddress: 'THjkP2wXq9mR4LnBs3TpYc7vZdK6FgE8Nx', status: 'PENDING', txHash: null, createdAt: daysAgo(1, 8, 0), processedAt: null },
  { id: 'wd_003', crypto: 'USDT', network: 'TRON', amount: '25000.00', fee: '1.00', netAmount: '24999.00', toAddress: 'TYbRt9kWs5mN2qJh4LpXc7vZdFgE8NxR3a', status: 'COMPLETED', txHash: txHash('0x', 203), createdAt: daysAgo(2, 9, 0), processedAt: daysAgo(2, 9, 15) },
  { id: 'wd_004', crypto: 'USDT', network: 'TRON', amount: '12000.00', fee: '1.00', netAmount: '11999.00', toAddress: 'TMxNw4pVcR8kBxN3mZj6Yw4sHdX9tLfG2e', status: 'COMPLETED', txHash: txHash('0x', 204), createdAt: daysAgo(3, 14, 0), processedAt: daysAgo(3, 14, 5) },
  { id: 'wd_005', crypto: 'USDT', network: 'TRON', amount: '32850.00', fee: '1.00', netAmount: '32849.00', toAddress: 'TQnLF7pVcR8kBxN3mZj6Yw4sHdX9tLfG2e', status: 'COMPLETED', txHash: txHash('0x', 205), createdAt: daysAgo(5, 8, 0), processedAt: daysAgo(5, 8, 10) },
  { id: 'wd_006', crypto: 'USDT', network: 'TRON', amount: '15000.00', fee: '1.00', netAmount: '14999.00', toAddress: 'THjkP2wXq9mR4LnBs3TpYc7vZdK6FgE8Nx', status: 'COMPLETED', txHash: txHash('0x', 206), createdAt: daysAgo(6, 10, 0), processedAt: daysAgo(6, 10, 1) },
  { id: 'wd_007', crypto: 'USDT', network: 'TRON', amount: '50000.00', fee: '1.00', netAmount: '49999.00', toAddress: 'TYbRt9kWs5mN2qJh4LpXc7vZdFgE8NxR3a', status: 'COMPLETED', txHash: txHash('0x', 207), createdAt: daysAgo(10, 10, 0), processedAt: daysAgo(10, 10, 12) },
  { id: 'wd_008', crypto: 'USDT', network: 'TRON', amount: '137100.00', fee: '1.00', netAmount: '137099.00', toAddress: 'TMxNw4pVcR8kBxN3mZj6Yw4sHdX9tLfG2e', status: 'COMPLETED', txHash: txHash('0x', 208), createdAt: daysAgo(13, 7, 0), processedAt: daysAgo(13, 7, 50) },
  { id: 'wd_009', crypto: 'USDT', network: 'TRON', amount: '49275.00', fee: '1.00', netAmount: '49274.00', toAddress: 'TQnLF7pVcR8kBxN3mZj6Yw4sHdX9tLfG2e', status: 'PROCESSING', txHash: null, createdAt: daysAgo(18, 14, 0), processedAt: null },
  { id: 'wd_010', crypto: 'USDT', network: 'TRON', amount: '30000.00', fee: '1.00', netAmount: '29999.00', toAddress: 'THjkP2wXq9mR4LnBs3TpYc7vZdK6FgE8Nx', status: 'FAILED', txHash: null, createdAt: daysAgo(23, 12, 0), processedAt: null },
];

// ── API Keys ────────────────────────────────────────────────────────────────
export const DEMO_API_KEYS = [
  { id: 'key_001', name: 'Production', prefix: 'mcc_live_7Kx9', createdAt: '2026-01-10T10:00:00Z', lastUsed: '2026-03-19T08:30:00Z', status: 'active' as const },
  { id: 'key_002', name: 'Test/Staging', prefix: 'mcc_test_3Qm2', createdAt: '2026-02-05T14:00:00Z', lastUsed: '2026-03-18T22:15:00Z', status: 'active' as const },
];

// ── Webhooks ────────────────────────────────────────────────────────────────
export const DEMO_WEBHOOKS = [
  { id: 'wh_001', url: 'https://techmart.com/api/webhooks/mycryptocoin', events: ['payment.confirmed', 'withdrawal.completed'], status: 'active' as const, lastTriggered: '2026-03-19T02:15:00Z', successRate: 99.2 },
  { id: 'wh_002', url: 'https://staging.techmart.com/webhooks', events: ['payment.confirmed'], status: 'active' as const, lastTriggered: '2026-03-18T14:30:00Z', successRate: 100 },
];

// ── Dashboard Stats ─────────────────────────────────────────────────────────
export const DEMO_DASHBOARD_STATS = {
  totalReceived: '351,896.42 USDT',
  totalFees: '1,759.48 USDT',
  availableBalance: '350,136.94 USDT',
  settlementCurrency: 'USDT TRC-20',
  activePayments: 3,
  volumeChart: {
    labels: Array.from({ length: 30 }, (_, i) => {
      const d = new Date('2026-03-19');
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().slice(0, 10);
    }),
    data: [
      102825, 0, 65122, 0, 48000, 0, 65700, 0, 0, 75000,
      0, 5826, 50000, 67500, 9120, 39420, 0, 28791, 32000, 0,
      0, 82260, 24637, 20000, 5040, 15000, 22004, 30000, 22500, 15768,
    ],
  },
  cryptoAllocation: { BTC: 48, ETH: 18, USDT: 13, SOL: 13, BNB: 8 },
};

// ── 15 Activity Items ───────────────────────────────────────────────────────
export const DEMO_ACTIVITY = [
  { id: 'act_01', type: 'payment', icon: 'arrow_downward', color: 'emerald', message: 'Payment received: 0.52340 BTC ($35,860)', timestamp: daysAgo(0, 9, 45) },
  { id: 'act_02', type: 'payment', icon: 'arrow_downward', color: 'emerald', message: 'Payment received: 3.20000 ETH ($10,512)', timestamp: daysAgo(0, 7, 38) },
  { id: 'act_03', type: 'withdrawal', icon: 'arrow_upward', color: 'blue', message: 'Withdrawal completed: 1.00000 BTC sent', timestamp: daysAgo(0, 6, 55) },
  { id: 'act_04', type: 'payment', icon: 'arrow_downward', color: 'emerald', message: 'Payment received: 85.00 SOL ($12,750)', timestamp: daysAgo(1, 14, 11) },
  { id: 'act_05', type: 'payment', icon: 'arrow_downward', color: 'emerald', message: 'Payment received: 12.50 BNB ($7,500)', timestamp: daysAgo(1, 10, 6) },
  { id: 'act_06', type: 'payment', icon: 'arrow_downward', color: 'emerald', message: 'Payment received: 8,200 USDT ($8,200)', timestamp: daysAgo(1, 16, 38) },
  { id: 'act_07', type: 'webhook', icon: 'webhook', color: 'purple', message: 'Webhook configured: https://techmart.com/api/webhooks/mycryptocoin', timestamp: daysAgo(2, 10, 0) },
  { id: 'act_08', type: 'payment', icon: 'arrow_downward', color: 'emerald', message: 'Payment received: 0.75 BTC ($51,412.50)', timestamp: daysAgo(2, 16, 15) },
  { id: 'act_09', type: 'withdrawal', icon: 'arrow_upward', color: 'blue', message: 'Withdrawal completed: 25,000 USDT sent', timestamp: daysAgo(2, 9, 15) },
  { id: 'act_10', type: 'api_key', icon: 'vpn_key', color: 'amber', message: 'API key created: Test/Staging (mcc_test_3Qm2...)', timestamp: daysAgo(42, 14, 0) },
  { id: 'act_11', type: 'payment', icon: 'arrow_downward', color: 'emerald', message: 'Payment received: 4.80 ETH ($15,768)', timestamp: daysAgo(3, 8, 18) },
  { id: 'act_12', type: 'withdrawal', icon: 'arrow_upward', color: 'blue', message: 'Withdrawal completed: 20.00 BNB sent', timestamp: daysAgo(3, 14, 5) },
  { id: 'act_13', type: 'payment', icon: 'arrow_downward', color: 'emerald', message: 'Payment expired: Order #10434 (200 SOL)', timestamp: daysAgo(3, 12, 15) },
  { id: 'act_14', type: 'security', icon: 'security', color: 'red', message: 'Login from new IP: 192.168.1.42 (approved)', timestamp: daysAgo(4, 8, 0) },
  { id: 'act_15', type: 'api_key', icon: 'vpn_key', color: 'amber', message: 'API key created: Production (mcc_live_7Kx9...)', timestamp: daysAgo(68, 10, 0) },
];

// ── Check if mock mode should be active ─────────────────────────────────────
export function isMockMode(): boolean {
  if (typeof window === 'undefined') return false;
  // Mock mode when no API URL is set or explicitly on localhost without backend
  return !process.env.NEXT_PUBLIC_API_URL || window.location.hostname === 'localhost';
}
