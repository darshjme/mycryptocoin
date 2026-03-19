import { Router } from 'express';
import * as transactionController from '../controllers/transaction.controller';
import { authenticateAny } from '../middleware/auth';
import { authenticatedRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticateAny);
router.use(authenticatedRateLimiter);

router.get('/', transactionController.listTransactions);

export default router;
