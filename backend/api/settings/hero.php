<?php
// Home page hero section. GET | PUT
require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/settings.php';

require_admin();
$fields = ['eyebrow', 'heading', 'subheading', 'description', 'primary_label', 'primary_url',
           'secondary_label', 'secondary_url', 'background_image', 'image_alt', 'highlights'];
const HERO_ICONS = ['badge-check', 'tag', 'globe', 'truck', 'shield', 'award', 'users', 'leaf'];
const MAX_HIGHLIGHTS = 4;

function hero_defaults(): array {
    return [
        'eyebrow' => 'Direct Sourcing from India',
        'heading' => "Connecting India's Producers to Global Markets.",
        'subheading' => 'India Sourcing Agent for Agricultural Products, Industrial Chemicals & Automotive Components',
        'description' => 'WORILO is a sourcing agent in India that connects international buyers with Indian farmers, producers, manufacturers and verified suppliers. We facilitate direct agricultural sourcing from India, competitive farmgate pricing, transparent communication and reliable supplier coordination for importers, wholesalers and procurement teams worldwide.',
        'primary_label' => 'Explore Our Products',
        'primary_url' => '#products',
        'secondary_label' => 'Partner With Us',
        'secondary_url' => '#contact',
        'background_image' => '/images/hero-bg.webp',
        'image_alt' => 'Container ship with tugboats leaving an Indian port loaded with export cargo',
        'highlights' => [
            ['icon' => 'badge-check', 'text' => 'India-Based Sourcing'],
            ['icon' => 'tag', 'text' => 'Competitive Farmgate Pricing'],
            ['icon' => 'globe', 'text' => 'Worldwide Buyer Connections'],
        ],
    ];
}

function hero_out(array $d): array {
    // Nothing saved yet -> pre-fill with the design's default content.
    if ($d['heading'] === '') return hero_defaults();
    $d['highlights'] = json_decode($d['highlights'] ?: '[]', true) ?: [];
    return $d;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['data' => hero_out(settings_get('hero', $fields))]);

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $in = json_body();
    $errors = [];

    $clean = [
        'eyebrow' => v_text($in, 'eyebrow', 'Eyebrow text', 2, 60, $errors),
        'heading' => v_text($in, 'heading', 'Heading', 10, 120, $errors),
        'subheading' => v_text($in, 'subheading', 'Sub-heading', 5, 120, $errors),
        'description' => v_text($in, 'description', 'Description', 20, 400, $errors),
        'primary_label' => v_text($in, 'primary_label', 'Primary button label', 2, 30, $errors),
        'primary_url' => v_link($in, 'primary_url', 'Primary button link', $errors),
        'background_image' => v_image_path($in, 'background_image', 'Background image', $errors),
        'image_alt' => v_text($in, 'image_alt', 'Image description', 5, 180, $errors, false),
    ];

    // Secondary button is optional, but label and link go together.
    $secLabel = trim((string)($in['secondary_label'] ?? ''));
    $secUrl = trim((string)($in['secondary_url'] ?? ''));
    if ($secLabel !== '' || $secUrl !== '') {
        $clean['secondary_label'] = v_text($in, 'secondary_label', 'Secondary button label', 2, 30, $errors);
        $clean['secondary_url'] = v_link($in, 'secondary_url', 'Secondary button link', $errors);
    } else {
        $clean['secondary_label'] = '';
        $clean['secondary_url'] = '';
    }

    $highlights = [];
    $raw = $in['highlights'] ?? [];
    if (!is_array($raw) || count($raw) > MAX_HIGHLIGHTS) {
        $errors['highlights'] = 'You can have at most ' . MAX_HIGHLIGHTS . ' highlights';
    } else {
        foreach (array_values($raw) as $i => $h) {
            $n = $i + 1;
            $text = trim(preg_replace('/\s+/u', ' ', (string)($h['text'] ?? '')));
            $icon = (string)($h['icon'] ?? '');
            if (mb_strlen($text) < 2 || mb_strlen($text) > 40) {
                $errors['highlights'] = "Highlight $n: text must be 2-40 characters";
                break;
            }
            if (!in_array($icon, HERO_ICONS, true)) {
                $errors['highlights'] = "Highlight $n: choose a valid icon";
                break;
            }
            $highlights[] = ['icon' => $icon, 'text' => $text];
        }
    }

    if ($errors) validation_fail($errors);

    settings_save('hero', $clean + ['highlights' => json_encode($highlights)]);
    json_out(['data' => $clean + ['highlights' => $highlights]]);
}

json_out(['error' => 'Method not allowed'], 405);
