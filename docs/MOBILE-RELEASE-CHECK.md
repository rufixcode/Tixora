# Mobile release and poster repair

The mobile catalog is fetched from Laravel. No sample listings are bundled in the current app. Its default API and EAS preview profile both point to `https://tixora-e6rf.onrender.com/api`. Any EXPO_PUBLIC_API_URL in your local .env or Vercel/Expo dashboard overrides the default, so use that same URL everywhere. A local Laravel database can contain different records from Aiven. Restart Expo after changing .env and redeploy/rebuild published clients after changing embedded environment variables.

Uploaded posters previously used Render's temporary local disk. On inspection, all three deployed poster URLs returned 404. New uploads are stored in the persistent MySQL database, with the existing 5 MB file limit. Base64 storage uses roughly one third more database space than the original file. This is suitable for a small catalog; larger catalogs should move media to object storage. Existing files still on local disk remain readable, but already-lost posters cannot be recovered by the app.

Apply the new database migration from a trusted workstation whose backend/.env points to Aiven before deploying the updated backend:

```powershell
cd C:\Users\ruffc\Tixora\backend
php artisan migrate --force
```

Push the reviewed changes to the branch Render and Vercel deploy. Redeploy the backend, upload the missing posters again through admin, and save each listing. Then redeploy the mobile website and build a new APK. Never run migrate:fresh or a demo seeder against Aiven to fix catalog problems.

Before submission, test on a real Android phone: customer login, live catalog and posters, search/filter, saved movies, screening/seat review, PayMongo test checkout, verified-payment QR, security login, camera permission, admission and duplicate rejection, account settings and logout. Check posters again after a Render redeploy to verify persistence. Automated bundling cannot verify camera hardware or a complete external payment.

During this review, the supplied mobile website's /home URL returned Vercel NOT_FOUND. Check its deployment domain and static export output directory (`dist`) in Vercel. Do not use an outdated published app to judge unpublished code fixes.
