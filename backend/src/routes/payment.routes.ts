import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticateAny, requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { authenticatedRateLimiter } from '../middleware/rateLimiter';
import {
  createPaymentSchema,
  getPaymentSchema,
  listPaymentsQuerySchema,
  verifyPaymentSchema,
} from '../validators/payment.schema';

const router = Router();

// All routes accept JWT or API key
router.use(authenticateAny);
router.use(authenticatedRateLimiter);

router.post(
  '/create',
  requirePermission('payments:write'),
  validate({ body: createPaymentSchema }),
  paymentController.createPayment,
);

router.get(
  '/',
  requirePermission('payments:read'),
  validate({ query: listPaymentsQuerySchema }),
  paymentController.listPayments,
);

router.get(
  '/:id',
  requirePermission('payments:read'),
  validate({ params: getPaymentSchema }),
  paymentController.getPayment,
);

router.post(
  '/:id/verify',
  requirePermission('payments:write'),
  validate({ params: getPaymentSchema, body: verifyPaymentSchema }),
  paymentController.verifyPayment,
);

export default router;
