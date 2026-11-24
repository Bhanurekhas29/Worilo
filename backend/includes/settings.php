<?php
// Key/value settings storage + encryption helpers for secrets.

function settings_get(string $group, array $fields): array {
    $keys = array_map(fn($f) => "{$group}_{$f}", $fields);
    $in = implode(',', array_fill(0, count($keys), '?'));
    $st = db()->prepare("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ($in)");
    $st->execute($keys);
    $rows = $st->fetchAll(PDO::FETCH_KEY_PAIR);
    $out = [];
    foreach ($fields as $f) $out[$f] = $rows["{$group}_{$f}"] ?? '';
    return $out;
}

function settings_save(string $group, array $values): void {
    $st = db()->prepare(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
    );
    foreach ($values as $field => $value) {
        $st->execute(["{$group}_{$field}", (string)$value]);
    }
    log_activity('content', 'Updated ' . settings_group_label($group));
}

function secret_key(): string {
    $cfg = require __DIR__ . '/../config/config.php';
    return hash('sha256', $cfg['app_key'], true);
}

function encrypt_secret(string $plain): string {
    $iv = random_bytes(12);
    $tag = '';
    $cipher = openssl_encrypt($plain, 'aes-256-gcm', secret_key(), OPENSSL_RAW_DATA, $iv, $tag);
    return base64_encode($iv . $tag . $cipher);
}

function decrypt_secret(string $stored): string {
    $raw = base64_decode($stored, true);
    if ($raw === false || strlen($raw) < 29) return '';
    $plain = openssl_decrypt(substr($raw, 28), 'aes-256-gcm', secret_key(), OPENSSL_RAW_DATA, substr($raw, 0, 12), substr($raw, 12, 16));
    return $plain === false ? '' : $plain;
}
