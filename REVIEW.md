# Integration and security review

Updated 8 October 2026. See INTEGRATION.md for current setup and feature coverage, and DEPLOYMENT.md for the server skeleton.

## Implemented safeguards

- Removed the hardcoded admin login and local browser admin flag. Laravel authorizes catalog changes using an explicit administrator role granted through a trusted console command.
- Browser sessions use HttpOnly cookies and CSRF. Native tokens expire and use SecureStore. Secrets remain backend runtime configuration.
- Checkout validates inventory, ownership and pricing on the server, reserves inventory transactionally and supports idempotent requests. The signed webhook independently verifies test payment amounts before issuing tickets.
- Booking history, favorites, seat holds and account changes are scoped to the authenticated user. Account deletion is blocked while active bookings exist.
- Payment cancellation expires the hosted checkout before returning inventory. No local timeout silently releases a payable order.
- Chat calls a private Qwen inference endpoint through Laravel. No desktop tools or private account data are exposed; model output is plain text with server-generated navigation.

## Scope and remaining verification

This is a code review and automated regression testing, not a penetration test or a guarantee against every attack. Real PayMongo sandbox credentials, webhook delivery, physical-device behavior and Docker/MySQL deployment still require environment testing. No real provider payment was processed here.

The prototype still needs unique persistent public event identifiers instead of title-derived slugs, database-side catalog pagination, account recovery/verification and live-sale policies including refunds and delivery. Do not advertise these as completed features. Development dependency advisories and infrastructure access controls require their own review; earlier scan results are not a current audit.

## Verification on 8 October 2026

- Laravel: 36 tests passed, 242 assertions, including simulated PayMongo responses and signed webhook validation.
- Web: production build passed.
- Mobile: source lint and TypeScript checks passed; Android, iOS and web bundle export was also performed. This is not native signing or physical-device verification.
- Repository diff whitespace check passed.

The admin dashboard now includes catalog archive/republish, poster uploads, ticket tiers, a customer directory and admin login settings in a dedicated management area. A local-only administrator creation command generates temporary credentials in ignored private storage; Docker build contexts exclude that storage. Login changes require the current password and revoke sessions/tokens.

8 October: raster uploads are admin-authorized and constrained by MIME, size and dimensions; generated filenames are served through a restricted route. AI reference code is isolated from the application; model weights, virtual environments and personal memory are ignored. A real local Qwen response was verified through Laravel. See docs/ADMIN-GUIDE.md and AI/README.md for limits and setup.

Mobile production dependency audit on 8 October: compatible transitive updates removed the critical shell-quote finding and reduced the report from 34 to 30 advisories (19 high, 11 moderate, zero critical). Remaining Expo/React Native toolchain and transitive findings are unresolved; npm proposes incompatible major changes for several packages. See docs/mobile-dependency-audit-2026-10-08.json. Do not interpret passing app tests as a clean security audit.

The final browser visual check could not run because the browser automation tool failed to initialize. API behavior and compilation were verified; hands-on browser and physical-device checks remain.
