/**
 * Lightning Network Service
 *
 * Handles BTC Lightning invoices via LND REST API for near-instant
 * payment settlement (<3 seconds). Supports BOLT11 invoice creation,
 * payment monitoring, and settlement callbacks.
 */

import { Decimal } from '@prisma/client/runtime/library';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface LightningInvoice {
  paymentHash: string;
  paymentRequest: string; // BOLT11 encoded invoice
  addIndex: string;
  rHashHex: string;
  amountSat: number;
  memo?: string;
  expiry: number;
  createdAt: Date;
  settledAt?: Date;
  settled: boolean;
}

export interface LightningPaymentStatus {
  settled: boolean;
  amountPaidSat: number;
  settleDate?: Date;
  preimage?: string;
}

export class LightningService {
  private readonly lndRestUrl: string;
  private readonly macaroon: string;
  private readonly invoiceExpirySec: number;
  private activeSubscriptions: Map<string, AbortController> = new Map();

  constructor() {
    this.lndRestUrl = process.env.LND_REST_URL || 'https://localhost:8080';
    this.macaroon = process.env.LND_MACAROON || '';
    this.invoiceExpirySec = 1800; // 30 minutes default
  }

  private get headers(): Record<string, string> {
    return {
      'Grpc-Metadata-macaroon': this.macaroon,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Generate a BOLT11 Lightning invoice for a given amount.
   * @param amountSat Amount in satoshis
   * @param memo Description for the invoice
   * @param expiry Optional expiry in seconds (default 1800)
   */
  async createInvoice(
    amountSat: number,
    memo: string = '',
    expiry?: number,
  ): Promise<LightningInvoice> {
    const body = {
      value: amountSat.toString(),
      memo,
      expiry: (expiry || this.invoiceExpirySec).toString(),
    };

    try {
      const response = await fetch(`${this.lndRestUrl}/v1/invoices`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LND invoice creation failed: ${response.status} ${errorText}`);
      }

      const data = await response.json() as any;

      const invoice: LightningInvoice = {
        paymentHash: data.r_hash ? Buffer.from(data.r_hash, 'base64').toString('hex') : '',
        paymentRequest: data.payment_request,
        addIndex: data.add_index,
        rHashHex: data.r_hash ? Buffer.from(data.r_hash, 'base64').toString('hex') : '',
        amountSat,
        memo,
        expiry: expiry || this.invoiceExpirySec,
        createdAt: new Date(),
        settled: false,
      };

      logger.info(`Lightning invoice created: ${invoice.paymentHash} for ${amountSat} sats`);
      return invoice;
    } catch (error) {
      logger.error('Failed to create Lightning invoice', { error, amountSat, memo });
      throw error;
    }
  }

  /**
   * Convert a crypto amount (BTC) to a BOLT11 invoice amount in satoshis.
   */
  btcToSatoshis(btcAmount: Decimal): number {
    return Math.floor(btcAmount.mul(100_000_000).toNumber());
  }

  /**
   * Create a payment invoice from BTC amount.
   */
  async createPaymentInvoice(
    btcAmount: Decimal,
    paymentId: string,
    merchantName: string = '',
  ): Promise<LightningInvoice> {
    const satoshis = this.btcToSatoshis(btcAmount);
    const memo = `Payment ${paymentId}${merchantName ? ` to ${merchantName}` : ''}`;
    return this.createInvoice(satoshis, memo);
  }

  /**
   * Check the status of a Lightning invoice by its payment hash.
   */
  async checkInvoiceStatus(paymentHashHex: string): Promise<LightningPaymentStatus> {
    try {
      const rHashBase64 = Buffer.from(paymentHashHex, 'hex').toString('base64url');
      const response = await fetch(
        `${this.lndRestUrl}/v1/invoice/${rHashBase64}`,
        { headers: this.headers },
      );

      if (!response.ok) {
        throw new Error(`LND lookup failed: ${response.status}`);
      }

      const data = await response.json() as any;

      return {
        settled: data.settled === true || data.state === 'SETTLED',
        amountPaidSat: parseInt(data.amt_paid_sat || '0', 10),
        settleDate: data.settle_date && data.settle_date !== '0'
          ? new Date(parseInt(data.settle_date, 10) * 1000)
          : undefined,
        preimage: data.r_preimage
          ? Buffer.from(data.r_preimage, 'base64').toString('hex')
          : undefined,
      };
    } catch (error) {
      logger.error(`Failed to check Lightning invoice: ${paymentHashHex}`, { error });
      return { settled: false, amountPaidSat: 0 };
    }
  }

  /**
   * Subscribe to invoice settlement events via LND streaming API.
   * Calls the callback when the invoice is settled (<3 seconds typical).
   */
  async subscribeToInvoice(
    paymentHashHex: string,
    onSettled: (status: LightningPaymentStatus) => Promise<void>,
  ): Promise<void> {
    const controller = new AbortController();
    this.activeSubscriptions.set(paymentHashHex, controller);

    try {
      const rHashBase64 = Buffer.from(paymentHashHex, 'hex').toString('base64url');
      const response = await fetch(
        `${this.lndRestUrl}/v2/invoices/subscribe/${rHashBase64}`,
        {
          headers: this.headers,
          signal: controller.signal,
        },
      );

      if (!response.ok || !response.body) {
        throw new Error(`LND subscribe failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // LND streams newline-delimited JSON
        const lines = chunk.split('\n').filter(l => l.trim());

        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            if (event.result?.settled || event.result?.state === 'SETTLED') {
              const status: LightningPaymentStatus = {
                settled: true,
                amountPaidSat: parseInt(event.result.amt_paid_sat || '0', 10),
                settleDate: event.result.settle_date
                  ? new Date(parseInt(event.result.settle_date, 10) * 1000)
                  : new Date(),
                preimage: event.result.r_preimage
                  ? Buffer.from(event.result.r_preimage, 'base64').toString('hex')
                  : undefined,
              };
              await onSettled(status);
              this.activeSubscriptions.delete(paymentHashHex);
              return;
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        logger.info(`Lightning subscription cancelled: ${paymentHashHex}`);
      } else {
        logger.error(`Lightning subscription error: ${paymentHashHex}`, { error });
      }
    } finally {
      this.activeSubscriptions.delete(paymentHashHex);
    }
  }

  /**
   * Poll-based invoice monitoring (fallback when streaming is not available).
   * Checks every 2 seconds for up to the invoice expiry period.
   */
  async pollInvoiceUntilSettled(
    paymentHashHex: string,
    timeoutMs: number = 1800_000,
    intervalMs: number = 2000,
  ): Promise<LightningPaymentStatus> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const poll = async () => {
        if (Date.now() - startTime > timeoutMs) {
          resolve({ settled: false, amountPaidSat: 0 });
          return;
        }

        const status = await this.checkInvoiceStatus(paymentHashHex);
        if (status.settled) {
          resolve(status);
          return;
        }

        setTimeout(poll, intervalMs);
      };

      poll();
    });
  }

  /**
   * Cancel an active subscription for an invoice.
   */
  cancelSubscription(paymentHashHex: string): void {
    const controller = this.activeSubscriptions.get(paymentHashHex);
    if (controller) {
      controller.abort();
      this.activeSubscriptions.delete(paymentHashHex);
    }
  }

  /**
   * Get LND node info for health checking.
   */
  async getNodeInfo(): Promise<{ alias: string; numActiveChannels: number; blockHeight: number } | null> {
    try {
      const response = await fetch(`${this.lndRestUrl}/v1/getinfo`, {
        headers: this.headers,
      });

      if (!response.ok) return null;
      const data = await response.json() as any;

      return {
        alias: data.alias || '',
        numActiveChannels: data.num_active_channels || 0,
        blockHeight: data.block_height || 0,
      };
    } catch {
      return null;
    }
  }

  /**
   * Decode a BOLT11 invoice to inspect its contents.
   */
  async decodeInvoice(paymentRequest: string): Promise<{
    destination: string;
    numSatoshis: number;
    description: string;
    expiry: number;
    paymentHash: string;
  } | null> {
    try {
      const response = await fetch(`${this.lndRestUrl}/v1/payreq/${paymentRequest}`, {
        headers: this.headers,
      });

      if (!response.ok) return null;
      const data = await response.json() as any;

      return {
        destination: data.destination || '',
        numSatoshis: parseInt(data.num_satoshis || '0', 10),
        description: data.description || '',
        expiry: parseInt(data.expiry || '0', 10),
        paymentHash: data.payment_hash || '',
      };
    } catch {
      return null;
    }
  }
}

export const lightningService = new LightningService();
