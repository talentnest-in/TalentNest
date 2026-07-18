#!/bin/bash
# SSL certificate auto-renewal script
# Usage: ./scripts/certbot-renew.sh [--dry-run]
# Add to crontab: 0 3 * * * /path/to/talentnest/scripts/certbot-renew.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

DRY_RUN=""
if [ "${1:-}" = "--dry-run" ]; then
  DRY_RUN="--dry-run"
  echo "[DRY RUN] Would renew certificates"
fi

echo "[Certbot] Renewing SSL certificates..."

docker compose --profile certbot run --rm certbot renew $DRY_RUN

if [ -z "$DRY_RUN" ]; then
  echo "[Certbot] Reloading nginx to pick up new certificates..."
  docker compose exec nginx nginx -s reload
fi

echo "[Certbot] Done"
