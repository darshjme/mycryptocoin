import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../middleware/errorHandler';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);

  res.status(201).json({
    success: true,
    data: result.merchant,
    message: result.message,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);

  res.status(200).json({
    success: true,
    data: {
      requiresOTP: result.requiresOTP,
      otpSentVia: result.otpSentVia,
      tempToken: result.tempToken,
    },
  });
});

export const verifyWhatsappOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await authService.verifyWhatsappOTP(req.body);

    if (result.tokens) {
      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/v1/auth/refresh-token',
      });

      res.cookie('accessToken', result.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });
    }

    res.status(200).json({
      success: true,
      data: result.tokens
        ? {
            accessToken: result.tokens.accessToken,
            refreshToken: result.tokens.refreshToken,
          }
        : undefined,
      message: result.message,
    });
  },
);

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.verifyEmail(req.body.token);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const token =
      req.body.refreshToken || req.cookies?.refreshToken;

    const result = await authService.refreshToken(token);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth/refresh-token',
    });

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  },
);

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.merchant!.id);

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await authService.forgotPassword(req.body.email);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  },
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await authService.resetPassword(
      req.body.token,
      req.body.password,
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  },
);
