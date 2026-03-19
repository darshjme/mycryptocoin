import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { auditService, AuditAction } from './audit.service';
import { logger } from '../utils/logger';
import { AuthError, ForbiddenError, ValidationError } from '../utils/errors';

// ─────────────────────────────────────────────────────────
// Admin Session & IP Security Service
// IP whitelisting, session management, login monitoring
// ─────────────────────────────────────────────────────────

export interface AdminSession {
  id: string;
  adminId: string;
  adminEmail: string;
  adminRole: string;
  ipAddress: string;
  userAgent: string;
  device: string;
  location: string;
  createdAt: Date;
  lastActiveAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason: string | null;
  createdAt: Date;
}

export interface IPWhitelistEntry {
  id: string;
  adminId: string;
  adminEmail: string;
  ipAddress: string;
  label: string;
  addedAt: Date;
  addedBy: string;
}

const LOGIN_ATTEMPTS_PREFIX = 'admin:login_attempts:';
const SESSION_PREFIX = 'admin:session:';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60;       // 30 minutes in seconds
const MAX_CONCURRENT_SESSIONS = 3;
const SESSION_TIMEOUT = 8 * 60 * 60;    // 8 hours in seconds

class AdminSecurityService {
  // ═══════════════════════════════════════════════════════
  // IP WHITELISTING
  // ═══════════════════════════════════════════════════════

  /**
   * Check if an IP is whitelisted for a specific admin.
   * If no whitelist is configured for the admin, all IPs are allowed.
   */
  async isIpAllowed(adminId: string, ipAddress: string): Promise<boolean> {
    // Check if admin has any whitelist entries
    const whitelistCount = await prisma.ipWhitelist.count({
      where: { adminId },
    });

    // No whitelist configured = all IPs allowed
    if (whitelistCount === 0) return true;

    // Check if IP is in the whitelist
    const entry = await prisma.ipWhitelist.findFirst({
      where: {
        adminId,
        ipAddress,
      },
    });

    return !!entry;
  }

  /**
   * Get all IP whitelist entries.
   */
  async getIpWhitelist(): Promise<IPWhitelistEntry[]> {
    const entries = await prisma.ipWhitelist.findMany({
      include: {
        admin: { select: { email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return entries.map((e: any) => ({
      id: e.id,
      adminId: e.adminId,
      adminEmail: e.admin?.email || '',
      ipAddress: e.ipAddress,
      label: e.label || '',
      addedAt: e.createdAt,
      addedBy: e.addedBy,
    }));
  }

  /**
   * Add an IP to whitelist for a specific admin.
   */
  async addIpToWhitelist(
    adminId: string,
    ipAddress: string,
    label: string,
    addedBy: string,
  ): Promise<void> {
    // Validate IP format (basic check)
    if (!this.isValidIp(ipAddress)) {
      throw new ValidationError('Invalid IP address format');
    }

    await prisma.ipWhitelist.create({
      data: {
        adminId,
        ipAddress,
        label,
        addedBy,
      },
    });

    await auditService.log({
      adminId: addedBy,
      action: AuditAction.IP_WHITELIST_UPDATED,
      target: `ip_whitelist:${adminId}`,
      targetId: adminId,
      previousValue: '',
      newValue: JSON.stringify({ ipAddress, label }),
      metadata: { action: 'add' },
      ipAddress: '',
      userAgent: '',
    });

    logger.info('IP added to whitelist', { adminId, ipAddress, addedBy });
  }

  /**
   * Remove an IP from whitelist.
   */
  async removeIpFromWhitelist(
    entryId: string,
    removedBy: string,
  ): Promise<void> {
    const entry = await prisma.ipWhitelist.findUnique({
      where: { id: entryId },
    });

    if (!entry) return;

    await prisma.ipWhitelist.delete({ where: { id: entryId } });

    await auditService.log({
      adminId: removedBy,
      action: AuditAction.IP_WHITELIST_UPDATED,
      target: `ip_whitelist:${entry.adminId}`,
      targetId: entry.adminId,
      previousValue: JSON.stringify({ ipAddress: entry.ipAddress }),
      newValue: '',
      metadata: { action: 'remove' },
      ipAddress: '',
      userAgent: '',
    });

    logger.info('IP removed from whitelist', { entryId, removedBy });
  }

  // ═══════════════════════════════════════════════════════
  // LOGIN ATTEMPT TRACKING & LOCKOUT
  // ═══════════════════════════════════════════════════════

  /**
   * Check if an account is locked due to failed attempts.
   */
  async isAccountLocked(email: string): Promise<{
    locked: boolean;
    remainingSeconds: number;
  }> {
    const lockKey = `${LOGIN_ATTEMPTS_PREFIX}lockout:${email}`;
    const ttl = await redis.ttl(lockKey);

    if (ttl > 0) {
      return { locked: true, remainingSeconds: ttl };
    }

    return { locked: false, remainingSeconds: 0 };
  }

  /**
   * Record a login attempt.
   */
  async recordLoginAttempt(params: {
    email: string;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    failureReason?: string;
  }): Promise<void> {
    // Store in DB for history
    await prisma.adminLoginLog.create({
      data: {
        email: params.email,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        success: params.success,
        failureReason: params.failureReason || null,
      },
    });

    if (params.success) {
      // Reset failed attempts on success
      await redis.del(`${LOGIN_ATTEMPTS_PREFIX}count:${params.email}`);
      await redis.del(`${LOGIN_ATTEMPTS_PREFIX}lockout:${params.email}`);

      await auditService.log({
        adminId: params.email,
        action: AuditAction.ADMIN_LOGIN,
        target: `admin:${params.email}`,
        targetId: params.email,
        previousValue: '',
        newValue: '',
        metadata: {},
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
    } else {
      // Increment failed attempts
      const attemptsKey = `${LOGIN_ATTEMPTS_PREFIX}count:${params.email}`;
      const attempts = await redis.incr(attemptsKey);
      await redis.expire(attemptsKey, LOCKOUT_DURATION);

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        // Lock account
        await redis.setex(
          `${LOGIN_ATTEMPTS_PREFIX}lockout:${params.email}`,
          LOCKOUT_DURATION,
          'locked',
        );

        logger.warn('Admin account locked due to failed login attempts', {
          email: params.email,
          attempts,
          lockoutDuration: LOCKOUT_DURATION,
        });
      }

      await auditService.log({
        adminId: params.email,
        action: AuditAction.ADMIN_LOGIN_FAILED,
        target: `admin:${params.email}`,
        targetId: params.email,
        previousValue: '',
        newValue: JSON.stringify({ failureReason: params.failureReason, attempts }),
        metadata: { attempts },
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
    }
  }

  /**
   * Get login history.
   */
  async getLoginHistory(options: {
    email?: string;
    success?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    attempts: LoginAttempt[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { email, success, page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (email) where.email = email;
    if (success !== undefined) where.success = success;

    const [attempts, total] = await Promise.all([
      prisma.adminLoginLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.adminLoginLog.count({ where }),
    ]);

    return {
      attempts: attempts.map((a: any) => ({
        id: a.id,
        email: a.email,
        ipAddress: a.ipAddress,
        userAgent: a.userAgent,
        success: a.success,
        failureReason: a.failureReason,
        createdAt: a.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ═══════════════════════════════════════════════════════
  // SESSION MANAGEMENT
  // ═══════════════════════════════════════════════════════

  /**
   * Create a new admin session.
   */
  async createSession(params: {
    adminId: string;
    adminEmail: string;
    adminRole: string;
    ipAddress: string;
    userAgent: string;
  }): Promise<AdminSession> {
    // Check concurrent sessions
    const activeSessions = await prisma.adminSession.count({
      where: {
        adminId: params.adminId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });

    if (activeSessions >= MAX_CONCURRENT_SESSIONS) {
      // Expire oldest session
      const oldest = await prisma.adminSession.findFirst({
        where: {
          adminId: params.adminId,
          isActive: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      if (oldest) {
        await prisma.adminSession.update({
          where: { id: oldest.id },
          data: { isActive: false },
        });
        await redis.del(`${SESSION_PREFIX}${oldest.id}`);
      }
    }

    const expiresAt = new Date(Date.now() + SESSION_TIMEOUT * 1000);
    const device = this.parseDevice(params.userAgent);

    const session = await prisma.adminSession.create({
      data: {
        adminId: params.adminId,
        adminEmail: params.adminEmail,
        adminRole: params.adminRole,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        device,
        location: '', // Populated by geo-IP in production
        expiresAt,
        isActive: true,
        lastActiveAt: new Date(),
      },
    });

    // Cache in Redis for fast lookup
    await redis.setex(
      `${SESSION_PREFIX}${session.id}`,
      SESSION_TIMEOUT,
      JSON.stringify({
        adminId: params.adminId,
        adminEmail: params.adminEmail,
        adminRole: params.adminRole,
      }),
    );

    return {
      id: session.id,
      adminId: params.adminId,
      adminEmail: params.adminEmail,
      adminRole: params.adminRole,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      device,
      location: '',
      createdAt: session.createdAt,
      lastActiveAt: session.lastActiveAt,
      expiresAt,
      isActive: true,
    };
  }

  /**
   * Validate and refresh a session.
   */
  async validateSession(sessionId: string): Promise<AdminSession | null> {
    // Quick check in Redis
    const cached = await redis.get(`${SESSION_PREFIX}${sessionId}`);
    if (!cached) return null;

    const session = await prisma.adminSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      await redis.del(`${SESSION_PREFIX}${sessionId}`);
      return null;
    }

    // Update last active
    await prisma.adminSession.update({
      where: { id: sessionId },
      data: { lastActiveAt: new Date() },
    });

    return {
      id: session.id,
      adminId: session.adminId,
      adminEmail: session.adminEmail,
      adminRole: session.adminRole,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      device: session.device || '',
      location: session.location || '',
      createdAt: session.createdAt,
      lastActiveAt: new Date(),
      expiresAt: session.expiresAt,
      isActive: session.isActive,
    };
  }

  /**
   * Get all active admin sessions.
   */
  async getActiveSessions(): Promise<AdminSession[]> {
    const sessions = await prisma.adminSession.findMany({
      where: {
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: 'desc' },
    });

    return sessions.map((s: any) => ({
      id: s.id,
      adminId: s.adminId,
      adminEmail: s.adminEmail,
      adminRole: s.adminRole,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      device: s.device || '',
      location: s.location || '',
      createdAt: s.createdAt,
      lastActiveAt: s.lastActiveAt,
      expiresAt: s.expiresAt,
      isActive: s.isActive,
    }));
  }

  /**
   * Force logout a specific session.
   */
  async forceLogout(
    sessionId: string,
    adminId: string,
    ipAddress: string,
  ): Promise<void> {
    const session = await prisma.adminSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) return;

    await prisma.adminSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });

    await redis.del(`${SESSION_PREFIX}${sessionId}`);

    await auditService.log({
      adminId,
      action: AuditAction.SESSION_FORCE_LOGOUT,
      target: `session:${sessionId}`,
      targetId: sessionId,
      previousValue: JSON.stringify({ active: true }),
      newValue: JSON.stringify({ active: false }),
      metadata: { targetAdminId: session.adminId, targetAdminEmail: session.adminEmail },
      ipAddress,
      userAgent: '',
    });

    logger.info('Admin session force-logged out', {
      sessionId,
      targetAdmin: session.adminEmail,
      actionBy: adminId,
    });
  }

  /**
   * Force logout all sessions for a specific admin.
   */
  async forceLogoutAll(
    targetAdminId: string,
    actionAdminId: string,
    ipAddress: string,
  ): Promise<number> {
    const sessions = await prisma.adminSession.findMany({
      where: { adminId: targetAdminId, isActive: true },
    });

    for (const session of sessions) {
      await prisma.adminSession.update({
        where: { id: session.id },
        data: { isActive: false },
      });
      await redis.del(`${SESSION_PREFIX}${session.id}`);
    }

    await auditService.log({
      adminId: actionAdminId,
      action: AuditAction.SESSION_FORCE_LOGOUT_ALL,
      target: `admin:${targetAdminId}`,
      targetId: targetAdminId,
      previousValue: JSON.stringify({ activeSessions: sessions.length }),
      newValue: JSON.stringify({ activeSessions: 0 }),
      metadata: {},
      ipAddress,
      userAgent: '',
    });

    logger.info('All sessions force-logged out for admin', {
      targetAdminId,
      sessionCount: sessions.length,
      actionBy: actionAdminId,
    });

    return sessions.length;
  }

  /**
   * Clean up expired sessions (scheduled job).
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.adminSession.updateMany({
      where: {
        isActive: true,
        expiresAt: { lt: new Date() },
      },
      data: { isActive: false },
    });

    if (result.count > 0) {
      logger.info('Cleaned up expired admin sessions', { count: result.count });
    }

    return result.count;
  }

  // ═══════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════

  private isValidIp(ip: string): boolean {
    // IPv4
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(ip)) {
      return ip.split('.').every((octet) => {
        const num = parseInt(octet, 10);
        return num >= 0 && num <= 255;
      });
    }
    // IPv6 (basic check)
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv6Regex.test(ip);
  }

  private parseDevice(userAgent: string): string {
    if (!userAgent) return 'Unknown';

    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Windows')) return 'Windows Desktop';
    if (userAgent.includes('Macintosh')) return 'Mac Desktop';
    if (userAgent.includes('Linux')) return 'Linux Desktop';

    return 'Desktop';
  }
}

export const adminSecurityService = new AdminSecurityService();
