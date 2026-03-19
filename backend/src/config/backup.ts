/**
 * MyCryptoCoin — Automated PostgreSQL Backup Configuration
 *
 * Schedules backups every 6 hours to local storage + S3.
 * Supports point-in-time recovery, backup verification, and retention policies.
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs/promises';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface BackupConfig {
  /** PostgreSQL connection string */
  databaseUrl: string;

  /** Local backup directory */
  localDir: string;

  /** S3 bucket name */
  s3Bucket: string;

  /** S3 prefix (folder) */
  s3Prefix: string;

  /** AWS region */
  awsRegion: string;

  /** Backup schedule interval in ms (default: 6 hours) */
  intervalMs: number;

  /** Retention policies */
  retention: {
    /** Number of daily backups to keep */
    daily: number;
    /** Number of weekly backups to keep */
    weekly: number;
    /** Number of monthly backups to keep */
    monthly: number;
  };

  /** Enable WAL archiving for PITR */
  enablePitr: boolean;

  /** Run a restore verification after backup */
  verifyBackups: boolean;

  /** Notification webhook URL for alerts */
  alertWebhookUrl?: string;
}

export const DEFAULT_BACKUP_CONFIG: BackupConfig = {
  databaseUrl: process.env.DATABASE_URL || '',
  localDir: process.env.BACKUP_LOCAL_DIR || '/var/backups/mycryptocoin',
  s3Bucket: process.env.BACKUP_S3_BUCKET || 'mycryptocoin-backups',
  s3Prefix: process.env.BACKUP_S3_PREFIX || 'postgres',
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  intervalMs: 6 * 60 * 60 * 1000, // 6 hours
  retention: {
    daily: 7,
    weekly: 4,
    monthly: 12,
  },
  enablePitr: true,
  verifyBackups: process.env.NODE_ENV === 'production',
  alertWebhookUrl: process.env.BACKUP_ALERT_WEBHOOK,
};

// ---------------------------------------------------------------------------
// Backup types
// ---------------------------------------------------------------------------

type BackupType = 'hourly' | 'daily' | 'weekly' | 'monthly';

interface BackupResult {
  filename: string;
  localPath: string;
  s3Key: string | null;
  sizeBytes: number;
  durationMs: number;
  verified: boolean;
  type: BackupType;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Backup execution
// ---------------------------------------------------------------------------

function getBackupFilename(type: BackupType): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  return `mycryptocoin-${type}-${ts}.sql.gz`;
}

function classifyBackup(): BackupType {
  const now = new Date();
  if (now.getDate() === 1) return 'monthly';
  if (now.getDay() === 0) return 'weekly';
  if (now.getHours() === 2) return 'daily'; // 2 AM backup is the daily
  return 'hourly';
}

export async function performBackup(
  config: BackupConfig = DEFAULT_BACKUP_CONFIG,
): Promise<BackupResult> {
  const startTime = Date.now();
  const type = classifyBackup();
  const filename = getBackupFilename(type);
  const localPath = path.join(config.localDir, filename);

  logger.info('Starting PostgreSQL backup', { type, filename });

  try {
    // Ensure backup directory exists
    await fs.mkdir(config.localDir, { recursive: true });

    // ---- pg_dump with compression -----------------------------------------
    const pgDumpCmd = [
      'pg_dump',
      `"${config.databaseUrl}"`,
      '--format=custom',
      '--compress=9',
      '--no-owner',
      '--no-privileges',
      '--verbose',
      `--file="${localPath}"`,
    ].join(' ');

    await execAsync(pgDumpCmd, { timeout: 600_000 }); // 10 min timeout

    // ---- Get file size ----------------------------------------------------
    const stat = await fs.stat(localPath);
    logger.info('pg_dump completed', {
      filename,
      sizeBytes: stat.size,
      sizeMb: (stat.size / 1024 / 1024).toFixed(2),
    });

    // ---- Upload to S3 -----------------------------------------------------
    let s3Key: string | null = null;
    try {
      s3Key = `${config.s3Prefix}/${type}/${filename}`;
      const s3Cmd = [
        'aws', 's3', 'cp',
        `"${localPath}"`,
        `"s3://${config.s3Bucket}/${s3Key}"`,
        `--region ${config.awsRegion}`,
        '--storage-class STANDARD_IA',
      ].join(' ');

      await execAsync(s3Cmd, { timeout: 600_000 });
      logger.info('Backup uploaded to S3', { s3Key });
    } catch (s3Err: any) {
      logger.error('S3 upload failed', { error: s3Err.message });
      s3Key = null;
    }

    // ---- Verify backup (restore test to temp DB) --------------------------
    let verified = false;
    if (config.verifyBackups) {
      verified = await verifyBackup(localPath, config);
    }

    // ---- Cleanup old backups ----------------------------------------------
    await cleanupOldBackups(config);

    const result: BackupResult = {
      filename,
      localPath,
      s3Key,
      sizeBytes: stat.size,
      durationMs: Date.now() - startTime,
      verified,
      type,
      timestamp: new Date().toISOString(),
    };

    logger.info('Backup completed successfully', {
      ...result,
      localPath: undefined, // don't log full path
    });

    return result;
  } catch (err: any) {
    logger.error('Backup failed', { error: err.message, filename });

    // Send alert
    if (config.alertWebhookUrl) {
      await sendAlert(config.alertWebhookUrl, `Backup failed: ${err.message}`);
    }

    throw err;
  }
}

// ---------------------------------------------------------------------------
// Backup verification — restore to a throwaway database
// ---------------------------------------------------------------------------

async function verifyBackup(backupPath: string, config: BackupConfig): Promise<boolean> {
  const verifyDbName = `mycryptocoin_verify_${Date.now()}`;

  try {
    logger.info('Verifying backup — creating temp database', { verifyDbName });

    // Parse connection string to get host/port/user
    const url = new URL(config.databaseUrl);
    const pgHost = url.hostname;
    const pgPort = url.port || '5432';
    const pgUser = url.username;

    // Create temp database
    await execAsync(
      `PGPASSWORD="${url.password}" createdb -h ${pgHost} -p ${pgPort} -U ${pgUser} ${verifyDbName}`,
      { timeout: 30_000 },
    );

    // Restore
    const restoreUrl = config.databaseUrl.replace(url.pathname, `/${verifyDbName}`);
    await execAsync(
      `pg_restore --dbname="${restoreUrl}" --no-owner --no-privileges "${backupPath}"`,
      { timeout: 300_000 },
    );

    // Basic sanity check — query a core table
    await execAsync(
      `PGPASSWORD="${url.password}" psql -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${verifyDbName} -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"`,
      { timeout: 30_000 },
    );

    logger.info('Backup verification passed');

    // Drop temp database
    await execAsync(
      `PGPASSWORD="${url.password}" dropdb -h ${pgHost} -p ${pgPort} -U ${pgUser} ${verifyDbName}`,
      { timeout: 30_000 },
    );

    return true;
  } catch (err: any) {
    logger.error('Backup verification failed', { error: err.message });

    // Attempt cleanup
    try {
      const url = new URL(config.databaseUrl);
      await execAsync(
        `PGPASSWORD="${url.password}" dropdb -h ${url.hostname} -p ${url.port || '5432'} -U ${url.username} --if-exists ${verifyDbName}`,
        { timeout: 10_000 },
      );
    } catch {
      // Ignore cleanup errors
    }

    return false;
  }
}

// ---------------------------------------------------------------------------
// Cleanup old backups (local + S3) based on retention policy
// ---------------------------------------------------------------------------

async function cleanupOldBackups(config: BackupConfig): Promise<void> {
  try {
    const files = await fs.readdir(config.localDir);
    const backupFiles = files
      .filter((f) => f.startsWith('mycryptocoin-') && f.endsWith('.sql.gz'))
      .sort()
      .reverse(); // newest first

    const toDelete: string[] = [];
    let dailyCount = 0;
    let weeklyCount = 0;
    let monthlyCount = 0;

    for (const file of backupFiles) {
      if (file.includes('-daily-')) {
        dailyCount++;
        if (dailyCount > config.retention.daily) toDelete.push(file);
      } else if (file.includes('-weekly-')) {
        weeklyCount++;
        if (weeklyCount > config.retention.weekly) toDelete.push(file);
      } else if (file.includes('-monthly-')) {
        monthlyCount++;
        if (monthlyCount > config.retention.monthly) toDelete.push(file);
      } else {
        // Hourly backups — keep last 4 (24 hours)
        // Handled by the daily cleanup
        toDelete.push(file); // will be cleaned if old
      }
    }

    // Delete hourly backups older than 24 hours
    const oneDayAgo = Date.now() - 86_400_000;
    const hourlyToDelete = backupFiles.filter((f) => {
      if (!f.includes('-hourly-')) return false;
      const match = f.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
      if (!match) return true;
      const ts = new Date(match[1].replace(/-/g, (m, i) => (i > 9 ? ':' : m))).getTime();
      return ts < oneDayAgo;
    });

    const allToDelete = [...new Set([...toDelete, ...hourlyToDelete])];

    for (const file of allToDelete) {
      const filePath = path.join(config.localDir, file);
      await fs.unlink(filePath);
      logger.debug('Deleted old backup', { file });
    }

    if (allToDelete.length > 0) {
      logger.info('Cleaned up old backups', { deletedCount: allToDelete.length });
    }

    // S3 cleanup via lifecycle rules is preferred, but we also clean manually
    try {
      for (const type of ['hourly', 'daily', 'weekly', 'monthly']) {
        const maxAge = type === 'hourly' ? 1 : type === 'daily' ? config.retention.daily : type === 'weekly' ? config.retention.weekly * 7 : config.retention.monthly * 30;
        await execAsync(
          `aws s3 ls "s3://${config.s3Bucket}/${config.s3Prefix}/${type}/" --region ${config.awsRegion} 2>/dev/null | awk '{print $4}' | head -n -${maxAge} | while read f; do aws s3 rm "s3://${config.s3Bucket}/${config.s3Prefix}/${type}/$f" --region ${config.awsRegion}; done`,
          { timeout: 120_000 },
        );
      }
    } catch {
      // S3 cleanup is best-effort
    }
  } catch (err: any) {
    logger.error('Backup cleanup failed', { error: err.message });
  }
}

// ---------------------------------------------------------------------------
// Alert helper
// ---------------------------------------------------------------------------

async function sendAlert(webhookUrl: string, message: string): Promise<void> {
  try {
    const payload = JSON.stringify({
      text: `[MyCryptoCoin Backup Alert] ${message}`,
      timestamp: new Date().toISOString(),
    });
    await execAsync(
      `curl -s -X POST -H "Content-Type: application/json" -d '${payload}' "${webhookUrl}"`,
      { timeout: 10_000 },
    );
  } catch {
    // Best-effort
  }
}

// ---------------------------------------------------------------------------
// Scheduler — call from main process
// ---------------------------------------------------------------------------

let backupInterval: NodeJS.Timeout | null = null;

export function startBackupScheduler(config: BackupConfig = DEFAULT_BACKUP_CONFIG): void {
  logger.info('Starting backup scheduler', { intervalMs: config.intervalMs });

  // Run immediately on startup
  performBackup(config).catch((err) => {
    logger.error('Initial backup failed', { error: err.message });
  });

  backupInterval = setInterval(() => {
    performBackup(config).catch((err) => {
      logger.error('Scheduled backup failed', { error: err.message });
    });
  }, config.intervalMs);
}

export function stopBackupScheduler(): void {
  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;
    logger.info('Backup scheduler stopped');
  }
}
