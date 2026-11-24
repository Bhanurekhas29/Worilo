<?php
// The signed-in admin's own profile. GET | PUT { name, email, avatar }
require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/account.php';

$me = require_admin();
const MAX_AVATAR_BYTES = 150000; // data-URL length; the browser resizes pictures to ~256px first

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['admin' => account_profile($me['id'])]);

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $in = json_body();
    $errors = [];

    $name = v_text($in, 'name', 'Full name', 2, 60, $errors);
    $email = v_email($in, 'email', 'Email', $errors);
    if ($email !== '' && !isset($errors['email'])) {
        $st = db()->prepare('SELECT 1 FROM admins WHERE email = ? AND id <> ? LIMIT 1');
        $st->execute([$email, $me['id']]);
        if ($st->fetchColumn()) $errors['email'] = 'This email is already in use';
    }

    // Empty string removes the picture; otherwise it must be a small real image.
    $avatar = (string)($in['avatar'] ?? '');
    if ($avatar !== '') {
        if (!preg_match('#^data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$#', $avatar, $m)) {
            $errors['avatar'] = 'Choose a JPG, PNG or WebP image';
        } elseif (strlen($avatar) > MAX_AVATAR_BYTES) {
            $errors['avatar'] = 'That picture is too large. Try a smaller image';
        } else {
            $bin = base64_decode($m[2], true);
            if ($bin === false || @getimagesizefromstring($bin) === false) $errors['avatar'] = 'That file is not a valid image';
        }
    }

    if ($errors) validation_fail($errors);

    db()->prepare('UPDATE admins SET name = ?, email = ?, avatar = ? WHERE id = ?')
        ->execute([$name, $email, $avatar !== '' ? $avatar : null, $me['id']]);
    log_activity('account', 'Updated their profile');
    json_out(['admin' => account_profile($me['id'])]);
}

json_out(['error' => 'Method not allowed'], 405);
