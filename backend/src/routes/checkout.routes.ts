/**
 * Checkout Routes
 *
 * GET  /checkout/:sessionId  — Renders hosted payment page data
 * POST /checkout/session      — Create a checkout session
 * GET  /checkout/:sessionId/status — Real-time status check
 *
 * Supports multiple display modes: page, popup, inline, hidden.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { SUPPORTED_CRYPTOS, getAllSupportedCryptos } from '../config/crypto';
import { authenticate } from '../middleware/auth';
import { PaymentStatus } from '@mycryptocoin/shared';
import { whiteLabelService } from '../services/whitelabel.service';
import { discountService } from '../services/discount.service';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const router = Router();

/**
 * Create a checkout session.
 * Authenticated endpoint — merchant creates a session for their customer.
 */
router.post('/session', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = (req as any).merchant.id;
    const {
      amount,
      currency = 'USD',
      displayMode = 'page',
      allowedCryptos,
      customerEmail,
      externalId,
      callbackUrl,
      successUrl,
      cancelUrl,
      metadata,
      discountCode,
    } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Amount is required' } });
    }

    const sessionId = `cs_${crypto.randomBytes(16).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Validate discount code if provided
    let discountInfo = null;
    if (discountCode) {
      const { Decimal } = await import('@prisma/client/runtime/library');
      const result = await discountService.validateDiscount(
        discountCode,
        merchantId,
        new Decimal(amount),
        customerEmail,
      );
      if (result.valid) {
        discountInfo = {
          code: discountCode,
          discountAmount: result.discountAmount.toString(),
          finalAmount: result.finalAmount.toString(),
        };
      }
    }

    // Store session in Redis
    const sessionData = {
      id: sessionId,
      merchantId,
      amount: discountInfo ? discountInfo.finalAmount : amount,
      originalAmount: amount,
      currency,
      displayMode,
      allowedCryptos: allowedCryptos || null,
      customerEmail: customerEmail || null,
      externalId: externalId || null,
      callbackUrl: callbackUrl || null,
      successUrl: successUrl || null,
      cancelUrl: cancelUrl || null,
      metadata: metadata || {},
      discount: discountInfo,
      paymentId: null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    await redis.setex(`checkout:${sessionId}`, 1800, JSON.stringify(sessionData));

    // Get merchant info for the checkout page
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { businessName: true, logoUrl: true },
    });

    const checkoutUrl = `https://mycrypto.co.in/pay/${sessionId}`;

    res.status(201).json({
      success: true,
      data: {
        sessionId,
        checkoutUrl,
        displayMode,
        expiresAt: expiresAt.toISOString(),
        amount: sessionData.amount,
        currency,
        discount: discountInfo,
        merchantName: merchant?.businessName,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get checkout session data (public endpoint for rendering the page).
 */
router.get('/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const cached = await redis.get(`checkout:${sessionId}`);

    if (!cached) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Checkout session not found or expired' },
      });
    }

    const session = JSON.parse(cached);

    // Check if expired
    if (new Date() > new Date(session.expiresAt)) {
      return res.status(410).json({
        success: false,
        error: { code: 'EXPIRED', message: 'Checkout session has expired' },
      });
    }

    // Get merchant info
    const merchant = await prisma.merchant.findUnique({
      where: { id: session.merchantId },
      select: { businessName: true, logoUrl: true },
    });

    // Get white-label config
    const whiteLabel = await whiteLabelService.getConfig(session.merchantId);

    // Filter available cryptos
    let availableCryptos = getAllSupportedCryptos();
    if (session.allowedCryptos && Array.isArray(session.allowedCryptos)) {
      availableCryptos = availableCryptos.filter((c) =>
        session.allowedCryptos.includes(`${c.network}:${c.token}`),
      );
    }

    // If a payment was created, include its details
    let paymentDetails = null;
    if (session.paymentId) {
      const payment = await prisma.payment.findUnique({
        where: { id: session.paymentId },
        select: {
          id: true,
          status: true,
          depositAddress: true,
          cryptoAmount: true,
          network: true,
          token: true,
          receivedAmount: true,
          expiresAt: true,
        },
      });
      paymentDetails = payment;
    }

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        amount: session.amount,
        originalAmount: session.originalAmount,
        currency: session.currency,
        displayMode: session.displayMode,
        expiresAt: session.expiresAt,
        status: session.status,
        discount: session.discount,
        merchant: {
          name: merchant?.businessName || 'Merchant',
          logo: merchant?.logoUrl || null,
        },
        theme: {
          primaryColor: whiteLabel.primaryColor,
          secondaryColor: whiteLabel.secondaryColor,
          accentColor: whiteLabel.accentColor,
          logoUrl: whiteLabel.logoUrl || merchant?.logoUrl,
          removeBranding: whiteLabel.removeBranding,
          customCss: whiteLabel.customCss,
        },
        availableCryptos: availableCryptos.map((c) => ({
          key: `${c.network}:${c.token}`,
          name: c.name,
          network: c.network,
          token: c.token,
          isToken: c.isToken,
        })),
        payment: paymentDetails,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get checkout session status (for polling / WebSocket fallback).
 */
router.get('/:sessionId/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const cached = await redis.get(`checkout:${sessionId}`);

    if (!cached) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } });
    }

    const session = JSON.parse(cached);

    let paymentStatus = null;
    if (session.paymentId) {
      const payment = await prisma.payment.findUnique({
        where: { id: session.paymentId },
        select: { status: true, receivedAmount: true, paidAt: true },
      });
      paymentStatus = payment;
    }

    res.json({
      success: true,
      data: {
        sessionId,
        status: session.status,
        paymentId: session.paymentId,
        payment: paymentStatus,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
