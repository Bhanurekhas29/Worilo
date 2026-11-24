<?php
// Creates the SUPERUSER. Usage: php scripts/create_admin.php <username> <email> <password> [name]
// Other admins are added from the Users page in the admin panel.
if (PHP_SAPI !== 'cli') { http_response_code(403); exit; }
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/validate.php';

$u = $argv[1] ?? null;
$e = $argv[2] ?? null;
$p = $argv[3] ?? null;
$n = $argv[4] ?? 'Administrator';
if (!$u || !$e || !$p) { fwrite(STDERR, "Usage: php scripts/create_admin.php <username> <email> <password> [name]\n"); exit(1); }
if (strlen($p) < 8) { fwrite(STDERR, "Password must be at least 8 characters\n"); exit(1); }
if (db()->query('SELECT COUNT(*) FROM admins WHERE is_super = 1')->fetchColumn() > 0) {
    fwrite(STDERR, "A superuser already exists.\n"); exit(1);
}

db()->prepare('INSERT INTO admins (name, username, email, password_hash, is_super) VALUES (?, ?, ?, ?, 1)')
    ->execute([$n, $u, $e, password_hash($p, PASSWORD_DEFAULT)]);
echo "Superuser '$u' created\n";
