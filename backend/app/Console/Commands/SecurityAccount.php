<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class SecurityAccount extends Command
{
    protected $signature = 'tixora:security-account {email?} {--name=Security staff} {--revoke}';

    protected $description = 'Create a scanner-only staff account or revoke its scanner access';

    public function handle(): int
    {
        $email = strtolower(trim($this->argument('email') ?? $this->ask('Staff email')));
        if ($this->option('revoke')) {
            $user = User::where('email', $email)->first();
            if (! $user || ! $user->is_security || ! $this->confirm('Revoke scanner access for '.$email.'?', false)) {
                return self::FAILURE;
            }
            $user->forceFill(['is_security' => false])->save();
            $user->tokens()->delete();
            Log::warning('Security audit: scanner role revoked.', ['user_id' => $user->id]);
            $this->info('Scanner access revoked and mobile tokens invalidated.');

            return self::SUCCESS;
        }
        $name = trim($this->option('name'));
        $validation = Validator::make(compact('email', 'name'), ['email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'], 'name' => ['required', 'min:2', 'max:255']]);
        if ($validation->fails()) {
            $this->error($validation->errors()->first());

            return self::FAILURE;
        }
        $password = $this->secret('Password (hidden)');
        $validation = Validator::make(['password' => $password, 'password_confirmation' => $this->secret('Confirm password (hidden)')], ['password' => ['required', 'string', 'max:72', 'confirmed', Password::min(16)->mixedCase()->numbers()->symbols()]]);
        if ($validation->fails()) {
            $this->error($validation->errors()->first());

            return self::FAILURE;
        }
        if (! $this->confirm('Create scanner-only staff account for '.$email.'?', false)) {
            return self::FAILURE;
        }
        $user = new User;
        $user->forceFill(['name' => $name, 'email' => $email, 'password' => $password, 'is_security' => true, 'is_admin' => false])->save();
        Log::warning('Security audit: scanner account created from console.', ['user_id' => $user->id]);
        $this->info('Staff account created. Sign in on mobile to open the scanner. No password file was saved.');

        return self::SUCCESS;
    }
}
