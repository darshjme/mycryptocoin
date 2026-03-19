#!/usr/bin/env bash
# ===========================================================================
# MyCryptoCoin — Production Deployment Script
#
# Usage:
#   ./deploy.sh                 # Deploy latest
#   ./deploy.sh --rollback      # Rollback to previous version
#   ./deploy.sh --version 42    # Deploy specific version
# ===========================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

APP_DIR="${APP_DIR:-/opt/mycryptocoin}"
COMPOSE_FILE="docker-compose.prod.yml"
HEALTH_CHECK_URL="http://localhost:4000/health"
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_INTERVAL=3
BACKUP_BEFORE_DEPLOY=true

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

health_check() {
  local url="$1"
  local retries="$2"
  local interval="$3"

  log "Running health check: ${url}"
  for i in $(seq 1 "$retries"); do
    if curl -sf "$url" | grep -q '"status"' 2>/dev/null; then
      log "Health check passed (attempt ${i})"
      return 0
    fi
    log "Health check attempt ${i}/${retries} failed — retrying in ${interval}s"
    sleep "$interval"
  done

  log "Health check FAILED after ${retries} attempts"
  return 1
}

# ---------------------------------------------------------------------------
# Pre-deploy checks
# ---------------------------------------------------------------------------

pre_deploy_checks() {
  log "Running pre-deploy checks..."

  # Check Docker is running
  if ! docker info &>/dev/null; then
    die "Docker is not running"
  fi

  # Check compose file exists
  if [ ! -f "${APP_DIR}/${COMPOSE_FILE}" ]; then
    die "Compose file not found: ${APP_DIR}/${COMPOSE_FILE}"
  fi

  # Check disk space (need at least 2 GB)
  local avail_kb
  avail_kb=$(df "$APP_DIR" | awk 'NR==2 {print $4}')
  if [ "$avail_kb" -lt 2097152 ]; then
    die "Insufficient disk space ($(( avail_kb / 1024 )) MB available, need 2 GB)"
  fi

  log "Pre-deploy checks passed"
}

# ---------------------------------------------------------------------------
# Backup
# ---------------------------------------------------------------------------

pre_deploy_backup() {
  if [ "$BACKUP_BEFORE_DEPLOY" = "true" ]; then
    log "Creating pre-deploy database backup..."
    docker compose -f "${APP_DIR}/${COMPOSE_FILE}" exec -T postgres-primary \
      pg_dump -U "${POSTGRES_USER:-mycryptocoin}" "${POSTGRES_DB:-mycryptocoin}" \
      --format=custom --compress=9 \
      > "${APP_DIR}/backups/pre-deploy-$(date +%Y%m%d-%H%M%S).sql.gz" || {
        log "WARNING: Pre-deploy backup failed — continuing anyway"
      }
    log "Pre-deploy backup complete"
  fi
}

# ---------------------------------------------------------------------------
# Deploy
# ---------------------------------------------------------------------------

deploy() {
  local version="${1:-latest}"

  log "========================================="
  log "Starting deployment (version: ${version})"
  log "========================================="

  cd "$APP_DIR"

  pre_deploy_checks
  pre_deploy_backup

  # Save current image digest for potential rollback
  local current_image
  current_image=$(docker compose -f "$COMPOSE_FILE" images backend --format '{{.Repository}}:{{.Tag}}' 2>/dev/null | head -1 || echo "")
  if [ -n "$current_image" ] && [ "$current_image" != ":" ]; then
    echo "$current_image" > "${APP_DIR}/.last-deployed-image"
    log "Saved rollback image: ${current_image}"
  fi

  # Pull latest images
  log "Pulling latest images..."
  if [ "$version" != "latest" ]; then
    export APP_VERSION="$version"
  fi
  docker compose -f "$COMPOSE_FILE" pull backend

  # Run database migrations
  log "Running database migrations..."
  docker compose -f "$COMPOSE_FILE" run --rm backend npx prisma migrate deploy

  # Rolling restart — start new containers before stopping old ones
  log "Performing rolling restart..."
  docker compose -f "$COMPOSE_FILE" up -d --no-deps --scale backend=3 --no-recreate backend

  # Wait a moment for new containers to start
  sleep 5

  # Health check
  if health_check "$HEALTH_CHECK_URL" "$HEALTH_CHECK_RETRIES" "$HEALTH_CHECK_INTERVAL"; then
    log "Deployment successful!"

    # Clean up old containers and images
    docker compose -f "$COMPOSE_FILE" up -d --remove-orphans
    docker image prune -f 2>/dev/null || true

    log "========================================="
    log "Deployment complete!"
    log "  Version: ${version}"
    log "  Time:    $(date -u)"
    log "========================================="
  else
    log "Deployment FAILED — initiating rollback"
    rollback
    exit 1
  fi
}

# ---------------------------------------------------------------------------
# Rollback
# ---------------------------------------------------------------------------

rollback() {
  log "========================================="
  log "Starting ROLLBACK"
  log "========================================="

  cd "$APP_DIR"

  if [ -f "${APP_DIR}/.last-deployed-image" ]; then
    local prev_image
    prev_image=$(cat "${APP_DIR}/.last-deployed-image")
    log "Rolling back to previous image: ${prev_image}"

    # Tag the previous image so compose picks it up
    export APP_VERSION="${prev_image##*:}"

    # Stop current containers and start with previous image
    docker compose -f "$COMPOSE_FILE" stop backend
    docker compose -f "$COMPOSE_FILE" up -d backend
  else
    log "WARNING: No previous version recorded — restarting current containers"
    docker compose -f "$COMPOSE_FILE" stop backend
    docker compose -f "$COMPOSE_FILE" up -d backend
  fi

  # Health check after rollback
  if health_check "$HEALTH_CHECK_URL" "$HEALTH_CHECK_RETRIES" "$HEALTH_CHECK_INTERVAL"; then
    log "Rollback successful"
  else
    log "CRITICAL: Rollback also failed — manual intervention required!"
    exit 2
  fi
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

case "${1:-}" in
  --rollback)
    rollback
    ;;
  --version)
    [ -z "${2:-}" ] && die "Usage: $0 --version <version-number>"
    deploy "$2"
    ;;
  --help|-h)
    echo "Usage: $0 [--rollback | --version <num>]"
    ;;
  *)
    deploy "latest"
    ;;
esac
