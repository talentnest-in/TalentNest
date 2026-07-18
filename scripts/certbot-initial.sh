#!/bin/bash
# Initial SSL certificate setup
# Usage: ./scripts/certbot-initial.sh your-domain.com your-email@example.com
# Requires: DNS A record pointing to this server, ports 80/443 open

set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 <domain> <email>"
  echo "Example: $0 talentnest.example.com admin@example.com"
  exit 1
fi

DOMAIN="$1"
EMAIL="$2"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "[Certbot] Obtaining certificate for $DOMAIN..."

docker compose --profile certbot run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --non-interaction

echo "[Certbot] Certificate obtained successfully!"
echo ""
echo "Next steps:"
echo "  1. Update nginx/nginx.conf with your domain name"
echo "  2. Uncomment the HTTPS server block in nginx/nginx.conf"
echo "  3. Set ssl_certificate paths to:"
echo "       /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "       /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo "  4. Rebuild and restart: docker compose up --build -d"
echo "  5. Set up auto-renewal: crontab -e"
echo "     Add: 0 3 * * * /path/to/talentnest/scripts/certbot-renew.sh"
