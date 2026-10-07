# Tixora deployment skeleton

Prepared for a Linux server with Docker Engine and Compose v2, administered over SSH. No server has been contacted or deployed. The professor's OS, hostname, domain, TLS/reverse-proxy arrangement and mobile delivery format are still unknown. Adjust this skeleton together before exposing it publicly.

## Architecture

HTTPS domain -> professor's reverse proxy -> 127.0.0.1:8080 gateway -> React/TanStack Node server and Laravel PHP-FPM -> private MySQL.

The browser uses `/web/*` with HttpOnly session cookies and CSRF protection. Public SSR reads use `API_INTERNAL_URL`. Native mobile clients can use `/api/*` with expiring bearer tokens. No database port, PHP-FPM port or Node port is published. Secrets are runtime backend settings, never frontend build arguments. All frontend JavaScript and VITE_* settings are public.

## Server preparation (once details are available)

1. Ask the professor for the Linux distribution/CPU architecture, SSH account and port, assigned application directory, approved HTTPS hostname, reverse-proxy owner, resource limits and backup location. Use SSH keys and verify the server fingerprint. Do not send private keys or passwords through chat or commit them.
2. Install or confirm Docker and Compose with the professor. Clone this repository into the assigned directory. Do not copy Windows `node_modules`, `vendor`, `.output`, local databases or development `.env` files to the server; images build their own dependencies.
3. Copy `deploy/.env.example` to `deploy/.env`. Set `APP_URL` to the final HTTPS URL. Generate unique database and root passwords. Generate an application key on the server with `openssl rand -base64 32` and set `APP_KEY=base64:<generated value>`. Keep this key stable across deployments and retain it with encrypted backups. Protect the file with `chmod 600 deploy/.env`.
4. From the repository root, run:

```sh
docker compose --env-file deploy/.env config --quiet
docker compose --env-file deploy/.env build
docker compose --env-file deploy/.env up -d database
docker compose --env-file deploy/.env run --rm backend php artisan migrate --force
docker compose --env-file deploy/.env up -d
docker compose --env-file deploy/.env ps
```

Do not run production demo seeding. The example account has a publicly known password and the seeder is now blocked outside local/testing. If that account exists in an older deployment, disable it and revoke its tokens. Existing browser bearer tokens should also be revoked when switching to session login.

5. Have the professor configure the assigned HTTPS virtual host to forward to `http://127.0.0.1:8080`, preserving the original Host header. HTTP must redirect to HTTPS. The gateway deliberately treats traffic as HTTPS; secure cookies will not work through direct HTTP. Keep its port on loopback. If the professor's proxy runs in a container or on another machine, coordinate a private network instead of opening this port to the internet.
6. Configure trusted client-IP forwarding at the gateway using only the professor's actual proxy address/range. Until that is configured, users behind the proxy share its rate-limit bucket. Do not blindly trust client-supplied X-Forwarded-For or wildcard proxy ranges. Add HSTS at the HTTPS proxy after validating the domain. A nonce-based script CSP needs separate TanStack SSR integration; do not paste a script-blocking CSP into production without testing.
7. Visit `/up`, register, sign in, refresh, sign out and search events through the final HTTPS domain. Verify the session cookie is Secure and HttpOnly; POST without a CSRF token must return 419; anonymous `/web/me` and `/api/me` must return 401. `/api/events` should return JSON. Configure and verify sandbox checkout using INTEGRATION.md.

Compose rejects missing keys/passwords instead of providing insecure defaults. Environment variables remain visible to authorized Docker administrators; on a shared server, agree on access controls or adapt to the professor's secret manager. Avoid printing resolved Compose configuration with secrets.

## Updates, persistence and recovery

Back up MySQL, the `app-storage` volume and the application key before migrations. Test restoring to a separate database. Take the application down for maintenance for incompatible schema changes; keep the previous image/source revision for rollback. Never use `docker compose down -v` for routine updates: it deletes persistent data. Do not run `migrate:fresh` on a deployed database.

Rebuild from the lockfiles and apply reviewed migrations for updates. The example image tags follow stable release lines; pin tested image digests for a repeatable real deployment. Docker builds/startup and MySQL-specific migrations have not been run here because Docker is unavailable. The Linux stack requires a full smoke test before launch.

A signed PayMongo test webhook is implemented; configure it using INTEGRATION.md. Queue workers, mail transport, a scheduler and file delivery are not configured. No receipt email is sent by this skeleton. Add workers/scheduler only alongside the features that need them, and schedule expired Sanctum token pruning when mobile authentication is used.

## Local development

Run Laravel on `127.0.0.1:8000` and `npm run dev` in `frontend`. Vite proxies `/web`, `/api` and `/sanctum` to Laravel. Keep local `SESSION_SECURE_COOKIE=false` for HTTP development, and use one hostname consistently. The committed Compose production profile always enables secure cookies and disables debug output. Never run a development server on a public interface.

## Mobile handoff

`mobile/` now contains connected Expo screens for accounts, events, cinema seats, favorites, settings, bookings and admin catalog management. See INTEGRATION.md for API configuration and sandbox checkout. Native tokens use SecureStore; the Expo web preview uses memory only. The responsive React website is the browser deployment target.

The server hosts Laravel and the React website. A signed Android APK/AAB or iOS app requires a separate native build and signing process once the delivery format is confirmed. Exporting JavaScript bundles does not produce an APK.

## References

- [Laravel 12 deployment](https://laravel.com/docs/12.x/deployment)
- [Laravel 12 Sanctum: SPA sessions and mobile API tokens](https://laravel.com/docs/12.x/sanctum)
