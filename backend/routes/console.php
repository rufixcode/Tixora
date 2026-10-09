<?php

use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('tixora:admin {email} {--revoke}', function () {
    $user = User::where('email', strtolower($this->argument('email')))->first();
    if (! $user) {
        $this->error('Register this account first.');

        return 1;
    }
    if (app()->environment('production') && ! $this->confirm('Change administrator access for '.$user->email.'?', false)) {
        return 1;
    }
    $user->forceFill(['is_admin' => ! $this->option('revoke')])->save();
    Log::warning('Security audit: administrator access changed from console.', ['user_id' => $user->id, 'is_admin' => $user->is_admin]);
    $this->info('Administrator access updated.');
})->purpose('Grant or revoke administrator access for an existing account');

Artisan::command('tixora:admin-create {email} {--name=Tixora Administrator}', function () {
    return $this->call('tixora:admin-bootstrap', ['email' => $this->argument('email'), '--name' => $this->option('name')]);
})->purpose('Create the first admin using hidden password prompts');
