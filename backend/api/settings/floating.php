<?php
// Floating contact icons (WhatsApp, phone, email) shown on every page. GET | PUT
require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/settings.php';

require_admin();
$fields = ['side', 'whatsapp_show', 'whatsapp_code', 'whatsapp_number', 'whatsapp_message',
           'phone_show', 'phone_code', 'phone_number', 'email_show', 'email_address'];

function floating_defaults(): array {
    return [
        'side' => 'right',
        'whatsapp' => ['show' => true, 'phone' => ['country_code' => '91', 'number' => '7010945812'], 'message' => 'Hello WORILO, I would like to make a sourcing enquiry.'],
        'phone' => ['show' => true, 'phone' => ['country_code' => '91', 'number' => '7010945812']],
        'email' => ['show' => true, 'address' => 'worilobusiness@gmail.com'],
    ];
}

function floating_out(array $d): array {
    if ($d['side'] === '' && $d['whatsapp_number'] === '' && $d['email_address'] === '') return floating_defaults();
    $on = fn($v) => $v === '' ? true : (bool)(int)$v;
    return [
        'side' => $d['side'] ?: 'right',
        'whatsapp' => ['show' => $on($d['whatsapp_show']), 'phone' => ['country_code' => $d['whatsapp_code'] ?: '91', 'number' => $d['whatsapp_number']], 'message' => $d['whatsapp_message']],
        'phone' => ['show' => $on($d['phone_show']), 'phone' => ['country_code' => $d['phone_code'] ?: '91', 'number' => $d['phone_number']]],
        'email' => ['show' => $on($d['email_show']), 'address' => $d['email_address']],
    ];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['data' => floating_out(settings_get('floating', $fields))]);

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $in = json_body();
    $errors = [];

    $side = (string)($in['side'] ?? '');
    if (!in_array($side, ['left', 'right'], true)) $errors['side'] = 'Choose left or right';

    $wa = is_array($in['whatsapp'] ?? null) ? $in['whatsapp'] : [];
    $ph = is_array($in['phone'] ?? null) ? $in['phone'] : [];
    $em = is_array($in['email'] ?? null) ? $in['email'] : [];
    $waOn = v_bool($wa, 'show');
    $phOn = v_bool($ph, 'show');
    $emOn = v_bool($em, 'show');

    // Icons that are switched off keep whatever was typed but are not required.
    $e = [];
    v_phone($wa, 'phone', 'WhatsApp number', $e, (bool)$waOn);
    if (isset($e['phone'])) $errors['whatsapp.phone'] = $e['phone'];
    $message = v_text($wa, 'message', 'Pre-filled message', 5, 200, $e, false);
    if (isset($e['message'])) $errors['whatsapp.message'] = $e['message'];

    $e = [];
    v_phone($ph, 'phone', 'Phone number', $e, (bool)$phOn);
    if (isset($e['phone'])) $errors['phone.phone'] = $e['phone'];

    $e = [];
    $address = v_email($em, 'address', 'Email address', $e, (bool)$emOn);
    if (isset($e['address'])) $errors['email.address'] = $e['address'];

    if ($errors) validation_fail($errors);

    $wp = is_array($wa['phone'] ?? null) ? $wa['phone'] : [];
    $pp = is_array($ph['phone'] ?? null) ? $ph['phone'] : [];
    $clean = [
        'side' => $side,
        'whatsapp_show' => (string)$waOn,
        'whatsapp_code' => (string)($wp['country_code'] ?? ''),
        'whatsapp_number' => trim((string)($wp['number'] ?? '')),
        'whatsapp_message' => $message,
        'phone_show' => (string)$phOn,
        'phone_code' => (string)($pp['country_code'] ?? ''),
        'phone_number' => trim((string)($pp['number'] ?? '')),
        'email_show' => (string)$emOn,
        'email_address' => $address,
    ];
    settings_save('floating', $clean);
    json_out(['data' => floating_out($clean)]);
}

json_out(['error' => 'Method not allowed'], 405);
