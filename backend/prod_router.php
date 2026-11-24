<?php
// Production router (Render): php -S 0.0.0.0:$PORT -t /app/dist backend/prod_router.php
// Static files come from the built frontend, /api/* goes to the PHP API, anything else is the React app.
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$dist = realpath(__DIR__ . '/../dist') ?: (__DIR__ . '/../dist');

if (!str_starts_with($path, '/api/') && $path !== '/api') {
    if ($path !== '/' && is_file($dist . $path)) return false; // let the server send the static file
    header('Content-Type: text/html; charset=utf-8');
    readfile($dist . '/index.html');
    return true;
}

$base = __DIR__ . $path;
if (is_file($base . '.php')) { require $base . '.php'; return true; }
if (is_file(rtrim($base, '/') . '/index.php')) { require rtrim($base, '/') . '/index.php'; return true; }
http_response_code(404);
header('Content-Type: application/json');
echo json_encode(['error' => 'Not found']);
