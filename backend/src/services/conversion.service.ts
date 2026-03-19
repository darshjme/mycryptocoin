import { Decimal } from '@prisma/client/runtime/library';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';

const RATE_CACHE_TTL = 60; // 60 seconds
const RATE_CACHE_PREFIX = 'exchange_rate:';
const FALLBACK_MAX_AGE_SECONDS = 300; // Refuse to use fallback rates older than 5 minutes
const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BNB: 'binancecoin',
  SOL: 'solana',
  LTC: 'litecoin',
  DOGE: 'dogecoin',
  TRX: 'tron',
  XRP: 'ripple',
  ADA: 'cardano',
  MATIC: 'matic-network',
  USDT: 'tether',
  USDC: 'usd-coin',
};

export class ConversionService {
  /**
   * Fetch the live exchange rate for a given crypto to USDT.
   * Caches in Redis with 60s TTL. Falls back to last known rate on API failure.
   */
  async getExchangeRate(crypto: string): Promise<Decimal> {
    const symbol = crypto.toUpperCase();

    // USDT -> USDT is always 1:1
    if (symbol === 'USDT') {
      return new Decimal(1);
    }

    const cacheKey = `${RATE_CACHE_PREFIX}${symbol}_USDT`;

    // Check Redis cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return new Decimal(cached);
    }

    // Fetch from CoinGecko
    try {
      const coinId = COINGECKO_IDS[symbol];
      if (!coinId) {
        throw new Error(`Unsupported crypto for conversion: ${symbol}`);
      }

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      const priceUsd = data[coinId]?.usd;

      if (!priceUsd || typeof priceUsd !== 'number') {
        throw new Error(`No price data for ${symbol}`);
      }

      // Sanity check: reject obviously garbage rates
      if (priceUsd <= 0) {
        throw new Error(`Invalid exchange rate for ${symbol}: ${priceUsd} (non-positive)`);
      }

      // Guard against stale/broken data: if we have a fallback, reject >50% deviation
      const fallbackRaw = await redis.get(`${RATE_CACHE_PREFIX}${symbol}_USDT:fallback`);
      if (fallbackRaw) {
        const fallbackRate = parseFloat(fallbackRaw);
        if (fallbackRate > 0) {
          const deviation = Math.abs(priceUsd - fallbackRate) / fallbackRate;
          if (deviation > 0.5) {
            logger.error(
              `Exchange rate for ${symbol} deviated ${(deviation * 100).toFixed(1)}% from last known rate. ` +
              `New: ${priceUsd}, Last: ${fallbackRate}. Rejecting and using fallback.`,
            );
            return new Decimal(fallbackRaw);
          }
        }
      }

      // USDT is pegged to USD, so USD price ~= USDT price
      const rate = new Decimal(priceUsd);

      // Cache in Redis
      await redis.setex(cacheKey, RATE_CACHE_TTL, rate.toString());

      // Also store as fallback (no TTL)
      await redis.set(`${RATE_CACHE_PREFIX}${symbol}_USDT:fallback`, rate.toString());

      logger.info(`Exchange rate fetched: 1 ${symbol} = ${rate} USDT`);
      return rate;
    } catch (error) {
      logger.error(`Failed to fetch exchange rate for ${symbol}`, { error });

      // Fallback to last known rate
      const fallback = await redis.get(`${RATE_CACHE_PREFIX}${symbol}_USDT:fallback`);
      if (fallback) {
        logger.warn(`Using fallback exchange rate for ${symbol}: ${fallback} USDT`);
        return new Decimal(fallback);
      }

      throw new Error(`Unable to determine exchange rate for ${symbol} to USDT`);
    }
  }

  /**
   * Convert a crypto amount to its USDT equivalent.
   * Returns the USDT amount and the exchange rate used.
   */
  async convertToUsdt(
    amount: Decimal,
    crypto: string,
  ): Promise<{ usdtAmount: Decimal; rate: Decimal }> {
    const rate = await this.getExchangeRate(crypto);
    const usdtAmount = amount.mul(rate).toDecimalPlaces(6, Decimal.ROUND_DOWN);

    logger.info(
      `Converted ${amount} ${crypto} -> ${usdtAmount} USDT (rate: ${rate})`,
    );

    return { usdtAmount, rate };
  }

  /**
   * Fetch all supported exchange rates at once (crypto -> USDT).
   */
  async getExchangeRates(): Promise<Record<string, Decimal>> {
    const symbols = Object.keys(COINGECKO_IDS);
    const rates: Record<string, Decimal> = {};

    await Promise.all(
      symbols.map(async (symbol) => {
        try {
          rates[symbol] = await this.getExchangeRate(symbol);
        } catch {
          logger.warn(`Skipping rate for ${symbol} — unavailable`);
        }
      }),
    );

    return rates;
  }
}

export const conversionService = new ConversionService();
