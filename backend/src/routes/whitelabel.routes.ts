/**
 * White-Label Routes
 *
 * GET  /whitelabel           — Get white-label config
 * PUT  /whitelabel           — Update white-label config
 * POST /whitelabel/verify-domain — Verify custom domain CNAME
 */

import { Router, Request, Response, NextFunction } from 'express';
import { whiteLabelService } from '../services/whitelabel.service';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Get white-label config
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = (req as any).merchant.id;
    const config = await whiteLabelService.getConfig(merchantId);
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
});

// Update white-label config
router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = (req as any).merchant.id;
    const config = await whiteLabelService.updateConfig(merchantId, req.body);
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
});

// Verify custom domain
router.post('/verify-domain', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = (req as any).merchant.id;
    const result = await whiteLabelService.verifyCustomDomain(merchantId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
