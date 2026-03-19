/**
 * MyCryptoCoin — DEX Aggregator Integration
 *
 * Unified interface for decentralized exchange swaps:
 * - 1inch API for EVM chains (Ethereum, BSC, Polygon, Arbitrum)
 * - Jupiter API for Solana
 *
 * Features:
 * - Quote fetching with slippage protection
 * - Swap execution with tx monitoring
 * - Multi-chain routing
 * - Gas estimation
 */

import { Decimal } from '@prisma/client/runtime/library';
import { logger } from '../../utils/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DexQuote {
  fromToken: string;
  toToken: string;
  fromAmount: Decimal;
  toAmount: Decimal;
  estimatedGas: Decimal; // in native token
  gasCostUsdt: Decimal;  // estimated gas cost in USDT
  priceImpact: Decimal;  // percentage
  route: string;         // human-readable route description
  protocol: string;      // '1inch' | 'jupiter'
  chainId: number;
  rawQuote: unknown;     // original quote response for execution
}

export interface DexSwapResult {
  txHash: string;
  fromAmount: Decimal;
  toAmount: Decimal;
  actualSlippage: Decimal;
  gasCost: Decimal;
  protocol: string;
  status: 'pending' | 'confirmed' | 'failed';
}

// ---------------------------------------------------------------------------
// Chain configuration
// ---------------------------------------------------------------------------

const CHAIN_IDS: Record<string, number> = {
  ETHEREUM: 1,
  BSC: 56,
  POLYGON: 137,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  AVALANCHE: 43114,
  BASE: 8453,
};

// USDT contract addresses per chain
const USDT_CONTRACTS: Record<number, string> = {
  1: '0xdAC17F958D2ee523a2206206994597C13D831ec7',     // Ethereum
  56: '0x55d398326f99059fF775485246999027B3197955',     // BSC
  137: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',   // Polygon
  42161: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // Arbitrum
  10: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',    // Optimism
  43114: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', // Avalanche
  8453: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',  // Base
};

// Native token addresses (for wrapping/gas estimation)
const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

// Token addresses per chain for common cryptos
const TOKEN_ADDRESSES: Record<number, Record<string, string>> = {
  1: { // Ethereum
    ETH: NATIVE_TOKEN_ADDRESS,
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    LINK: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
  },
  56: { // BSC
    BNB: NATIVE_TOKEN_ADDRESS,
    WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    BTCB: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    ETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
  },
  137: { // Polygon
    MATIC: NATIVE_TOKEN_ADDRESS,
    WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    WBTC: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
  },
};

// Solana token mints
const SOLANA_MINTS: Record<string, string> = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
};

const ONEINCH_BASE_URL = 'https://api.1inch.dev/swap/v6.0';
const JUPITER_BASE_URL = 'https://quote-api.jup.ag/v6';

// ---------------------------------------------------------------------------
// 1inch Integration (EVM chains)
// ---------------------------------------------------------------------------

class OneInchService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.ONEINCH_API_KEY || '';
  }

  /**
   * Get a swap quote from 1inch.
   */
  async getQuote(
    chainId: number,
    fromToken: string,
    toToken: string,
    amount: string, // in smallest unit (wei, etc.)
    slippage: number = 0.5,
  ): Promise<DexQuote> {
    if (!this.apiKey) {
      throw new Error('1inch API key not configured');
    }

    const url = `${ONEINCH_BASE_URL}/${chainId}/quote`;
    const params = new URLSearchParams({
      src: fromToken,
      dst: toToken,
      amount,
      includeGas: 'true',
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`1inch quote error ${response.status}: ${errorText}`);
    }

    const data = await response.json() as any;

    const fromAmount = new Decimal(amount);
    const toAmount = new Decimal(data.toAmount || data.dstAmount || '0');
    const estimatedGas = new Decimal(data.gas || data.estimatedGas || '0');

    return {
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      estimatedGas,
      gasCostUsdt: new Decimal(0), // calculated by caller
      priceImpact: new Decimal(0), // 1inch handles this internally
      route: `1inch-v6-chain-${chainId}`,
      protocol: '1inch',
      chainId,
      rawQuote: data,
    };
  }

  /**
   * Build and return the swap transaction data from 1inch.
   * The caller is responsible for signing and broadcasting.
   */
  async getSwapTx(
    chainId: number,
    fromToken: string,
    toToken: string,
    amount: string,
    fromAddress: string,
    slippage: number = 0.5,
  ): Promise<{
    to: string;
    data: string;
    value: string;
    gas: string;
  }> {
    if (!this.apiKey) {
      throw new Error('1inch API key not configured');
    }

    const url = `${ONEINCH_BASE_URL}/${chainId}/swap`;
    const params = new URLSearchParams({
      src: fromToken,
      dst: toToken,
      amount,
      from: fromAddress,
      slippage: slippage.toString(),
      disableEstimate: 'false',
      allowPartialFill: 'false',
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`1inch swap error ${response.status}: ${errorText}`);
    }

    const data = await response.json() as any;

    return {
      to: data.tx.to,
      data: data.tx.data,
      value: data.tx.value,
      gas: data.tx.gas?.toString() || '0',
    };
  }
}

// ---------------------------------------------------------------------------
// Jupiter Integration (Solana)
// ---------------------------------------------------------------------------

class JupiterService {
  /**
   * Get a swap quote from Jupiter for Solana tokens.
   */
  async getQuote(
    inputMint: string,
    outputMint: string,
    amount: string, // in lamports or smallest unit
    slippageBps: number = 50, // 0.5% = 50 basis points
  ): Promise<DexQuote> {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount,
      slippageBps: slippageBps.toString(),
      onlyDirectRoutes: 'false',
      asLegacyTransaction: 'false',
    });

    const response = await fetch(`${JUPITER_BASE_URL}/quote?${params}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jupiter quote error ${response.status}: ${errorText}`);
    }

    const data = await response.json() as any;

    const fromAmount = new Decimal(amount);
    const toAmount = new Decimal(data.outAmount || '0');
    const priceImpact = new Decimal(data.priceImpactPct || '0');

    return {
      fromToken: inputMint,
      toToken: outputMint,
      fromAmount,
      toAmount,
      estimatedGas: new Decimal(5000), // ~5000 lamports for Solana tx
      gasCostUsdt: new Decimal(0), // negligible on Solana
      priceImpact,
      route: `jupiter-v6-${data.routePlan?.length || 0}-hops`,
      protocol: 'jupiter',
      chainId: 0, // Solana
      rawQuote: data,
    };
  }

  /**
   * Get the swap transaction for Jupiter.
   * Returns serialized transaction for signing.
   */
  async getSwapTransaction(
    quoteResponse: unknown,
    userPublicKey: string,
  ): Promise<{ swapTransaction: string; lastValidBlockHeight: number }> {
    const response = await fetch(`${JUPITER_BASE_URL}/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jupiter swap error ${response.status}: ${errorText}`);
    }

    const data = await response.json() as any;

    return {
      swapTransaction: data.swapTransaction,
      lastValidBlockHeight: data.lastValidBlockHeight,
    };
  }
}

// ---------------------------------------------------------------------------
// Unified DEX Aggregator
// ---------------------------------------------------------------------------

export class DexAggregatorService {
  private oneInch: OneInchService;
  private jupiter: JupiterService;

  constructor() {
    this.oneInch = new OneInchService();
    this.jupiter = new JupiterService();
  }

  /**
   * Determine the best DEX for a given network.
   */
  private getProtocol(network: string): 'oneinch' | 'jupiter' {
    if (network.toUpperCase() === 'SOLANA') return 'jupiter';
    return 'oneinch';
  }

  /**
   * Get the chain ID for a network.
   */
  private getChainId(network: string): number {
    const chainId = CHAIN_IDS[network.toUpperCase()];
    if (!chainId && network.toUpperCase() !== 'SOLANA') {
      throw new Error(`Unsupported network for DEX swap: ${network}`);
    }
    return chainId || 0;
  }

  /**
   * Resolve token address for a given crypto on a specific chain.
   */
  private resolveTokenAddress(crypto: string, network: string): string {
    const upperCrypto = crypto.toUpperCase();
    const upperNetwork = network.toUpperCase();

    // Solana uses mints
    if (upperNetwork === 'SOLANA') {
      const mint = SOLANA_MINTS[upperCrypto];
      if (!mint) throw new Error(`No Solana mint for ${upperCrypto}`);
      return mint;
    }

    // EVM chains
    const chainId = this.getChainId(network);

    // USDT target
    if (upperCrypto === 'USDT') {
      const addr = USDT_CONTRACTS[chainId];
      if (!addr) throw new Error(`No USDT contract for chain ${chainId}`);
      return addr;
    }

    // Source token
    const chainTokens = TOKEN_ADDRESSES[chainId];
    if (chainTokens && chainTokens[upperCrypto]) {
      return chainTokens[upperCrypto];
    }

    throw new Error(`No token address for ${upperCrypto} on chain ${chainId}`);
  }

  /**
   * Get a quote for swapping crypto to USDT via DEX.
   */
  async getQuote(
    crypto: string,
    network: string,
    amount: Decimal,
    decimals: number = 18,
  ): Promise<DexQuote> {
    const protocol = this.getProtocol(network);
    const amountRaw = amount
      .mul(new Decimal(10).pow(decimals))
      .toFixed(0);

    if (protocol === 'jupiter') {
      const inputMint = this.resolveTokenAddress(crypto, 'SOLANA');
      const outputMint = SOLANA_MINTS['USDT'];

      const quote = await this.jupiter.getQuote(
        inputMint,
        outputMint,
        amountRaw,
      );

      logger.info('Jupiter quote received', {
        crypto,
        amount: amount.toString(),
        toAmount: quote.toAmount.toString(),
        priceImpact: quote.priceImpact.toString(),
      });

      return quote;
    }

    // 1inch for EVM
    const chainId = this.getChainId(network);
    const fromToken = this.resolveTokenAddress(crypto, network);
    const toToken = USDT_CONTRACTS[chainId];

    if (!toToken) {
      throw new Error(`No USDT contract for network ${network}`);
    }

    const quote = await this.oneInch.getQuote(
      chainId,
      fromToken,
      toToken,
      amountRaw,
    );

    logger.info('1inch quote received', {
      crypto,
      network,
      chainId,
      amount: amount.toString(),
      toAmount: quote.toAmount.toString(),
    });

    return quote;
  }

  /**
   * Execute a swap from crypto to USDT via DEX.
   * Returns swap details and tx hash.
   */
  async executeSwap(
    crypto: string,
    network: string,
    amount: Decimal,
    fromAddress: string,
    decimals: number = 18,
    maxSlippage: number = 0.5,
  ): Promise<{
    txData: unknown;
    quote: DexQuote;
  }> {
    const protocol = this.getProtocol(network);
    const amountRaw = amount
      .mul(new Decimal(10).pow(decimals))
      .toFixed(0);

    if (protocol === 'jupiter') {
      const inputMint = this.resolveTokenAddress(crypto, 'SOLANA');
      const outputMint = SOLANA_MINTS['USDT'];

      const quote = await this.jupiter.getQuote(
        inputMint,
        outputMint,
        amountRaw,
        Math.round(maxSlippage * 100), // convert to basis points
      );

      // Check slippage/price impact
      if (quote.priceImpact.abs().gt(maxSlippage)) {
        throw new Error(
          `Price impact too high: ${quote.priceImpact}% (max: ${maxSlippage}%)`,
        );
      }

      const swapTx = await this.jupiter.getSwapTransaction(
        quote.rawQuote,
        fromAddress,
      );

      return { txData: swapTx, quote };
    }

    // 1inch EVM
    const chainId = this.getChainId(network);
    const fromToken = this.resolveTokenAddress(crypto, network);
    const toToken = USDT_CONTRACTS[chainId];

    const quote = await this.oneInch.getQuote(
      chainId,
      fromToken,
      toToken!,
      amountRaw,
    );

    const swapTx = await this.oneInch.getSwapTx(
      chainId,
      fromToken,
      toToken!,
      amountRaw,
      fromAddress,
      maxSlippage,
    );

    return { txData: swapTx, quote };
  }

  /**
   * Check if a network is supported for DEX swaps.
   */
  isSupported(network: string): boolean {
    const upper = network.toUpperCase();
    return upper === 'SOLANA' || upper in CHAIN_IDS;
  }

  /**
   * Get the protocol name for a network (for logging/DB storage).
   */
  getProtocolName(network: string): string {
    return this.getProtocol(network) === 'jupiter'
      ? 'dex_jupiter'
      : 'dex_1inch';
  }
}

export const dexAggregatorService = new DexAggregatorService();
