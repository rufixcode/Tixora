# Laravel on Render with Aiven MySQL

This profile hosts the Laravel API. It is separate from the Vercel website/mobile
web projects and does not depend on the professor's server. Render builds Docker
itself; you do not need a local Docker installation. The original PHP-FPM
Dockerfile remains for Compose; use Dockerfile.render for this HTTP service.

## Create the backend service

Push these source files to your own GitHub repository, excluding .env, local
databases and certificates. In Render: New > Web Service > connect that repository.

| Setting | Value |
| --- | --- |
| Name | tixora-api (or an available name) |
| Branch | Your branch containing these files |
| Root Directory | backend |
| Language / Runtime | Docker |
| Dockerfile Path | ./Dockerfile.render (relative to backend) |
| Docker Build Context | . (backend) |
| Instance Type | Free |
| Health Check Path | /up |

Leave Docker Command empty. Leave build/pre-deploy commands empty. Apache listens
on 0.0.0.0:10000. If PORT is set, keep it 10000. Pick a region near Aiven where
available. Do not create a Render database; keep your existing Aiven database.

## Environment and certificate

Use deploy/render/.env.example as the list of backend environment settings.
Enter your actual Aiven values and the same APP_KEY used by your local backend.
Do not paste your entire development .env: it may enable debugging or point
to local-only services. No database credentials belong in frontend settings.

Use the actual assigned Render URL for APP_URL and ASSET_URL. Render's environment
fields accept raw values: do not surround DB_PASSWORD with dotenv quote marks.
Do not set DB_URL, DATABASE_URL, SESSION_DOMAIN or a Windows certificate path.

Under Environment > Secret Files, add filename `aiven-ca.pem`. Paste the complete
contents of your downloaded Aiven CA certificate, including BEGIN/END lines.
Render makes this available at `/etc/secrets/aiven-ca.pem`. It must match the
Aiven service's certificate. The existing Laravel MySQL config uses it for TLS.

Only share sanitized build logs/screenshots; hide passwords, keys and DB URIs.

## Migrations and validation

If migrations already completed on Aiven, do not rerun a database reset or seed.
Check status from the trusted Windows workstation whose backend/.env points to
Aiven and whose local CA path is configured:

```powershell
cd C:\Users\ruffc\Tixora\backend
php artisan config:clear
php artisan migrate:status
```

Pending migrations should be reviewed before `php artisan migrate`; back up an
existing database first. Startup does not modify the database schema or seed demo
accounts. All clients share the database through Laravel, not direct MySQL access.

After the build completes, visit the service's `/up` (200), `/api/events` (JSON),
and `/api/me` (401 when anonymous). /up confirms application health; the public
events request also verifies database access. A migration creates tables, not
copies of your previous SQLite data. A new database has no existing listings.

## Website and mobile integration comes next

Set the native/mobile web EXPO_PUBLIC_API_URL to the backend URL plus `/api`.
The mobile web origin needs explicit backend CORS configuration before requests
will work in a browser. A native APK uses token authentication independently.

The website uses same-origin `/web` and `/sanctum` session routes. Its Vercel
deployment needs backend proxy rewrites and a public-API SSR URL; deploying the
frontend alone does not make login work. Configure and test this separately once
the backend URL is known. Do not weaken CSRF checks or expose database secrets.

Register a personal account once website integration is working, then grant it
admin access from the trusted local backend connected to Aiven:

```powershell
php artisan tixora:admin your-email@example.com
```

## Free demo limitations

Render free services sleep after inactivity and can take about a minute to wake.
Local files disappear on redeploy, restart or sleep. Uploaded posters therefore
need external object storage for persistence; do not rely on the default local
poster store for a durable deployment. Database entries are persistent in Aiven.
Payment integration requires sandbox secrets, the final frontend return URL and
a webhook to the backend `/api` route specified in docs/PAYMONGO-SETUP.md.
The private AI model is not hosted here; the built-in help fallback stays available.

This profile has not been built on Render yet. Check its live build logs and
application endpoints before submission.

References: [Render Laravel](https://render.com/docs/deploy-php-laravel-docker),
[secret files](https://render.com/docs/configure-environment-variables),
[free limits](https://render.com/docs/free).
