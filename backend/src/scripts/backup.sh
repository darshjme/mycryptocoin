#!/usr/bin/env bash
# ===========================================================================
# MyCryptoCoin — PostgreSQL Backup Script
#
# Usage:
#   ./backup.sh                    # Run backup with defaults
#   ./backup.sh --type daily       # Force backup type
#   ./backup.sh --restore <file>   # Restore from backup (use restore.sh instead)
#
# Environment variables (required):
#   DATABASE_URL          — PostgreSQL connection string
#   BACKUP_S3_BUCKET      — S3 bucket name
#   AWS_REGION            — AWS region (default: us-east-1)
#
# Optional:
#   BACKUP_LOCAL_DIR      — Local backup dir (default: /var/backups/mycryptocoin)
#   BACKUP_S3_PREFIX      — S3 key prefix (default: postgres)
#   BACKUP_ALERT_WEBHOOK  — Slack/webhook URL for alerts
#   BACKUP_RETENTION_DAILY   — Number of daily backups to keep (default: 7)
#   BACKUP_RETENTION_WEEKLY  — Number of weekly backups to keep (default: 4)
#   BACKUP_RETENTION_MONTHLY — Number of monthly backups to keep (default: 12)
# ===========================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BACKUP_DIR="${BACKUP_LOCAL_DIR:-/var/backups/mycryptocoin}"
S3_BUCKET="${BACKUP_S3_BUCKET:-mycryptocoin-backups}"
S3_PREFIX="${BACKUP_S3_PREFIX:-postgres}"
REGION="${AWS_REGION:-us-east-1}"
RETENTION_DAILY="${BACKUP_RETENTION_DAILY:-7}"
RETENTION_WEEKLY="${BACKUP_RETENTION_WEEKLY:-4}"
RETENTION_MONTHLY="${BACKUP_RETENTION_MONTHLY:-12}"
ALERT_WEBHOOK="${BACKUP_ALERT_WEBHOOK:-}"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%S")
DAY_OF_WEEK=$(date -u +"%u") # 1=Monday, 7=Sunday
DAY_OF_MONTH=$(date -u +"%d")
HOUR=$(date -u +"%H")

# Determine backup type
if [ "${1:-}" = "--type" ] && [ -n "${2:-}" ]; then
  BACKUP_TYPE="$2"
elif [ "$DAY_OF_MONTH" = "01" ]; then
  BACKUP_TYPE="monthly"
elif [ "$DAY_OF_WEEK" = "7" ]; then
  BACKUP_TYPE="weekly"
elif [ "$HOUR" = "02" ]; then
  BACKUP_TYPE="daily"
else
  BACKUP_TYPE="hourly"
fi

FILENAME="mycryptocoin-${BACKUP_TYPE}-${TIMESTAMP}.dump"
LOCAL_PATH="${BACKUP_DIR}/${FILENAME}"
S3_KEY="${S3_PREFIX}/${BACKUP_TYPE}/${FILENAME}"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

log() {
  echo "[$(date -u +"%Y-%m-%d %H:%M:%S UTC")] $1"
}

send_alert() {
  local message="$1"
  local status="${2:-error}"

  if [ -n "$ALERT_WEBHOOK" ]; then
    curl -s -X POST "$ALERT_WEBHOOK" \
      -H "Content-Type: application/json" \
      -d "{\"text\":\"[MyCryptoCoin Backup ${status}] ${message}\",\"timestamp\":\"$(date -u --iso-8601=seconds)\"}" \
      >/dev/null 2>&1 || true
  fi
}

cleanup_on_exit() {
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    log "ERROR: Backup failed with exit code ${exit_code}"
    send_alert "Backup failed: ${FILENAME} (exit code: ${exit_code})" "error"

    # Remove partial backup
    rm -f "$LOCAL_PATH" 2>/dev/null || true
  fi
}

trap cleanup_on_exit EXIT

# ---------------------------------------------------------------------------
# Preflight checks
# ---------------------------------------------------------------------------

if [ -z "${DATABASE_URL:-}" ]; then
  log "ERROR: DATABASE_URL is not set"
  exit 1
fi

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Check available disk space (need at least 1 GB free)
AVAIL_KB=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')
if [ "$AVAIL_KB" -lt 1048576 ]; then
  log "ERROR: Insufficient disk space (${AVAIL_KB} KB available, need 1 GB)"
  send_alert "Backup aborted: insufficient disk space (${AVAIL_KB} KB)" "error"
  exit 1
fi

# Check pg_dump is available
if ! command -v pg_dump &>/dev/null; then
  log "ERROR: pg_dump not found in PATH"
  exit 1
fi

# ---------------------------------------------------------------------------
# Step 1: pg_dump
# ---------------------------------------------------------------------------

log "Starting ${BACKUP_TYPE} backup: ${FILENAME}"
START_TIME=$(date +%s)

pg_dump "$DATABASE_URL" \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  --verbose \
  --file="$LOCAL_PATH" \
  2>&1 | while IFS= read -r line; do log "pg_dump: $line"; done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
FILE_SIZE=$(stat -f%z "$LOCAL_PATH" 2>/dev/null || stat -c%s "$LOCAL_PATH" 2>/dev/null)
FILE_SIZE_MB=$(echo "scale=2; $FILE_SIZE / 1048576" | bc)

log "pg_dump completed in ${DURATION}s (${FILE_SIZE_MB} MB)"

# ---------------------------------------------------------------------------
# Step 2: Checksum
# ---------------------------------------------------------------------------

CHECKSUM=$(sha256sum "$LOCAL_PATH" | awk '{print $1}')
echo "$CHECKSUM  $FILENAME" >> "${BACKUP_DIR}/checksums.txt"
log "SHA256: ${CHECKSUM}"

# ---------------------------------------------------------------------------
# Step 3: Upload to S3
# ---------------------------------------------------------------------------

if command -v aws &>/dev/null && [ -n "$S3_BUCKET" ]; then
  log "Uploading to S3: s3://${S3_BUCKET}/${S3_KEY}"

  aws s3 cp "$LOCAL_PATH" "s3://${S3_BUCKET}/${S3_KEY}" \
    --region "$REGION" \
    --storage-class STANDARD_IA \
    --sse AES256 \
    --metadata "checksum=${CHECKSUM},type=${BACKUP_TYPE},duration=${DURATION}" \
    2>&1 | while IFS= read -r line; do log "S3: $line"; done

  log "S3 upload complete"
else
  log "WARNING: aws CLI not available or S3_BUCKET not set — skipping S3 upload"
fi

# ---------------------------------------------------------------------------
# Step 4: Cleanup old local backups
# ---------------------------------------------------------------------------

log "Cleaning up old local backups..."

cleanup_type() {
  local type="$1"
  local keep="$2"

  local count=0
  # List backups of this type, newest first
  for f in $(ls -t "${BACKUP_DIR}"/mycryptocoin-${type}-*.dump 2>/dev/null); do
    count=$((count + 1))
    if [ "$count" -gt "$keep" ]; then
      log "Deleting old ${type} backup: $(basename "$f")"
      rm -f "$f"
    fi
  done
}

cleanup_type "hourly" 4
cleanup_type "daily" "$RETENTION_DAILY"
cleanup_type "weekly" "$RETENTION_WEEKLY"
cleanup_type "monthly" "$RETENTION_MONTHLY"

# ---------------------------------------------------------------------------
# Step 5: S3 cleanup (delete old backups beyond retention)
# ---------------------------------------------------------------------------

if command -v aws &>/dev/null && [ -n "$S3_BUCKET" ]; then
  s3_cleanup_type() {
    local type="$1"
    local keep="$2"
    local prefix="${S3_PREFIX}/${type}/"

    local files
    files=$(aws s3 ls "s3://${S3_BUCKET}/${prefix}" --region "$REGION" 2>/dev/null | awk '{print $4}' | sort -r)
    local count=0
    for f in $files; do
      count=$((count + 1))
      if [ "$count" -gt "$keep" ]; then
        log "Deleting old S3 ${type} backup: ${f}"
        aws s3 rm "s3://${S3_BUCKET}/${prefix}${f}" --region "$REGION" 2>/dev/null || true
      fi
    done
  }

  s3_cleanup_type "hourly" 4
  s3_cleanup_type "daily" "$RETENTION_DAILY"
  s3_cleanup_type "weekly" "$RETENTION_WEEKLY"
  s3_cleanup_type "monthly" "$RETENTION_MONTHLY"
fi

# ---------------------------------------------------------------------------
# Step 6: Summary
# ---------------------------------------------------------------------------

log "========================================="
log "Backup complete!"
log "  Type:     ${BACKUP_TYPE}"
log "  File:     ${FILENAME}"
log "  Size:     ${FILE_SIZE_MB} MB"
log "  Duration: ${DURATION}s"
log "  SHA256:   ${CHECKSUM}"
log "  S3:       s3://${S3_BUCKET}/${S3_KEY}"
log "========================================="

send_alert "Backup successful: ${FILENAME} (${FILE_SIZE_MB} MB, ${DURATION}s)" "success"
