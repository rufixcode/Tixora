# Tixora integration handoff — 7 October 2026

## Connected features

Web and Expo mobile use the same Laravel catalog, accounts, favorites, settings, cinema inventory and booking records. Both include event checkout, cinema seat holds, booking history, payment resume/cancellation and an authorized catalog editor. Chat is connected to a private local Qwen service through Laravel, with a built-in help fallback. See AI/README.md.

Browser authentication uses HttpOnly session cookies and CSRF. Native authentication uses expiring tokens in SecureStore. The Expo web preview keeps tokens in memory only; use the React website for the deployed browser experience. Admin privileges are checked by Laravel, not a browser flag. Prices, seat ownership, availability and payment confirmation are validated on the server.

## Local setup

1. Install backend Composer dependencies and each application's npm dependencies from their lockfiles.
2. Configure backend/.env and run `php artisan migrate` in backend. Back up an existing database before migrations. Do not use migrate:fresh against existing data.
3. Start Laravel on 127.0.0.1:8000 and run `npm run dev` in frontend (port 5173). Use the same hostname consistently for browser sessions.
4. Register an account normally. From the trusted backend terminal, run `php artisan tixora:admin your-account@example.com` to grant catalog administration. Use `--revoke` to remove it. There is no default admin password.
5. Create future events through the admin screen. Enter date/time in UTC, the current backend timezone. The local catalog may be empty until events are added.
6. For mobile, set EXPO_PUBLIC_API_URL in mobile/.env to the reachable backend API URL (including /api), then start Expo. Android emulator defaults to http://10.0.2.2:8000/api; a physical device needs a reachable development host. Release builds require HTTPS. Never put secret keys in EXPO_PUBLIC_* or VITE_* settings.

## PayMongo sandbox setup

Configure these only in backend/.env (or deploy/.env for containers):

- PAYMONGO_SECRET_KEY: your sk_test_ key.
- PAYMONGO_WEBHOOK_SECRET: signing secret for your test webhook.
- PAYMONGO_RETURN_URL: the web application's full /bookings URL.
- PAYMONGO_PAYMENT_METHODS: card by default; enable other sandbox methods only when supported by your account.

Register a reachable HTTPS webhook at `/api/payments/paymongo/webhook` for `checkout_session.payment.paid`. A localhost server requires a trusted development tunnel for provider callbacks. Reload configuration after changing settings. Never commit .env or paste keys into chat.

Checkout fails closed until test credentials are configured. Live secret keys are rejected. Laravel creates a hosted checkout using server prices and an idempotency key. Tickets are issued only after a signed test webhook and independent provider verification of the paid amount and currency. Returning to the app alone does not mark a booking paid; refresh booking history after the callback arrives.

Unpaid bookings retain inventory until cancellation successfully expires the provider session. This prevents selling the same seats while an older checkout remains payable. Resume or cancel pending orders from booking history. Cinema selection holds expire after ten minutes before checkout. Refunds, receipt email, password recovery, admission scanning and live payment processing are not implemented.

## Verification and deployment limits

Automated payment tests use simulated provider responses; they do not prove a real PayMongo transaction. Complete a sandbox card checkout, webhook delivery, duplicate callback and cancellation test with your own test account before demonstration. The test keys were not configured during this implementation.

Web production compilation and mobile Android/iOS/Web exports were checked. Native export is not a signed APK/IPA or a physical-device test. Test authentication, checkout browser return and booking refresh on the intended phone before delivery.

See DEPLOYMENT.md for the Docker/SSH skeleton. No professor server was contacted. Docker startup, TLS, MySQL concurrency and provider networking still need verification on that environment. Back up MySQL and application storage before deployment. Slug collisions and catalog pagination remain limitations for a larger catalog; use distinct event titles for this prototype.

Provider reference: https://docs.paymongo.com/docs/payment-channels-hosted-checkout-quick-start


## Admin dashboard

Sign in with an administrator account to open the dedicated admin area on web or mobile. It contains Listings, Customers and Admin account; customer navigation, overview and payment panels are excluded.

- Publish and edit concerts, general events and movie screenings with titles, concert artists, descriptions, HTTPS poster URLs, venue/city, UTC schedule, price and capacity.
- Search and filter the catalog. Archive/delete removes a listing from both public apps but retains its database history. Select archived listings, edit and save to republish.
- Search the paginated customer directory and update your own admin login details.
- Listings with booking history cannot be edited or archived. Booking/payment records and customer accounts are read-only in the dashboard; refunds and account moderation are not implemented. Administrator grants/revocations use the trusted `tixora:admin` console command, not a public registration field.

To grant access, register your own account, then run `php artisan tixora:admin your-email@example.com` from backend. Sign out and back in to refresh the mobile role. No shared admin password is included.

For a fresh local demo account, `php artisan tixora:admin-create admin@tixora.local` generates a random password in `backend/storage/app/private/admin-login.txt`. It refuses to overwrite existing accounts or credential files and is disabled outside local/testing. Keep that file private, change the email/password through Settings → Change login details, then delete the temporary file. Changing login details requires the current password and signs out all sessions/tokens.

## 8 October update

See [Admin and image guide](docs/ADMIN-GUIDE.md) for direct poster uploads and ticket-tier management, and [AI setup](AI/README.md) for the working chatbot and deployment requirements. The model service is separate from Laravel. Native image-picker behavior still requires a physical-device test.
