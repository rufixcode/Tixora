# Tixora website on Vercel

Push frontend/vercel.json and the updated Vite configuration to the branch being
deployed. The Node server target remains for local/native/Docker deployments;
builds with VERCEL=1 use Nitro's Vercel target. No extra Nitro plugin is needed.

In Vercel: Add New > Project > import rufixcode/Tixora.

| Setting | Value |
| --- | --- |
| Root Directory | frontend |
| Framework Preset | TanStack Start |
| Production Branch | main, after merging the prepared changes |
| Install Command | npm ci |
| Build Command | npm run build |
| Output Directory | Leave framework default; do not set dist or .output |
| Node.js Version | 24.x |

Add this environment variable for Production and Preview:

```
API_INTERNAL_URL=https://tixora-e6rf.onrender.com/api
```

This URL is used by server rendering for public catalog reads. Browser requests
continue through same-origin /web and /sanctum paths, proxied to Render using the
rewrites. /api also proxies media URLs. No database credentials, APP_KEY or secret
payment keys belong in this frontend project. Vercel sets VERCEL=1 automatically.

Keep Render SESSION_SECURE_COOKIE=true, SESSION_HTTP_ONLY=true,
SESSION_SAME_SITE=lax, SESSION_ENCRYPT=true and SESSION_DRIVER=database.
Leave SESSION_DOMAIN unset: host-only cookies returned through the Vercel proxy
must belong to the website rather than onrender.com. Keep the existing APP_KEY.
Ensure Aiven migrations are complete. Update PAYMONGO_RETURN_URL on Render to
the final website URL plus /bookings before testing sandbox checkout.

After deployment, verify all of these using the Vercel website URL:

1. Home page, search and event pages load, including direct page refreshes.
2. /api/events returns JSON; /sanctum/csrf-cookie returns cookies.
3. Register, sign in, refresh, sign out and sign in again work.
4. Anonymous /web/me returns 401; POST without a CSRF token returns 419.
5. Browser session cookies are Secure and HttpOnly; XSRF-TOKEN intentionally
   remains readable for the CSRF header. Cookies must not name onrender.com.
6. Bookings and sandbox payments use real catalog records, not mock data.

Render's free backend may take a minute to wake after inactivity; a Vercel rewrite
or SSR request can time out during that wakeup. Open the Render /up endpoint,
wait until it responds, then retry the website. Free Render local poster files
are ephemeral; external storage is still needed for durable uploads.

The Expo mobile web app and APK are separate deployments. This configuration
does not deploy mobile/ or replace its API settings. Test browser CORS separately
before publishing the mobile web project.

References: [TanStack Start on Vercel](https://vercel.com/kb/guide/deploy-a-tanstack-start-app-to-vercel),
[external rewrites](https://vercel.com/docs/routing/rewrites).
