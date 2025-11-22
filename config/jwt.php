<?php

return [
    'secret' => env('JWT_SECRET'),
    'ttl' => (int) env('JWT_TTL', 1440), // 24 heures (in minutes)
    'refresh_ttl' => (int) env('JWT_REFRESH_TTL', 20160), // 2 semaines (in minutes)
    'algo' => env('JWT_ALGO', 'HS256'),
    
    'required_claims' => [
        'iss',
        'iat',
        'exp',
        'nbf',
        'sub',
        'jti',
    ],

    'blacklist_enabled' => env('JWT_BLACKLIST_ENABLED', true),
    'blacklist_grace_period' => env('JWT_BLACKLIST_GRACE_PERIOD', 0),
];
