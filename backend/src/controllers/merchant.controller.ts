import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { generateApiKey, generateApiKeySecret, hashApiKey } from '../utils/helpers';
import { NotFoundError } from '../utils/errors';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const merchant = await prisma.merchant.findUnique({
    where: { id: req.merchant!.id },
    select: {
      id: true,
      email: true,
      businessName: true,
      phone: true,
      whatsappNumber: true,
      country: true,
      website: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      notificationPreferences: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!merchant) {
    throw new NotFoundError('Merchant not found');
  }

  res.status(200).json({
    success: true,
    data: merchant,
  });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const updated = await prisma.merchant.update({
    where: { id: req.merchant!.id },
    data: {
      ...(req.body.businessName && { businessName: req.body.businessName }),
      ...(req.body.website && { website: req.body.website }),
      ...(req.body.country && { country: req.body.country }),
      ...(req.body.phone && { phone: req.body.phone }),
      ...(req.body.whatsappNumber && { whatsappNumber: req.body.whatsappNumber }),
      ...(req.body.notificationPreferences && {
        notificationPreferences: req.body.notificationPreferences,
      }),
    },
    select: {
      id: true,
      email: true,
      businessName: true,
      phone: true,
      whatsappNumber: true,
      country: true,
      website: true,
      notificationPreferences: true,
      updatedAt: true,
    },
  });

  res.status(200).json({
    success: true,
    data: updated,
    message: 'Profile updated successfully',
  });
});

export const createApiKey = asyncHandler(async (req: Request, res: Response) => {
  const { name, mode, permissions, ipWhitelist } = req.body;

  const rawKey = generateApiKey(mode);
  const secret = generateApiKeySecret();
  const keyHash = hashApiKey(rawKey);

  const apiKey = await prisma.apiKey.create({
    data: {
      merchantId: req.merchant!.id,
      name,
      keyHash,
      keyPrefix: rawKey.slice(0, 16),
      mode,
      permissions,
      ipWhitelist: ipWhitelist || [],
      isActive: true,
    },
  });

  // Return the raw key only once — it cannot be retrieved again
  res.status(201).json({
    success: true,
    data: {
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey,
      secret,
      mode: apiKey.mode,
      permissions: apiKey.permissions,
      ipWhitelist: apiKey.ipWhitelist,
      createdAt: apiKey.createdAt,
    },
    message:
      'API key created. Store the key and secret securely — they cannot be retrieved again.',
  });
});

export const getApiKeys = asyncHandler(async (req: Request, res: Response) => {
  const apiKeys = await prisma.apiKey.findMany({
    where: {
      merchantId: req.merchant!.id,
      revokedAt: null,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      mode: true,
      permissions: true,
      ipWhitelist: true,
      isActive: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: apiKeys,
  });
});

export const deleteApiKey = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const apiKey = await prisma.apiKey.findFirst({
    where: { id, merchantId: req.merchant!.id },
  });

  if (!apiKey) {
    throw new NotFoundError('API key not found');
  }

  await prisma.apiKey.update({
    where: { id },
    data: {
      isActive: false,
      revokedAt: new Date(),
    },
  });

  res.status(200).json({
    success: true,
    message: 'API key revoked successfully',
  });
});
