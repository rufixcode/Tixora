<?php

return [
    // This integration deliberately accepts test keys only.
    'secret_key' => trim((string) env('PAYMONGO_SECRET_KEY'), " \t\n\r\0\x0B\"'"),
    'webhook_secret' => trim((string) env('PAYMONGO_WEBHOOK_SECRET'), " \t\n\r\0\x0B\"'"),
    'return_url' => env('PAYMONGO_RETURN_URL', 'http://localhost:5173/bookings'),
    'methods' => array_filter(explode(',', env('PAYMONGO_PAYMENT_METHODS', 'card'))),
];
