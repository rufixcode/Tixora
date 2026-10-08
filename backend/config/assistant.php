<?php

return [
    'enabled' => env('ASSISTANT_ENABLED', false),
    'url' => env('ASSISTANT_URL', 'http://127.0.0.1:8081/v1/chat/completions'),
    'model' => env('ASSISTANT_MODEL', 'tixora'),
    'key' => env('ASSISTANT_API_KEY'),
    'timeout' => 40,
];
