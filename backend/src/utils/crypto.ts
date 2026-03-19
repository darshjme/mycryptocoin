import { CryptoSymbol, SUPPORTED_CRYPTOS } from '../config/crypto';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Validate a cryptocurrency address against its expected format.
 */
export function validateCryptoAddress(
  address: string,
  symbol: CryptoSymbol,
): boolean {
  const config = SUPPORTED_CRYPTOS[symbol];
  if (!config) return false;
  return config.addressRegex.test(address);
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
  symbol: CryptoSymbol,
): string {
  const config = SUPPORTED_CRYPTOS[symbol];
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
export function getSmallestUnitName(symbol: CryptoSymbol): string {
  const unitNames: Record<CryptoSymbol, string> = {
    [CryptoSymbol.BTC]: 'satoshi',
    [CryptoSymbol.ETH]: 'wei',
    [CryptoSymbol.USDT_ERC20]: 'micro-USDT',
    [CryptoSymbol.USDT_TRC20]: 'micro-USDT',
    [CryptoSymbol.BNB]: 'jager',
    [CryptoSymbol.SOL]: 'lamport',
    [CryptoSymbol.MATIC]: 'wei',
    [CryptoSymbol.LTC]: 'litoshi',
    [CryptoSymbol.DOGE]: 'koinu',
    [CryptoSymbol.XRP]: 'drop',
  };
  return unitNames[symbol] || 'unit';
}

/**
 * Check if an amount meets the minimum requirement for a given crypto.
 */
export function meetsMinimumAmount(
  amount: string | Decimal,
  symbol: CryptoSymbol,
): boolean {
  const config = SUPPORTED_CRYPTOS[symbol];
  const value = new Decimal(amount.toString());
  const minimum = new Decimal(config.minAmount);
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

/**
 * Normalize a crypto symbol input to a CryptoSymbol enum value.
 */
export function normalizeCryptoSymbol(input: string): CryptoSymbol | null {
  const upper = input.toUpperCase().replace('-', '_');
  if (upper in CryptoSymbol) {
    return upper as CryptoSymbol;
  }
  // Handle common aliases
  const aliases: Record<string, CryptoSymbol> = {
    BITCOIN: CryptoSymbol.BTC,
    ETHEREUM: CryptoSymbol.ETH,
    TETHER: CryptoSymbol.USDT_ERC20,
    USDT: CryptoSymbol.USDT_ERC20,
    SOLANA: CryptoSymbol.SOL,
    POLYGON: CryptoSymbol.MATIC,
    LITECOIN: CryptoSymbol.LTC,
    DOGECOIN: CryptoSymbol.DOGE,
    RIPPLE: CryptoSymbol.XRP,
  };
  return aliases[upper] || null;
}
