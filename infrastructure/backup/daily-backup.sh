#!/usr/bin/env bash
# ==============================================================================
# Owtlet™ Daily Automated Database Backup Script (infrastructure/backup/daily-backup.sh)
# Creates encrypted/gzipped PostgreSQL dumps with SHA-256 checksums & 30-day retention
# Designed for automated execution via Cron (e.g. 02:00 AM daily)
# ==============================================================================
set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/opt/owtlet/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
CONTAINER_NAME="${PG_CONTAINER:-owtlet_postgres}"
DB_USER="${POSTGRES_USER:-owtlet}"
DB_NAME="${POSTGRES_DB:-owtlet}"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_FILE="${BACKUP_DIR}/owtlet_db_${TIMESTAMP}.sql.gz"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

log() {
  local msg="[$(date +'%Y-%m-%d %H:%M:%S')] $1"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

log "🚀 Starting Owtlet database backup for database '${DB_NAME}'..."

# Verify docker container is running
if ! docker ps --filter "name=${CONTAINER_NAME}" --filter "status=running" --format '{{.Names}}' | grep -q "${CONTAINER_NAME}"; then
  log "❌ ERROR: PostgreSQL container '${CONTAINER_NAME}' is not running!"
  exit 1
fi

# Execute pg_dump and gzip in pipeline
if docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists | gzip > "${BACKUP_FILE}"; then
  FILE_SIZE="$(du -h "${BACKUP_FILE}" | cut -f1)"
  log "✅ Database dump completed: ${BACKUP_FILE} (Size: ${FILE_SIZE})"

  # Generate SHA-256 Checksum
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "${BACKUP_FILE}" > "${CHECKSUM_FILE}"
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "${BACKUP_FILE}" > "${CHECKSUM_FILE}"
  fi
  log "🔐 Checksum generated: ${CHECKSUM_FILE}"

  # Retention cleanup: Remove backups older than RETENTION_DAYS
  OLD_BACKUPS_COUNT=$(find "${BACKUP_DIR}" -name "owtlet_db_*.sql.gz" -mtime +"${RETENTION_DAYS}" | wc -l | tr -d ' ')
  if [ "$OLD_BACKUPS_COUNT" -gt 0 ]; then
    log "🧹 Purging ${OLD_BACKUPS_COUNT} backup(s) older than ${RETENTION_DAYS} days..."
    find "${BACKUP_DIR}" -name "owtlet_db_*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete
    find "${BACKUP_DIR}" -name "owtlet_db_*.sql.gz.sha256" -mtime +"${RETENTION_DAYS}" -delete
  fi

  log "🎉 Database backup successfully finished."
  exit 0
else
  log "❌ ERROR: pg_dump failed during execution!"
  # Clean up failed partial file
  rm -f "${BACKUP_FILE}" "${CHECKSUM_FILE}"
  exit 1
fi

