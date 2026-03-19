import { CryptoNetwork, TokenSymbol } from '@mycryptocoin/shared';
import { cryptoKey, SUPPORTED_CRYPTOS, type CryptoKey, CryptoSymbol } from '../config/crypto';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Resolve a network string (could be CryptoNetwork or CryptoSymbol "NETWORK:TOKEN").
 */
function resolveNetwork(networkOrSymbol: string): CryptoNetwork {
  if (networkOrSymbol.includes(':')) {
    return networkOrSymbol.split(':')[0] as CryptoNetwork;
  }
  return networkOrSymbol as CryptoNetwork;
}

/**
 * Validate a cryptocurrency address against its expected format.
 * Accepts either a CryptoNetwork string or a CryptoSymbol ("NETWORK:TOKEN").
 */
export function validateCryptoAddress(
  address: string,
  networkOrSymbol: string,
): boolean {
  const network = resolveNetwork(networkOrSymbol);
  const configs = Object.values(SUPPORTED_CRYPTOS).filter(c => c.network === network);
  if (configs.length === 0) return false;
  return configs[0].addressRegex.test(address);
}

/**
 * Convert from the smallest unit to the standard unit.
 * e.g., satoshi -> BTC, wei -> ETH, lamports -> SOL
 */
export function fromSmallestUnit(
  amount: bigint | string,
  decimals: number,
): Decimal {
  const value = new Decimal(amount.toString());
  const divisor = new Decimal(10).pow(decimals);
  return value.div(divisor);
}

/**
 * Convert from standard unit to smallest unit.
 * e.g., BTC -> satoshi, ETH -> wei, SOL -> lamports
 */
export function toSmallestUnit(
  amount: string | number | Decimal,
  decimals: number,
): bigint {
  const value = new Decimal(amount.toString());
  const multiplier = new Decimal(10).pow(decimals);
  const result = value.mul(multiplier).floor();
  return BigInt(result.toFixed(0));
}

/**
 * Format a crypto amount with proper decimal places.
 */
export function formatCryptoAmount(
  amount: string | Decimal,
  network: CryptoNetwork,
  token: TokenSymbol,
): string {
  const key = cryptoKey(network, token);
  const config = SUPPORTED_CRYPTOS[key];
  const value = new Decimal(amount.toString());
  return value.toFixed(config.decimals);
}

/**
 * Format amount for display (trim trailing zeros).
 */
export function formatDisplayAmount(
  amount: string | Decimal,
  maxDecimals: number = 8,
): string {
  const value = new Decimal(amount.toString());
  const formatted = value.toFixed(maxDecimals);
  // Remove trailing zeros but keep at least one decimal
  return formatted.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

/**
 * Get the smallest unit name for a cryptocurrency.
 */
export function getSmallestUnitName(token: TokenSymbol): string {
  const unitNames: Record<string, string> = {
    [TokenSymbol.BTC]: 'satoshi',
    [TokenSymbol.ETH]: 'wei',
    [TokenSymbol.USDT]: 'micro-USDT',
    [TokenSymbol.USDC]: 'micro-USDC',
    [TokenSymbol.BNB]: 'jager',
    [TokenSymbol.SOL]: 'lamport',
    [TokenSymbol.LTC]: 'litoshi',
    [TokenSymbol.TRX]: 'sun',
  };
  return unitNames[token] || 'unit';
}

/**
 * Check if an amount meets the minimum deposit requirement for a given crypto.
 */
/**
 * Check if an amount meets the minimum requirement.
 * Accepts (amount, network, token) or (amount, cryptoSymbol) for backward compat.
 */
export function meetsMinimumAmount(
  amount: string | Decimal,
  networkOrSymbol: string,
  token?: string,
): boolean {
  let key: string;
  if (token) {
    key = cryptoKey(networkOrSymbol as CryptoNetwork, token as TokenSymbol);
  } else {
    // Legacy CryptoSymbol usage: value is already a CryptoKey like "BITCOIN:BTC"
    key = networkOrSymbol;
  }
  const config = SUPPORTED_CRYPTOS[key];
  if (!config) return false;
  const value = new Decimal(amount.toString());
  const minimum = new Decimal(config.minDeposit);
  return value.gte(minimum);
}

/**
 * Compare two Decimal amounts.
 * Returns: -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareAmounts(
  a: string | Decimal,
  b: string | Decimal,
): -1 | 0 | 1 {
  const valA = new Decimal(a.toString());
  const valB = new Decimal(b.toString());
  if (valA.lt(valB)) return -1;
  if (valA.gt(valB)) return 1;
  return 0;
}
