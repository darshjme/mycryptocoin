/**
 * Discount / Coupon Routes
 *
 * POST   /discounts           — Create discount code
 * GET    /discounts           — List discounts
 * GET    /discounts/:id       — Get single discount
 * POST   /discounts/validate  — Validate a discount code
 * DELETE /discounts/:id       — Deactivate discount
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import { discountService } from '../services/discount.service';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Create discount
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = (req as any).merchant.id;
    const discount = await discountService.createDiscount(merchantId, req.body);
    res.status(201).json({ success: true, data: discount });
  } catch (error) {
    next(error);
  }
});

// List discounts
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = (req as any).merchant.id;
    const { isActive, page = '1', limit = '20' } = req.query;

    const result = await discountService.listDiscounts(merchantId, {
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: parseInt(page as string, 10),
      limit: Math.min(parseInt(limit as string, 10), 100),
    });

    res.json({
      success: true,
      data: result.discounts,
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

// Validate discount code
router.post('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = (req as any).merchant.id;
    const { code, amount, customerEmail, checkoutId } = req.body;

    if (!code || !amount) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Code and amount are required' },
      });
    }

    const result = await discountService.validateDiscount(
      code,
      merchantId,
      new Decimal(amount),
      customerEmail,
      checkoutId,
    );

    res.json({
      success: true,
      data: {
        valid: result.valid,
        discountAmount: result.discountAmount.toString(),
        finalAmount: result.finalAmount.toString(),
        message: result.message,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get single discount
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = (req as any).merchant.id;
    const discount = await discountService.getDiscount(req.params.id, merchantId);
    res.json({ success: true, data: discount });
  } catch (error) {
    next(error);
  }
});

// Deactivate discount
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = (req as any).merchant.id;
    const discount = await discountService.deactivateDiscount(req.params.id, merchantId);
    res.json({ success: true, data: discount, message: 'Discount deactivated' });
  } catch (error) {
    next(error);
  }
});

export default router;
