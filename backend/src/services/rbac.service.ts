import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

// ─────────────────────────────────────────────────────────
// Role-Based Access Control (RBAC) Service
// Enterprise-grade permission matrix for MyCryptoCoin admin
// ─────────────────────────────────────────────────────────

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OPERATIONS = 'OPERATIONS',
  COMPLIANCE = 'COMPLIANCE',
  SUPPORT = 'SUPPORT',
  VIEWER = 'VIEWER',
}

export enum Permission {
  // Withdrawal operations
  WITHDRAWAL_VIEW = 'withdrawal:view',
  WITHDRAWAL_APPROVE = 'withdrawal:approve',
  WITHDRAWAL_REJECT = 'withdrawal:reject',

  // Wallet operations
  WALLET_VIEW = 'wallet:view',
  WALLET_MANAGE = 'wallet:manage',
  WALLET_SWEEP = 'wallet:sweep',

  // Merchant operations
  MERCHANT_VIEW = 'merchant:view',
  MERCHANT_EDIT = 'merchant:edit',
  MERCHANT_FREEZE = 'merchant:freeze',
  MERCHANT_DELETE = 'merchant:delete',

  // Transaction operations
  TRANSACTION_VIEW = 'transaction:view',
  TRANSACTION_EXPORT = 'transaction:export',

  // KYC/AML compliance
  COMPLIANCE_VIEW = 'compliance:view',
  COMPLIANCE_REVIEW = 'compliance:review',
  COMPLIANCE_APPROVE = 'compliance:approve',

  // Fraud & Alerts
  FRAUD_VIEW = 'fraud:view',
  FRAUD_MANAGE = 'fraud:manage',

  // Audit logs
  AUDIT_VIEW = 'audit:view',
  AUDIT_EXPORT = 'audit:export',

  // Emergency controls
  EMERGENCY_FREEZE_GLOBAL = 'emergency:freeze_global',
  EMERGENCY_FREEZE_MERCHANT = 'emergency:freeze_merchant',
  EMERGENCY_FREEZE_CRYPTO = 'emergency:freeze_crypto',
  EMERGENCY_MAINTENANCE = 'emergency:maintenance',

  // Settings
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_EDIT = 'settings:edit',

  // Session & Security
  SESSIONS_VIEW = 'sessions:view',
  SESSIONS_MANAGE = 'sessions:manage',

  // Reconciliation & Reserves
  RECONCILIATION_VIEW = 'reconciliation:view',
  RECONCILIATION_RUN = 'reconciliation:run',
  RESERVES_VIEW = 'reserves:view',

  // Admin management
  ADMIN_VIEW = 'admin:view',
  ADMIN_CREATE = 'admin:create',
  ADMIN_EDIT = 'admin:edit',
  ADMIN_DELETE = 'admin:delete',

  // Dashboard
  DASHBOARD_VIEW = 'dashboard:view',

  // Revenue
  REVENUE_VIEW = 'revenue:view',
}

/**
 * Complete permissions matrix.
 * SUPER_ADMIN: full access to everything
 * OPERATIONS: approve withdrawals, manage wallets, view transactions
 * COMPLIANCE: KYC/AML review, suspicious activity, audit logs
 * SUPPORT: view merchant profiles, transactions (read-only money operations)
 * VIEWER: dashboard only, read-only everything
 */
const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  [AdminRole.SUPER_ADMIN]: Object.values(Permission), // Full access

  [AdminRole.OPERATIONS]: [
    Permission.DASHBOARD_VIEW,
    Permission.WITHDRAWAL_VIEW,
    Permission.WITHDRAWAL_APPROVE,
    Permission.WITHDRAWAL_REJECT,
    Permission.WALLET_VIEW,
    Permission.WALLET_MANAGE,
    Permission.WALLET_SWEEP,
    Permission.MERCHANT_VIEW,
    Permission.TRANSACTION_VIEW,
    Permission.TRANSACTION_EXPORT,
    Permission.FRAUD_VIEW,
    Permission.RECONCILIATION_VIEW,
    Permission.RECONCILIATION_RUN,
    Permission.RESERVES_VIEW,
    Permission.REVENUE_VIEW,
    Permission.SESSIONS_VIEW,
    Permission.SETTINGS_VIEW,
  ],

  [AdminRole.COMPLIANCE]: [
    Permission.DASHBOARD_VIEW,
    Permission.COMPLIANCE_VIEW,
    Permission.COMPLIANCE_REVIEW,
    Permission.COMPLIANCE_APPROVE,
    Permission.FRAUD_VIEW,
    Permission.FRAUD_MANAGE,
    Permission.AUDIT_VIEW,
    Permission.AUDIT_EXPORT,
    Permission.MERCHANT_VIEW,
    Permission.TRANSACTION_VIEW,
    Permission.TRANSACTION_EXPORT,
    Permission.REVENUE_VIEW,
    Permission.RESERVES_VIEW,
  ],

  [AdminRole.SUPPORT]: [
    Permission.DASHBOARD_VIEW,
    Permission.MERCHANT_VIEW,
    Permission.TRANSACTION_VIEW,
    Permission.WITHDRAWAL_VIEW,
    Permission.WALLET_VIEW,
    Permission.COMPLIANCE_VIEW,
    Permission.FRAUD_VIEW,
    Permission.SESSIONS_VIEW,
    Permission.REVENUE_VIEW,
  ],

  [AdminRole.VIEWER]: [
    Permission.DASHBOARD_VIEW,
    Permission.MERCHANT_VIEW,
    Permission.TRANSACTION_VIEW,
    Permission.WITHDRAWAL_VIEW,
    Permission.WALLET_VIEW,
    Permission.REVENUE_VIEW,
  ],
};

const ROLE_CACHE_PREFIX = 'rbac:permissions:';
const ROLE_CACHE_TTL = 300; // 5 minutes

class RBACService {
  /**
   * Get all permissions for a given role.
   */
  getPermissionsForRole(role: AdminRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Check if a role has a specific permission.
   */
  hasPermission(role: AdminRole, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return false;
    return permissions.includes(permission);
  }

  /**
   * Check if a role has ALL of the specified permissions.
   */
  hasAllPermissions(role: AdminRole, permissions: Permission[]): boolean {
    return permissions.every((p) => this.hasPermission(role, p));
  }

  /**
   * Check if a role has ANY of the specified permissions.
   */
  hasAnyPermission(role: AdminRole, permissions: Permission[]): boolean {
    return permissions.some((p) => this.hasPermission(role, p));
  }

  /**
   * Enforce a permission — throws ForbiddenError if denied.
   */
  enforce(role: AdminRole, permission: Permission): void {
    if (!this.hasPermission(role, permission)) {
      logger.warn('Permission denied', {
        role,
        permission,
      });
      throw new ForbiddenError(
        `Permission denied: role '${role}' does not have '${permission}'`,
      );
    }
  }

  /**
   * Enforce multiple permissions (all required).
   */
  enforceAll(role: AdminRole, permissions: Permission[]): void {
    for (const permission of permissions) {
      this.enforce(role, permission);
    }
  }

  /**
   * Enforce at least one of the specified permissions.
   */
  enforceAny(role: AdminRole, permissions: Permission[]): void {
    if (!this.hasAnyPermission(role, permissions)) {
      logger.warn('Permission denied', {
        role,
        permissions,
      });
      throw new ForbiddenError(
        `Permission denied: role '${role}' does not have any of [${permissions.join(', ')}]`,
      );
    }
  }

  /**
   * Get the role hierarchy level (higher = more privileged).
   */
  getRoleLevel(role: AdminRole): number {
    const levels: Record<AdminRole, number> = {
      [AdminRole.SUPER_ADMIN]: 100,
      [AdminRole.OPERATIONS]: 80,
      [AdminRole.COMPLIANCE]: 70,
      [AdminRole.SUPPORT]: 50,
      [AdminRole.VIEWER]: 10,
    };
    return levels[role] ?? 0;
  }

  /**
   * Check if role A is equal or higher privilege than role B.
   */
  isRoleAtLeast(role: AdminRole, minimumRole: AdminRole): boolean {
    return this.getRoleLevel(role) >= this.getRoleLevel(minimumRole);
  }

  /**
   * Validate that the given string is a valid admin role.
   */
  isValidRole(role: string): role is AdminRole {
    return Object.values(AdminRole).includes(role as AdminRole);
  }

  /**
   * Get cached permissions for an admin user.
   * Falls back to role-based lookup if no custom overrides exist.
   */
  async getCachedPermissions(adminId: string, role: AdminRole): Promise<Permission[]> {
    const cacheKey = `${ROLE_CACHE_PREFIX}${adminId}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as Permission[];
      }
    } catch {
      // Cache miss or error — fall through to role-based lookup
    }

    const permissions = this.getPermissionsForRole(role);

    try {
      await redis.setex(cacheKey, ROLE_CACHE_TTL, JSON.stringify(permissions));
    } catch {
      // Non-critical — continue without cache
    }

    return permissions;
  }

  /**
   * Invalidate cached permissions for an admin user (e.g., after role change).
   */
  async invalidateCache(adminId: string): Promise<void> {
    try {
      await redis.del(`${ROLE_CACHE_PREFIX}${adminId}`);
    } catch (error) {
      logger.warn('Failed to invalidate RBAC cache', { adminId, error });
    }
  }

  /**
   * Get a human-readable description of a role.
   */
  getRoleDescription(role: AdminRole): string {
    const descriptions: Record<AdminRole, string> = {
      [AdminRole.SUPER_ADMIN]: 'Full system access — can perform all operations including emergency controls and admin management',
      [AdminRole.OPERATIONS]: 'Operational access — approve withdrawals, manage wallets, run reconciliation',
      [AdminRole.COMPLIANCE]: 'Compliance access — KYC/AML review, fraud management, audit logs',
      [AdminRole.SUPPORT]: 'Support access — read-only view of merchants, transactions, and wallets',
      [AdminRole.VIEWER]: 'Viewer access — dashboard and basic read-only access only',
    };
    return descriptions[role] || 'Unknown role';
  }

  /**
   * Get all available roles with their descriptions and permission counts.
   */
  getAllRoles(): Array<{
    role: AdminRole;
    description: string;
    permissionCount: number;
    level: number;
  }> {
    return Object.values(AdminRole).map((role) => ({
      role,
      description: this.getRoleDescription(role),
      permissionCount: this.getPermissionsForRole(role).length,
      level: this.getRoleLevel(role),
    }));
  }
}

export const rbacService = new RBACService();
