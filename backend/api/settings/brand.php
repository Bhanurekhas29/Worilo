<?php
// Brand settings. GET | PUT
require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/settings.php';

require_admin();
$fields = ['company_name', 'header_logo', 'footer_logo', 'favicon'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $d = settings_get('brand', $fields);
    // Nothing saved yet -> default to the Worilo logo files that ship with the project.
    if ($d['company_name'] === '' && $d['header_logo'] === '' && $d['footer_logo'] === '' && $d['favicon'] === '') {
        $d = ['company_name' => 'WORILO', 'header_logo' => '/images/logo.png', 'footer_logo' => '/images/logo.png', 'favicon' => '/images/favicon.png'];
    }
    json_out(['data' => $d]);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $in = json_body();
    $errors = [];
    $clean = [
        'company_name' => v_text($in, 'company_name', 'Company name', 2, 100, $errors),
        'header_logo' => v_image_path($in, 'header_logo', 'Header logo', $errors),
        'footer_logo' => v_image_path($in, 'footer_logo', 'Footer logo', $errors),
        'favicon' => v_image_path($in, 'favicon', 'Favicon', $errors),
    ];
    if ($errors) validation_fail($errors);
    settings_save('brand', $clean);
    json_out(['data' => $clean]);
}

json_out(['error' => 'Method not allowed'], 405);
