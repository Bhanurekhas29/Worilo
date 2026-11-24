<?php
// "Agricultural Products" page (/agricultural-products): banner, intro and a grid of category cards. GET | PUT
// Card links are admin-controlled (page path, #anchor or full URL).
require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/settings.php';

require_admin();
$fields = ['seo_title', 'seo_description', 'eyebrow', 'heading', 'intro', 'banner_image', 'banner_alt', 'cards'];
const MAX_AGRI_CARDS = 16;
const AGRI_ICONS = ['wheat', 'sprout', 'bean', 'leaf', 'flame', 'droplet', 'apple', 'flask', 'nut', 'package'];

function agripage_defaults(): array {
    $card = fn($title, $icon, $image, $alt) => ['title' => $title, 'icon' => $icon, 'image' => $image, 'image_alt' => $alt, 'url' => '/#contact'];
    return [
        'seo_title' => 'Agricultural Products from India | Rice, Spices, Pulses | WORILO',
        'seo_description' => 'Source rice, grains, pulses, seeds, spices, oils, fruits and vegetables directly from Indian farmers and suppliers with WORILO, your India sourcing agent.',
        'eyebrow' => 'Agricultural Products',
        'heading' => 'Agricultural Products from India',
        'intro' => 'We source a wide range of agricultural products from India directly from farmers and producers, at competitive farmgate prices.',
        'banner_image' => '/images/agricultural-harvest.webp',
        'banner_alt' => 'Burlap sacks of grains, pulses and seeds with wheat ears, cotton and fresh vegetables in front of a green field',
        'cards' => [
            $card('Rice', 'wheat', '/images/rice.webp', 'Sack and heap of white rice grains with green rice plants'),
            $card('Grains & Cereals', 'sprout', '/images/grains-cereals.webp', 'Wooden bowls of assorted grains and cereals in burlap sacks'),
            $card('Pulses', 'bean', '/images/pulses.webp', 'Burlap sacks filled with different pulses and lentils'),
            $card('Seeds', 'leaf', '/images/seeds.webp', 'Wooden bowls of black, green and brown seeds'),
            $card('Spices', 'flame', '/images/spices.webp', 'Bowls of turmeric, chilli powder and whole spices'),
            $card('Oils', 'droplet', '/images/oils.webp', 'Bottles of golden cooking oil beside sunflowers and olives'),
            $card('Fruits & Vegetables', 'apple', '/images/fruits-vegetables.webp', 'Basket of fresh fruits and vegetables including grapes, apples and peppers'),
            $card('Chemicals', 'flask', '/images/chemicals.webp', 'Laboratory glassware with blue liquid and a green seedling'),
        ],
    ];
}

function agripage_out(array $d): array {
    if ($d['heading'] === '') return agripage_defaults();
    $d['cards'] = json_decode($d['cards'] ?: '[]', true) ?: [];
    return $d;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['data' => agripage_out(settings_get('agripage', $fields))]);

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $in = json_body();
    $errors = [];

    $clean = [
        'seo_title' => v_text($in, 'seo_title', 'Page title', 10, 70, $errors),
        'seo_description' => v_text($in, 'seo_description', 'Page description', 50, 160, $errors),
        'eyebrow' => v_text($in, 'eyebrow', 'Eyebrow text', 2, 40, $errors, false),
        'heading' => v_text($in, 'heading', 'Heading', 5, 100, $errors),
        'intro' => v_text($in, 'intro', 'Intro text', 20, 300, $errors, false),
        'banner_image' => v_image_path($in, 'banner_image', 'Banner image', $errors),
        'banner_alt' => v_text($in, 'banner_alt', 'Banner description', 5, 180, $errors, false),
    ];

    $raw = is_array($in['cards'] ?? null) ? array_values($in['cards']) : [];
    if (count($raw) < 1) $errors['cards'] = 'Add at least one card';
    elseif (count($raw) > MAX_AGRI_CARDS) $errors['cards'] = 'You can have at most ' . MAX_AGRI_CARDS . ' cards';

    $cards = [];
    foreach (array_slice($raw, 0, MAX_AGRI_CARDS) as $i => $c) {
        $c = is_array($c) ? $c : [];
        $e = [];
        $icon = (string)($c['icon'] ?? '');
        if (!in_array($icon, AGRI_ICONS, true)) $e['icon'] = 'Choose a valid icon';
        $cards[] = [
            'title' => v_text($c, 'title', 'Title', 2, 40, $e),
            'icon' => $icon,
            'image' => v_image_path($c, 'image', 'Image', $e),
            'image_alt' => v_text($c, 'image_alt', 'Image description', 5, 180, $e, false),
            'url' => v_link($c, 'url', 'Card link', $e, false),
        ];
        foreach ($e as $field => $msg) $errors["cards.$i.$field"] = $msg;
    }

    if ($errors) validation_fail($errors);

    settings_save('agripage', $clean + ['cards' => json_encode($cards, JSON_UNESCAPED_UNICODE)]);
    json_out(['data' => $clean + ['cards' => $cards]]);
}

json_out(['error' => 'Method not allowed'], 405);
