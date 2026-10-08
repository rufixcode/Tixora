# PayMongo test checkout

The Laravel checkout integration is implemented. Activation still needs your own PayMongo test key, test webhook signing secret and a publicly reachable HTTPS backend. Blank secrets intentionally keep checkout unavailable.

## Activate locally

1. Open PayMongo Dashboard → Settings → Developers in test mode. Copy the secret test key (starts with `sk_test_`) into `PAYMONGO_SECRET_KEY` in `backend/.env`. Do not put it in React or Expo environment files or send it in chat.
2. Expose your Laravel backend through your server or a trusted HTTPS development tunnel. Register that public backend URL followed by `/api/payments/paymongo/webhook` in PayMongo's test-mode webhook settings. Subscribe to `checkout_session.payment.paid`.
3. Copy that webhook's signing secret into `PAYMONGO_WEBHOOK_SECRET` in `backend/.env`. This is different from the API secret key.
4. Set `PAYMONGO_RETURN_URL` to the web app's complete `/bookings` URL. The prepared localhost URL works only on this computer; phone tests need a URL reachable from the phone. Leave `PAYMONGO_PAYMENT_METHODS=card` for the first test.
5. From `backend`, run `php artisan config:clear`. Restart long-running backend services after configuration changes.
6. Sign in as a customer and choose a ticket or cinema seats. Select **Continue to payment** and use the official PayMongo test payment details. Verify webhook delivery in the dashboard, then refresh My bookings to confirm the order. Returning to the app alone does not confirm payment.

For Docker, put the same settings in the private deployment environment file consumed by Compose and recreate the backend service. Never commit either environment file.

## Verification

Run `php artisan test --filter=CheckoutTest` from `backend` for simulated checkout, webhook and cancellation checks. These do not validate your PayMongo account or public webhook connection. Finish one real sandbox checkout and one cancellation before demonstration; no live funds are involved.

The button uses normal payment wording. A small test-mode notice remains so testers know no real payment is collected. Live keys are rejected by the backend.

Official references:
- https://docs.paymongo.com/docs/payment-channels-hosted-checkout-quick-start
- https://docs.paymongo.com/docs/developer-tools-webhook-setup-management
- https://docs.paymongo.com/docs/payment-channels-testing
