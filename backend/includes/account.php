<?php
// Profile data for the signed-in admin (includes the avatar, which admin_public() leaves out).
function account_profile(int $id): array {
    $st = db()->prepare('SELECT id, name, username, email, is_super, is_active, avatar, last_login_at, created_at FROM admins WHERE id = ?');
    $st->execute([$id]);
    $a = $st->fetch();
    return admin_public($a) + [
        'avatar' => $a['avatar'] ?: '',
        'last_login_at' => $a['last_login_at'],
        'created_at' => $a['created_at'],
    ];
}
