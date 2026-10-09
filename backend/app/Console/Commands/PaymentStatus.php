<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class PaymentStatus extends Command
{
    protected $signature = 'tixora:payment-status';

    protected $description = 'Report PayMongo configuration without displaying secrets';

    public function handle(): int
    {
        $key = (string) config('paymongo.secret_key');
        $status = $key === '' ? 'MISSING' : (str_starts_with($key, 'sk_test_') ? 'Test-key format OK' : 'WRONG TYPE: requires a secret test key');
        $this->line('PayMongo configuration check (no secrets shown):');
        $this->line('PAYMONGO_SECRET_KEY: '.$status);
        $this->line('PAYMONGO_WEBHOOK_SECRET: '.(config('paymongo.webhook_secret') ? 'Present' : 'MISSING'));
        $this->line('Presence checks do not verify credentials with PayMongo.');

        return self::SUCCESS;
    }
}
