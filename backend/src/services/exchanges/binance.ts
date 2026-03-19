/**
 * MyCryptoCoin — Binance CEX Integration
 *
 * Production-grade Binance spot API integration for:
 * - Market order execution (sell crypto -> USDT)
 * - Deposit address management
 * - Withdrawal to TRON wallet
 * - Rate fetching from Binance ticker
 *
 * All API keys are stored AES-256-GCM encrypted in the ExchangeConfig table.
 */

import crypto from 'node:crypto';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../config/database';
import { decrypt } from '../../config/encryption';
import { logger } from '../../utils/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BinanceCredentials {
  apiKey: string;
  apiSecret: string;
}

interface BinanceTickerResponse {
  symbol: string;
  price: string;
}

interface BinanceOrderResponse {
  symbol: string;
  orderId: number;
  clientOrderId: string;
  transactTime: number;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: string;
  type: string;
  side: string;
  fills: Array<{
    price: string;
    qty: string;
    commission: string;
    commissionAsset: string;
  }>;
}

interface BinanceWithdrawResponse {
  id: string;
  txId?: string;
}

interface BinanceDepositAddressResponse {
  address: string;
  coin: string;
  tag?: string;
  url: string;
}

// ---------------------------------------------------------------------------
// Binance API symbol mapping
// ---------------------------------------------------------------------------

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

const BINANCE_NETWORK_MAP: Record<string, string> = {
  BITCOIN: 'BTC',
  ETHEREUM: 'ETH',
  BSC: 'BSC',
  SOLANA: 'SOL',
  TRON: 'TRX',
  POLYGON: 'MATIC',
  AVALANCHE: 'AVAXC',
  LITECOIN: 'LTC',
  DOGECOIN: 'DOGE',
  RIPPLE: 'XRP',
};

const BASE_URL = 'https://api.binance.com';

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class BinanceService {
  private credentials: BinanceCredentials | null = null;

  /**
   * Load and decrypt API credentials from the ExchangeConfig table.
   */
  private async getCredentials(): Promise<BinanceCredentials> {
    if (this.credentials) return this.credentials;

    const config = await prisma.exchangeConfig.findUnique({
      where: { name: 'binance' },
    });

    if (!config || !config.isActive) {
      throw new Error('Binance exchange config not found or inactive');
    }

    if (!config.apiKeyEncrypted || !config.apiSecretEncrypted) {
      throw new Error('Binance API credentials not configured');
    }

    this.credentials = {
      apiKey: decrypt(config.apiKeyEncrypted),
      apiSecret: decrypt(config.apiSecretEncrypted),
    };

    return this.credentials;
  }

  /**
   * Clear cached credentials (call after key rotation).
   */
  clearCredentials(): void {
    this.credentials = null;
  }

  /**
   * Sign a Binance API request using HMAC-SHA256.
   */
  private signRequest(params: Record<string, string>, secret: string): string {
    const queryString = Object.entries(params)
      .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
      .join('&');

    const signature = crypto
      .createHmac('sha256', secret)
      .update(queryString)
      .digest('hex');

    return `${queryString}&signature=${signature}`;
  }

  /**
   * Make an authenticated request to Binance API.
   */
  private async authenticatedRequest<T>(
    method: 'GET' | 'POST' | 'DELETE',
    endpoint: string,
    params: Record<string, string> = {},
  ): Promise<T> {
    const { apiKey, apiSecret } = await this.getCredentials();

    params.timestamp = Date.now().toString();
    params.recvWindow = '10000';

    const signedQuery = this.signRequest(params, apiSecret);
    const url = `${BASE_URL}${endpoint}?${signedQuery}`;

    const response = await fetch(url, {
      method,
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error('Binance API error', {
        endpoint,
        status: response.status,
        body: errorBody,
      });
      throw new Error(`Binance API error ${response.status}: ${errorBody}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Fetch the current spot price for a crypto/USDT pair.
   * No authentication required.
   */
  async getTickerPrice(crypto: string): Promise<Decimal> {
    const symbol = BINANCE_PAIRS[crypto.toUpperCase()];
    if (!symbol) {
      throw new Error(`Unsupported crypto for Binance: ${crypto}`);
    }

    const response = await fetch(
      `${BASE_URL}/api/v3/ticker/price?symbol=${symbol}`,
    );

    if (!response.ok) {
      throw new Error(`Binance ticker error: ${response.status}`);
    }

    const data = (await response.json()) as BinanceTickerResponse;
    return new Decimal(data.price);
  }

  /**
   * Execute a market sell order: sell crypto for USDT.
   * Returns the filled order details.
   */
  async marketSell(
    crypto: string,
    amount: Decimal,
  ): Promise<{
    orderId: string;
    executedQty: Decimal;
    usdtReceived: Decimal;
    avgPrice: Decimal;
    fees: Decimal;
  }> {
    const symbol = BINANCE_PAIRS[crypto.toUpperCase()];
    if (!symbol) {
      throw new Error(`Unsupported crypto for Binance market sell: ${crypto}`);
    }

    const params: Record<string, string> = {
      symbol,
      side: 'SELL',
      type: 'MARKET',
      quantity: amount.toFixed(8),
    };

    const order = await this.authenticatedRequest<BinanceOrderResponse>(
      'POST',
      '/api/v3/order',
      params,
    );

    if (order.status !== 'FILLED') {
      logger.warn('Binance order not immediately filled', {
        orderId: order.orderId,
        status: order.status,
      });
    }

    // Calculate total fees from fills
    let totalFees = new Decimal(0);
    for (const fill of order.fills || []) {
      if (fill.commissionAsset === 'USDT') {
        totalFees = totalFees.add(new Decimal(fill.commission));
      }
    }

    const executedQty = new Decimal(order.executedQty);
    const usdtReceived = new Decimal(order.cummulativeQuoteQty);
    const avgPrice = executedQty.gt(0)
      ? usdtReceived.div(executedQty)
      : new Decimal(0);

    logger.info('Binance market sell executed', {
      symbol,
      orderId: order.orderId,
      executedQty: executedQty.toString(),
      usdtReceived: usdtReceived.toString(),
      avgPrice: avgPrice.toString(),
      fees: totalFees.toString(),
    });

    return {
      orderId: order.orderId.toString(),
      executedQty,
      usdtReceived,
      avgPrice,
      fees: totalFees,
    };
  }

  /**
   * Get the deposit address for a specific crypto on Binance.
   */
  async getDepositAddress(
    crypto: string,
    network?: string,
  ): Promise<{ address: string; tag?: string }> {
    const params: Record<string, string> = {
      coin: crypto.toUpperCase(),
    };

    if (network) {
      const binanceNetwork = BINANCE_NETWORK_MAP[network.toUpperCase()];
      if (binanceNetwork) {
        params.network = binanceNetwork;
      }
    }

    const result = await this.authenticatedRequest<BinanceDepositAddressResponse>(
      'GET',
      '/sapi/v1/capital/deposit/address',
      params,
    );

    return {
      address: result.address,
      tag: result.tag,
    };
  }

  /**
   * Withdraw USDT to a TRON address.
   */
  async withdrawUsdt(
    toAddress: string,
    amount: Decimal,
    network: string = 'TRX', // TRC-20
  ): Promise<{ withdrawId: string; txId?: string }> {
    const binanceNetwork = BINANCE_NETWORK_MAP[network.toUpperCase()] || network;

    const params: Record<string, string> = {
      coin: 'USDT',
      address: toAddress,
      amount: amount.toFixed(2),
      network: binanceNetwork,
    };

    const result = await this.authenticatedRequest<BinanceWithdrawResponse>(
      'POST',
      '/sapi/v1/capital/withdraw/apply',
      params,
    );

    logger.info('Binance USDT withdrawal initiated', {
      withdrawId: result.id,
      toAddress,
      amount: amount.toString(),
      network: binanceNetwork,
    });

    return {
      withdrawId: result.id,
      txId: result.txId,
    };
  }

  /**
   * Get account balances for all assets.
   */
  async getBalances(): Promise<Record<string, Decimal>> {
    const result = await this.authenticatedRequest<{
      balances: Array<{ asset: string; free: string; locked: string }>;
    }>('GET', '/api/v3/account');

    const balances: Record<string, Decimal> = {};
    for (const b of result.balances) {
      const free = new Decimal(b.free);
      if (free.gt(0)) {
        balances[b.asset] = free;
      }
    }

    return balances;
  }

  /**
   * Check if a symbol pair is supported for trading.
   */
  isSupported(crypto: string): boolean {
    return crypto.toUpperCase() in BINANCE_PAIRS;
  }
}

export const binanceService = new BinanceService();
