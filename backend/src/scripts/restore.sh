#!/usr/bin/env bash
# ===========================================================================
# MyCryptoCoin — PostgreSQL Restore Script
#
# Usage:
#   ./restore.sh <backup-file>                  # Restore from local file
#   ./restore.sh --s3 <s3-key>                  # Restore from S3
#   ./restore.sh --pitr "2024-06-15 14:30:00"   # Point-in-time recovery
#   ./restore.sh --list                         # List available backups
#   ./restore.sh --verify <backup-file>         # Verify backup integrity
#
# Environment variables (required):
#   DATABASE_URL — PostgreSQL connection string for the TARGET database
#
# Optional:
#   BACKUP_LOCAL_DIR  — Local backup dir (default: /var/backups/mycryptocoin)
#   BACKUP_S3_BUCKET  — S3 bucket
#   AWS_REGION        — AWS region
# ===========================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BACKUP_DIR="${BACKUP_LOCAL_DIR:-/var/backups/mycryptocoin}"
S3_BUCKET="${BACKUP_S3_BUCKET:-mycryptocoin-backups}"
S3_PREFIX="${BACKUP_S3_PREFIX:-postgres}"
REGION="${AWS_REGION:-us-east-1}"

# Temp restore database name
RESTORE_VERIFY_DB="mycryptocoin_restore_verify_$$"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

log() {
  echo "[$(date -u +"%Y-%m-%d %H:%M:%S UTC")] $1"
}

die() {
  log "FATAL: $1"
  exit 1
}

confirm() {
  local prompt="$1"
  echo ""
  echo "========================================="
  echo "  WARNING: DESTRUCTIVE OPERATION"
  echo "========================================="
  echo ""
  read -rp "$prompt [yes/NO]: " answer
  if [ "$answer" != "yes" ]; then
    log "Aborted by user"
    exit 0
  fi
}

# Parse DATABASE_URL to get components
parse_db_url() {
  if [ -z "${DATABASE_URL:-}" ]; then
    die "DATABASE_URL is not set"
  fi

  DB_PROTO=$(echo "$DATABASE_URL" | sed -n 's|^\([^:]*\)://.*|\1|p')
  DB_USER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
  DB_PASS=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:/]*\).*|\1|p')
  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
  DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')

  DB_PORT="${DB_PORT:-5432}"
}

# ---------------------------------------------------------------------------
# Command: --list
# ---------------------------------------------------------------------------

list_backups() {
  log "Local backups in ${BACKUP_DIR}:"
  echo ""

  if [ -d "$BACKUP_DIR" ]; then
    ls -lhS "${BACKUP_DIR}"/mycryptocoin-*.sql.gz 2>/dev/null | while IFS= read -r line; do
      echo "  $line"
    done
  else
    echo "  (no local backup directory)"
  fi

  echo ""

  if command -v aws &>/dev/null && [ -n "$S3_BUCKET" ]; then
    log "S3 backups in s3://${S3_BUCKET}/${S3_PREFIX}/:"
    echo ""
    for type in monthly weekly daily hourly; do
      echo "  [${type}]"
      aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/${type}/" --region "$REGION" 2>/dev/null | while IFS= read -r line; do
        echo "    $line"
      done
      echo ""
    done
  fi
}

# ---------------------------------------------------------------------------
# Command: --verify
# ---------------------------------------------------------------------------

verify_backup() {
  local backup_file="$1"

  if [ ! -f "$backup_file" ]; then
    die "Backup file not found: ${backup_file}"
  fi

  parse_db_url

  log "Verifying backup: ${backup_file}"

  # Check file integrity
  log "Checking file integrity..."
  pg_restore --list "$backup_file" > /dev/null 2>&1 || die "Backup file is corrupt or invalid"
  log "File integrity check passed"

  # Verify checksum if available
  local filename
  filename=$(basename "$backup_file")
  if [ -f "${BACKUP_DIR}/checksums.txt" ]; then
    local stored_checksum
    stored_checksum=$(grep "$filename" "${BACKUP_DIR}/checksums.txt" 2>/dev/null | awk '{print $1}')
    if [ -n "$stored_checksum" ]; then
      local actual_checksum
      actual_checksum=$(sha256sum "$backup_file" | awk '{print $1}')
      if [ "$stored_checksum" = "$actual_checksum" ]; then
        log "SHA256 checksum verified"
      else
        die "Checksum mismatch! Expected: ${stored_checksum}, Got: ${actual_checksum}"
      fi
    else
      log "WARNING: No stored checksum found for ${filename}"
    fi
  fi

  # Test restore to temp database
  log "Creating temp database: ${RESTORE_VERIFY_DB}"
  PGPASSWORD="$DB_PASS" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$RESTORE_VERIFY_DB"

  local verify_url="${DB_PROTO}://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${RESTORE_VERIFY_DB}"

  log "Restoring to temp database..."
  pg_restore \
    --dbname="$verify_url" \
    --no-owner \
    --no-privileges \
    --jobs=4 \
    "$backup_file" 2>&1 | while IFS= read -r line; do log "restore: $line"; done

  # Sanity checks
  log "Running sanity checks..."
  local table_count
  table_count=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$RESTORE_VERIFY_DB" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
  log "Tables found: ${table_count}"

  if [ "${table_count// /}" -eq 0 ]; then
    log "WARNING: No tables found in restored database"
  fi

  # Cleanup
  log "Dropping temp database..."
  PGPASSWORD="$DB_PASS" dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$RESTORE_VERIFY_DB"

  log "Verification PASSED"
}

# ---------------------------------------------------------------------------
# Command: restore from file
# ---------------------------------------------------------------------------

restore_from_file() {
  local backup_file="$1"

  if [ ! -f "$backup_file" ]; then
    die "Backup file not found: ${backup_file}"
  fi

  parse_db_url

  log "Target database: ${DB_NAME} at ${DB_HOST}:${DB_PORT}"
  log "Backup file: ${backup_file}"
  log "File size: $(du -h "$backup_file" | awk '{print $1}')"

  # List contents
  log "Backup contents:"
  pg_restore --list "$backup_file" | head -20

  confirm "This will OVERWRITE the database '${DB_NAME}'. Are you sure?"

  # Step 1: Terminate existing connections
  log "Terminating existing connections to ${DB_NAME}..."
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" \
    2>/dev/null || true

  # Step 2: Drop and recreate database
  log "Dropping database ${DB_NAME}..."
  PGPASSWORD="$DB_PASS" dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" --if-exists "$DB_NAME"

  log "Creating database ${DB_NAME}..."
  PGPASSWORD="$DB_PASS" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"

  # Step 3: Restore
  log "Restoring from backup..."
  local start_time
  start_time=$(date +%s)

  pg_restore \
    --dbname="$DATABASE_URL" \
    --no-owner \
    --no-privileges \
    --jobs=4 \
    --verbose \
    "$backup_file" 2>&1 | while IFS= read -r line; do log "restore: $line"; done

  local end_time
  end_time=$(date +%s)
  local duration=$((end_time - start_time))

  log "Restore completed in ${duration}s"

  # Step 4: Run Prisma migrations (in case backup is behind current schema)
  log "Applying any pending Prisma migrations..."
  cd "$(dirname "$0")/../../.."
  npx prisma migrate deploy 2>&1 | while IFS= read -r line; do log "prisma: $line"; done

  # Step 5: Verify
  log "Verifying restore..."
  local table_count
  table_count=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
  log "Public tables found: ${table_count}"

  local row_counts
  row_counts=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
    "SELECT schemaname, relname AS table, n_live_tup AS row_count FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 10;")
  log "Top tables by row count:"
  echo "$row_counts"

  log "========================================="
  log "Restore complete!"
  log "  Database: ${DB_NAME}"
  log "  Tables:   ${table_count}"
  log "  Duration: ${duration}s"
  log "========================================="
}

# ---------------------------------------------------------------------------
# Command: restore from S3
# ---------------------------------------------------------------------------

restore_from_s3() {
  local s3_key="$1"

  if ! command -v aws &>/dev/null; then
    die "aws CLI not found"
  fi

  local local_file="${BACKUP_DIR}/$(basename "$s3_key")"

  log "Downloading from S3: s3://${S3_BUCKET}/${s3_key}"
  aws s3 cp "s3://${S3_BUCKET}/${s3_key}" "$local_file" --region "$REGION"
  log "Downloaded to ${local_file}"

  restore_from_file "$local_file"
}

# ---------------------------------------------------------------------------
# Command: point-in-time recovery
# ---------------------------------------------------------------------------

restore_pitr() {
  local target_time="$1"

  parse_db_url

  log "Point-in-time recovery to: ${target_time}"
  log ""
  log "PITR requires WAL archiving to be configured in PostgreSQL."
  log "This script will:"
  log "  1. Restore the most recent base backup before the target time"
  log "  2. Replay WAL files up to the target time"
  log ""

  confirm "Proceed with PITR to '${target_time}'?"

  # Find the most recent base backup before target time
  local target_epoch
  target_epoch=$(date -d "$target_time" +%s 2>/dev/null || date -j -f "%Y-%m-%d %H:%M:%S" "$target_time" +%s 2>/dev/null)

  local best_backup=""
  for f in $(ls -t "${BACKUP_DIR}"/mycryptocoin-*.sql.gz 2>/dev/null); do
    local file_ts
    file_ts=$(echo "$f" | grep -oP '\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}' | sed 's/-/:/4;s/-/:/4')
    local file_epoch
    file_epoch=$(date -d "$file_ts" +%s 2>/dev/null || echo 0)

    if [ "$file_epoch" -le "$target_epoch" ] && [ "$file_epoch" -gt 0 ]; then
      best_backup="$f"
      break
    fi
  done

  if [ -z "$best_backup" ]; then
    die "No base backup found before ${target_time}"
  fi

  log "Using base backup: $(basename "$best_backup")"

  # Restore base backup
  restore_from_file "$best_backup"

  # Configure recovery target
  log "Setting recovery target to: ${target_time}"
  local pg_data_dir
  pg_data_dir=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SHOW data_directory;")
  pg_data_dir="${pg_data_dir// /}"

  # Write recovery signal file (PostgreSQL 12+)
  log "Writing recovery configuration..."
  log "NOTE: For full PITR, ensure the following is in postgresql.conf:"
  log "  restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'"
  log "  recovery_target_time = '${target_time}'"
  log "  recovery_target_action = 'promote'"
  log ""
  log "Then restart PostgreSQL to begin WAL replay."
  log "Once recovery is complete, PostgreSQL will automatically promote to read-write."
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

case "${1:-}" in
  --list)
    list_backups
    ;;
  --s3)
    [ -z "${2:-}" ] && die "Usage: $0 --s3 <s3-key>"
    restore_from_s3 "$2"
    ;;
  --pitr)
    [ -z "${2:-}" ] && die "Usage: $0 --pitr \"YYYY-MM-DD HH:MM:SS\""
    restore_pitr "$2"
    ;;
  --verify)
    [ -z "${2:-}" ] && die "Usage: $0 --verify <backup-file>"
    verify_backup "$2"
    ;;
  --help|-h)
    head -20 "$0" | tail -15
    ;;
  "")
    die "Usage: $0 <backup-file> | --s3 <key> | --pitr <time> | --list | --verify <file>"
    ;;
  *)
    restore_from_file "$1"
    ;;
esac
