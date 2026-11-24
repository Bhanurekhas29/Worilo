<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/validate.php';
require_once __DIR__ . '/activity.php';

$config = require __DIR__ . '/../config/config.php';

// CORS (only needed if frontend and API are on different origins)
header('Access-Control-Allow-Origin: ' . $config['cors_origin']);
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Content-Type: application/json; charset=utf-8');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

// Public endpoints define CAPTURE_JSON first: no session, and json_out() throws instead of exiting
// so the settings endpoints can be reused to read their data (see api/public/site.php).
if (!defined('CAPTURE_JSON')) {
    session_name('worilo_admin');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $config['secure_cookie'],
        'httponly' => true,
        'samesite' => $config['secure_cookie'] ? 'None' : 'Lax',
    ]);
    session_start();
}

class JsonCaptured extends Exception {
    public function __construct(public array $data, public int $status = 200) { parent::__construct('captured'); }
}

function json_out(array $data, int $status = 200): void {
    if (defined('CAPTURE_JSON')) throw new JsonCaptured($data, $status);
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function json_body(): array {
    $data = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($data) ? $data : [];
}

function validation_fail(array $errors): void {
    json_out(['error' => 'Please fix the highlighted fields', 'errors' => $errors], 422);
}

function admin_public(array $a): array {
    return [
        'id' => (int)$a['id'],
        'name' => $a['name'],
        'username' => $a['username'],
        'email' => $a['email'],
        'is_super' => (bool)$a['is_super'],
        'is_active' => (bool)$a['is_active'],
    ];
}

function require_admin(): array {
    if (defined('CAPTURE_JSON')) {
        return ['id' => 0, 'name' => 'public', 'username' => 'public', 'email' => '', 'is_super' => false, 'is_active' => true];
    }
    if (empty($_SESSION['admin_id'])) {
        json_out(['error' => 'Unauthorized'], 401);
    }
    $st = db()->prepare('SELECT id, name, username, email, is_super, is_active FROM admins WHERE id = ?');
    $st->execute([$_SESSION['admin_id']]);
    $admin = $st->fetch();
    if (!$admin || !$admin['is_active']) {
        $_SESSION = [];
        session_destroy();
        json_out(['error' => 'Unauthorized'], 401);
    }
    $GLOBALS['current_admin'] = admin_public($admin); // used by log_activity()
    return $GLOBALS['current_admin'];
}

function require_super(): array {
    $admin = require_admin();
    if (!$admin['is_super']) {
        json_out(['error' => 'Only the superuser can do this'], 403);
    }
    return $admin;
}
