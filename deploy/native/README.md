# Deploy Tixora on Ubuntu 24.04 without Docker

This kit keeps the existing MySQL schema and same-origin website authentication.
It does not contact a server, repair the stalled installer, or expose any ports.
Use it after the professor clears the package-manager lock. Run commands one at
a time, stopping on errors. Never delete apt locks to bypass a running installer.

## Server requirements and addresses

- PHP 8.3 CLI and FPM, Composer, MySQL, Nginx, Node.js 24 LTS and npm.
- Deployment user `student10`; application directory `/var/www/tixora`.
- PHP-FPM uses `/run/php/php8.3-fpm.sock`; website uses loopback port 3000.
- Nginx uses loopback port 8080; MySQL must remain private.
- A separate HTTPS website hostname routed to port 8080 by the professor.

The existing `student10.jzier.dev` browser console is a terminal application.
Do not replace its tunnel/proxy routing with Tixora or restart its host services.
Ask for a separate hostname or a professor-approved routing change. An existing
Cloudflare terminal URL does not automatically publish the website.

If the username, path or Node executable differs, update the service/config files
before installing them. `command -v node` must match ExecStart. This service uses
`/usr/bin/node`; a user-local nvm installation needs a different service setup.

## 1. Install prerequisites after the package manager is repaired

```bash
sudo apt update
sudo apt install -y git curl ca-certificates xz-utils unzip nginx mysql-server composer php8.3-cli php8.3-fpm php8.3-mysql php8.3-mbstring php8.3-xml php8.3-curl php8.3-intl php8.3-zip
```

Install Node.js 24 LTS using the official Node distribution or your professor's
approved repository. Ubuntu's default Node package may be too old. Confirm:

```bash
php -v
composer --version
node -v
npm -v
```

## 2. Get the source

Replace `YOUR_REPOSITORY_URL` with your repository. Do not upload Windows
node_modules/vendor, generated build folders, local databases or local secrets.

```bash
sudo install -d -o student10 -g www-data -m 0750 /var/www/tixora
git clone YOUR_REPOSITORY_URL /var/www/tixora
cd /var/www/tixora
sudo chgrp -R www-data /var/www/tixora
find /var/www/tixora -type d -exec chmod g+s {} +
```

For an existing checkout, inspect its changes before pulling. Keep the original
folder and data if moving an existing deployment; do not overwrite it blindly.

## 3. Create a private MySQL database

Open the MySQL administrator console:

```bash
sudo mysql
```

Use a new, strong password in place of the placeholder below. These statements
are for the FIRST setup only. Exit MySQL after completing them.

```sql
CREATE DATABASE tixora CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'tixora'@'127.0.0.1' IDENTIFIED BY 'REPLACE_WITH_NEW_PASSWORD';
GRANT ALL PRIVILEGES ON tixora.* TO 'tixora'@'127.0.0.1';
EXIT;
```

Verify MySQL is bound only to loopback using `sudo ss -ltnp`; do not expose 3306.
Migrations create tables but DO NOT copy existing SQLite data. If existing users,
bookings or catalog data must be preserved, stop and plan a tested data import.

## 4. Configure server secrets

Only copy these files for FIRST setup; preserve existing keys and credentials.

```bash
cp deploy/native/backend.env.example backend/.env
cp deploy/native/frontend.env.example deploy/native/frontend.env
chmod 640 backend/.env
chmod 600 deploy/native/frontend.env
nano backend/.env
```

Set APP_URL to the assigned HTTPS website URL, DB_PASSWORD to your MySQL password,
and PAYMONGO_RETURN_URL to that same website's `/bookings` URL. Keep APP_DEBUG=false
and secure cookies enabled. Payment keys must be sandbox keys for a class demo.
Leave the assistant disabled until a private inference server is available; the
help-guide fallback still works. The 4B model is not required for this deployment.

Prepare Laravel's writable folders and their group permissions. Source code is
owned by student10; only storage/bootstrap-cache are writable by PHP-FPM.

```bash
mkdir -p backend/storage/framework/cache/data backend/storage/framework/sessions backend/storage/framework/views backend/storage/logs
sudo chgrp -R www-data backend/storage backend/bootstrap/cache
chmod -R g+rwX backend/storage backend/bootstrap/cache
find backend/storage backend/bootstrap/cache -type d -exec chmod g+s {} +
bash deploy/native/prepare.sh
cd backend
php artisan key:generate --force
php artisan migrate --force
php artisan config:cache
php artisan view:cache
cd ..
```

Generate APP_KEY only on the first deployment. Keep it with encrypted backups.
The demo seeder is intentionally blocked in production; do not bypass it.

## 5. Install the site configuration and website service

The site remains private until the professor routes the HTTPS hostname to it.
Do not remove Nginx's other sites or change the Cloudflare terminal service.

```bash
sudo cp deploy/native/nginx.conf /etc/nginx/sites-available/tixora
sudo ln -s /etc/nginx/sites-available/tixora /etc/nginx/sites-enabled/tixora
sudo cp deploy/native/uploads.ini /etc/php/8.3/fpm/conf.d/99-tixora-uploads.ini
sudo cp deploy/native/tixora-frontend.service /etc/systemd/system/tixora-frontend.service
sudo nginx -t
sudo systemctl daemon-reload
sudo systemctl enable --now mysql php8.3-fpm nginx tixora-frontend
sudo systemctl restart php8.3-fpm
sudo systemctl reload nginx
```

If the symlink already exists, inspect it rather than replacing it. These commands
assume your professor allows services inside this LXC. Report service errors;
changing host-level LXC permissions is outside this kit.

The supplied Nginx profile assumes HTTPS at the outer proxy, just like Compose.
Never publish loopback 8080 directly as HTTP or forward untrusted public traffic
to it. Keep the original Host header. Ask the professor to set trusted client-IP
forwarding to actual proxy addresses; until then users share a rate-limit bucket.

## 6. Check the deployment and create an administrator

```bash
curl -i http://127.0.0.1:8080/up
curl -i http://127.0.0.1:8080/api/events
sudo systemctl status tixora-frontend --no-pager
```

Through the final HTTPS domain, test register/login, refresh, logout, search,
bookings, poster uploads and sandbox checkout. `/up` must return 200, public
events must return JSON, anonymous `/web/me` must return 401, and a POST without
CSRF must return 419. Verify login cookies are Secure and HttpOnly.

Register your own account through the website, then grant it administrator access
using the existing trusted console command (replace the email):

```bash
cd /var/www/tixora/backend
php artisan tixora:admin your-email@example.com
```

Use Administration to create listings. Do not publish the local test account or
upload private credential files. No temporary production password is generated.

## Mobile delivery

On your development computer, put the final HTTPS `/api` URL into `mobile/.env`
using `deploy/native/mobile.env.example`. Rebuild after changing this public
setting. Both apps use the same MySQL database through Laravel; the phone never
connects directly to MySQL. An APK requires a separate Expo build and signing;
hosting the website does not create an installable mobile app.

## Updates, database changes and recovery

Before updates, record the source revision and back up MySQL, backend/storage,
and backend/.env to private storage outside the checkout. Export using a password
prompt, not a password in the command line. This dump covers InnoDB data; avoid
concurrent schema changes, and verify the export completes successfully.

```bash
umask 077
mysqldump -h 127.0.0.1 -u tixora -p --single-transaction --no-tablespaces tixora > /YOUR_PRIVATE_BACKUP_DIRECTORY/tixora.sql
```

Also copy uploads and configuration privately. Replace the backup path first,
use unique filenames, keep copies off-server and test restoring to a separate DB.
Take a consistent backup during maintenance if bookings or uploads are active.

For each update: test locally, commit and push; then enter maintenance, pull the
reviewed revision, rebuild, apply migrations and restart. Node serves its old
build during preparation, so stop the website before overwriting build output.

```bash
cd /var/www/tixora/backend
php artisan down --retry=60
sudo systemctl stop tixora-frontend
cd ..
git pull --ff-only
bash deploy/native/prepare.sh
cd backend
php artisan migrate --force
php artisan config:cache
php artisan view:cache
sudo systemctl restart php8.3-fpm
sudo systemctl start tixora-frontend
php artisan up
```

Stop on any failure; do not continue to `up` after a failed migration/build.
Frontend pages can be unavailable while the website service is stopped. Keep a
known-good revision/build for recovery. Restoring old code alone does not undo
schema/data changes; review rollback or restore from a tested backup.

Add NEW migrations for schema updates; preserve already-applied migrations.
Never use migrate:fresh, migrate:reset or the demo seeder on deployed data.
Changing listing titles/prices/posters normally belongs in Administration.
Queue workers, scheduler and receipt email delivery are not provided by this kit.

## Troubleshooting

```bash
sudo journalctl -u tixora-frontend -n 40 --no-pager
sudo journalctl -u php8.3-fpm -n 40 --no-pager
sudo nginx -t
```

502: check Node service, PHP socket and directory permissions. Login fails:
check final HTTPS URL, Host forwarding and cookies. Upload too large: the outer
proxy must permit a 6 MB body too. Do not share secrets or raw user/payment logs.

References: [Laravel deployment](https://laravel.com/docs/12.x/deployment),
[Node.js downloads](https://nodejs.org/en/download).
