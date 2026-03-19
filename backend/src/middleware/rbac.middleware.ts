import { Request, Response, NextFunction } from 'express';
import { AdminRole, Permission, rbacService } from '../services/rbac.service';
import { ForbiddenError, AuthError } from '../utils/errors';
import { logger } from '../utils/logger';

// ─────────────────────────────────────────────────────────
// RBAC Middleware
// Express middleware to enforce role-based access control
// ─────────────────────────────────────────────────────────

// Extend Express Request to include admin context
declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string;
        email: string;
        role: AdminRole;
        name: string;
      };
    }
  }
}

/**
 * Middleware: require the admin to have a specific permission.
 * Must be used AFTER authentication middleware.
 *
 * Usage:
 *   router.get('/audit', requirePermission(Permission.AUDIT_VIEW), controller.getAuditLog);
 */
export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const admin = req.admin;
      if (!admin) {
        throw new AuthError('Admin authentication required');
      }

      if (!rbacService.isValidRole(admin.role)) {
        throw new ForbiddenError(`Invalid admin role: ${admin.role}`);
      }

      rbacService.enforce(admin.role, permission);

      logger.debug('Permission check passed', {
        adminId: admin.id,
        role: admin.role,
        permission,
        path: req.path,
      });

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware: require the admin to have ALL of the specified permissions.
 *
 * Usage:
 *   router.post('/wallets/sweep',
 *     requireAllPermissions([Permission.WALLET_MANAGE, Permission.WALLET_SWEEP]),
 *     controller.sweepWallet
 *   );
 */
export function requireAllPermissions(permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const admin = req.admin;
      if (!admin) {
        throw new AuthError('Admin authentication required');
      }

      if (!rbacService.isValidRole(admin.role)) {
        throw new ForbiddenError(`Invalid admin role: ${admin.role}`);
      }

      rbacService.enforceAll(admin.role, permissions);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware: require the admin to have ANY of the specified permissions.
 *
 * Usage:
 *   router.get('/merchants',
 *     requireAnyPermission([Permission.MERCHANT_VIEW, Permission.COMPLIANCE_VIEW]),
 *     controller.getMerchants
 *   );
 */
export function requireAnyPermission(permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const admin = req.admin;
      if (!admin) {
        throw new AuthError('Admin authentication required');
      }

      if (!rbacService.isValidRole(admin.role)) {
        throw new ForbiddenError(`Invalid admin role: ${admin.role}`);
      }

      rbacService.enforceAny(admin.role, permissions);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware: require the admin's role to be at or above a minimum role level.
 *
 * Usage:
 *   router.use(requireRole(AdminRole.OPERATIONS));
 */
export function requireRole(minimumRole: AdminRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const admin = req.admin;
      if (!admin) {
        throw new AuthError('Admin authentication required');
      }

      if (!rbacService.isValidRole(admin.role)) {
        throw new ForbiddenError(`Invalid admin role: ${admin.role}`);
      }

      if (!rbacService.isRoleAtLeast(admin.role, minimumRole)) {
        throw new ForbiddenError(
          `Insufficient role: '${admin.role}' requires at least '${minimumRole}'`,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware: require SUPER_ADMIN role only.
 * Shorthand for critical operations.
 */
export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction): void {
  try {
    const admin = req.admin;
    if (!admin) {
      throw new AuthError('Admin authentication required');
    }

    if (admin.role !== AdminRole.SUPER_ADMIN) {
      logger.warn('Super admin access denied', {
        adminId: admin.id,
        role: admin.role,
        path: req.path,
        ip: req.ip,
      });
      throw new ForbiddenError('This operation requires SUPER_ADMIN access');
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware: attach admin context to request from JWT payload.
 * This bridges the existing auth middleware to the RBAC system.
 * Must be used AFTER the existing authenticate middleware.
 */
export function attachAdminContext(req: Request, _res: Response, next: NextFunction): void {
  try {
    if (!req.merchant) {
      throw new AuthError('Authentication required');
    }

    // Map the merchant (admin user) to the admin context
    req.admin = {
      id: req.merchant.id,
      email: req.merchant.email,
      role: req.merchant.role as AdminRole,
      name: req.merchant.email.split('@')[0], // Fallback name from email
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Log permission checks for audit trail.
 * Use this after permission middleware for sensitive operations.
 */
export function logPermissionCheck(action: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.admin) {
      logger.info('Admin access', {
        action,
        adminId: req.admin.id,
        role: req.admin.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method,
      });
    }
    next();
  };
}
