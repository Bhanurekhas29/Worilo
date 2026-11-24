<?php
// Navbar call-to-action button ("Request a Quote"). GET | PUT
require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/settings.php';

require_admin();
$fields = ['label', 'url', 'show'];

function cta_out(array $d): array {
    return [
        'label' => $d['label'] === '' ? 'Request a Quote' : $d['label'],
        'url' => $d['url'] === '' ? '#contact' : $d['url'],
        'show' => $d['show'] === '' ? true : (bool)(int)$d['show'],
    ];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['data' => cta_out(settings_get('cta', $fields))]);

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $in = json_body();
    $errors = [];
    $clean = [
        'label' => v_text($in, 'label', 'Button label', 2, 30, $errors),
        'url' => v_link($in, 'url', 'Button link', $errors),
        'show' => v_bool($in, 'show'),
    ];
    if ($errors) validation_fail($errors);
    settings_save('cta', $clean);
    json_out(['data' => cta_out(array_map('strval', $clean))]);
}

json_out(['error' => 'Method not allowed'], 405);
