#!/bin/bash
# ── PM2 Graceful Stop ────────────────────────────────────────────────

set -e

echo "Stopping TalentNest API gracefully..."

# Send SIGINT to all instances, then wait up to 10s
pm2 stop talentnest-api --kill-timeout 10000

pm2 delete talentnest-api 2>/dev/null || true

echo "TalentNest API stopped."
