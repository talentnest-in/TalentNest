#!/bin/sh
set -e

echo "==> [TalentNest Backend] Generating Prisma Client..."
npx prisma generate

echo "==> [TalentNest Backend] Running database migrations..."
npx prisma db push --accept-data-loss 2>&1

echo "==> [TalentNest Backend] Starting application..."
exec "$@"
