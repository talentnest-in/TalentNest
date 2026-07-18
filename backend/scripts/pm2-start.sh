#!/bin/bash
# ── PM2 Production Startup Script ────────────────────────────────────
# Usage: bash scripts/pm2-start.sh [production|development]
# Requires: pm2 (npm install -g pm2)

set -e

ENV="${1:-production}"
echo "Starting TalentNest API in $ENV mode..."

# Ensure node_modules exists
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm ci --only=production
fi

# Build if needed
if [ ! -d "dist" ]; then
  echo "Building..."
  npx prisma generate
  npx tsc
fi

# Ensure log directory
mkdir -p logs

# Start with PM2
pm2 delete talentnest-api 2>/dev/null || true

if [ "$ENV" = "production" ]; then
  pm2 start ecosystem.config.js --env production
else
  pm2 start ecosystem.config.js
fi

pm2 save
pm2 list

echo ""
echo "TalentNest API started successfully in $ENV mode"
echo "  Logs: ./logs/"
echo "  Monitor: pm2 monit"
echo "  Status: pm2 status"
