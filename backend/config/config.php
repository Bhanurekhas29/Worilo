<?php
// Reads from environment variables (Render / TiDB Cloud), falls back to local XAMPP defaults.
return [
    'db_host'       => getenv('DB_HOST') ?: '127.0.0.1',
    'db_port'       => getenv('DB_PORT') ?: '3306',
    'db_name'       => getenv('DB_NAME') ?: 'worilo',
    'db_user'       => getenv('DB_USER') ?: 'root',
    'db_pass'       => getenv('DB_PASS') ?: '',
    'db_ssl'        => getenv('DB_SSL') === '1', // set DB_SSL=1 for TiDB Cloud
    'cors_origin'   => getenv('CORS_ORIGIN') ?: 'http://localhost:5173',
    'secure_cookie' => getenv('APP_ENV') === 'production',
    // Used to encrypt stored secrets (SMTP app password). MUST be set in production.
    'app_key'       => getenv('APP_KEY') ?: 'dev-only-key-change-in-production',
];
