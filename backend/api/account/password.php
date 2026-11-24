<?php
// Change the signed-in admin's password. POST { current_password, new_password, confirm_password }
require_once __DIR__ . '/../../includes/bootstrap.php';

$me = require_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['error' => 'Method not allowed'], 405);

$in = json_body();
$current = (string)($in['current_password'] ?? '');
$new = (string)($in['new_password'] ?? '');
$confirm = (string)($in['confirm_password'] ?? '');
$errors = [];

$st = db()->prepare('SELECT password_hash, failed_attempts, locked_until FROM admins WHERE id = ?');
$st->execute([$me['id']]);
$row = $st->fetch();

if ($row['locked_until'] && strtotime($row['locked_until']) > time()) {
    json_out(['error' => 'Too many failed attempts. Try again later.'], 429);
}

if ($current === '') $errors['current_password'] = 'Enter your current password';

if ($new === '') $errors['new_password'] = 'Enter a new password';
elseif ($problem = password_problem($new, $me['username'])) $errors['new_password'] = $problem;
elseif ($current !== '' && hash_equals($current, $new)) $errors['new_password'] = 'The new password must be different from the current one';

if (!isset($errors['new_password']) && $new !== '' && $new !== $confirm) $errors['confirm_password'] = 'Passwords do not match';

// Only check the current password once the rest is valid, so typos don't burn attempts.
if (!$errors && !password_verify($current, $row['password_hash'])) {
    $attempts = (int)$row['failed_attempts'] + 1;
    $lock = $attempts >= 5 ? date('Y-m-d H:i:s', time() + 15 * 60) : null;
    db()->prepare('UPDATE admins SET failed_attempts = ?, locked_until = ? WHERE id = ?')->execute([$lock ? 0 : $attempts, $lock, $me['id']]);
    $errors['current_password'] = 'Incorrect password';
}

if ($errors) validation_fail($errors);

db()->prepare('UPDATE admins SET password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?')
    ->execute([password_hash($new, PASSWORD_DEFAULT), $me['id']]);
session_regenerate_id(true);
log_activity('security', 'Changed their password');

json_out(['ok' => true]);
