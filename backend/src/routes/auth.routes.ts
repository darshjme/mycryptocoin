import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { strictRateLimiter } from '../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  verifyWhatsappOtpSchema,
  verifyEmailSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.schema';

const router = Router();

router.post(
  '/register',
  strictRateLimiter,
  validate({ body: registerSchema }),
  authController.register,
);

router.post(
  '/login',
  strictRateLimiter,
  validate({ body: loginSchema }),
  authController.login,
);

router.post(
  '/verify-whatsapp-otp',
  strictRateLimiter,
  validate({ body: verifyWhatsappOtpSchema }),
  authController.verifyWhatsappOtp,
);

router.post(
  '/verify-email',
  validate({ body: verifyEmailSchema }),
  authController.verifyEmail,
);

router.post(
  '/refresh-token',
  validate({ body: refreshTokenSchema }),
  authController.refreshToken,
);

router.post('/logout', authenticate, authController.logout);

router.post(
  '/forgot-password',
  strictRateLimiter,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword,
);

router.post(
  '/reset-password',
  strictRateLimiter,
  validate({ body: resetPasswordSchema }),
  authController.resetPassword,
);

export default router;
