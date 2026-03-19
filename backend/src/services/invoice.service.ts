/**
 * Invoice Service
 *
 * Professional invoice generation with unique IDs, line items, tax calculation,
 * PDF generation, email delivery, and crypto payment integration.
 */

import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config/database';
import { InvoiceStatus, CryptoNetwork, TokenSymbol } from '@mycryptocoin/shared';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import { emailService } from './email.service';
import crypto from 'crypto';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: string;
  amount: string;
}

export interface CreateInvoiceInput {
  customerName?: string;
  customerEmail?: string;
  customerAddress?: string;
  lineItems: InvoiceLineItem[];
  currency?: string;
  taxRate?: number;
  dueDate?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface InvoiceData {
  id: string;
  merchantId: string;
  invoiceNumber: string;
  status: string;
  customerName?: string;
  customerEmail?: string;
  customerAddress?: string;
  lineItems: InvoiceLineItem[];
  subtotal: Decimal;
  taxRate?: Decimal;
  taxAmount?: Decimal;
  total: Decimal;
  currency: string;
  dueDate?: Date;
  paidAt?: Date;
  paymentId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// EU VAT rates for common countries
const EU_VAT_RATES: Record<string, number> = {
  AT: 20, BE: 21, BG: 20, HR: 25, CY: 19, CZ: 21, DK: 25,
  EE: 22, FI: 24, FR: 20, DE: 19, GR: 24, HU: 27, IE: 23,
  IT: 22, LV: 21, LT: 21, LU: 17, MT: 18, NL: 21, PL: 23,
  PT: 23, RO: 19, SK: 20, SI: 22, ES: 21, SE: 25, GB: 20,
};

export class InvoiceService {
  /**
   * Generate a unique invoice number: INV-YYYYMMDD-XXXXX
   */
  private generateInvoiceNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);
    return `INV-${dateStr}-${random}`;
  }

  /**
   * Calculate VAT for an EU/UK country code.
   */
  getVatRate(countryCode?: string): number {
    if (!countryCode) return 0;
    return EU_VAT_RATES[countryCode.toUpperCase()] || 0;
  }

  /**
   * Create a new invoice.
   */
  async createInvoice(merchantId: string, input: CreateInvoiceInput): Promise<InvoiceData> {
    if (!input.lineItems || input.lineItems.length === 0) {
      throw new ValidationError('At least one line item is required');
    }

    // Calculate subtotal from line items
    let subtotal = new Decimal(0);
    const processedItems: InvoiceLineItem[] = input.lineItems.map((item) => {
      const amount = new Decimal(item.unitPrice).mul(item.quantity);
      subtotal = subtotal.add(amount);
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: amount.toString(),
      };
    });

    // Calculate tax
    const taxRate = input.taxRate !== undefined ? new Decimal(input.taxRate) : new Decimal(0);
    const taxAmount = subtotal.mul(taxRate).div(100);
    const total = subtotal.add(taxAmount);

    const invoiceNumber = this.generateInvoiceNumber();
    const dueDate = input.dueDate ? new Date(input.dueDate) : undefined;

    const invoice = await prisma.invoice.create({
      data: {
        id: crypto.randomUUID(),
        merchantId,
        invoiceNumber,
        status: InvoiceStatus.DRAFT,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerAddress: input.customerAddress,
        lineItems: processedItems as any,
        subtotal,
        taxRate,
        taxAmount,
        total,
        currency: input.currency || 'USD',
        dueDate,
        notes: input.notes,
        metadata: input.metadata || {},
      },
    });

    logger.info(`Invoice created: ${invoiceNumber} for merchant ${merchantId}, total: ${total}`);
    return invoice as unknown as InvoiceData;
  }

  /**
   * Get an invoice by ID.
   */
  async getInvoice(invoiceId: string, merchantId?: string): Promise<InvoiceData> {
    const where: any = { id: invoiceId };
    if (merchantId) where.merchantId = merchantId;

    const invoice = await prisma.invoice.findFirst({ where });
    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }
    return invoice as unknown as InvoiceData;
  }

  /**
   * List invoices with pagination and filters.
   */
  async listInvoices(
    merchantId: string,
    filters: {
      status?: string;
      customerEmail?: string;
      startDate?: string;
      endDate?: string;
      page: number;
      limit: number;
    },
  ): Promise<{ invoices: InvoiceData[]; total: number }> {
    const where: any = { merchantId };
    if (filters.status) where.status = filters.status;
    if (filters.customerEmail) where.customerEmail = filters.customerEmail;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return { invoices: invoices as unknown as InvoiceData[], total };
  }

  /**
   * Update an invoice (only DRAFT invoices can be updated).
   */
  async updateInvoice(invoiceId: string, merchantId: string, updates: Partial<CreateInvoiceInput>): Promise<InvoiceData> {
    const invoice = await this.getInvoice(invoiceId, merchantId);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new ValidationError('Only draft invoices can be updated');
    }

    const data: any = {};

    if (updates.lineItems) {
      let subtotal = new Decimal(0);
      const processedItems = updates.lineItems.map((item) => {
        const amount = new Decimal(item.unitPrice).mul(item.quantity);
        subtotal = subtotal.add(amount);
        return { ...item, amount: amount.toString() };
      });
      data.lineItems = processedItems;
      data.subtotal = subtotal;

      const taxRate = updates.taxRate !== undefined
        ? new Decimal(updates.taxRate)
        : (invoice.taxRate || new Decimal(0));
      data.taxRate = taxRate;
      data.taxAmount = subtotal.mul(taxRate).div(100);
      data.total = subtotal.add(data.taxAmount);
    }

    if (updates.customerName !== undefined) data.customerName = updates.customerName;
    if (updates.customerEmail !== undefined) data.customerEmail = updates.customerEmail;
    if (updates.customerAddress !== undefined) data.customerAddress = updates.customerAddress;
    if (updates.dueDate !== undefined) data.dueDate = new Date(updates.dueDate);
    if (updates.notes !== undefined) data.notes = updates.notes;
    if (updates.currency !== undefined) data.currency = updates.currency;

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data,
    });

    return updated as unknown as InvoiceData;
  }

  /**
   * Cancel an invoice (mark as CANCELLED).
   */
  async cancelInvoice(invoiceId: string, merchantId: string): Promise<InvoiceData> {
    const invoice = await this.getInvoice(invoiceId, merchantId);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new ValidationError('Cannot cancel a paid invoice');
    }

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: InvoiceStatus.CANCELLED },
    });

    return updated as unknown as InvoiceData;
  }

  /**
   * Send an invoice via email to the customer.
   */
  async sendInvoice(invoiceId: string, merchantId: string): Promise<InvoiceData> {
    const invoice = await this.getInvoice(invoiceId, merchantId);

    if (!invoice.customerEmail) {
      throw new ValidationError('Invoice has no customer email');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new ValidationError('Cannot send a cancelled invoice');
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    // Generate payment link
    const paymentUrl = `https://mycrypto.co.in/pay/invoice/${invoiceId}`;

    // Generate HTML invoice email
    const lineItemsHtml = (invoice.lineItems as InvoiceLineItem[]).map((item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.unitPrice} ${invoice.currency}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.amount} ${invoice.currency}</td>
      </tr>
    `).join('');

    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">${merchant?.businessName || 'MyCryptoCoin'}</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0;">Invoice ${invoice.invoiceNumber}</p>
        </div>
        <div style="padding: 24px; background: white; border: 1px solid #eee;">
          ${invoice.customerName ? `<p><strong>Bill To:</strong> ${invoice.customerName}</p>` : ''}
          ${invoice.customerAddress ? `<p>${invoice.customerAddress}</p>` : ''}
          ${invoice.dueDate ? `<p><strong>Due Date:</strong> ${invoice.dueDate.toLocaleDateString()}</p>` : ''}

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 8px; text-align: left;">Description</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Unit Price</th>
                <th style="padding: 8px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>${lineItemsHtml}</tbody>
          </table>

          <div style="text-align: right; margin-top: 16px;">
            <p>Subtotal: <strong>${invoice.subtotal} ${invoice.currency}</strong></p>
            ${invoice.taxAmount && !new Decimal(invoice.taxAmount.toString()).isZero() ? `<p>Tax (${invoice.taxRate}%): <strong>${invoice.taxAmount} ${invoice.currency}</strong></p>` : ''}
            <p style="font-size: 20px;">Total: <strong>${invoice.total} ${invoice.currency}</strong></p>
          </div>

          ${invoice.notes ? `<p style="margin-top: 16px; color: #666;"><em>${invoice.notes}</em></p>` : ''}

          <div style="text-align: center; margin-top: 24px;">
            <a href="${paymentUrl}" style="display: inline-block; background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Pay with Crypto
            </a>
          </div>
        </div>
        <div style="padding: 16px; text-align: center; color: #999; font-size: 12px; background: #f8f9fa; border-radius: 0 0 12px 12px;">
          Powered by MyCryptoCoin | mycrypto.co.in
        </div>
      </div>
    `;

    await emailService.sendEmail({
      to: invoice.customerEmail,
      subject: `Invoice ${invoice.invoiceNumber} from ${merchant?.businessName || 'MyCryptoCoin'}`,
      html,
    });

    // Update status to SENT
    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: InvoiceStatus.SENT },
    });

    logger.info(`Invoice ${invoice.invoiceNumber} sent to ${invoice.customerEmail}`);
    return updated as unknown as InvoiceData;
  }

  /**
   * Mark an invoice as paid (called when payment completes).
   */
  async markAsPaid(invoiceId: string, paymentId: string): Promise<InvoiceData> {
    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.PAID,
        paymentId,
        paidAt: new Date(),
      },
    });

    logger.info(`Invoice ${invoiceId} marked as paid via payment ${paymentId}`);
    return updated as unknown as InvoiceData;
  }

  /**
   * Generate HTML for PDF rendering of an invoice.
   */
  generateInvoiceHtml(invoice: InvoiceData, merchantName: string): string {
    const lineItemsHtml = (invoice.lineItems as InvoiceLineItem[]).map((item) => `
      <tr>
        <td>${item.description}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">${item.unitPrice} ${invoice.currency}</td>
        <td style="text-align: right;">${item.amount} ${invoice.currency}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .company { font-size: 24px; font-weight: bold; color: #3B82F6; }
          .invoice-title { font-size: 32px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f0f0f0; padding: 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #eee; }
          .totals { text-align: right; margin-top: 20px; }
          .total-row { font-size: 20px; font-weight: bold; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">${merchantName}</div>
          <div class="invoice-title">INVOICE</div>
        </div>
        <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
        <p><strong>Date:</strong> ${invoice.createdAt.toLocaleDateString()}</p>
        ${invoice.dueDate ? `<p><strong>Due:</strong> ${invoice.dueDate.toLocaleDateString()}</p>` : ''}
        ${invoice.customerName ? `<p><strong>Bill To:</strong> ${invoice.customerName}</p>` : ''}
        ${invoice.customerAddress ? `<p>${invoice.customerAddress}</p>` : ''}

        <table>
          <thead>
            <tr><th>Description</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Unit Price</th><th style="text-align:right;">Amount</th></tr>
          </thead>
          <tbody>${lineItemsHtml}</tbody>
        </table>

        <div class="totals">
          <p>Subtotal: ${invoice.subtotal} ${invoice.currency}</p>
          ${invoice.taxAmount && !new Decimal(invoice.taxAmount.toString()).isZero() ? `<p>Tax (${invoice.taxRate}%): ${invoice.taxAmount} ${invoice.currency}</p>` : ''}
          <p class="total-row">Total: ${invoice.total} ${invoice.currency}</p>
        </div>

        ${invoice.notes ? `<p style="margin-top:20px;"><em>${invoice.notes}</em></p>` : ''}

        <div class="footer">
          <p>Payment accepted via cryptocurrency at mycrypto.co.in</p>
          <p>Powered by MyCryptoCoin</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Check for overdue invoices and update their status.
   */
  async checkOverdueInvoices(): Promise<number> {
    const result = await prisma.invoice.updateMany({
      where: {
        status: InvoiceStatus.SENT,
        dueDate: { lt: new Date() },
      },
      data: { status: InvoiceStatus.OVERDUE },
    });

    if (result.count > 0) {
      logger.info(`Marked ${result.count} invoices as overdue`);
    }

    return result.count;
  }
}

export const invoiceService = new InvoiceService();
