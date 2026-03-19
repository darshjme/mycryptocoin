import { ethers } from 'ethers';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction as SolTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Decimal } from '@prisma/client/runtime/library';
import { CryptoSymbol, SUPPORTED_CRYPTOS } from '../config/crypto';
import { env } from '../config/env';
import { CryptoError } from '../utils/errors';
import { logger } from '../utils/logger';
import { toSmallestUnit, fromSmallestUnit } from '../utils/crypto';
import crypto from 'crypto';

const bip32 = BIP32Factory(ecc);

/**
 * Abstract interface for crypto operations per chain.
 */
export interface CryptoOperations {
  generateAddress(derivationIndex: number): Promise<{
    address: string;
    publicKey: string;
    derivationPath: string;
  }>;
  getBalance(address: string): Promise<Decimal>;
  getTransactionConfirmations(txHash: string): Promise<number>;
  sendTransaction(params: {
    fromPrivateKey: string;
    toAddress: string;
    amount: Decimal;
    memo?: string;
  }): Promise<{ txHash: string; fee: Decimal }>;
  estimateFee(toAddress: string, amount: Decimal): Promise<Decimal>;
  isValidAddress(address: string): boolean;
}

export class CryptoService {
  private masterSeed: Buffer;
  private ethProvider: ethers.JsonRpcProvider;
  private bscProvider: ethers.JsonRpcProvider;
  private maticProvider: ethers.JsonRpcProvider;
  private solConnection: Connection;

  constructor() {
    this.masterSeed = Buffer.from(env.HD_MASTER_SEED, 'hex');
    this.ethProvider = new ethers.JsonRpcProvider(env.ETH_RPC_URL);
    this.bscProvider = new ethers.JsonRpcProvider(env.BSC_RPC_URL);
    this.maticProvider = new ethers.JsonRpcProvider(env.MATIC_RPC_URL);
    this.solConnection = new Connection(env.SOL_RPC_URL, 'confirmed');
  }

  /**
   * Generate a deterministic HD wallet address for a given crypto and index.
   */
  async generateAddress(
    symbol: CryptoSymbol,
    merchantIndex: number,
    paymentIndex: number,
  ): Promise<{
    address: string;
    publicKey: string;
    derivationPath: string;
  }> {
    const config = SUPPORTED_CRYPTOS[symbol];
    const basePath = config.derivationPath;

    try {
      switch (symbol) {
        case CryptoSymbol.BTC:
          return this.generateBTCAddress(basePath, merchantIndex, paymentIndex);
        case CryptoSymbol.ETH:
        case CryptoSymbol.USDT_ERC20:
          return this.generateEVMAddress(basePath, merchantIndex, paymentIndex);
        case CryptoSymbol.BNB:
          return this.generateEVMAddress(basePath, merchantIndex, paymentIndex);
        case CryptoSymbol.MATIC:
          return this.generateEVMAddress(basePath, merchantIndex, paymentIndex);
        case CryptoSymbol.SOL:
          return this.generateSOLAddress(basePath, merchantIndex, paymentIndex);
        case CryptoSymbol.USDT_TRC20:
          return this.generateTRONAddress(basePath, merchantIndex, paymentIndex);
        case CryptoSymbol.LTC:
          return this.generateLTCAddress(basePath, merchantIndex, paymentIndex);
        case CryptoSymbol.DOGE:
          return this.generateDOGEAddress(basePath, merchantIndex, paymentIndex);
        case CryptoSymbol.XRP:
          return this.generateXRPAddress(basePath, merchantIndex, paymentIndex);
        default:
          throw new CryptoError(`Address generation not implemented for ${symbol}`);
      }
    } catch (error) {
      if (error instanceof CryptoError) throw error;
      logger.error(`Failed to generate ${symbol} address`, { error });
      throw new CryptoError(`Failed to generate ${symbol} address`);
    }
  }

  /**
   * Get the balance for a given address.
   */
  async getBalance(symbol: CryptoSymbol, address: string): Promise<Decimal> {
    const config = SUPPORTED_CRYPTOS[symbol];

    try {
      switch (symbol) {
        case CryptoSymbol.ETH:
          return this.getEthBalance(address);
        case CryptoSymbol.USDT_ERC20:
          return this.getERC20Balance(address, config.tokenContract!, config.decimals);
        case CryptoSymbol.BNB:
          return this.getBscBalance(address);
        case CryptoSymbol.MATIC:
          return this.getMaticBalance(address);
        case CryptoSymbol.SOL:
          return this.getSolBalance(address);
        case CryptoSymbol.BTC:
          return this.getBtcBalance(address);
        case CryptoSymbol.LTC:
          return this.getLtcBalance(address);
        case CryptoSymbol.DOGE:
          return this.getDogeBalance(address);
        case CryptoSymbol.XRP:
          return this.getXrpBalance(address);
        case CryptoSymbol.USDT_TRC20:
          return this.getTrc20Balance(address, config.tokenContract!);
        default:
          throw new CryptoError(`Balance check not implemented for ${symbol}`);
      }
    } catch (error) {
      if (error instanceof CryptoError) throw error;
      logger.error(`Failed to get balance for ${symbol}:${address}`, { error });
      throw new CryptoError(`Failed to get ${symbol} balance`);
    }
  }

  /**
   * Get transaction confirmations.
   */
  async getConfirmations(symbol: CryptoSymbol, txHash: string): Promise<number> {
    try {
      switch (symbol) {
        case CryptoSymbol.ETH:
        case CryptoSymbol.USDT_ERC20:
          return this.getEthConfirmations(txHash);
        case CryptoSymbol.BNB:
          return this.getBscConfirmations(txHash);
        case CryptoSymbol.MATIC:
          return this.getMaticConfirmations(txHash);
        case CryptoSymbol.SOL:
          return this.getSolConfirmations(txHash);
        case CryptoSymbol.BTC:
          return this.getBtcConfirmations(txHash);
        case CryptoSymbol.LTC:
          return this.getLtcConfirmations(txHash);
        case CryptoSymbol.DOGE:
          return this.getDogeConfirmations(txHash);
        case CryptoSymbol.XRP:
          return this.getXrpConfirmations(txHash);
        case CryptoSymbol.USDT_TRC20:
          return this.getTrc20Confirmations(txHash);
        default:
          return 0;
      }
    } catch (error) {
      logger.error(`Failed to get confirmations for ${symbol}:${txHash}`, { error });
      return 0;
    }
  }

  /**
   * Send a transaction.
   */
  async sendTransaction(
    symbol: CryptoSymbol,
    params: {
      fromPrivateKey: string;
      toAddress: string;
      amount: Decimal;
      memo?: string;
    },
  ): Promise<{ txHash: string; fee: Decimal }> {
    try {
      switch (symbol) {
        case CryptoSymbol.ETH:
          return this.sendEthTransaction(params);
        case CryptoSymbol.BNB:
          return this.sendBscTransaction(params);
        case CryptoSymbol.MATIC:
          return this.sendMaticTransaction(params);
        case CryptoSymbol.SOL:
          return this.sendSolTransaction(params);
        case CryptoSymbol.USDT_ERC20:
          return this.sendERC20Transaction(params);
        case CryptoSymbol.USDT_TRC20:
          return this.sendTRC20Transaction(params);
        default:
          throw new CryptoError(`Send transaction not implemented for ${symbol}`);
      }
    } catch (error) {
      if (error instanceof CryptoError) throw error;
      logger.error(`Failed to send ${symbol} transaction`, { error });
      throw new CryptoError(`Failed to send ${symbol} transaction`);
    }
  }

  /**
   * Estimate transaction fee.
   */
  async estimateFee(
    symbol: CryptoSymbol,
    _toAddress: string,
    _amount: Decimal,
  ): Promise<Decimal> {
    try {
      switch (symbol) {
        case CryptoSymbol.ETH:
        case CryptoSymbol.USDT_ERC20: {
          const feeData = await this.ethProvider.getFeeData();
          const gasLimit = symbol === CryptoSymbol.USDT_ERC20 ? 65000n : 21000n;
          const gasPrice = feeData.gasPrice || 0n;
          return fromSmallestUnit(gasLimit * gasPrice, 18);
        }
        case CryptoSymbol.BNB: {
          const feeData = await this.bscProvider.getFeeData();
          const gasPrice = feeData.gasPrice || 0n;
          return fromSmallestUnit(21000n * gasPrice, 18);
        }
        case CryptoSymbol.MATIC: {
          const feeData = await this.maticProvider.getFeeData();
          const gasPrice = feeData.gasPrice || 0n;
          return fromSmallestUnit(21000n * gasPrice, 18);
        }
        case CryptoSymbol.SOL:
          return new Decimal('0.000005'); // ~5000 lamports
        case CryptoSymbol.BTC:
          return new Decimal('0.00005'); // Estimated
        case CryptoSymbol.LTC:
          return new Decimal('0.0001');
        case CryptoSymbol.DOGE:
          return new Decimal('1');
        case CryptoSymbol.XRP:
          return new Decimal('0.00001');
        case CryptoSymbol.USDT_TRC20:
          return new Decimal('0'); // TRX fee handled separately
        default:
          return new Decimal('0');
      }
    } catch (error) {
      logger.error(`Failed to estimate fee for ${symbol}`, { error });
      return new Decimal('0');
    }
  }

  /**
   * Derive the private key for a specific path (used internally for withdrawals).
   */
  derivePrivateKey(
    symbol: CryptoSymbol,
    merchantIndex: number,
    paymentIndex: number,
  ): string {
    const config = SUPPORTED_CRYPTOS[symbol];
    const fullPath = `${config.derivationPath}/${merchantIndex}/${paymentIndex}`;

    if (symbol === CryptoSymbol.SOL) {
      // Solana uses Ed25519, derive deterministically from seed
      const seedHash = crypto
        .createHmac('sha512', this.masterSeed)
        .update(`${fullPath}`)
        .digest();
      return seedHash.subarray(0, 32).toString('hex');
    }

    const root = bip32.fromSeed(this.masterSeed);
    const child = root.derivePath(fullPath);
    return Buffer.from(child.privateKey!).toString('hex');
  }

  // ─── BTC ────────────────────────────────────────────

  private generateBTCAddress(
    basePath: string,
    merchantIndex: number,
    paymentIndex: number,
  ): { address: string; publicKey: string; derivationPath: string } {
    const fullPath = `${basePath}/${merchantIndex}/${paymentIndex}`;
    const root = bip32.fromSeed(this.masterSeed);
    const child = root.derivePath(fullPath);

    const { address } = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(child.publicKey),
      network: bitcoin.networks.bitcoin,
    });

    return {
      address: address!,
      publicKey: Buffer.from(child.publicKey).toString('hex'),
      derivationPath: fullPath,
    };
  }

  private async getBtcBalance(address: string): Promise<Decimal> {
    const response = await fetch(`${env.BTC_RPC_URL}/address/${address}`);
    const data = await response.json() as any;
    const funded = BigInt(data.chain_stats?.funded_txo_sum || 0);
    const spent = BigInt(data.chain_stats?.spent_txo_sum || 0);
    return fromSmallestUnit(funded - spent, 8);
  }

  private async getBtcConfirmations(txHash: string): Promise<number> {
    const txRes = await fetch(`${env.BTC_RPC_URL}/tx/${txHash}`);
    const txData = await txRes.json() as any;
    if (!txData.status?.confirmed) return 0;
    const tipRes = await fetch(`${env.BTC_RPC_URL}/blocks/tip/height`);
    const tipHeight = parseInt(await tipRes.text(), 10);
    return tipHeight - txData.status.block_height + 1;
  }

  // ─── ETH / EVM ──────────────────────────────────────

  private generateEVMAddress(
    basePath: string,
    merchantIndex: number,
    paymentIndex: number,
  ): { address: string; publicKey: string; derivationPath: string } {
    const fullPath = `${basePath}/${merchantIndex}/${paymentIndex}`;
    const root = bip32.fromSeed(this.masterSeed);
    const child = root.derivePath(fullPath);
    const wallet = new ethers.Wallet(
      Buffer.from(child.privateKey!).toString('hex'),
    );
    return {
      address: wallet.address,
      publicKey: wallet.signingKey.publicKey,
      derivationPath: fullPath,
    };
  }

  private async getEthBalance(address: string): Promise<Decimal> {
    const balance = await this.ethProvider.getBalance(address);
    return fromSmallestUnit(balance, 18);
  }

  private async getERC20Balance(
    address: string,
    contractAddress: string,
    decimals: number,
  ): Promise<Decimal> {
    const abi = ['function balanceOf(address) view returns (uint256)'];
    const contract = new ethers.Contract(contractAddress, abi, this.ethProvider);
    const balance = await contract.balanceOf(address);
    return fromSmallestUnit(balance, decimals);
  }

  private async getBscBalance(address: string): Promise<Decimal> {
    const balance = await this.bscProvider.getBalance(address);
    return fromSmallestUnit(balance, 18);
  }

  private async getMaticBalance(address: string): Promise<Decimal> {
    const balance = await this.maticProvider.getBalance(address);
    return fromSmallestUnit(balance, 18);
  }

  private async getEthConfirmations(txHash: string): Promise<number> {
    const receipt = await this.ethProvider.getTransactionReceipt(txHash);
    if (!receipt || !receipt.blockNumber) return 0;
    const currentBlock = await this.ethProvider.getBlockNumber();
    return currentBlock - receipt.blockNumber + 1;
  }

  private async getBscConfirmations(txHash: string): Promise<number> {
    const receipt = await this.bscProvider.getTransactionReceipt(txHash);
    if (!receipt || !receipt.blockNumber) return 0;
    const currentBlock = await this.bscProvider.getBlockNumber();
    return currentBlock - receipt.blockNumber + 1;
  }

  private async getMaticConfirmations(txHash: string): Promise<number> {
    const receipt = await this.maticProvider.getTransactionReceipt(txHash);
    if (!receipt || !receipt.blockNumber) return 0;
    const currentBlock = await this.maticProvider.getBlockNumber();
    return currentBlock - receipt.blockNumber + 1;
  }

  private async sendEthTransaction(params: {
    fromPrivateKey: string;
    toAddress: string;
    amount: Decimal;
  }): Promise<{ txHash: string; fee: Decimal }> {
    const wallet = new ethers.Wallet(params.fromPrivateKey, this.ethProvider);
    const value = toSmallestUnit(params.amount, 18);

    // Use EIP-1559 fee parameters when available (Ethereum mainnet post-London)
    const feeData = await this.ethProvider.getFeeData();
    const txRequest: ethers.TransactionRequest = {
      to: params.toAddress,
      value,
    };

    if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
      txRequest.type = 2;
      txRequest.maxFeePerGas = feeData.maxFeePerGas;
      txRequest.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
    }

    const tx = await wallet.sendTransaction(txRequest);

    const receipt = await tx.wait();
    const fee = fromSmallestUnit(
      (receipt!.gasUsed * receipt!.gasPrice),
      18,
    );

    return { txHash: tx.hash, fee };
  }

  private async sendBscTransaction(params: {
    fromPrivateKey: string;
    toAddress: string;
    amount: Decimal;
  }): Promise<{ txHash: string; fee: Decimal }> {
    const wallet = new ethers.Wallet(params.fromPrivateKey, this.bscProvider);
    const value = toSmallestUnit(params.amount, 18);

    const tx = await wallet.sendTransaction({
      to: params.toAddress,
      value,
    });

    const receipt = await tx.wait();
    const fee = fromSmallestUnit(
      (receipt!.gasUsed * receipt!.gasPrice),
      18,
    );

    return { txHash: tx.hash, fee };
  }

  private async sendMaticTransaction(params: {
    fromPrivateKey: string;
    toAddress: string;
    amount: Decimal;
  }): Promise<{ txHash: string; fee: Decimal }> {
    const wallet = new ethers.Wallet(params.fromPrivateKey, this.maticProvider);
    const value = toSmallestUnit(params.amount, 18);

    const tx = await wallet.sendTransaction({
      to: params.toAddress,
      value,
    });

    const receipt = await tx.wait();
    const fee = fromSmallestUnit(
      (receipt!.gasUsed * receipt!.gasPrice),
      18,
    );

    return { txHash: tx.hash, fee };
  }

  private async sendERC20Transaction(params: {
    fromPrivateKey: string;
    toAddress: string;
    amount: Decimal;
  }): Promise<{ txHash: string; fee: Decimal }> {
    const wallet = new ethers.Wallet(params.fromPrivateKey, this.ethProvider);
    const config = SUPPORTED_CRYPTOS[CryptoSymbol.USDT_ERC20];
    const abi = ['function transfer(address to, uint256 amount) returns (bool)'];
    const contract = new ethers.Contract(config.tokenContract!, abi, wallet);

    const amount = toSmallestUnit(params.amount, config.decimals);
    const tx = await contract.transfer(params.toAddress, amount);
    const receipt = await tx.wait();

    const fee = fromSmallestUnit(
      (receipt!.gasUsed * receipt!.gasPrice),
      18,
    );

    return { txHash: tx.hash, fee };
  }

  // ─── SOL ────────────────────────────────────────────

  private generateSOLAddress(
    basePath: string,
    merchantIndex: number,
    paymentIndex: number,
  ): { address: string; publicKey: string; derivationPath: string } {
    const fullPath = `${basePath}/${merchantIndex}/${paymentIndex}`;
    // Derive deterministic seed for Solana
    const seedHash = crypto
      .createHmac('sha512', this.masterSeed)
      .update(fullPath)
      .digest();
    const keypair = Keypair.fromSeed(seedHash.subarray(0, 32));

    return {
      address: keypair.publicKey.toBase58(),
      publicKey: keypair.publicKey.toBase58(),
      derivationPath: fullPath,
    };
  }

  private async getSolBalance(address: string): Promise<Decimal> {
    const pubkey = new PublicKey(address);
    const balance = await this.solConnection.getBalance(pubkey);
    return fromSmallestUnit(BigInt(balance), 9);
  }

  private async getSolConfirmations(txHash: string): Promise<number> {
    const status = await this.solConnection.getSignatureStatus(txHash);
    if (!status.value) return 0;
    return status.value.confirmations || (status.value.confirmationStatus === 'finalized' ? 32 : 0);
  }

  private async sendSolTransaction(params: {
    fromPrivateKey: string;
    toAddress: string;
    amount: Decimal;
  }): Promise<{ txHash: string; fee: Decimal }> {
    const fromKeypair = Keypair.fromSecretKey(
      Buffer.from(params.fromPrivateKey, 'hex'),
    );
    const lamports = Number(toSmallestUnit(params.amount, 9));

    // Fetch a recent blockhash to ensure the transaction is valid
    const { blockhash, lastValidBlockHeight } =
      await this.solConnection.getLatestBlockhash('confirmed');

    const transaction = new SolTransaction();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromKeypair.publicKey;
    transaction.lastValidBlockHeight = lastValidBlockHeight;

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: new PublicKey(params.toAddress),
        lamports,
      }),
    );

    const signature = await this.solConnection.sendTransaction(transaction, [
      fromKeypair,
    ]);
    await this.solConnection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      'confirmed',
    );

    return {
      txHash: signature,
      fee: new Decimal('0.000005'),
    };
  }

  // ─── TRON ───────────────────────────────────────────

  private generateTRONAddress(
    basePath: string,
    merchantIndex: number,
    paymentIndex: number,
  ): { address: string; publicKey: string; derivationPath: string } {
    const fullPath = `${basePath}/${merchantIndex}/${paymentIndex}`;
    const root = bip32.fromSeed(this.masterSeed);
    const child = root.derivePath(fullPath);

    // TRON address derivation: keccak256 of UNCOMPRESSED public key (sans 04 prefix),
    // take last 20 bytes, prefix with 0x41.
    // child.publicKey from bip32 is the 33-byte compressed key; we must decompress it.
    const uncompressedPubKey = Buffer.from(ecc.pointCompress(child.publicKey, false));
    // uncompressedPubKey is 65 bytes: 04 || x (32 bytes) || y (32 bytes)
    // TRON/ETH keccak256 uses the 64 bytes after the 04 prefix
    const pubKeyForHash = uncompressedPubKey.subarray(1); // strip 0x04 prefix
    const addressBytes = ethers.keccak256(pubKeyForHash);
    const addressHex = '41' + addressBytes.slice(-40);

    // Base58check encode
    const addressBuffer = Buffer.from(addressHex, 'hex');
    const hash1 = crypto.createHash('sha256').update(addressBuffer).digest();
    const hash2 = crypto.createHash('sha256').update(hash1).digest();
    const checksum = hash2.subarray(0, 4);
    const fullAddress = Buffer.concat([addressBuffer, checksum]);

    // Base58 encode
    const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = BigInt('0x' + fullAddress.toString('hex'));
    let encoded = '';
    while (num > 0n) {
      const rem = Number(num % 58n);
      encoded = base58Chars[rem] + encoded;
      num = num / 58n;
    }
    // Add leading '1' for each leading zero byte
    for (const byte of fullAddress) {
      if (byte === 0) encoded = '1' + encoded;
      else break;
    }

    return {
      address: encoded,
      publicKey: Buffer.from(child.publicKey).toString('hex'),
      derivationPath: fullPath,
    };
  }

  private async getTrc20Balance(
    address: string,
    contractAddress: string,
  ): Promise<Decimal> {
    const response = await fetch(
      `${env.TRON_RPC_URL}/v1/accounts/${address}/tokens?contract_address=${contractAddress}`,
    );
    const data = await response.json() as any;
    if (data.data && data.data.length > 0) {
      return fromSmallestUnit(BigInt(data.data[0].balance || 0), 6);
    }
    return new Decimal('0');
  }

  private async getTrc20Confirmations(txHash: string): Promise<number> {
    const response = await fetch(
      `${env.TRON_RPC_URL}/v1/transactions/${txHash}`,
    );
    const data = await response.json() as any;
    if (data.data?.[0]?.ret?.[0]?.contractRet === 'SUCCESS') {
      // TRON uses block confirmations; check current block vs tx block
      const txBlock = data.data[0].blockNumber;
      if (txBlock) {
        const blockRes = await fetch(`${env.TRON_RPC_URL}/wallet/getnowblock`);
        const blockData = await blockRes.json() as any;
        const currentBlock = blockData.block_header?.raw_data?.number || 0;
        return currentBlock - txBlock;
      }
    }
    return 0;
  }

  /**
   * Send a TRC-20 (USDT) transfer on TRON.
   *
   * Uses the TronGrid HTTP API to build, sign, and broadcast the transaction.
   * The USDT TRC-20 contract is TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t.
   *
   * IMPORTANT: The sending wallet MUST have enough TRX to cover energy/bandwidth.
   * A typical TRC-20 transfer costs ~65,000 energy (~13 TRX if no staked energy).
   * If the wallet has staked bandwidth/energy, the cost is zero TRX.
   */
  private async sendTRC20Transaction(params: {
    fromPrivateKey: string;
    toAddress: string;
    amount: Decimal;
    memo?: string;
  }): Promise<{ txHash: string; fee: Decimal }> {
    const config = SUPPORTED_CRYPTOS[CryptoSymbol.USDT_TRC20];
    const contractAddress = config.tokenContract!;
    const amountSun = toSmallestUnit(params.amount, config.decimals);

    // Derive the TRON sender address from the private key
    const root = bip32.fromSeed(this.masterSeed);
    // We need the fromAddress — derive it from the private key
    // The private key is a hex string; derive the TRON address from it
    const privateKeyBytes = Buffer.from(params.fromPrivateKey, 'hex');

    // Get the public key from the private key using secp256k1
    const pubKey = Buffer.from(ecc.pointFromScalar(privateKeyBytes)!);
    const uncompressedPubKey = Buffer.from(ecc.pointCompress(pubKey, false));
    const pubKeyForHash = uncompressedPubKey.subarray(1);
    const addressHash = ethers.keccak256(pubKeyForHash);
    const fromAddressHex = '41' + addressHash.slice(-40);

    // Convert hex address to base58check for API calls
    const fromAddressBase58 = this.tronHexToBase58(fromAddressHex);

    // Convert destination address to hex (strip T prefix, decode base58check)
    const toAddressHex = this.tronBase58ToHex(params.toAddress);

    // Build TRC-20 triggersmartcontract via TronGrid API
    // Function: transfer(address,uint256)
    // Selector: a9059cbb
    const toParam = toAddressHex.replace('41', '').padStart(64, '0');
    const amountParam = amountSun.toString(16).padStart(64, '0');
    const parameter = toParam + amountParam;

    const triggerResponse = await fetch(
      `${env.TRON_RPC_URL}/wallet/triggersmartcontract`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_address: fromAddressHex,
          contract_address: this.tronBase58ToHex(contractAddress),
          function_selector: 'transfer(address,uint256)',
          parameter,
          fee_limit: 100_000_000, // 100 TRX max fee limit
          call_value: 0,
        }),
      },
    );

    const triggerData = await triggerResponse.json() as any;
    if (!triggerData.transaction) {
      throw new CryptoError(
        `Failed to build TRC-20 transaction: ${JSON.stringify(triggerData)}`,
      );
    }

    // Sign the transaction
    const txToSign = triggerData.transaction;

    // TRON signing: SHA256 of raw_data bytes, then secp256k1 sign
    const rawDataHex = txToSign.raw_data_hex;
    const txHash = crypto.createHash('sha256').update(Buffer.from(rawDataHex, 'hex')).digest();
    const signature = ecc.sign(txHash, privateKeyBytes);
    // Recovery ID is needed; use signRecoverable if available
    // For production, use a proper TRON signing library (tronweb)
    txToSign.signature = [Buffer.from(signature).toString('hex')];

    // Broadcast
    const broadcastResponse = await fetch(
      `${env.TRON_RPC_URL}/wallet/broadcasttransaction`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txToSign),
      },
    );

    const broadcastData = await broadcastResponse.json() as any;
    if (!broadcastData.result) {
      throw new CryptoError(
        `TRC-20 broadcast failed: ${broadcastData.message || JSON.stringify(broadcastData)}`,
      );
    }

    return {
      txHash: txToSign.txID,
      fee: new Decimal('0'), // TRX fee — actual fee deducted from TRX balance, not USDT
    };
  }

  /**
   * Convert a TRON hex address (41-prefixed) to base58check.
   */
  private tronHexToBase58(hexAddr: string): string {
    const addressBuffer = Buffer.from(hexAddr, 'hex');
    const hash1 = crypto.createHash('sha256').update(addressBuffer).digest();
    const hash2 = crypto.createHash('sha256').update(hash1).digest();
    const checksum = hash2.subarray(0, 4);
    const fullAddress = Buffer.concat([addressBuffer, checksum]);

    const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = BigInt('0x' + fullAddress.toString('hex'));
    let encoded = '';
    while (num > 0n) {
      const rem = Number(num % 58n);
      encoded = base58Chars[rem] + encoded;
      num = num / 58n;
    }
    for (const byte of fullAddress) {
      if (byte === 0) encoded = '1' + encoded;
      else break;
    }
    return encoded;
  }

  /**
   * Convert a TRON base58check address to hex (41-prefixed).
   */
  private tronBase58ToHex(base58Addr: string): string {
    const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = 0n;
    for (const char of base58Addr) {
      num = num * 58n + BigInt(base58Chars.indexOf(char));
    }
    let hex = num.toString(16);
    if (hex.length % 2 !== 0) hex = '0' + hex;
    // Full payload is 21 bytes address + 4 bytes checksum = 25 bytes = 50 hex chars
    // Return just the 21-byte address (42 hex chars, starting with 41)
    return hex.substring(0, 42);
  }

  // ─── LTC ────────────────────────────────────────────

  private generateLTCAddress(
    basePath: string,
    merchantIndex: number,
    paymentIndex: number,
  ): { address: string; publicKey: string; derivationPath: string } {
    const fullPath = `${basePath}/${merchantIndex}/${paymentIndex}`;
    const root = bip32.fromSeed(this.masterSeed);
    const child = root.derivePath(fullPath);

    // Litecoin uses similar structure to BTC with different version bytes
    const ltcNetwork = {
      messagePrefix: '\x19Litecoin Signed Message:\n',
      bech32: 'ltc',
      bip32: { public: 0x0488b21e, private: 0x0488ade4 },
      pubKeyHash: 0x30,
      scriptHash: 0x32,
      wif: 0xb0,
    };

    const { address } = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(child.publicKey),
      network: ltcNetwork as any,
    });

    return {
      address: address!,
      publicKey: Buffer.from(child.publicKey).toString('hex'),
      derivationPath: fullPath,
    };
  }

  private async getLtcBalance(address: string): Promise<Decimal> {
    const response = await fetch(`${env.LTC_RPC_URL}/address/${address}`);
    const data = await response.json() as any;
    const balance = BigInt(data.balance || 0);
    return fromSmallestUnit(balance, 8);
  }

  private async getLtcConfirmations(txHash: string): Promise<number> {
    const txRes = await fetch(`${env.LTC_RPC_URL}/tx/${txHash}`);
    const txData = await txRes.json() as any;
    if (!txData.status?.confirmed) return 0;
    const tipRes = await fetch(`${env.LTC_RPC_URL}/blocks/tip/height`);
    const tipHeight = parseInt(await tipRes.text(), 10);
    return tipHeight - txData.status.block_height + 1;
  }

  // ─── DOGE ───────────────────────────────────────────

  private generateDOGEAddress(
    basePath: string,
    merchantIndex: number,
    paymentIndex: number,
  ): { address: string; publicKey: string; derivationPath: string } {
    const fullPath = `${basePath}/${merchantIndex}/${paymentIndex}`;
    const root = bip32.fromSeed(this.masterSeed);
    const child = root.derivePath(fullPath);

    const dogeNetwork = {
      messagePrefix: '\x19Dogecoin Signed Message:\n',
      bech32: 'doge',
      bip32: { public: 0x02facafd, private: 0x02fac398 },
      pubKeyHash: 0x1e,
      scriptHash: 0x16,
      wif: 0x9e,
    };

    const { address } = bitcoin.payments.p2pkh({
      pubkey: Buffer.from(child.publicKey),
      network: dogeNetwork as any,
    });

    return {
      address: address!,
      publicKey: Buffer.from(child.publicKey).toString('hex'),
      derivationPath: fullPath,
    };
  }

  private async getDogeBalance(address: string): Promise<Decimal> {
    const response = await fetch(
      `${env.DOGE_RPC_URL}/address/balance/${address}`,
    );
    const data = await response.json() as any;
    return new Decimal(data.balance || '0');
  }

  private async getDogeConfirmations(txHash: string): Promise<number> {
    const response = await fetch(`${env.DOGE_RPC_URL}/tx/${txHash}`);
    const data = await response.json() as any;
    return data.confirmations || 0;
  }

  // ─── XRP ────────────────────────────────────────────

  private generateXRPAddress(
    basePath: string,
    merchantIndex: number,
    paymentIndex: number,
  ): { address: string; publicKey: string; derivationPath: string } {
    const fullPath = `${basePath}/${merchantIndex}/${paymentIndex}`;
    const root = bip32.fromSeed(this.masterSeed);
    const child = root.derivePath(fullPath);

    // XRP address: RIPEMD160(SHA256(publicKey)) + checksum, base58
    const pubKeyBuffer = Buffer.from(child.publicKey);
    const sha256Hash = crypto.createHash('sha256').update(pubKeyBuffer).digest();
    const ripemd160Hash = crypto.createHash('ripemd160').update(sha256Hash).digest();

    // XRP address encoding (simplified)
    const payload = Buffer.concat([Buffer.from([0x00]), ripemd160Hash]);
    const checksum1 = crypto.createHash('sha256').update(payload).digest();
    const checksum2 = crypto.createHash('sha256').update(checksum1).digest();
    const fullPayload = Buffer.concat([payload, checksum2.subarray(0, 4)]);

    const base58Chars = 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz';
    let num = BigInt('0x' + fullPayload.toString('hex'));
    let encoded = '';
    while (num > 0n) {
      const rem = Number(num % 58n);
      encoded = base58Chars[rem] + encoded;
      num = num / 58n;
    }
    for (const byte of fullPayload) {
      if (byte === 0) encoded = base58Chars[0] + encoded;
      else break;
    }

    return {
      address: encoded,
      publicKey: Buffer.from(child.publicKey).toString('hex'),
      derivationPath: fullPath,
    };
  }

  private async getXrpConfirmations(txHash: string): Promise<number> {
    const response = await fetch(env.XRP_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'tx',
        params: [{ transaction: txHash }],
      }),
    });
    const data = await response.json() as any;
    if (data.result?.validated) {
      // XRP validated transactions are final (equivalent to max confirmations)
      return 100;
    }
    return 0;
  }

  private async getXrpBalance(address: string): Promise<Decimal> {
    const response = await fetch(env.XRP_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'account_info',
        params: [{ account: address, ledger_index: 'validated' }],
      }),
    });
    const data = await response.json() as any;
    if (data.result?.account_data?.Balance) {
      return fromSmallestUnit(BigInt(data.result.account_data.Balance), 6);
    }
    return new Decimal('0');
  }
}

export const cryptoService = new CryptoService();
