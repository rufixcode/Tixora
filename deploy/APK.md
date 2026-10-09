# Build the Tixora Android APK

The mobile preview profile builds a signed, installable APK using the existing
Render backend. It does not require Docker, Android Studio, or a Google Play
developer account. You need an Expo account and available EAS build quota.

From Windows PowerShell:

```powershell
cd C:\Users\ruffc\Tixora\mobile
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform android --profile preview
```

Log in to your own Expo account. For init, create a new Tixora project unless you
already own one for this app. EAS records the real project ID in app.json; do not
invent it or copy another person's ID. When asked about Android signing, allow
EAS to generate/manage a new keystore for a first build, or reuse your existing
Tixora keystore if this is an update. Preserve that signing identity for future
updates. The package identifier is com.rufixcode.tixora.

The preview profile already includes the public API URL. Its environment is
preview; remove or correct any conflicting EXPO_PUBLIC_API_URL in that project's
EAS dashboard. No database passwords or payment keys belong in mobile builds.

Wait for the build to finish. The CLI gives an Expo build URL: open it on your
Android phone and download/install the APK. Enable installation from that browser
if Android asks; no Play Store publication is required. You can share the build
link or APK for your submission. Do not use the Vercel link as an APK download.

After installing, test registration/login, catalog, bookings, logout and app
restart. The free Render backend can need a minute to wake. Expo Go is not needed
to run this APK. Internet access and a working backend are required.

Changing the embedded API URL requires rebuilding the APK. Commit EAS's project
link changes (app.json) and eas.json; never commit a keystore or credentials file.
The cloud build has not been submitted here: Expo login/project association and
signing are interactive steps in your account. Free builds can queue.

References: [Expo APK builds](https://docs.expo.dev/build-reference/apk/),
[first build](https://docs.expo.dev/build/setup/).
