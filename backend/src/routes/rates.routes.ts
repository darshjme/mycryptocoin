/**
 * Exchange Rate Routes (Public — no auth required)
 *
 * GET /rates        — All exchange rates
 * GET /rates/:crypto — Specific crypto rate
 */

import { Router, Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { getAllSupportedCryptos } from '../config/crypto';
import { logger } from '../utils/logger';

const router = Router();

const CACHE_KEY = 'exchange_rates';
const CACHE_TTL_SEC = 60; // Refresh every 60 seconds

interface CryptoRate {
  crypto: string;
  network: string;
  token: string;
  name: string;
  usdRate: number;
  usdtRate: number;
  btcRate: number;
  change24h: number;
  lastUpdated: string;
}

/**
 * Fetch rates from CoinGecko or similar aggregator.
 * Falls back to cached data if the API is unavailable.
 */
async function fetchRates(): Promise<CryptoRate[]> {
  // Check cache first
  const cached = await redis.get(CACHE_KEY);
  if (cached) {
    return JSON.parse(cached);
  }

  // Map token symbols to CoinGecko IDs
  const geckoIds: Record<string, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    SOL: 'solana',
    LTC: 'litecoin',
    BNB: 'binancecoin',
    TRX: 'tron',
    MATIC: 'matic-network',
    AVAX: 'avalanche-2',
    DOT: 'polkadot',
    DOGE: 'dogecoin',
    XRP: 'ripple',
    XMR: 'monero',
    ZEC: 'zcash',
    BCH: 'bitcoin-cash',
    ADA: 'cardano',
    USDT: 'tether',
    USDC: 'usd-coin',
    DAI: 'dai',
    SHIB: 'shiba-inu',
    PEPE: 'pepe',
    LINK: 'chainlink',
    UNI: 'uniswap',
    AAVE: 'aave',
    ARB: 'arbitrum',
    OP: 'optimism',
  };

  const ids = Object.values(geckoIds).join(',');

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,btc&include_24hr_change=true`,
      { signal: AbortSignal.timeout(10000) },
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API returned ${response.status}`);
    }

    const data = await response.json() as Record<string, any>;
    const now = new Date().toISOString();

    const rates: CryptoRate[] = [];
    const cryptos = getAllSupportedCryptos();

    // Build unique token set
    const seenTokens = new Set<string>();

    for (const crypto of cryptos) {
      const tokenKey = crypto.token;
      if (seenTokens.has(tokenKey)) continue;
      seenTokens.add(tokenKey);

      const geckoId = geckoIds[tokenKey];
      if (!geckoId || !data[geckoId]) continue;

      const priceData = data[geckoId];
      rates.push({
        crypto: `${crypto.network}:${tokenKey}`,
        network: crypto.network,
        token: tokenKey,
        name: crypto.name,
        usdRate: priceData.usd || 0,
        usdtRate: priceData.usd || 0, // USDT ~= USD
        btcRate: priceData.btc || 0,
        change24h: priceData.usd_24h_change || 0,
        lastUpdated: now,
      });
    }

    // Cache the rates
    await redis.setex(CACHE_KEY, CACHE_TTL_SEC, JSON.stringify(rates));

    logger.info(`Exchange rates updated: ${rates.length} assets`);
    return rates;
  } catch (error) {
    logger.error('Failed to fetch exchange rates', { error });

    // Return stale cache if available
    const stale = await redis.get(`${CACHE_KEY}:stale`);
    if (stale) return JSON.parse(stale);

    // Return empty if no cache
    return [];
  }
}

// GET /rates — all exchange rates
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rates = await fetchRates();
    res.json({
      success: true,
      data: rates,
      meta: {
        count: rates.length,
        cacheRefreshSeconds: CACHE_TTL_SEC,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /rates/:crypto — specific crypto rate (e.g., /rates/BTC or /rates/ETHEREUM:ETH)
router.get('/:crypto', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rates = await fetchRates();
    const query = req.params.crypto.toUpperCase();

    const match = rates.find((r) =>
      r.token === query ||
      r.crypto === query ||
      r.name.toUpperCase() === query
    );

    if (!match) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Rate not found for ${req.params.crypto}` },
      });
    }

    res.json({ success: true, data: match });
  } catch (error) {
    next(error);
  }
});

export default router;
