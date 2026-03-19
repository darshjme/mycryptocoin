import { Router } from 'express';
import * as webhookController from '../controllers/webhook.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { authenticatedRateLimiter } from '../middleware/rateLimiter';
import {
  webhookSchema,
  webhookUpdateSchema,
  webhookParamSchema,
} from '../validators/merchant.schema';

const router = Router();

router.use(authenticate);
router.use(authenticatedRateLimiter);

router.post(
  '/',
  validate({ body: webhookSchema }),
  webhookController.registerWebhook,
);

router.get('/', webhookController.getWebhooks);

router.put(
  '/:id',
  validate({ params: webhookParamSchema, body: webhookUpdateSchema }),
  webhookController.updateWebhook,
);

router.delete(
  '/:id',
  validate({ params: webhookParamSchema }),
  webhookController.deleteWebhook,
);

export default router;
