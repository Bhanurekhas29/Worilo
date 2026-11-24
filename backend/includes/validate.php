<?php
// Small validation helpers. Each returns the cleaned value and appends to $errors on failure.

function v_text(array $in, string $key, string $label, int $min, int $max, array &$errors, bool $required = true): string {
    $val = trim((string)($in[$key] ?? ''));
    $val = preg_replace('/\s+/u', ' ', $val);
    $len = mb_strlen($val);
    if ($val === '') {
        if ($required) $errors[$key] = "$label is required";
        return '';
    }
    if ($len < $min) $errors[$key] = "$label must be at least $min characters";
    elseif ($len > $max) $errors[$key] = "$label must be at most $max characters";
    return $val;
}

function v_email(array $in, string $key, string $label, array &$errors, bool $required = true): string {
    $val = strtolower(trim((string)($in[$key] ?? '')));
    if ($val === '') {
        if ($required) $errors[$key] = "$label is required";
        return '';
    }
    if (strlen($val) > 190 || !filter_var($val, FILTER_VALIDATE_EMAIL)) {
        $errors[$key] = 'Enter a valid ' . strtolower($label);
    }
    return $val;
}

function v_url(array $in, string $key, string $label, array &$errors, bool $required = false): string {
    $val = trim((string)($in[$key] ?? ''));
    if ($val === '') {
        if ($required) $errors[$key] = "$label is required";
        return '';
    }
    if (strlen($val) > 255 || !filter_var($val, FILTER_VALIDATE_URL) || !preg_match('#^https?://#i', $val)) {
        $errors[$key] = "$label must be a valid http(s) URL";
    }
    return $val;
}

// Image reference: a site path like /images/logo.png or a full http(s) URL.
function v_image_path(array $in, string $key, string $label, array &$errors, bool $required = false): string {
    $val = trim((string)($in[$key] ?? ''));
    if ($val === '') {
        if ($required) $errors[$key] = "$label is required";
        return '';
    }
    $okPath = preg_match('#^/[A-Za-z0-9_./-]+$#', $val) && !str_contains($val, '..');
    $okUrl = filter_var($val, FILTER_VALIDATE_URL) && preg_match('#^https?://#i', $val);
    if (strlen($val) > 255 || (!$okPath && !$okUrl)) {
        $errors[$key] = "$label must be a path like /images/logo.png or an http(s) URL";
    } elseif (!preg_match('/\.(png|jpe?g|svg|webp|avif|gif|ico)(\?.*)?$/i', $val)) {
        $errors[$key] = "$label must point to an image (png, jpg, svg, webp, avif, gif or ico)";
    }
    return $val;
}

// Site link: internal path (/about, /#contact), in-page anchor (#about) or full http(s) URL.
function v_link(array $in, string $key, string $label, array &$errors, bool $required = true): string {
    $val = trim((string)($in[$key] ?? ''));
    if ($val === '') {
        if ($required) $errors[$key] = "$label is required";
        return '';
    }
    $okPath = preg_match('#^/[A-Za-z0-9\-._~/\#?=&%]*$#', $val) && !str_contains($val, '//');
    $okAnchor = preg_match('/^#[A-Za-z0-9_-]+$/', $val);
    $okUrl = filter_var($val, FILTER_VALIDATE_URL) && preg_match('#^https?://#i', $val);
    if (strlen($val) > 255 || (!$okPath && !$okAnchor && !$okUrl)) {
        $errors[$key] = "$label must be a page path like /about, an anchor like #contact, or a full http(s) URL";
    }
    return $val;
}

// Worldwide phone: country_code (1-4 digits, no "+") and number (6-14 digits) in $in[$key].
// Returns "+<code><number>" or '' when empty and optional.
function v_phone(array $in, string $key, string $label, array &$errors, bool $required = false): string {
    $p = is_array($in[$key] ?? null) ? $in[$key] : [];
    $code = (string)($p['country_code'] ?? '');
    $num = trim((string)($p['number'] ?? ''));
    if ($num === '') {
        if ($required) $errors[$key] = "$label is required";
        return '';
    }
    if (!preg_match('/^\d{1,4}$/', $code)) $errors[$key] = 'Choose a country code';
    elseif (!preg_match('/^\d{6,14}$/', $num)) $errors[$key] = "$label must be 6 to 14 digits";
    return "+$code$num";
}

function v_bool(array $in, string $key): int {
    return !empty($in[$key]) && $in[$key] !== 'false' ? 1 : 0;
}

function password_problem(string $pw, string $username = ''): ?string {
    if (strlen($pw) < 8) return 'Password must be at least 8 characters';
    if (strlen($pw) > 72) return 'Password must be at most 72 characters';
    if (!preg_match('/[a-z]/', $pw)) return 'Password needs a lowercase letter';
    if (!preg_match('/[A-Z]/', $pw)) return 'Password needs an uppercase letter';
    if (!preg_match('/\d/', $pw)) return 'Password needs a number';
    if (!preg_match('/[^A-Za-z0-9]/', $pw)) return 'Password needs a special character';
    if ($username !== '' && stripos($pw, $username) !== false) return 'Password must not contain the username';
    return null;
}
