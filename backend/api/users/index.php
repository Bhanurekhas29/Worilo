<?php
// Admin users. Superuser only. GET list | POST create | PUT ?id= update | DELETE ?id=
require_once __DIR__ . '/../../includes/bootstrap.php';

$me = require_super();
$method = $_SERVER['REQUEST_METHOD'];
$id = (int)($_GET['id'] ?? 0);

function find_user(int $id): array {
    $st = db()->prepare('SELECT * FROM admins WHERE id = ?');
    $st->execute([$id]);
    $u = $st->fetch();
    if (!$u) json_out(['error' => 'User not found'], 404);
    return $u;
}

function unique_taken(string $field, string $value, int $exceptId): bool {
    $st = db()->prepare("SELECT 1 FROM admins WHERE $field = ? AND id <> ? LIMIT 1");
    $st->execute([$value, $exceptId]);
    return (bool)$st->fetchColumn();
}

if ($method === 'GET') {
    $rows = db()->query('SELECT id, name, username, email, is_super, is_active, created_at FROM admins ORDER BY is_super DESC, id ASC')->fetchAll();
    json_out(['users' => array_map(fn($r) => admin_public($r) + ['created_at' => $r['created_at']], $rows)]);
}

if ($method === 'POST' || $method === 'PUT') {
    $in = json_body();
    $errors = [];
    $existing = null;
    if ($method === 'PUT') {
        if (!$id) json_out(['error' => 'Missing id'], 400);
        $existing = find_user($id);
    }

    $name = v_text($in, 'name', 'Full name', 2, 60, $errors);
    $email = v_email($in, 'email', 'Email', $errors);
    if ($email !== '' && !isset($errors['email']) && unique_taken('email', $email, $id)) {
        $errors['email'] = 'This email is already in use';
    }

    // Username can only be set when creating a user.
    $username = $existing['username'] ?? trim((string)($in['username'] ?? ''));
    if (!$existing) {
        if ($username === '') $errors['username'] = 'Username is required';
        elseif (!preg_match('/^[A-Za-z0-9_.]{3,30}$/', $username)) {
            $errors['username'] = 'Username must be 3-30 characters: letters, numbers, dot or underscore';
        } elseif (unique_taken('username', $username, 0)) {
            $errors['username'] = 'This username is already taken';
        }
    }

    $password = (string)($in['password'] ?? '');
    $confirm = (string)($in['password_confirm'] ?? '');
    if (!$existing || $password !== '') {
        if ($password === '') $errors['password'] = 'Password is required';
        elseif ($problem = password_problem($password, $username)) $errors['password'] = $problem;
        elseif ($password !== $confirm) $errors['password_confirm'] = 'Passwords do not match';
    }

    // The superuser can never be deactivated.
    $active = ($existing && $existing['is_super']) ? 1 : ($existing ? v_bool($in, 'is_active') : 1);
    if ($existing && !$existing['is_super'] && !array_key_exists('is_active', $in)) $active = (int)$existing['is_active'];

    if ($errors) validation_fail($errors);

    if (!$existing) {
        db()->prepare('INSERT INTO admins (name, username, email, password_hash, is_super, is_active) VALUES (?, ?, ?, ?, 0, 1)')
            ->execute([$name, $username, $email, password_hash($password, PASSWORD_DEFAULT)]);
        $newId = (int)db()->lastInsertId();
        log_activity('user', "Added user $name ($username)");
        json_out(['user' => admin_public(find_user($newId))], 201);
    }

    db()->prepare('UPDATE admins SET name = ?, email = ?, is_active = ? WHERE id = ?')->execute([$name, $email, $active, $id]);
    if ($password !== '') {
        db()->prepare('UPDATE admins SET password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?')
            ->execute([password_hash($password, PASSWORD_DEFAULT), $id]);
    }
    log_activity('user', 'Updated user ' . $existing['username'] . ($password !== '' ? ' (password reset)' : ''));
    json_out(['user' => admin_public(find_user($id))]);
}

if ($method === 'DELETE') {
    if (!$id) json_out(['error' => 'Missing id'], 400);
    $user = find_user($id);
    if ($user['is_super']) json_out(['error' => 'The superuser cannot be deleted'], 403);
    if ($id === $me['id']) json_out(['error' => 'You cannot delete your own account'], 403);
    db()->prepare('DELETE FROM admins WHERE id = ?')->execute([$id]);
    log_activity('user', "Deleted user {$user['name']} ({$user['username']})");
    json_out(['ok' => true]);
}

json_out(['error' => 'Method not allowed'], 405);
