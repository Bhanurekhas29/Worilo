<?php
require_once __DIR__ . '/../../includes/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['error' => 'Method not allowed'], 405);

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

$body = json_body();
$login = trim((string)($body['login'] ?? ''));
$password = (string)($body['password'] ?? '');

if ($login === '' || $password === '') {
    json_out(['error' => 'Username/email and password are required'], 422);
}

$st = db()->prepare('SELECT * FROM admins WHERE username = :u OR email = :e LIMIT 1');
$st->execute(['u' => $login, 'e' => $login]);
$admin = $st->fetch();

if ($admin && $admin['locked_until'] && strtotime($admin['locked_until']) > time()) {
    json_out(['error' => 'Too many failed attempts. Try again later.'], 429);
}

if (!$admin || !password_verify($password, $admin['password_hash'])) {
    if ($admin) {
        $attempts = (int)$admin['failed_attempts'] + 1;
        $lock = $attempts >= MAX_ATTEMPTS ? date('Y-m-d H:i:s', time() + LOCK_MINUTES * 60) : null;
        db()->prepare('UPDATE admins SET failed_attempts = ?, locked_until = ? WHERE id = ?')
            ->execute([$lock ? 0 : $attempts, $lock, $admin['id']]);
        log_activity('security', $lock ? "Account \"{$admin['username']}\" locked after repeated failed logins" : "Failed login attempt for \"{$admin['username']}\"", ['id' => $admin['id'], 'name' => $admin['name'] ?: $admin['username']]);
    } else {
        log_activity('security', 'Failed login attempt for unknown user "' . mb_substr($login, 0, 40) . '"', ['id' => null, 'name' => 'Unknown visitor']);
    }
    json_out(['error' => 'Invalid credentials'], 401);
}

if (!$admin['is_active']) {
    json_out(['error' => 'This account has been disabled. Contact the administrator.'], 403);
}

db()->prepare('UPDATE admins SET failed_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = ?')->execute([$admin['id']]);
session_regenerate_id(true);
$_SESSION['admin_id'] = (int)$admin['id'];
log_activity('login', 'Logged in', admin_public($admin));

json_out(['admin' => admin_public($admin)]);
