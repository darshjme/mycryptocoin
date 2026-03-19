import { Router } from 'express';
import * as merchantController from '../controllers/merchant.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { authenticatedRateLimiter } from '../middleware/rateLimiter';
import {
  updateProfileSchema,
  createApiKeySchema,
  deleteApiKeyParamSchema,
} from '../validators/merchant.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(authenticatedRateLimiter);

router.get('/profile', merchantController.getProfile);

router.put(
  '/profile',
  validate({ body: updateProfileSchema }),
  merchantController.updateProfile,
);

router.post(
  '/api-keys',
  validate({ body: createApiKeySchema }),
  merchantController.createApiKey,
);

router.get('/api-keys', merchantController.getApiKeys);

router.delete(
  '/api-keys/:id',
  validate({ params: deleteApiKeyParamSchema }),
  merchantController.deleteApiKey,
);

export default router;
