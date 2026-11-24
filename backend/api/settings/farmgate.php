<?php
// Farmgate Sourcing section: heading, image, feature cards, button and note. GET | PUT
// Card numbers (01, 02...) are derived from the order on the website, never stored.
require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/settings.php';

require_admin();
$fields = ['eyebrow', 'heading', 'subheading', 'description', 'image', 'image_alt', 'image_caption', 'cards', 'button_label', 'button_url', 'note'];
const MAX_FARMGATE_CARDS = 8;

function farmgate_defaults(): array {
    return [
        'eyebrow' => 'Farmgate Sourcing',
        'heading' => 'Direct Farmgate Sourcing from India',
        'subheading' => 'Better Connections. Competitive Prices. Transparent Sourcing.',
        'description' => 'WORILO works to connect international buyers with farmers, agricultural producers and suppliers across India. By reducing unnecessary intermediaries wherever possible, we help buyers explore direct sourcing from farmers, competitive farmgate prices and transparent agricultural sourcing in India.',
        'image' => '/images/farmgate-sourcing.webp',
        'image_alt' => 'Farm workers sorting freshly harvested green leafy produce into baskets',
        'image_caption' => 'Fewer intermediaries. More transparent farmgate pricing.',
        'cards' => [
            ['title' => 'Direct Producer Connections', 'description' => 'Connect with farmers, producer groups and agricultural suppliers across India where suitable.'],
            ['title' => 'Competitive Sourcing', 'description' => 'Explore farmgate price opportunities and competitive quotations based on product grade, quantity, season, availability and delivery requirements.'],
            ['title' => 'Product Specifications', 'description' => 'Coordinate product specifications, quality requirements, packaging preferences, and supplier information.'],
            ['title' => 'Export Coordination', 'description' => 'Support communication between buyers and suppliers and coordinate sourcing-related requirements for international transactions, including export coordination from India.'],
        ],
        'button_label' => 'Discuss Sourcing',
        'button_url' => '#contact',
        'note' => 'Note: Actual prices depend on availability, quality, quantity, logistics, processing, packaging, and other applicable costs.',
    ];
}

function farmgate_out(array $d): array {
    if ($d['heading'] === '') return farmgate_defaults();
    $d['cards'] = json_decode($d['cards'] ?: '[]', true) ?: [];
    return $d;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['data' => farmgate_out(settings_get('farmgate', $fields))]);

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $in = json_body();
    $errors = [];

    $clean = [
        'eyebrow' => v_text($in, 'eyebrow', 'Eyebrow text', 2, 40, $errors),
        'heading' => v_text($in, 'heading', 'Heading', 10, 100, $errors),
        'subheading' => v_text($in, 'subheading', 'Sub-heading', 5, 100, $errors),
        'description' => v_text($in, 'description', 'Description', 20, 400, $errors),
        'image' => v_image_path($in, 'image', 'Image', $errors),
        'image_alt' => v_text($in, 'image_alt', 'Image description', 5, 180, $errors, false),
        'image_caption' => v_text($in, 'image_caption', 'Image caption', 5, 120, $errors, false),
        'note' => v_text($in, 'note', 'Note', 10, 250, $errors, false),
    ];

    // Button is optional, but label and link go together.
    if (trim((string)($in['button_label'] ?? '')) !== '' || trim((string)($in['button_url'] ?? '')) !== '') {
        $clean['button_label'] = v_text($in, 'button_label', 'Button label', 2, 30, $errors);
        $clean['button_url'] = v_link($in, 'button_url', 'Button link', $errors);
    } else {
        $clean['button_label'] = '';
        $clean['button_url'] = '';
    }

    $raw = is_array($in['cards'] ?? null) ? array_values($in['cards']) : [];
    if (count($raw) < 1) $errors['cards'] = 'Add at least one card';
    elseif (count($raw) > MAX_FARMGATE_CARDS) $errors['cards'] = 'You can have at most ' . MAX_FARMGATE_CARDS . ' cards';

    $cards = [];
    foreach (array_slice($raw, 0, MAX_FARMGATE_CARDS) as $i => $c) {
        $c = is_array($c) ? $c : [];
        $e = [];
        $cards[] = [
            'title' => v_text($c, 'title', 'Title', 2, 50, $e),
            'description' => v_text($c, 'description', 'Description', 10, 200, $e),
        ];
        foreach ($e as $field => $msg) $errors["cards.$i.$field"] = $msg;
    }

    if ($errors) validation_fail($errors);

    settings_save('farmgate', $clean + ['cards' => json_encode($cards, JSON_UNESCAPED_UNICODE)]);
    json_out(['data' => $clean + ['cards' => $cards]]);
}

json_out(['error' => 'Method not allowed'], 405);
