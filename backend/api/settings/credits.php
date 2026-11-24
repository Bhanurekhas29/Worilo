<?php
// Footer credit: "Designed and developed by <a>Vetri IT Systems</a>". GET | PUT
// The wording is fixed; admins can toggle it and set where the link points.
require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/settings.php';

require_admin();
$fields = ['credit_url', 'show_credit'];
const CREDIT_TEXT = 'Designed and Developed by';
const CREDIT_NAME = 'Vetri IT Systems';

function credits_out(array $d): array {
    return [
        'credit_text' => CREDIT_TEXT,
        'credit_name' => CREDIT_NAME,
        'credit_url' => $d['credit_url'],
        'show_credit' => $d['show_credit'] === '' ? true : (bool)(int)$d['show_credit'],
    ];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['data' => credits_out(settings_get('credits', $fields))]);

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $in = json_body();
    $errors = [];
    $clean = [
        'credit_url' => v_url($in, 'credit_url', 'Credit link', $errors),
        'show_credit' => v_bool($in, 'show_credit'),
    ];
    if ($errors) validation_fail($errors);
    settings_save('credits', $clean);
    json_out(['data' => credits_out(array_map('strval', $clean))]);
}

json_out(['error' => 'Method not allowed'], 405);
