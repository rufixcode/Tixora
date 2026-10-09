# Secure administrator setup

Run from your trusted local PowerShell terminal, not the professor's blocked server.

1. Confirm `backend/.env` points to your deployed Aiven MySQL database, with its CA certificate. Never paste its contents or credentials into chat.
2. From `C:\Users\ruffc\Tixora\backend`, run `php artisan config:clear`, then the setup command below.

```powershell
php artisan tixora:admin-bootstrap --name=admin
```

Enter the login email when prompted. The name may be `admin`, but login uses an email address. Use an email you control. Enter and confirm a unique password with at least 16 characters, uppercase and lowercase letters, a number and a symbol (maximum 72 characters). Password input is hidden. Confirm the account creation after checking the email.

Sign in at https://tixora-self.vercel.app/login and open https://tixora-self.vercel.app/admin. The console writes an audit entry, stores only a password hash and saves no password file. Public registration cannot assign administrator privileges. Bootstrap refuses existing users and stops when an administrator already exists.

If an administrator already exists, register the intended account normally, then use the trusted console:

```powershell
php artisan tixora:admin your-real-email@example.com
```

This grants a role; it does not create or reset a password. Production asks for confirmation. To remove that role:

```powershell
php artisan tixora:admin your-real-email@example.com --revoke
```

Keep database access and this terminal restricted. Console access is the authorization for role changes; there is no public administrator creation endpoint. These controls are not multi-factor authentication. If an old `backend/storage/app/private/admin-login.txt` exists from the previous local helper, change that account's password and delete the file securely.

## Ticket entry

In Admin → Ticket check-in, paste the `tixora:ticket:…` value from a scanned QR or from the customer's copied entry code. Check the event title and ticket status. Enter your current administrator password and choose **Admit guest**. This atomically marks one ticket used and records who admitted it. Repeated use is rejected. QR values are private admission credentials; do not post them publicly.

This version accepts a QR reader's pasted output. An in-app camera scanner is not included.
