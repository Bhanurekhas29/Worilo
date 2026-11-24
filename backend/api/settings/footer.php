<?php
// Website footer. GET | PUT
// The logo comes from Brand, the "Contact Us" column from Quote Form, and the credits row from
// Credits, so only the remaining texts and link columns are stored here.
require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/settings.php';

require_admin();
$fields = ['tagline', 'description', 'chat_show', 'chat_label', 'columns', 'copyright', 'bottom_text'];
const MAX_FOOTER_COLUMNS = 3;
const MAX_FOOTER_LINKS = 10;

function footer_defaults(): array {
    return [
        'tagline' => 'Direct Sourcing. Better Value. Global Reach.',
        'description' => 'WORILO is a sourcing agent in India connecting international buyers directly with Indian farmers, producers, manufacturers and verified suppliers for agricultural products, industrial chemicals and automotive components, with competitive farmgate prices and fewer intermediaries.',
        'chat_show' => true,
        'chat_label' => 'Chat on WhatsApp',
        'columns' => [
            ['title' => 'Company', 'links' => [
                ['label' => 'Home', 'url' => '/'],
                ['label' => 'About Us', 'url' => '#about'],
                ['label' => 'Our Products', 'url' => '#products'],
                ['label' => 'Our Services', 'url' => '#services'],
                ['label' => 'Global Markets', 'url' => '#markets'],
                ['label' => 'Contact Us', 'url' => '#contact'],
            ]],
            ['title' => 'Our Products', 'links' => [
                ['label' => 'Agricultural Products', 'url' => '#products'],
                ['label' => 'Industrial Chemicals', 'url' => '#products'],
                ['label' => 'Automotive Components', 'url' => '#products'],
                ['label' => 'Request a Quote', 'url' => '#contact'],
            ]],
        ],
        'copyright' => 'WORILO. All rights reserved.',
        'bottom_text' => 'Direct Sourcing. Better Value. Global Reach.',
    ];
}

function footer_out(array $d): array {
    if ($d['tagline'] === '' && $d['columns'] === '') return footer_defaults();
    $d['chat_show'] = $d['chat_show'] === '' ? true : (bool)(int)$d['chat_show'];
    $d['columns'] = json_decode($d['columns'] ?: '[]', true) ?: [];
    return $d;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['data' => footer_out(settings_get('footer', $fields))]);

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $in = json_body();
    $errors = [];

    $chatShow = v_bool($in, 'chat_show');
    $clean = [
        'tagline' => v_text($in, 'tagline', 'Tagline', 5, 80, $errors),
        'description' => v_text($in, 'description', 'Description', 20, 400, $errors),
        'chat_show' => (string)$chatShow,
        'chat_label' => v_text($in, 'chat_label', 'WhatsApp button label', 2, 40, $errors, (bool)$chatShow),
        'copyright' => v_text($in, 'copyright', 'Copyright text', 3, 80, $errors),
        'bottom_text' => v_text($in, 'bottom_text', 'Bottom line text', 5, 100, $errors, false),
    ];

    $raw = is_array($in['columns'] ?? null) ? array_values($in['columns']) : [];
    if (count($raw) > MAX_FOOTER_COLUMNS) $errors['columns'] = 'You can have at most ' . MAX_FOOTER_COLUMNS . ' link columns';

    $columns = [];
    foreach (array_slice($raw, 0, MAX_FOOTER_COLUMNS) as $i => $col) {
        $col = is_array($col) ? $col : [];
        $e = [];
        $title = v_text($col, 'title', 'Column title', 2, 30, $e);
        $links = [];
        $rawLinks = is_array($col['links'] ?? null) ? array_values($col['links']) : [];
        if (!$rawLinks) $e['links'] = 'Add at least one link';
        elseif (count($rawLinks) > MAX_FOOTER_LINKS) $e['links'] = 'Use at most ' . MAX_FOOTER_LINKS . ' links per column';
        foreach (array_slice($rawLinks, 0, MAX_FOOTER_LINKS) as $j => $l) {
            $l = is_array($l) ? $l : [];
            $le = [];
            $link = ['label' => v_text($l, 'label', 'Label', 2, 40, $le), 'url' => v_link($l, 'url', 'Link', $le)];
            foreach ($le as $f => $msg) $errors["columns.$i.links.$j.$f"] = $msg;
            $links[] = $link;
        }
        foreach ($e as $f => $msg) $errors["columns.$i.$f"] = $msg;
        $columns[] = ['title' => $title, 'links' => $links];
    }

    if ($errors) validation_fail($errors);

    settings_save('footer', $clean + ['columns' => json_encode($columns, JSON_UNESCAPED_UNICODE)]);
    json_out(['data' => footer_out($clean + ['columns' => json_encode($columns, JSON_UNESCAPED_UNICODE)])]);
}

json_out(['error' => 'Method not allowed'], 405);
