#!/bin/sh
# ──────────────────────────────────────────────────────────────────
# SSL Certificate Renewal (Certbot)
# Run via cron: 0 3 * * * /path/to/scripts/ssl-renew.sh
# ──────────────────────────────────────────────────────────────────
set -e

echo "==> Renewing SSL certificates ..."

docker compose run --rm certbot renew --webroot \
  --webroot-path /var/www/certbot \
  --non-interactive

echo "==> Reloading nginx to pick up new certificates ..."
docker compose exec nginx nginx -s reload

echo "==> SSL renewal complete"
