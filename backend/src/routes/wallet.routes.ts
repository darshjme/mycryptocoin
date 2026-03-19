import { Router } from 'express';
import * as walletController from '../controllers/wallet.controller';
import { authenticateAny } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { authenticatedRateLimiter } from '../middleware/rateLimiter';
import {
  walletCryptoParamSchema,
  autoWithdrawSchema,
  withdrawSchema,
} from '../validators/wallet.schema';

const router = Router();

router.use(authenticateAny);
router.use(authenticatedRateLimiter);

router.get('/', walletController.getWallets);

router.get(
  '/:crypto',
  validate({ params: walletCryptoParamSchema }),
  walletController.getWallet,
);

router.put(
  '/:crypto/auto-withdraw',
  validate({ params: walletCryptoParamSchema, body: autoWithdrawSchema }),
  walletController.configureAutoWithdraw,
);

router.post(
  '/:crypto/withdraw',
  validate({ params: walletCryptoParamSchema, body: withdrawSchema }),
  walletController.withdraw,
);

export default router;
