<?php
// Dev router: php -S localhost:8000 router.php  -> clean URLs like /api/auth/login
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$base = __DIR__ . $path;
if (str_starts_with($path, '/scripts') || str_starts_with($path, '/config') || str_starts_with($path, '/includes') || str_starts_with($path, '/database')) {
    http_response_code(404); exit;
}
if (is_file($base . '.php')) { require $base . '.php'; return true; }
if (is_file(rtrim($base, '/') . '/index.php')) { require rtrim($base, '/') . '/index.php'; return true; }
http_response_code(404);
header('Content-Type: application/json');
echo json_encode(['error' => 'Not found']);
