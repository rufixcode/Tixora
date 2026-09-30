# Frontend/backend integration and security review

## What can connect now

| Feature | React web | Laravel route | Native mobile |
| --- | --- | --- | --- |
| Registration/login | Connected with session cookies and CSRF | POST /web/register, /web/login | Token endpoints /api/register, /api/login available; screens not built |
| Current user/logout | Connected in header | GET /web/me, POST /web/logout | /api/me and /api/logout available; screens not built |
| Event list, category, featured and search | Connected | GET /web/events; public /api/events | API reusable; screens not built |
| Event detail and ticket tiers | Connected | GET /web/events/{slug}; public /api/events/{slug} | API reusable; screens not built |
| Checkout/seat selection | Disabled; shows coming soon | Authenticated booking endpoint returns 503 | Not ready |
| Payment, receipts, ticket history, favorites, refunds, password reset | Not implemented | No complete workflow | Not implemented |

## Changes made

- Removed browser token/user persistence. Browser login now uses Laravel's HttpOnly session cookie; writes obtain and send a CSRF token. Legacy localStorage entries are cleared on API use. Session regeneration prevents carrying a pre-login session ID into authentication. Added logout to the header.
- Kept native bearer-token endpoints, with 24-hour expiry and logout revocation. Added bounds/type validation to auth input, normalized email before validation, and prevented authenticated JSON responses from being cached.
- Centralized frontend requests: browsers use same-origin routes; SSR uses a server-only internal address. No public localhost API address is baked into the browser application. Development proxy addresses and display constants are not secrets or attack mechanisms; moving secrets into VITE_* variables would still expose them.
- Fixed event search calling lower() on a plain string, added query validation and public route throttling. Corrected missing-ticket-tier rendering.
- Removed the unsafe booking implementation: it accepted ticket types from unrelated events, ignored reliable seat/capacity ownership, had no atomic inventory reservation, and issued confirmed/valid tickets without a verified payment. The route now fails closed and creates no records. This is an intentional behavior change, not a completed booking implementation.
- Removed synthetic seat-availability hashing; the unfinished map cannot present invented available seats. UI no longer claims a payment was charged or a receipt was sent.
- Blocked the known-password demo seeder in production. Existing seeded accounts and previously issued tokens require cleanup on any already-running deployment; this change does not delete existing records.
- Disabled the custom Lovable runtime-error reporting hook in production, kept browser error responses generic for server failures, and disabled client build source maps.
- Added Dockerfiles, build-context secret exclusions, a private database and loopback gateway, production environment placeholders, and the SSH/deployment handoff guide.

## Remaining work before real ticket sales

Implement server-owned screening selection, stable unique event identifiers (current slug generation can collide), real seat inventory, transactions/locking, reservation expiry, request idempotency, trusted payment confirmation and signed webhooks. Only then issue valid tickets and enable booking availability. Add actual delivery and refund policies before displaying them as promises.

Event listing currently loads multiple tables into memory and uses per-event queries. Add database-side filtering/pagination and appropriate indexes before a larger dataset. Define a publication policy for draft/cancelled/past events. Landing-page marketing copy is still prototype content. Account verification/reset, admin authorization and native mobile screens remain separate features.

No hardcoded private credential or browser command-execution path was identified in the inspected frontend source. This is a scoped code review, not a penetration test or guarantee against all attacks. A malicious browser can alter any client-side value; authorization, pricing, capacity and payment validation must always be enforced by Laravel.

## Validation

Verification completed on 2026-09-30:

- Laravel: 8 tests passed, 29 assertions, using an isolated in-memory SQLite database.
- Frontend: production Node build, TypeScript check and ESLint on all changed frontend source/config files passed.
- Production dependency scans: npm and Composer reported no known advisories. This excludes mobile and is not an audit of every development dependency.
- Built public JavaScript: no internal API address/configuration found; no client source maps emitted.
- Common private-key/credential marker scan of web/mobile source: no matches. Real backend .env is ignored and not tracked.

The regression tests cover cookie registration/logout without issuing tokens, CSRF rejection, mobile token expiry/revocation, malformed credentials, event search and prevention of unpaid ticket creation. Docker is unavailable on this workstation, so container startup/TLS/MySQL verification remains outstanding. Mobile has not been built or changed.
