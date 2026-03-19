/**
 * Testnet Configuration
 *
 * Toggle via API key prefix: mcc_test_ uses testnets, mcc_live_ uses mainnet.
 * Each testnet mirrors its mainnet counterpart with different RPC URLs,
 * chain IDs, and explorer URLs.
 */

import { CryptoNetwork, TokenSymbol } from '@mycryptocoin/shared';

export interface TestnetConfig {
  network: CryptoNetwork;
  token: TokenSymbol;
  testnetName: string;
  chainId?: number;
  rpcUrl: string;
  explorerUrl: string;
  explorerTxUrl: string;
  faucetUrl?: string;
  addressRegex: RegExp;
}

export const TESTNET_CONFIGS: Record<string, TestnetConfig> = {
  'BITCOIN:BTC': {
    network: CryptoNetwork.BITCOIN,
    token: TokenSymbol.BTC,
    testnetName: 'Bitcoin Testnet3',
    rpcUrl: 'https://blockstream.info/testnet/api',
    explorerUrl: 'https://blockstream.info/testnet',
    explorerTxUrl: 'https://blockstream.info/testnet/tx/',
    faucetUrl: 'https://bitcoinfaucet.uo1.net/',
    addressRegex: /^(tb1|[mn2])[a-zA-HJ-NP-Z0-9]{25,62}$/,
  },
  'ETHEREUM:ETH': {
    network: CryptoNetwork.ETHEREUM,
    token: TokenSymbol.ETH,
    testnetName: 'Ethereum Sepolia',
    chainId: 11155111,
    rpcUrl: 'https://rpc.sepolia.org',
    explorerUrl: 'https://sepolia.etherscan.io',
    explorerTxUrl: 'https://sepolia.etherscan.io/tx/',
    faucetUrl: 'https://sepoliafaucet.com/',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
  },
  'ETHEREUM:USDT': {
    network: CryptoNetwork.ETHEREUM,
    token: TokenSymbol.USDT,
    testnetName: 'USDT Sepolia',
    chainId: 11155111,
    rpcUrl: 'https://rpc.sepolia.org',
    explorerUrl: 'https://sepolia.etherscan.io',
    explorerTxUrl: 'https://sepolia.etherscan.io/tx/',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
  },
  'ETHEREUM:USDC': {
    network: CryptoNetwork.ETHEREUM,
    token: TokenSymbol.USDC,
    testnetName: 'USDC Sepolia',
    chainId: 11155111,
    rpcUrl: 'https://rpc.sepolia.org',
    explorerUrl: 'https://sepolia.etherscan.io',
    explorerTxUrl: 'https://sepolia.etherscan.io/tx/',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
  },
  'TRON:TRX': {
    network: CryptoNetwork.TRON,
    token: TokenSymbol.TRX,
    testnetName: 'TRON Nile',
    rpcUrl: 'https://nile.trongrid.io',
    explorerUrl: 'https://nile.tronscan.org',
    explorerTxUrl: 'https://nile.tronscan.org/#/transaction/',
    faucetUrl: 'https://nileex.io/join/getJoinPage',
    addressRegex: /^T[a-zA-HJ-NP-Z0-9]{33}$/,
  },
  'TRON:USDT': {
    network: CryptoNetwork.TRON,
    token: TokenSymbol.USDT,
    testnetName: 'USDT Nile',
    rpcUrl: 'https://nile.trongrid.io',
    explorerUrl: 'https://nile.tronscan.org',
    explorerTxUrl: 'https://nile.tronscan.org/#/transaction/',
    addressRegex: /^T[a-zA-HJ-NP-Z0-9]{33}$/,
  },
  'SOLANA:SOL': {
    network: CryptoNetwork.SOLANA,
    token: TokenSymbol.SOL,
    testnetName: 'Solana Devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    explorerUrl: 'https://explorer.solana.com/?cluster=devnet',
    explorerTxUrl: 'https://explorer.solana.com/tx/{tx}?cluster=devnet',
    faucetUrl: 'https://solfaucet.com/',
    addressRegex: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  },
  'BSC:BNB': {
    network: CryptoNetwork.BSC,
    token: TokenSymbol.BNB,
    testnetName: 'BSC Testnet',
    chainId: 97,
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    explorerUrl: 'https://testnet.bscscan.com',
    explorerTxUrl: 'https://testnet.bscscan.com/tx/',
    faucetUrl: 'https://testnet.binance.org/faucet-smart',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
  },
  'POLYGON:MATIC': {
    network: CryptoNetwork.POLYGON,
    token: TokenSymbol.MATIC,
    testnetName: 'Polygon Amoy',
    chainId: 80002,
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    explorerUrl: 'https://amoy.polygonscan.com',
    explorerTxUrl: 'https://amoy.polygonscan.com/tx/',
    faucetUrl: 'https://faucet.polygon.technology/',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
  },
  'AVALANCHE:AVAX': {
    network: CryptoNetwork.AVALANCHE,
    token: TokenSymbol.AVAX,
    testnetName: 'Avalanche Fuji',
    chainId: 43113,
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    explorerUrl: 'https://testnet.snowtrace.io',
    explorerTxUrl: 'https://testnet.snowtrace.io/tx/',
    faucetUrl: 'https://faucet.avax.network/',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
  },
  'ARBITRUM:ETH': {
    network: CryptoNetwork.ARBITRUM,
    token: TokenSymbol.ETH,
    testnetName: 'Arbitrum Sepolia',
    chainId: 421614,
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorerUrl: 'https://sepolia.arbiscan.io',
    explorerTxUrl: 'https://sepolia.arbiscan.io/tx/',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
  },
  'OPTIMISM:ETH': {
    network: CryptoNetwork.OPTIMISM,
    token: TokenSymbol.ETH,
    testnetName: 'OP Sepolia',
    chainId: 11155420,
    rpcUrl: 'https://sepolia.optimism.io',
    explorerUrl: 'https://sepolia-optimism.etherscan.io',
    explorerTxUrl: 'https://sepolia-optimism.etherscan.io/tx/',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
  },
  'BASE:ETH': {
    network: CryptoNetwork.BASE,
    token: TokenSymbol.ETH,
    testnetName: 'Base Sepolia',
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    explorerTxUrl: 'https://sepolia.basescan.org/tx/',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
  },
  'LIGHTNING:BTC': {
    network: CryptoNetwork.LIGHTNING,
    token: TokenSymbol.BTC,
    testnetName: 'Lightning Testnet',
    rpcUrl: 'https://localhost:8080', // LND testnet
    explorerUrl: 'https://mempool.space/testnet/lightning',
    explorerTxUrl: 'https://mempool.space/testnet/lightning/payment/',
    addressRegex: /^lntb[0-9a-z]+$/i,
  },
};

/**
 * Determine if an API key is a test key.
 */
export function isTestApiKey(apiKeyPrefix: string): boolean {
  return apiKeyPrefix.startsWith('mcc_test_');
}

/**
 * Determine if an API key is a live key.
 */
export function isLiveApiKey(apiKeyPrefix: string): boolean {
  return apiKeyPrefix.startsWith('mcc_live_');
}

/**
 * Get the appropriate network config based on API key type.
 */
export function getTestnetConfig(cryptoKey: string): TestnetConfig | null {
  return TESTNET_CONFIGS[cryptoKey] || null;
}

/**
 * Get all available testnet configurations.
 */
export function getAllTestnets(): TestnetConfig[] {
  return Object.values(TESTNET_CONFIGS);
}
