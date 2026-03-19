import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  authenticatedRateLimiter,
  strictRateLimiter,
} from '../middleware/rateLimiter';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(requireAdmin);
router.use(authenticatedRateLimiter);

router.get('/merchants', adminController.getMerchants);
router.get('/transactions', adminController.getTransactions);
router.get('/stats', adminController.getStats);
router.post('/whatsapp/init', adminController.initWhatsapp);
router.get('/whatsapp/qr', adminController.getWhatsappQr);
// Strict rate limit on admin OTP sends (5 req/min) to prevent abuse
router.post('/whatsapp/send-otp', strictRateLimiter, adminController.sendWhatsappOtp);
router.get('/revenue', adminController.getRevenue);

export default router;
