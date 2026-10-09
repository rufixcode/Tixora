#!/usr/bin/env bash
# Run as the deployment user, never with sudo. Does not install system packages.
set -euo pipefail
umask 0027
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
if [ "$(id -u)" -eq 0 ]; then
    echo "Run this as the deployment user, not root." >&2
    exit 1
fi
for tool in php composer node npm; do
    command -v "$tool" >/dev/null || { echo "Missing: $tool" >&2; exit 1; }
done
php -r 'if (PHP_VERSION_ID < 80300) { fwrite(STDERR, "PHP 8.3+ required\n"); exit(1); } foreach (["pdo_mysql", "mbstring", "xml", "curl", "intl", "zip"] as $ext) { if (!extension_loaded($ext)) { fwrite(STDERR, "Missing PHP extension: $ext\n"); exit(1); } }'
node -e 'if (Number(process.versions.node.split(".")[0]) !== 24) { console.error("Use Node.js 24 LTS."); process.exit(1); }'
[ -f backend/.env ] || { echo "Configure backend/.env from deploy/native/backend.env.example first." >&2; exit 1; }
[ -f deploy/native/frontend.env ] || { echo "Configure deploy/native/frontend.env first." >&2; exit 1; }
echo "Installing locked dependencies and building the website..."
(cd backend && composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader)
(cd frontend && npm ci && npm run build)
echo "Prepared. Apply migrations and start services using deploy/native/README.md."
