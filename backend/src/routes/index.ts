import { Router } from 'express';
import authRoutes from './auth.routes';
import merchantRoutes from './merchant.routes';
import paymentRoutes from './payment.routes';
import walletRoutes from './wallet.routes';
import transactionRoutes from './transaction.routes';
import webhookRoutes from './webhook.routes';
import adminRoutes from './admin.routes';
import adminSecurityRoutes from './admin-security.routes';
import invoiceRoutes from './invoice.routes';
import refundRoutes from './refund.routes';
import checkoutRoutes from './checkout.routes';
import ratesRoutes from './rates.routes';
import discountRoutes from './discount.routes';
import whiteLabelRoutes from './whitelabel.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/merchant', merchantRoutes);
router.use('/payments', paymentRoutes);
router.use('/wallets', walletRoutes);
router.use('/transactions', transactionRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/security', adminSecurityRoutes);

// New feature routes
router.use('/invoices', invoiceRoutes);
router.use('/', refundRoutes);            // Mounts /payments/:id/refund and /refunds
router.use('/checkout', checkoutRoutes);
router.use('/rates', ratesRoutes);        // Public — no auth needed
router.use('/discounts', discountRoutes);
router.use('/whitelabel', whiteLabelRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '2.0.0',
    },
  });
});

export default router;
