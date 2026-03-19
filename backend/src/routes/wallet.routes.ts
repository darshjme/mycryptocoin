import { Router } from 'express';
import * as walletController from '../controllers/wallet.controller';
import { authenticateAny, requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { authenticatedRateLimiter } from '../middleware/rateLimiter';
import {
  walletParamSchema,
  autoWithdrawSchema,
  withdrawSchema,
} from '../validators/wallet.schema';

const router = Router();

router.use(authenticateAny);
router.use(authenticatedRateLimiter);

router.get('/', requirePermission('wallets:read'), walletController.getWallets);

router.get(
  '/:network/:token',
  requirePermission('wallets:read'),
  validate({ params: walletParamSchema }),
  walletController.getWallet,
);

router.put(
  '/:network/:token/auto-withdraw',
  requirePermission('wallets:write'),
  validate({ params: walletParamSchema, body: autoWithdrawSchema }),
  walletController.configureAutoWithdraw,
);

router.post(
  '/:network/:token/withdraw',
  requirePermission('wallets:write'),
  validate({ params: walletParamSchema, body: withdrawSchema }),
  walletController.withdraw,
);

export default router;
