<?php

use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('tixora:admin {email} {--revoke}', function () {
    $user = User::where('email', strtolower($this->argument('email')))->first();
    if (! $user) {
        $this->error('Register this account first.');

        return 1;
    }
    $user->forceFill(['is_admin' => ! $this->option('revoke')])->save();
    $this->info('Administrator access updated.');
})->purpose('Grant or revoke administrator access for an existing account');

Artisan::command('tixora:admin-create {email} {--name=Tixora Administrator}', function () {
    if (! app()->environment(['local', 'testing'])) {
        $this->error('This temporary-account helper is for local development. Register and grant an account on the deployed server.');

        return 1;
    }
    $email = strtolower(trim($this->argument('email')));
    if (! filter_var($email, FILTER_VALIDATE_EMAIL) || User::where('email', $email)->exists()) {
        $this->error('Use a valid email that does not already have an account. No existing account was changed.');

        return 1;
    }
    $disk = Storage::disk('local');
    $path = 'admin-login.txt';
    if ($disk->exists($path)) {
        $this->error('The private admin-login.txt already exists. Move it securely before creating another account.');

        return 1;
    }
    $password = Str::password(24);
    DB::transaction(function () use ($email, $password, $disk, $path) {
        $user = new User;
        $user->forceFill(['name' => $this->option('name'), 'email' => $email, 'password' => $password, 'is_admin' => true])->save();
        if (! $disk->put($path, "Tixora local administrator\nEmail: ".$email."\nTemporary password: ".$password."\nSign in normally, then open /admin. Change email/password in Settings, then delete this file.\n", 'private')) {
            throw new RuntimeException('Could not save private login details; account creation rolled back.');
        }
    });
    $this->info('Administrator created. Login details are in backend/storage/app/private/admin-login.txt. Change them in Settings.');
})->purpose('Create a local admin with a random password saved privately, never in source code');
