<?php
require_once __DIR__ . '/../../includes/bootstrap.php';

if (!empty($_SESSION['admin_id'])) {
    $st = db()->prepare('SELECT id, name, username FROM admins WHERE id = ?');
    $st->execute([$_SESSION['admin_id']]);
    if ($a = $st->fetch()) log_activity('login', 'Logged out', ['id' => $a['id'], 'name' => $a['name'] ?: $a['username']]);
}
$_SESSION = [];
session_destroy();
json_out(['ok' => true]);
