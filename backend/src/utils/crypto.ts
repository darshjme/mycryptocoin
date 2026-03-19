import { CryptoNetwork, TokenSymbol } from '@mycryptocoin/shared';
import { cryptoKey, SUPPORTED_CRYPTOS, type CryptoKey } from '../config/crypto';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Validate a cryptocurrency address against its expected format.
 * Uses network-level regex (addresses are network-specific, not token-specific).
 */
export function validateCryptoAddress(
  address: string,
  network: CryptoNetwork,
): boolean {
  // Find any config for this network to get the address regex
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
export function meetsMinimumAmount(
  amount: string | Decimal,
  network: CryptoNetwork,
  token: TokenSymbol,
): boolean {
  const key = cryptoKey(network, token);
  const config = SUPPORTED_CRYPTOS[key];
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
