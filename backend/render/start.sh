#!/usr/bin/env bash
set -euo pipefail
cd /var/www/html
: "${APP_KEY:?Set APP_KEY in Render's environment settings}"
: "${APP_URL:?Set APP_URL in Render's environment settings}"
: "${DB_HOST:?Set your Aiven DB_HOST}"
: "${DB_PASSWORD:?Set your Aiven DB_PASSWORD}"
: "${MYSQL_ATTR_SSL_CA:?Set MYSQL_ATTR_SSL_CA to /etc/secrets/aiven-ca.pem}"
if [ "${APP_ENV:-}" != production ] || [ "${APP_DEBUG:-}" != false ]; then
    echo "Render requires APP_ENV=production and APP_DEBUG=false." >&2
    exit 1
fi
if [ "${PORT:-10000}" != 10000 ]; then
    echo "This Apache profile requires PORT=10000." >&2
    exit 1
fi
php -r '$path = getenv("MYSQL_ATTR_SSL_CA"); if (!is_readable($path) || !openssl_x509_read(file_get_contents($path))) { fwrite(STDERR, "Missing or invalid Aiven CA certificate. Add aiven-ca.pem as a Render secret file.\n"); exit(1); }'
php artisan config:cache
php artisan view:cache
# Apply migrations deliberately from a trusted workstation, never on each boot.
exec apache2-foreground
