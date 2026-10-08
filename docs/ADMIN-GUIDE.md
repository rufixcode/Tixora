# Admin and image guide

## Upload a poster (recommended)

1. Sign in with an administrator account and open Administration → Listings.
2. Choose Add listing or Edit. Enter its title, category, description, venue, city, schedule, price and capacity. Schedules are entered in UTC.
3. On the website, choose a file under Upload poster. On mobile, tap Choose poster image to use the phone's photo picker.
4. Use JPG, PNG or WebP, at most 5 MB and 4096 × 4096 pixels. SVG, executable files and unsupported formats are rejected. Remove private location/EXIF metadata before publishing an image.
5. Wait for the preview, then click Publish event or Save changes & publish. Uploading by itself does not attach the file to a listing.
6. Open the event on the public website or mobile app to check the poster. The same image is used by both apps.

The database stores a reference such as `/api/media/<random-id>.jpg` in the existing `poster_url` column of movies, concerts or events. The file itself is in `backend/storage/app/public/posters/`. Do not paste image bytes, local C: paths or phone file paths into the database. The API serves only generated raster filenames; a public storage symlink is not required. Back up the database AND the storage volume. Replacing a poster does not delete older files; keep them for backup, and review unused uploads before deleting them manually.

## Upload configuration

Docker PHP accepts 5 MB uploads (6 MB total request body); the supplied Nginx configuration also permits 6 MB. The professor's outer reverse proxy needs a compatible limit. On local PHP, set upload_max_filesize=5M and post_max_size=6M in php.ini and restart the server, or run this from backend/public for development:

```powershell
php -d upload_max_filesize=5M -d post_max_size=6M -S 127.0.0.1:8000 ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php
```

Mobile EXPO_PUBLIC_API_URL must point to a reachable backend `/api` URL. Uploaded image paths are resolved against that same server. Keep native tokens out of public image URLs. An Expo development/native rebuild may be required after adding the image-picker plugin; select a supported image and test on your target phone.

## Admin functions

- Listings: create/edit concerts, general events and movie screenings; poster uploads and preview; search/filter; archive and republish.
- Ticket tiers: on a concert or general-event card, open Ticket tiers to add/edit/delete options such as General Admission and VIP. Up to ten tiers per listing, each up to 200 tickets; at least one remains. The main listing editor updates the lowest-priced tier. Movie prices/capacity use the screening editor instead.
- Customers: search registered accounts. Credentials and payment secrets are never included.
- Admin account: change your email and password using the current password.
- Sign out: leave the dedicated management area. Customer navigation, checkout, payment reports, overview and chatbot are excluded from this area.

Once a listing has booking history, schedule, price, capacity changes and deletion are blocked to protect existing orders. An admin cannot manually mark an unpaid booking paid. Refunds, customer banning/deletion, role changes through the browser and ticket admission scanning are not implemented. Roles are managed with the trusted server console. The admin is functional but does not pretend these unimplemented operations work.

Local administrator credentials remain in the ignored `backend/storage/app/private/admin-login.txt` file if you have not removed it. Do not publish it. Change the initial login details in Admin account.
