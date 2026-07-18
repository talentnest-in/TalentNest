#!/bin/bash
# Rollback script for TalentNest
# Usage: ./scripts/rollback.sh backend|frontend [commit-hash]
set -euo pipefail

SERVICE="${1:-}"
COMMIT="${2:-}"

if [ -z "$SERVICE" ]; then
  echo "Usage: $0 backend|frontend [commit-hash]"
  echo "  If no commit hash is provided, rolls back to the previous deployment."
  exit 1
fi

echo "[Rollback] Rolling back $SERVICE..."

case "$SERVICE" in
  backend)
    if [ -n "$COMMIT" ]; then
      echo "[Rollback] Reverting backend to commit $COMMIT"
      git revert --no-commit "$COMMIT"..HEAD
    else
      echo "[Rollback] Reverting backend to previous deployment"
      git revert HEAD~1 --no-commit
    fi

    echo "[Rollback] Rebuilding backend..."
    cd backend
    npm ci --legacy-peer-deps
    npx prisma generate
    npm run build

    echo "[Rollback] Triggering Render redeploy..."
    if [ -n "${RENDER_API_KEY:-}" ] && [ -n "${RENDER_SERVICE_ID:-}" ]; then
      curl -s -X POST "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys" \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{}'
      echo "[Rollback] Backend rollback triggered on Render"
    else
      echo "[Rollback] RENDER_API_KEY/RENDER_SERVICE_ID not set — manual deploy required"
    fi
    ;;

  frontend)
    if [ -n "$COMMIT" ]; then
      echo "[Rollback] Reverting frontend to commit $COMMIT"
      git revert --no-commit "$COMMIT"..HEAD
    else
      echo "[Rollback] Reverting frontend to previous deployment"
      git revert HEAD~1 --no-commit
    fi

    echo "[Rollback] Rebuilding frontend..."
    cd frontend
    npm ci
    npm run build

    echo "[Rollback] Redeploying to Vercel..."
    if [ -n "${VERCEL_TOKEN:-}" ]; then
      npx vercel deploy --prebuilt --prod --token="$VERCEL_TOKEN"
      echo "[Rollback] Frontend rollback triggered on Vercel"
    else
      echo "[Rollback] VERCEL_TOKEN not set — manual deploy required"
    fi
    ;;

  *)
    echo "Unknown service: $SERVICE. Use 'backend' or 'frontend'."
    exit 1
    ;;
esac

echo "[Rollback] $SERVICE rollback initiated successfully"
