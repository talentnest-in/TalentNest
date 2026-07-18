#!/bin/sh
# ──────────────────────────────────────────────────────────────────
# SSL Initial Certificate Request (Certbot)
# Usage: ./scripts/ssl-init.sh your-domain.com your-email@example.com
# ──────────────────────────────────────────────────────────────────
set -e

DOMAIN="${1:?Usage: $0 <domain> <email>}"
EMAIL="${2:?Usage: $0 <domain> <email>}"

echo "==> Requesting SSL certificate for $DOMAIN ..."

docker compose run --rm certbot certonly --webroot \
  --webroot-path /var/www/certbot \
  --domain "$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --non-interactive

echo "==> Certificate obtained successfully!"
echo "==> Uncomment the ssl_* directives in nginx/nginx.conf"
echo "==> Restart nginx: docker compose restart nginx"
