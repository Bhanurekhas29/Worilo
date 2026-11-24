<?php
// Resets an admin's password. Usage: php scripts/reset_password.php <username-or-email> <new-password>
// DB settings come from the DB_* env vars (same as create_admin.php).
if (PHP_SAPI !== 'cli') { http_response_code(403); exit; }
require_once __DIR__ . '/../includes/db.php';

$who = $argv[1] ?? null;
$pw = $argv[2] ?? null;
if (!$who || !$pw) { fwrite(STDERR, "Usage: php scripts/reset_password.php <username-or-email> <new-password>\n"); exit(1); }
if (strlen($pw) < 8) { fwrite(STDERR, "Password must be at least 8 characters\n"); exit(1); }

$st = db()->prepare('UPDATE admins SET password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE username = ? OR email = ?');
$st->execute([password_hash($pw, PASSWORD_DEFAULT), $who, $who]);
echo $st->rowCount() ? "Password updated for '$who'\n" : "No admin found with that username or email\n";
