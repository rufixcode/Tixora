<?php

return [
    // This integration deliberately accepts test keys only.
    'secret_key' => env('PAYMONGO_SECRET_KEY'),
    'webhook_secret' => env('PAYMONGO_WEBHOOK_SECRET'),
    'return_url' => env('PAYMONGO_RETURN_URL', 'http://localhost:5173/bookings'),
    'methods' => array_filter(explode(',', env('PAYMONGO_PAYMENT_METHODS', 'card'))),
];
