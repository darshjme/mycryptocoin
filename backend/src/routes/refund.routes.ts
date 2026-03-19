/**
 * Refund Routes
 *
 * POST /payments/:id/refund  — Initiate refund
 * GET  /refunds              — List refunds
 * GET  /refunds/:id          — Get single refund
 */

import { Router, Request, Response, NextFunction } from 'express';
import { refundService } from '../services/refund.service';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Initiate refund for a payment
router.post('/payments/:id/refund', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = (req as any).merchant.id;
    const refund = await refundService.createRefund(req.params.id, merchantId, {
      amount: req.body.amount,
      reason: req.body.reason,
      toAddress: req.body.toAddress,
      refundInUsdt: req.body.refundInUsdt,
    });
    res.status(201).json({ success: true, data: refund });
  } catch (error) {
    next(error);
  }
});

// List refunds
router.get('/refunds', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = (req as any).merchant.id;
    const { paymentId, status, page = '1', limit = '20' } = req.query;

    const result = await refundService.listRefunds(merchantId, {
      paymentId: paymentId as string | undefined,
      status: status as string | undefined,
      page: parseInt(page as string, 10),
      limit: Math.min(parseInt(limit as string, 10), 100),
    });

    res.json({
      success: true,
      data: result.refunds,
      meta: {
        total: result.total,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        totalPages: Math.ceil(result.total / parseInt(limit as string, 10)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get single refund
router.get('/refunds/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = (req as any).merchant.id;
    const refund = await refundService.getRefund(req.params.id, merchantId);
    res.json({ success: true, data: refund });
  } catch (error) {
    next(error);
  }
});

export default router;
