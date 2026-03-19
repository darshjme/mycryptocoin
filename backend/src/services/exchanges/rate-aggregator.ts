/**
 * MyCryptoCoin — Multi-Source Rate Aggregator
 *
 * Fetches exchange rates from 3+ sources simultaneously and calculates
 * the median rate for manipulation protection.
 *
 * Sources: CoinGecko, Binance, Kraken
 * Cache: Redis with 30s TTL
 * Audit: Every fetch logged to ExchangeRateLog table
 */

import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { logger } from '../../utils/logger';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RATE_CACHE_TTL = 30; // 30 seconds — tighter than before for accuracy
const RATE_CACHE_PREFIX = 'rate:median:';
const RATE_FALLBACK_PREFIX = 'rate:fallback:';

// CoinGecko ID mapping
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
  AVAX: 'avalanche-2',
  DOT: 'polkadot',
  LINK: 'chainlink',
  USDT: 'tether',
  USDC: 'usd-coin',
};

// Binance trading pair mapping
const BINANCE_PAIRS: Record<string, string> = {
  BTC: 'BTCUSDT',
  ETH: 'ETHUSDT',
  BNB: 'BNBUSDT',
  SOL: 'SOLUSDT',
  LTC: 'LTCUSDT',
  DOGE: 'DOGEUSDT',
  TRX: 'TRXUSDT',
  XRP: 'XRPUSDT',
  ADA: 'ADAUSDT',
  MATIC: 'MATICUSDT',
  AVAX: 'AVAXUSDT',
  DOT: 'DOTUSDT',
  LINK: 'LINKUSDT',
};

// Kraken pair mapping (Kraken uses different naming)
const KRAKEN_PAIRS: Record<string, string> = {
  BTC: 'XBTUSDT',
  ETH: 'ETHUSDT',
  SOL: 'SOLUSDT',
  LTC: 'LTCUSDT',
  DOGE: 'DOGEUSDT',
  XRP: 'XRPUSDT',
  ADA: 'ADAUSDT',
  DOT: 'DOTUSDT',
  LINK: 'LINKUSDT',
  MATIC: 'MATICUSDT',
  AVAX: 'AVAXUSDT',
};

// ---------------------------------------------------------------------------
// Rate fetcher result
// ---------------------------------------------------------------------------

interface RateFetchResult {
  rate: Decimal;
  source: string;
  timestamp: Date;
}

// ---------------------------------------------------------------------------
// Individual source fetchers
// ---------------------------------------------------------------------------

async function fetchCoinGeckoRate(crypto: string): Promise<RateFetchResult | null> {
  try {
    const coinId = COINGECKO_IDS[crypto.toUpperCase()];
    if (!coinId) return null;

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      { signal: AbortSignal.timeout(5000) },
    );

    if (!response.ok) return null;

    const data = await response.json() as any;
    const price = data[coinId]?.usd;
    if (!price) return null;

    return {
      rate: new Decimal(price),
      source: 'coingecko',
      timestamp: new Date(),
    };
  } catch (error) {
    logger.debug(`CoinGecko rate fetch failed for ${crypto}`, { error });
    return null;
  }
}

async function fetchBinanceRate(crypto: string): Promise<RateFetchResult | null> {
  try {
    const pair = BINANCE_PAIRS[crypto.toUpperCase()];
    if (!pair) return null;

    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${pair}`,
      { signal: AbortSignal.timeout(5000) },
    );

    if (!response.ok) return null;

    const data = await response.json() as any;
    if (!data.price) return null;

    return {
      rate: new Decimal(data.price),
      source: 'binance',
      timestamp: new Date(),
    };
  } catch (error) {
    logger.debug(`Binance rate fetch failed for ${crypto}`, { error });
    return null;
  }
}

async function fetchKrakenRate(crypto: string): Promise<RateFetchResult | null> {
  try {
    const pair = KRAKEN_PAIRS[crypto.toUpperCase()];
    if (!pair) return null;

    const response = await fetch(
      `https://api.kraken.com/0/public/Ticker?pair=${pair}`,
      { signal: AbortSignal.timeout(5000) },
    );

    if (!response.ok) return null;

    const data = await response.json() as any;
    if (data.error?.length > 0) return null;

    // Kraken returns data keyed by their internal pair name
    const resultKeys = Object.keys(data.result || {});
    if (resultKeys.length === 0) return null;

    const pairData = data.result[resultKeys[0]];
    // 'c' = last trade closed [price, lot-volume]
    const lastPrice = pairData?.c?.[0];
    if (!lastPrice) return null;

    return {
      rate: new Decimal(lastPrice),
      source: 'kraken',
      timestamp: new Date(),
    };
  } catch (error) {
    logger.debug(`Kraken rate fetch failed for ${crypto}`, { error });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Median calculation
// ---------------------------------------------------------------------------

function calculateMedian(values: Decimal[]): Decimal {
  if (values.length === 0) {
    throw new Error('Cannot calculate median of empty array');
  }

  const sorted = [...values].sort((a, b) => a.cmp(b));
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    // Even: average of two middle values
    return sorted[mid - 1].add(sorted[mid]).div(2);
  }

  return sorted[mid];
}

/**
 * Detect outlier rates that deviate too far from median.
 * Returns rates within 2% of median (protects against manipulation).
 */
function filterOutliers(
  rates: RateFetchResult[],
  maxDeviationPercent: number = 2,
): RateFetchResult[] {
  if (rates.length <= 1) return rates;

  const median = calculateMedian(rates.map((r) => r.rate));
  const threshold = median.mul(maxDeviationPercent).div(100);

  const filtered = rates.filter((r) =>
    r.rate.sub(median).abs().lte(threshold),
  );

  // If all rates are outliers (impossible in practice), keep them all
  if (filtered.length === 0) return rates;

  // Log any outliers that were removed
  const removed = rates.filter((r) =>
    r.rate.sub(median).abs().gt(threshold),
  );
  for (const outlier of removed) {
    logger.warn('Rate outlier detected and filtered', {
      source: outlier.source,
      rate: outlier.rate.toString(),
      median: median.toString(),
      deviation: outlier.rate.sub(median).abs().div(median).mul(100).toFixed(2) + '%',
    });
  }

  return filtered;
}

// ---------------------------------------------------------------------------
// Rate Aggregator Service
// ---------------------------------------------------------------------------

export class RateAggregatorService {
  /**
   * Fetch exchange rate from multiple sources, take median for safety.
   * Logs every fetch to ExchangeRateLog for audit trail.
   * Caches in Redis with 30s TTL.
   *
   * Fallback chain: Binance -> CoinGecko -> Kraken -> last cached rate.
   */
  async getRate(crypto: string): Promise<{ rate: Decimal; source: string; timestamp: Date }> {
    const symbol = crypto.toUpperCase();

    // Stablecoins are always 1:1
    if (symbol === 'USDT' || symbol === 'USDC') {
      return { rate: new Decimal(1), source: 'pegged', timestamp: new Date() };
    }

    // Check Redis cache first
    const cacheKey = `${RATE_CACHE_PREFIX}${symbol}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        rate: new Decimal(parsed.rate),
        source: parsed.source,
        timestamp: new Date(parsed.timestamp),
      };
    }

    // Fetch from all sources in parallel
    const [binanceResult, coingeckoResult, krakenResult] = await Promise.all([
      fetchBinanceRate(symbol),
      fetchCoinGeckoRate(symbol),
      fetchKrakenRate(symbol),
    ]);

    const allResults: RateFetchResult[] = [];
    if (binanceResult) allResults.push(binanceResult);
    if (coingeckoResult) allResults.push(coingeckoResult);
    if (krakenResult) allResults.push(krakenResult);

    // Log every successful fetch to DB for audit
    await this.logRateFetches(symbol, allResults);

    // If no sources returned data, try fallback
    if (allResults.length === 0) {
      return this.getFallbackRate(symbol);
    }

    // Filter outliers and calculate median
    const filtered = filterOutliers(allResults);
    const medianRate = calculateMedian(filtered.map((r) => r.rate));

    // Determine source description
    const sources = filtered.map((r) => r.source).join('+');
    const sourceDesc = filtered.length > 1 ? `median(${sources})` : sources;

    const result = {
      rate: medianRate.toDecimalPlaces(8),
      source: sourceDesc,
      timestamp: new Date(),
    };

    // Cache in Redis
    await redis.setex(cacheKey, RATE_CACHE_TTL, JSON.stringify({
      rate: result.rate.toString(),
      source: result.source,
      timestamp: result.timestamp.toISOString(),
    }));

    // Store as fallback (longer TTL)
    await redis.set(`${RATE_FALLBACK_PREFIX}${symbol}`, JSON.stringify({
      rate: result.rate.toString(),
      source: result.source,
      timestamp: result.timestamp.toISOString(),
    }));

    // Log the median rate to DB as well
    await this.logRate(symbol, result.rate, sourceDesc);

    logger.info(`Exchange rate for ${symbol}: ${result.rate} USDT (source: ${sourceDesc}, ${filtered.length} sources)`);

    return result;
  }

  /**
   * Get individual source rates (for comparison/debugging).
   */
  async getAllSourceRates(crypto: string): Promise<RateFetchResult[]> {
    const symbol = crypto.toUpperCase();

    const [binance, coingecko, kraken] = await Promise.all([
      fetchBinanceRate(symbol),
      fetchCoinGeckoRate(symbol),
      fetchKrakenRate(symbol),
    ]);

    const results: RateFetchResult[] = [];
    if (binance) results.push(binance);
    if (coingecko) results.push(coingecko);
    if (kraken) results.push(kraken);

    return results;
  }

  /**
   * Batch fetch rates for multiple cryptos at once.
   */
  async getRates(cryptos: string[]): Promise<Record<string, { rate: Decimal; source: string }>> {
    const results: Record<string, { rate: Decimal; source: string }> = {};

    await Promise.all(
      cryptos.map(async (crypto) => {
        try {
          const { rate, source } = await this.getRate(crypto);
          results[crypto.toUpperCase()] = { rate, source };
        } catch (error) {
          logger.warn(`Failed to fetch rate for ${crypto}`, { error });
        }
      }),
    );

    return results;
  }

  /**
   * Get fallback rate from Redis (no TTL key).
   */
  private async getFallbackRate(
    symbol: string,
  ): Promise<{ rate: Decimal; source: string; timestamp: Date }> {
    const fallback = await redis.get(`${RATE_FALLBACK_PREFIX}${symbol}`);
    if (fallback) {
      const parsed = JSON.parse(fallback);
      logger.warn(`Using fallback rate for ${symbol}: ${parsed.rate}`, {
        originalSource: parsed.source,
        originalTimestamp: parsed.timestamp,
      });
      return {
        rate: new Decimal(parsed.rate),
        source: `fallback(${parsed.source})`,
        timestamp: new Date(parsed.timestamp),
      };
    }

    throw new Error(`No exchange rate available for ${symbol} from any source`);
  }

  /**
   * Log a single rate to the ExchangeRateLog table for audit trail.
   */
  async logRate(crypto: string, rate: Decimal, source: string): Promise<void> {
    try {
      await prisma.exchangeRateLog.create({
        data: {
          crypto: crypto.toUpperCase(),
          usdtRate: rate,
          source,
        },
      });
    } catch (error) {
      // Rate logging should never break the main flow
      logger.error('Failed to log exchange rate', { crypto, rate: rate.toString(), source, error });
    }
  }

  /**
   * Log all fetched rates to the ExchangeRateLog table.
   */
  private async logRateFetches(crypto: string, results: RateFetchResult[]): Promise<void> {
    if (results.length === 0) return;

    try {
      await prisma.exchangeRateLog.createMany({
        data: results.map((r) => ({
          crypto: crypto.toUpperCase(),
          usdtRate: r.rate,
          source: r.source,
          fetchedAt: r.timestamp,
        })),
      });
    } catch (error) {
      logger.error('Failed to log exchange rate fetches', { crypto, error });
    }
  }

  /**
   * Get recent rate history for a crypto (for display/debugging).
   */
  async getRateHistory(
    crypto: string,
    hours: number = 24,
    limit: number = 100,
  ): Promise<Array<{ rate: Decimal; source: string; fetchedAt: Date }>> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const logs = await prisma.exchangeRateLog.findMany({
      where: {
        crypto: crypto.toUpperCase(),
        fetchedAt: { gte: since },
      },
      orderBy: { fetchedAt: 'desc' },
      take: limit,
    });

    return logs.map((l) => ({
      rate: l.usdtRate,
      source: l.source,
      fetchedAt: l.fetchedAt,
    }));
  }
}

export const rateAggregatorService = new RateAggregatorService();
