/**
 * MyCryptoCoin — Encryption Module
 *
 * AES-256-GCM for sensitive data at rest (API keys, wallet keys in DB).
 * PBKDF2 key derivation. Encryption key rotation support.
 * Never stores plaintext secrets.
 */

import crypto from 'node:crypto';
import { logger } from '../utils/logger';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits — recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;
const PBKDF2_ITERATIONS = 600_000; // OWASP recommended for SHA-512
const PBKDF2_KEY_LENGTH = 32; // 256 bits
const PBKDF2_DIGEST = 'sha512';

// Key version prefix — enables rotation
const CURRENT_KEY_VERSION = 1;
const KEY_VERSION_PREFIX = `v${CURRENT_KEY_VERSION}`;

// ---------------------------------------------------------------------------
// Master key management
// ---------------------------------------------------------------------------

/**
 * The master encryption key.  In production this MUST come from:
 * - An HSM or cloud KMS (AWS KMS, GCP KMS, Azure Key Vault)
 * - An environment variable injected at runtime (never committed)
 *
 * The env var stores a hex-encoded 32-byte key.
 */
function getMasterKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_MASTER_KEY;
  if (!keyHex || keyHex.length < 64) {
    throw new Error(
      'ENCRYPTION_MASTER_KEY must be set (64 hex chars = 32 bytes). ' +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  return Buffer.from(keyHex, 'hex');
}

/**
 * Support for rotated keys.  Previous keys are stored as comma-separated
 * hex values in ENCRYPTION_PREVIOUS_KEYS.
 */
function getPreviousKeys(): Map<number, Buffer> {
  const keys = new Map<number, Buffer>();
  const prevKeysStr = process.env.ENCRYPTION_PREVIOUS_KEYS || '';
  if (!prevKeysStr) return keys;

  const parts = prevKeysStr.split(',').map((s) => s.trim()).filter(Boolean);
  // Format: "version:hexkey,version:hexkey"
  for (const part of parts) {
    const [vStr, hexKey] = part.split(':');
    const version = parseInt(vStr, 10);
    if (!isNaN(version) && hexKey && hexKey.length >= 64) {
      keys.set(version, Buffer.from(hexKey, 'hex'));
    }
  }
  return keys;
}

// ---------------------------------------------------------------------------
// Key derivation (PBKDF2) — for password-based encryption
// ---------------------------------------------------------------------------

/**
 * Derive a 256-bit key from a passphrase using PBKDF2.
 */
export function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    passphrase,
    salt,
    PBKDF2_ITERATIONS,
    PBKDF2_KEY_LENGTH,
    PBKDF2_DIGEST,
  );
}

// ---------------------------------------------------------------------------
// Encryption — AES-256-GCM
// ---------------------------------------------------------------------------

/**
 * Encrypt a plaintext string.
 * Returns a base64 string: "v1:<salt>:<iv>:<authTag>:<ciphertext>"
 *
 * The salt is used to derive a per-record key from the master key,
 * providing an extra layer of isolation.
 */
export function encrypt(plaintext: string): string {
  const masterKey = getMasterKey();
  const salt = crypto.randomBytes(SALT_LENGTH);
  const derivedKey = deriveKey(masterKey.toString('hex'), salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Format: v1:salt:iv:authTag:ciphertext (all base64)
  const result = [
    KEY_VERSION_PREFIX,  // "v1" (no trailing colon — join() adds the separator)
    salt.toString('base64'),
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':');

  return result;
}

/**
 * Decrypt a ciphertext string produced by encrypt().
 */
export function decrypt(encryptedStr: string): string {
  const parts = encryptedStr.split(':');

  if (parts.length < 5) {
    throw new Error('Invalid encrypted data format');
  }

  // Parse version
  const versionStr = parts[0];
  const version = parseInt(versionStr.replace('v', ''), 10);

  // Get the correct key for this version
  let masterKey: Buffer;
  if (version === CURRENT_KEY_VERSION) {
    masterKey = getMasterKey();
  } else {
    const previousKeys = getPreviousKeys();
    const prevKey = previousKeys.get(version);
    if (!prevKey) {
      throw new Error(`No decryption key available for version ${version}`);
    }
    masterKey = prevKey;
  }

  const salt = Buffer.from(parts[1], 'base64');
  const iv = Buffer.from(parts[2], 'base64');
  const authTag = Buffer.from(parts[3], 'base64');
  const ciphertext = Buffer.from(parts[4], 'base64');

  const derivedKey = deriveKey(masterKey.toString('hex'), salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

// ---------------------------------------------------------------------------
// Key rotation
// ---------------------------------------------------------------------------

/**
 * Re-encrypt a value with the current key version.
 * Returns the new encrypted string, or null if already on current version.
 */
export function rotateEncryption(encryptedStr: string): string | null {
  const currentVersionPrefix = `v${CURRENT_KEY_VERSION}:`;
  if (encryptedStr.startsWith(currentVersionPrefix)) {
    return null; // Already on current version
  }

  // Decrypt with old key, re-encrypt with new key
  const plaintext = decrypt(encryptedStr);
  return encrypt(plaintext);
}

/**
 * Batch rotate encrypted fields.  Call this during a migration or
 * background job after changing the master key.
 */
export async function batchRotateEncryptedFields(
  records: Array<{ id: string; encryptedValue: string }>,
  updateFn: (id: string, newEncryptedValue: string) => Promise<void>,
): Promise<{ rotated: number; skipped: number; errors: number }> {
  let rotated = 0;
  let skipped = 0;
  let errors = 0;

  for (const record of records) {
    try {
      const newValue = rotateEncryption(record.encryptedValue);
      if (newValue) {
        await updateFn(record.id, newValue);
        rotated++;
      } else {
        skipped++;
      }
    } catch (err: any) {
      logger.error('Failed to rotate encryption for record', {
        id: record.id,
        error: err.message,
      });
      errors++;
    }
  }

  logger.info('Encryption rotation batch complete', { rotated, skipped, errors });
  return { rotated, skipped, errors };
}

// ---------------------------------------------------------------------------
// Hashing (one-way, for API key storage)
// ---------------------------------------------------------------------------

/**
 * Hash an API key for storage.  Uses SHA-256 with a pepper.
 * The original key cannot be recovered — only compared.
 */
export function hashApiKey(apiKey: string): string {
  const pepper = process.env.API_KEY_PEPPER;
  if (!pepper || pepper === 'mycryptocoin-default-pepper') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('API_KEY_PEPPER must be set in production — do not use the default pepper');
    }
  }
  return crypto
    .createHmac('sha256', pepper || 'mycryptocoin-default-pepper')
    .update(apiKey)
    .digest('hex');
}

/**
 * Verify an API key against its stored hash.
 */
export function verifyApiKeyHash(apiKey: string, storedHash: string): boolean {
  const computed = hashApiKey(apiKey);
  return crypto.timingSafeEqual(
    Buffer.from(computed, 'hex'),
    Buffer.from(storedHash, 'hex'),
  );
}

// ---------------------------------------------------------------------------
// Utility: generate secure random strings
// ---------------------------------------------------------------------------

export function generateApiKey(prefix = 'mcc'): string {
  const random = crypto.randomBytes(32).toString('base64url');
  return `${prefix}_${random}`;
}

export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}
