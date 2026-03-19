import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { AuthError, ForbiddenError } from '../utils/errors';
import { hashApiKey } from '../utils/helpers';
import { logger } from '../utils/logger';

export interface JwtPayload {
  merchantId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      merchant?: {
        id: string;
        email: string;
        role: string;
      };
      apiKey?: {
        id: string;
        merchantId: string;
        mode: string;
        permissions: string[];
      };
    }
  }
}

/**
 * JWT authentication middleware.
 * Extracts token from Authorization header or cookies.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new AuthError('No authentication token provided');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.merchant = {
      id: decoded.merchantId,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AuthError('Token has expired'));
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthError('Invalid token'));
      return;
    }
    next(error);
  }
}

/**
 * API key authentication middleware.
 * Checks the X-API-Key header.
 */
export async function authenticateApiKey(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const apiKeyRaw = req.headers['x-api-key'] as string;
    if (!apiKeyRaw) {
      throw new AuthError('No API key provided');
    }

    // Validate format: mcc_live_xxxx or mcc_test_xxxx
    if (!apiKeyRaw.startsWith('mcc_live_') && !apiKeyRaw.startsWith('mcc_test_')) {
      throw new AuthError('Invalid API key format');
    }

    const keyHash = hashApiKey(apiKeyRaw);

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        keyHash,
        isActive: true,
        revokedAt: null,
      },
      include: {
        merchant: {
          select: { id: true, email: true, role: true, isActive: true },
        },
      },
    });

    if (!apiKey) {
      throw new AuthError('Invalid or revoked API key');
    }

    if (!apiKey.merchant.isActive) {
      throw new ForbiddenError('Merchant account is deactivated');
    }

    // SECURITY: Enforce IP whitelist if configured on the API key.
    // An empty whitelist means all IPs are allowed.
    if (apiKey.ipWhitelist && Array.isArray(apiKey.ipWhitelist) && apiKey.ipWhitelist.length > 0) {
      const requestIp = req.ip || req.socket.remoteAddress || '';
      const normalizedIp = requestIp.replace(/^::ffff:/, ''); // Handle IPv4-mapped IPv6
      if (!apiKey.ipWhitelist.includes(normalizedIp)) {
        logger.warn('API key used from non-whitelisted IP', {
          apiKeyId: apiKey.id,
          requestIp: normalizedIp,
          whitelist: apiKey.ipWhitelist,
        });
        throw new ForbiddenError('Request IP is not in the API key whitelist');
      }
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    req.apiKey = {
      id: apiKey.id,
      merchantId: apiKey.merchantId,
      mode: apiKeyRaw.startsWith('mcc_live_') ? 'live' : 'test',
      permissions: apiKey.permissions as string[] || [],
    };

    req.merchant = {
      id: apiKey.merchant.id,
      email: apiKey.merchant.email,
      role: apiKey.merchant.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware that accepts either JWT or API key.
 */
export async function authenticateAny(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const hasApiKey = !!req.headers['x-api-key'];
  const hasToken = !!extractToken(req);

  if (hasApiKey) {
    return authenticateApiKey(req, res, next);
  }
  if (hasToken) {
    return authenticate(req, res, next);
  }

  next(new AuthError('Authentication required'));
}

/**
 * Admin role check middleware (must be used after authenticate).
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.merchant || req.merchant.role !== 'ADMIN') {
    next(new ForbiddenError('Admin access required'));
    return;
  }
  next();
}

/**
 * SECURITY: API key permission enforcement middleware.
 * If the request was authenticated via an API key, verify the key has
 * the required permission scope. JWT-authenticated users bypass this
 * (they have full access to their own account).
 *
 * Usage: router.post('/create', authenticateAny, requirePermission('payments:write'), handler);
 */
export function requirePermission(...requiredPermissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // JWT-based auth has full access
    if (!req.apiKey) {
      next();
      return;
    }

    const keyPermissions = req.apiKey.permissions || [];
    const hasAll = requiredPermissions.every((p) => keyPermissions.includes(p));

    if (!hasAll) {
      next(
        new ForbiddenError(
          `API key lacks required permission(s): ${requiredPermissions.join(', ')}`,
        ),
      );
      return;
    }

    next();
  };
}

/**
 * Extract JWT from Authorization header or cookies.
 */
function extractToken(req: Request): string | null {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check cookies
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
}

/**
 * Generate access and refresh tokens.
 */
export function generateTokens(payload: JwtPayload): {
  accessToken: string;
  refreshToken: string;
} {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as any,
  });

  const refreshToken = jwt.sign(
    { ...payload, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRY as any,
    },
  );

  return { accessToken, refreshToken };
}

/**
 * Verify refresh token.
 */
export function verifyRefreshToken(token: string): JwtPayload & { type: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload & { type: string };
}
