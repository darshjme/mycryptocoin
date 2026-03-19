import { Router } from 'express';
import authRoutes from './auth.routes';
import merchantRoutes from './merchant.routes';
import paymentRoutes from './payment.routes';
import walletRoutes from './wallet.routes';
import transactionRoutes from './transaction.routes';
import webhookRoutes from './webhook.routes';
import adminRoutes from './admin.routes';
import adminSecurityRoutes from './admin-security.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/merchant', merchantRoutes);
router.use('/payments', paymentRoutes);
router.use('/wallets', walletRoutes);
router.use('/transactions', transactionRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/security', adminSecurityRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    },
  });
});

export default router;
