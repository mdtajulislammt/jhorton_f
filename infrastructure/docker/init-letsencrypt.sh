#!/usr/bin/env bash
# ==============================================================================
# Owtlet™ SSL Certificate Bootstrap & Let's Encrypt Initializer
# Solves the bootstrap dependency between Nginx and Certbot
# Domains: owtlet.com, www.owtlet.com, owtlet.live, www.owtlet.live
# Usage: bash infrastructure/docker/init-letsencrypt.sh [staging|production] [email]
# ==============================================================================
set -euo pipefail

DOMAINS=("owtlet.com" "www.owtlet.com" "owtlet.live" "www.owtlet.live")
RSA_KEY_SIZE=4096
DATA_PATH="/etc/letsencrypt"
CERTBOT_WEBROOT="/var/www/certbot"
EMAIL="${2:-ops@owtlet.com}"
STAGING="${1:-0}" # Set to 1 for staging/dry-run test to avoid Let's Encrypt rate limits

echo "=========================================================="
echo "🔒 Owtlet SSL / Let's Encrypt Initialization"
echo "Domains: ${DOMAINS[*]}"
echo "Contact: $EMAIL"
echo "=========================================================="

if [ -d "$DATA_PATH/live/owtlet.com" ] && [ -f "$DATA_PATH/live/owtlet.com/fullchain.pem" ]; then
  read -p "Existing certificate found for owtlet.com. Continue and replace? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    echo "Aborted."
    exit 0
  fi
fi

mkdir -p "$CERTBOT_WEBROOT"
mkdir -p "$DATA_PATH/live/owtlet.com"

echo "### Step 1: Generating dummy certificates for initial Nginx startup ..."
openssl req -x509 -nodes -newkey rsa:$RSA_KEY_SIZE -days 1 \
  -keyout "$DATA_PATH/live/owtlet.com/privkey.pem" \
  -out "$DATA_PATH/live/owtlet.com/fullchain.pem" \
  -subj "/CN=localhost" 2>/dev/null

echo "### Step 2: Starting Nginx container ..."
docker compose --profile prod up -d nginx

echo "### Step 3: Removing dummy certificates ..."
rm -rf "$DATA_PATH/live/owtlet.com"

echo "### Step 4: Requesting Let's Encrypt certificate ..."
DOMAIN_ARGS=""
for domain in "${DOMAINS[@]}"; do
  DOMAIN_ARGS="$DOMAIN_ARGS -d $domain"
done

# Check if email is valid or register unsafely
EMAIL_ARG="--email $EMAIL"
if [ -z "$EMAIL" ]; then
  EMAIL_ARG="--register-unsafely-without-email"
fi

STAGING_ARG=""
if [ "$STAGING" != "0" ] && [ "$STAGING" != "production" ]; then
  STAGING_ARG="--staging"
  echo "⚠️ Running in Let's Encrypt STAGING mode."
fi

docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $STAGING_ARG \
    $EMAIL_ARG \
    $DOMAIN_ARGS \
    --rsa-key-size $RSA_KEY_SIZE \
    --agree-tos \
    --force-renewal \
    --non-interactive" certbot

echo "### Step 5: Reloading Nginx with production certificates ..."
docker compose exec nginx nginx -s reload

echo "✅ SUCCESS: Let's Encrypt certificates installed and Nginx reloaded!"

