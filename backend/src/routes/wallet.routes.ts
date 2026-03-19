import { Router } from 'express';
import * as walletController from '../controllers/wallet.controller';
import { authenticateAny } from '../middleware/auth';
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

router.get('/', walletController.getWallets);

router.get(
  '/:network/:token',
  validate({ params: walletParamSchema }),
  walletController.getWallet,
);

router.put(
  '/:network/:token/auto-withdraw',
  validate({ params: walletParamSchema, body: autoWithdrawSchema }),
  walletController.configureAutoWithdraw,
);

router.post(
  '/:network/:token/withdraw',
  validate({ params: walletParamSchema, body: withdrawSchema }),
  walletController.withdraw,
);

export default router;
