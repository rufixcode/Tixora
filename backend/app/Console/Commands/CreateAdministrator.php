<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class CreateAdministrator extends Command
{
    protected $signature = 'tixora:admin-bootstrap {email?} {--name=admin}';

    protected $description = 'Securely create the first administrator from a trusted terminal';

    public function handle(): int
    {
        if (User::where('is_admin', true)->exists()) {
            $this->error('An administrator already exists. Use that account, or the trusted tixora:admin command for another registered user.');

            return self::FAILURE;
        }
        $email = strtolower(trim($this->argument('email') ?? $this->ask('Administrator email')));
        $name = trim($this->option('name'));
        $validator = Validator::make(compact('email', 'name'), ['email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'], 'name' => ['required', 'string', 'min:2', 'max:255']]);
        if ($validator->fails()) {
            $this->error($validator->errors()->first());

            return self::FAILURE;
        }
        $password = $this->secret('Password (hidden)');
        $confirmation = $this->secret('Confirm password (hidden)');
        $validator = Validator::make(['password' => $password, 'password_confirmation' => $confirmation], ['password' => ['required', 'string', 'max:72', 'confirmed', Password::min(16)->mixedCase()->numbers()->symbols()]]);
        if ($validator->fails()) {
            $this->error($validator->errors()->first());

            return self::FAILURE;
        }
        if (! $this->confirm('Create the first administrator for '.$email.' in the currently configured database?', false)) {
            return self::FAILURE;
        }
        $created = DB::transaction(function () use ($email, $name, $password) {
            // Lock existing users and the admin range during the bootstrap check.
            DB::table('users')->orderBy('id')->lockForUpdate()->get(['id']);
            if (User::where('is_admin', true)->exists()) {
                return false;
            }
            $user = new User;
            $user->forceFill(['name' => $name, 'email' => $email, 'password' => $password, 'is_admin' => true])->save();
            Log::warning('Security audit: first administrator created from console.', ['user_id' => $user->id]);

            return true;
        });
        if (! $created) {
            $this->error('An administrator was created by another session. No account was added.');

            return self::FAILURE;
        }
        $this->info('Administrator created. Sign in normally, then open /admin. No password was saved to a file.');

        return self::SUCCESS;
    }
}
