import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import {
  attachAdminContext,
  requirePermission,
  requireAllPermissions,
  requireSuperAdmin,
  logPermissionCheck,
} from '../middleware/rbac.middleware';
import { Permission } from '../services/rbac.service';
import { settingsService } from '../services/settings.service';
import { auditService } from '../services/audit.service';
import { emergencyService } from '../services/emergency.service';
import { reconciliationService } from '../services/reconciliation.service';
import { walletManagementService } from '../services/wallet-management.service';
import { complianceService, KYCStatus } from '../services/compliance.service';
import { fraudDetectionService, AlertStatus, AlertSeverity } from '../services/fraud-detection.service';
import { withdrawalApprovalService } from '../services/withdrawal-approval.service';
import { adminSecurityService } from '../services/admin-security.service';
import { authenticatedRateLimiter } from '../middleware/rateLimiter';
import { CryptoSymbol } from '../config/crypto';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication + admin context
router.use(authenticate);
router.use(attachAdminContext);
router.use(authenticatedRateLimiter);

// ═══════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════

router.get(
  '/settings',
  requirePermission(Permission.SETTINGS_VIEW),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const settings = await settingsService.getSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  },
);

router.put(
  '/settings',
  requirePermission(Permission.SETTINGS_EDIT),
  logPermissionCheck('settings.update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const settings = await settingsService.updateSettings(
        req.body,
        req.admin!.id,
        req.ip || '',
      );
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  },
);

// ═══════════════════════════════════════════════════════
// AUDIT LOG
// ═══════════════════════════════════════════════════════

router.get(
  '/audit-log',
  requirePermission(Permission.AUDIT_VIEW),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        adminId,
        action,
        actionPrefix,
        search,
        startDate,
        endDate,
        page,
        limit,
      } = req.query;

      const result = await auditService.query({
        adminId: adminId as string,
        action: action as any,
        actionPrefix: actionPrefix as string,
        search: search as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 50,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/audit-log/export',
  requirePermission(Permission.AUDIT_EXPORT),
  logPermissionCheck('audit.export'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate, adminId, action } = req.query;
      const entries = await auditService.exportLogs({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        adminId: adminId as string,
        action: action as any,
      });

      res.json({ success: true, data: entries });
    } catch (error) {
      next(error);
    }
  },
);

// ═══════════════════════════════════════════════════════
// EMERGENCY CONTROLS
// ═══════════════════════════════════════════════════════

router.get(
  '/emergency/status',
  requirePermission(Permission.SETTINGS_VIEW),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await emergencyService.getFreezeStatus();
      res.json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/emergency/freeze-global',
  requirePermission(Permission.EMERGENCY_FREEZE_GLOBAL),
  logPermissionCheck('emergency.global_freeze'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reason, action } = req.body;

      if (action === 'unfreeze') {
        await emergencyService.deactivateGlobalFreeze(req.admin!.id, req.ip || '');
        res.json({ success: true, message: 'Global freeze deactivated' });
      } else {
        await emergencyService.activateGlobalFreeze(req.admin!.id, reason, req.ip || '');
        res.json({ success: true, message: 'GLOBAL FREEZE ACTIVATED — All withdrawals halted' });
      }
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/emergency/freeze-merchant/:id',
  requirePermission(Permission.EMERGENCY_FREEZE_MERCHANT),
  logPermissionCheck('emergency.merchant_freeze'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reason, action } = req.body;
      const merchantId = req.params.id;

      if (action === 'unfreeze') {
        await emergencyService.unfreezeMerchant(merchantId, req.admin!.id, req.ip || '');
        res.json({ success: true, message: 'Merchant unfrozen' });
      } else {
        await emergencyService.freezeMerchant(merchantId, req.admin!.id, reason, req.ip || '');
        res.json({ success: true, message: 'Merchant frozen' });
      }
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/emergency/freeze-crypto/:symbol',
  requirePermission(Permission.EMERGENCY_FREEZE_CRYPTO),
  logPermissionCheck('emergency.crypto_freeze'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reason, action } = req.body;
      const crypto = req.params.symbol as CryptoSymbol;

      if (action === 'unfreeze') {
        await emergencyService.unfreezeCrypto(crypto, req.admin!.id, req.ip || '');
        res.json({ success: true, message: `${crypto} unfrozen` });
      } else {
        await emergencyService.freezeCrypto(crypto, req.admin!.id, reason, req.ip || '');
        res.json({ success: true, message: `${crypto} frozen` });
      }
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/emergency/maintenance',
  requirePermission(Permission.EMERGENCY_MAINTENANCE),
  logPermissionCheck('emergency.maintenance'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { enabled, message } = req.body;

      if (enabled) {
        await emergencyService.enableMaintenanceMode(req.admin!.id, message || '', req.ip || '');
        res.json({ success: true, message: 'Maintenance mode enabled' });
      } else {
        await emergencyService.disableMaintenanceMode(req.admin!.id, req.ip || '');
        res.json({ success: true, message: 'Maintenance mode disabled' });
      }
    } catch (error) {
      next(error);
    }
  },
);

// ═══════════════════════════════════════════════════════
// RECONCILIATION & PROOF OF RESERVES
// ═══════════════════════════════════════════════════════

router.get(
  '/reconciliation',
  requirePermission(Permission.RECONCILIATION_VIEW),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await reconciliationService.getLatestReport();
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/reconciliation/run',
  requirePermission(Permission.RECONCILIATION_RUN),
  logPermissionCheck('reconciliation.run'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await reconciliationService.runReconciliation(req.admin!.id, 'manual');
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/proof-of-reserves',
  requirePermission(Permission.RESERVES_VIEW),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reserves = await reconciliationService.getProofOfReserves();
      res.json({ success: true, data: reserves });
    } catch (error) {
      next(error);
    }
  },
);

// ═══════════════════════════════════════════════════════
// HOT/COLD WALLET MANAGEMENT
// ═══════════════════════════════════════════════════════

router.get(
  '/wallets/hot-cold',
  requirePermission(Permission.WALLET_VIEW),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const balances = await walletManagementService.getWalletBalances();
      res.json({ success: true, data: balances });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/wallets/sweep',
  requireAllPermissions([Permission.WALLET_MANAGE, Permission.WALLET_SWEEP]),
  logPermissionCheck('wallet.sweep'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { crypto, amount } = req.body;
      const result = await walletManagementService.sweepToCold(
        crypto as CryptoSymbol,
        req.admin!.id,
        amount,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// ═══════════════════════════════════════════════════════
// COMPLIANCE / KYC
// ═══════════════════════════════════════════════════════

router.get(
  '/compliance/merchants',
  requirePermission(Permission.COMPLIANCE_VIEW),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, page, limit } = req.query;
      const result = await complianceService.getReviewQueue({
        status: status as KYCStatus,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

router.put(
  '/compliance/merchants/:id',
  requirePermission(Permission.COMPLIANCE_APPROVE),
  logPermissionCheck('compliance.review'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const submissionId = req.params.id;
      const { action, reason, notes, requirements } = req.body;

      switch (action) {
        case 'approve':
          await complianceService.approveSubmission(submissionId, req.admin!.id, notes);
          res.json({ success: true, message: 'KYC approved' });
          break;
        case 'reject':
          await complianceService.rejectSubmission(submissionId, req.admin!.id, reason, notes);
          res.json({ success: true, message: 'KYC rejected' });
          break;
        case 'request_info':
          await complianceService.requestAdditionalInfo(submissionId, req.admin!.id, requirements);
          res.json({ success: true, message: 'Additional info requested' });
          break;
        default:
          res.status(400).json({ success: false, message: 'Invalid action' });
      }
    } catch (error) {
      next(error);
    }
  },
);

// ═══════════════════════════════════════════════════════
// FRAUD DETECTION
// ═══════════════════════════════════════════════════════

router.get(
  '/fraud/alerts',
  requirePermission(Permission.FRAUD_VIEW),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, severity, merchantId, type, page, limit } = req.query;
      const result = await fraudDetectionService.getAlerts({
        status: status as AlertStatus,
        severity: severity as AlertSeverity,
        merchantId: merchantId as string,
        type: type as any,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/fraud/alerts/counts',
  requirePermission(Permission.FRAUD_VIEW),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const counts = await fraudDetectionService.getAlertCounts();
      res.json({ success: true, data: counts });
    } catch (error) {
      next(error);
    }
  },
);

router.put(
  '/fraud/alerts/:id',
  requirePermission(Permission.FRAUD_MANAGE),
  logPermissionCheck('fraud.alert_action'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { action, notes } = req.body;
      await fraudDetectionService.acknowledgeAlert(
        req.params.id,
        req.admin!.id,
        action,
        notes,
      );
      res.json({ success: true, message: `Alert ${action}` });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/fraud/rules',
  requirePermission(Permission.FRAUD_VIEW),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rules = await fraudDetectionService.getRules();
      res.json({ success: true, data: rules });
    } catch (error) {
      next(error);
    }
  },
);

router.put(
  '/fraud/rules',
  requirePermission(Permission.FRAUD_MANAGE),
  logPermissionCheck('fraud.rules_update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rules = await fraudDetectionService.updateRules(req.body, req.admin!.id);
      res.json({ success: true, data: rules });
    } catch (error) {
      next(error);
    }
  },
);

// ═══════════════════════════════════════════════════════
// WITHDRAWAL APPROVALS
// ═══════════════════════════════════════════════════════

router.get(
  '/withdrawals/pending',
  requirePermission(Permission.WITHDRAWAL_VIEW),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, sortOrder } = req.query;
      const result = await withdrawalApprovalService.getPendingWithdrawals({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        sortBy: (sortBy as 'amount' | 'createdAt') || 'createdAt',
        sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/withdrawals/history',
  requirePermission(Permission.WITHDRAWAL_VIEW),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, status } = req.query;
      const result = await withdrawalApprovalService.getApprovalHistory({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        status: status as 'APPROVED' | 'REJECTED',
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/withdrawals/:id/approve',
  requirePermission(Permission.WITHDRAWAL_APPROVE),
  logPermissionCheck('withdrawal.approve'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment } = req.body;
      const result = await withdrawalApprovalService.approveWithdrawal(
        req.params.id,
        req.admin!.id,
        req.admin!.email,
        req.admin!.role,
        comment || '',
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/withdrawals/:id/reject',
  requirePermission(Permission.WITHDRAWAL_REJECT),
  logPermissionCheck('withdrawal.reject'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reason } = req.body;
      await withdrawalApprovalService.rejectWithdrawal(
        req.params.id,
        req.admin!.id,
        req.admin!.email,
        req.admin!.role,
        reason,
      );
      res.json({ success: true, message: 'Withdrawal rejected' });
    } catch (error) {
      next(error);
    }
  },
);

// ═══════════════════════════════════════════════════════
// SESSION & SECURITY
// ═══════════════════════════════════════════════════════

router.get(
  '/sessions',
  requirePermission(Permission.SESSIONS_VIEW),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessions = await adminSecurityService.getActiveSessions();
      res.json({ success: true, data: sessions });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  '/sessions/:id',
  requirePermission(Permission.SESSIONS_MANAGE),
  logPermissionCheck('session.force_logout'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminSecurityService.forceLogout(
        req.params.id,
        req.admin!.id,
        req.ip || '',
      );
      res.json({ success: true, message: 'Session terminated' });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/login-history',
  requirePermission(Permission.SESSIONS_VIEW),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, success, page, limit } = req.query;
      const result = await adminSecurityService.getLoginHistory({
        email: email as string,
        success: success !== undefined ? success === 'true' : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 50,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/ip-whitelist',
  requirePermission(Permission.SESSIONS_VIEW),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entries = await adminSecurityService.getIpWhitelist();
      res.json({ success: true, data: entries });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/ip-whitelist',
  requirePermission(Permission.SESSIONS_MANAGE),
  logPermissionCheck('security.ip_whitelist_add'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { adminId, ipAddress, label } = req.body;
      await adminSecurityService.addIpToWhitelist(
        adminId,
        ipAddress,
        label,
        req.admin!.id,
      );
      res.json({ success: true, message: 'IP added to whitelist' });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  '/ip-whitelist/:id',
  requirePermission(Permission.SESSIONS_MANAGE),
  logPermissionCheck('security.ip_whitelist_remove'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminSecurityService.removeIpFromWhitelist(
        req.params.id,
        req.admin!.id,
      );
      res.json({ success: true, message: 'IP removed from whitelist' });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
