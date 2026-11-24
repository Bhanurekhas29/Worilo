<?php
// SMTP / email settings. Superuser only. GET | PUT
// The app password is encrypted at rest, never returned, and can only be changed after the
// admin re-enters their own account password.
require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/settings.php';

$me = require_super();
$fields = ['smtp_host', 'smtp_port', 'encryption', 'smtp_username', 'smtp_password', 'from_email', 'from_name', 'notify_email',
           'password_updated_at', 'password_updated_by'];

function email_settings_out(array $d): array {
    $has = $d['smtp_password'] !== '';
    $updated = '';
    if ($has && $d['password_updated_at'] !== '') {
        $updated = date('j M Y', strtotime($d['password_updated_at'])) . ($d['password_updated_by'] !== '' ? ' by ' . $d['password_updated_by'] : '');
    }
    unset($d['smtp_password'], $d['password_updated_at'], $d['password_updated_by']);
    // Secrets are write-only: the form always receives empty values for them.
    return $d + ['smtp_password' => '', 'current_password' => '', 'has_password' => $has, 'password_updated' => $updated];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $d = settings_get('email', $fields);
    // Nothing saved yet: pre-fill the company Gmail setup. Only the app password is still needed.
    if ($d['smtp_host'] === '' && $d['smtp_username'] === '' && $d['notify_email'] === '') {
        $d['smtp_host'] = 'smtp.gmail.com';
        $d['smtp_username'] = $d['from_email'] = $d['notify_email'] = 'worilobusiness@gmail.com';
        $d['from_name'] = 'WORILO';
    }
    if ($d['encryption'] === '') $d['encryption'] = 'tls';
    if ($d['smtp_port'] === '') $d['smtp_port'] = '587';
    json_out(['data' => email_settings_out($d)]);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $in = json_body();
    $stored = settings_get('email', $fields);
    $errors = [];

    $host = strtolower(trim((string)($in['smtp_host'] ?? '')));
    $hostRe = '/^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/';
    if ($host === '') $errors['smtp_host'] = 'SMTP host is required';
    elseif (!preg_match($hostRe, $host) && !filter_var($host, FILTER_VALIDATE_IP)) {
        $errors['smtp_host'] = 'Enter a valid host, e.g. smtp.gmail.com';
    }

    $portRaw = trim((string)($in['smtp_port'] ?? ''));
    $port = ctype_digit($portRaw) ? (int)$portRaw : 0;
    if ($portRaw === '') $errors['smtp_port'] = 'SMTP port is required';
    elseif ($port < 1 || $port > 65535) $errors['smtp_port'] = 'Port must be a number between 1 and 65535';

    $enc = (string)($in['encryption'] ?? '');
    if (!in_array($enc, ['tls', 'ssl', 'none'], true)) $errors['encryption'] = 'Choose TLS, SSL or None';

    $username = trim((string)($in['smtp_username'] ?? ''));
    if ($username === '') $errors['smtp_username'] = 'SMTP username is required';
    elseif (strlen($username) > 190 || preg_match('/\s/', $username)) $errors['smtp_username'] = 'Enter a valid SMTP username (no spaces)';

    // App passwords are shown with spaces (e.g. "abcd efgh ijkl mnop"); store without them.
    $pw = preg_replace('/\s+/', '', (string)($in['smtp_password'] ?? ''));
    $current = (string)($in['current_password'] ?? '');
    if ($pw === '') {
        if ($stored['smtp_password'] === '') $errors['smtp_password'] = 'App password is required';
    } else {
        if (strlen($pw) < 8 || strlen($pw) > 100) {
            $errors['smtp_password'] = 'App password must be 8-100 characters';
        } elseif (str_ends_with($host, 'gmail.com') && !preg_match('/^[a-z]{16}$/i', $pw)) {
            $errors['smtp_password'] = 'A Gmail app password is 16 letters (spaces are ignored)';
        }

        // Re-authenticate before the secret can be replaced.
        if ($current === '') {
            $errors['current_password'] = 'Enter your admin password to change the app password';
        } else {
            $st = db()->prepare('SELECT password_hash, failed_attempts, locked_until FROM admins WHERE id = ?');
            $st->execute([$me['id']]);
            $row = $st->fetch();
            if ($row['locked_until'] && strtotime($row['locked_until']) > time()) {
                json_out(['error' => 'Too many failed attempts. Try again later.'], 429);
            }
            if (!password_verify($current, $row['password_hash'])) {
                $attempts = (int)$row['failed_attempts'] + 1;
                $lock = $attempts >= 5 ? date('Y-m-d H:i:s', time() + 15 * 60) : null;
                db()->prepare('UPDATE admins SET failed_attempts = ?, locked_until = ? WHERE id = ?')
                    ->execute([$lock ? 0 : $attempts, $lock, $me['id']]);
                $errors['current_password'] = 'Incorrect password';
            } else {
                db()->prepare('UPDATE admins SET failed_attempts = 0, locked_until = NULL WHERE id = ?')->execute([$me['id']]);
            }
        }
    }

    $fromEmail = v_email($in, 'from_email', 'From email', $errors);
    $fromName = v_text($in, 'from_name', 'From name', 2, 80, $errors);
    $notify = v_email($in, 'notify_email', 'Notification email', $errors);

    if ($errors) validation_fail($errors);

    $clean = [
        'smtp_host' => $host,
        'smtp_port' => (string)$port,
        'encryption' => $enc,
        'smtp_username' => $username,
        'from_email' => $fromEmail,
        'from_name' => $fromName,
        'notify_email' => $notify,
        'smtp_password' => $stored['smtp_password'],
        'password_updated_at' => $stored['password_updated_at'],
        'password_updated_by' => $stored['password_updated_by'],
    ];
    if ($pw !== '') {
        $clean['smtp_password'] = encrypt_secret($pw);
        $clean['password_updated_at'] = date('Y-m-d H:i:s');
        $clean['password_updated_by'] = $me['username'];
    }
    settings_save('email', $clean);
    json_out(['data' => email_settings_out($clean)]);
}

json_out(['error' => 'Method not allowed'], 405);
