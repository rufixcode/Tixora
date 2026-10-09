# Mobile security scanner

Deploy the backend and run its migration before signing into the updated mobile app. From a trusted terminal with backend/.env pointing to your Aiven database:

```powershell
cd C:\Users\ruffc\Tixora\backend
php artisan migrate --force
php artisan tixora:security-account
```

Enter the staff email, a password of at least 16 characters (upper/lowercase, number and symbol), confirm the password, and confirm creation. Password entry is hidden. The command never overwrites an existing user or stores a password file. Use a separate account for each staff member so admission logs identify the individual.

Sign in on mobile using the new account. It opens Ticket scanner automatically. Staff can check and admit tickets but cannot manage listings or view administrator customer reports. The backend checks the role on every request; hiding buttons is not the access control.

Allow camera access, point the rear camera at a customer's admission QR in My bookings, check the event and ticket status, then enter your staff password and confirm guest entry. Scanning alone does not mark a ticket used. The backend admits one guest once and records the staff user. Already-used, unknown and unpaid tickets cannot be admitted. The camera stops when leaving the scanner or backgrounding the app. Microphone access is not requested.

Internet is required. If an admission request loses its connection, check the same ticket again: a previous request may already have succeeded. Never assume that an error means a guest was not admitted. A pasted ticket entry code can be checked if the camera is unavailable.

To revoke a security account and invalidate its mobile sessions:

```powershell
php artisan tixora:security-account staff-email@example.com --revoke
```

The Android app needs a new APK build to include the native camera package and permissions. Browser camera support depends on the device and browser; HTTPS is required. Test a confirmed ticket on a physical phone, admit it, scan again to verify duplicate rejection, then build the final APK using deploy/APK.md. Automated tests validate backend permissions and single-use admission, but cannot prove the physical camera scan works on your phone.
