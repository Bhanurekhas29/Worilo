<?php
// "Global Markets" section: heading, intro, market chips, button and map image. GET | PUT
require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/settings.php';

require_admin();
$fields = ['eyebrow', 'heading', 'description', 'markets', 'button_label', 'button_url', 'image', 'image_alt'];
const MAX_MARKETS = 12;

function markets_defaults(): array {
    return [
        'eyebrow' => 'Global Markets',
        'heading' => 'Connecting India with the World',
        'description' => 'WORILO connects the world with Indian producers through competitive farmgate sourcing and international sourcing from India, serving importers and buyers across the United Kingdom, Europe, the UAE, Saudi Arabia, other Gulf countries, Singapore and worldwide markets.',
        'markets' => [
            ['name' => 'United Kingdom', 'tooltip' => 'Indian suppliers and sourcing agent for UK buyers'],
            ['name' => 'Europe', 'tooltip' => 'Source products from India for European importers'],
            ['name' => 'United Arab Emirates', 'tooltip' => 'India sourcing agent for UAE buyers'],
            ['name' => 'Saudi Arabia', 'tooltip' => 'Indian suppliers for Saudi Arabia buyers'],
            ['name' => 'Singapore', 'tooltip' => 'Source products from India for Singapore buyers'],
            ['name' => 'Worldwide Markets', 'tooltip' => 'Indian suppliers for international buyers worldwide'],
        ],
        'button_label' => 'Explore Global Markets',
        'button_url' => '#contact',
        'image' => '/images/global-map.webp',
        'image_alt' => 'World map with glowing trade routes connecting India to the UK, Europe, the Middle East, Africa and Asia',
    ];
}

function markets_out(array $d): array {
    if ($d['heading'] === '') return markets_defaults();
    $list = json_decode($d['markets'] ?: '[]', true) ?: [];
    // Older saves stored plain strings; always return {name, tooltip}.
    $d['markets'] = array_map(fn($m) => is_array($m)
        ? ['name' => (string)($m['name'] ?? ''), 'tooltip' => (string)($m['tooltip'] ?? '')]
        : ['name' => (string)$m, 'tooltip' => ''], $list);
    return $d;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['data' => markets_out(settings_get('markets', $fields))]);

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $in = json_body();
    $errors = [];

    $clean = [
        'eyebrow' => v_text($in, 'eyebrow', 'Eyebrow text', 2, 40, $errors),
        'heading' => v_text($in, 'heading', 'Heading', 10, 100, $errors),
        'description' => v_text($in, 'description', 'Description', 20, 400, $errors),
        'image' => v_image_path($in, 'image', 'Map image', $errors),
        'image_alt' => v_text($in, 'image_alt', 'Map image description', 5, 180, $errors, false),
    ];

    // Button is optional, but label and link go together.
    if (trim((string)($in['button_label'] ?? '')) !== '' || trim((string)($in['button_url'] ?? '')) !== '') {
        $clean['button_label'] = v_text($in, 'button_label', 'Button label', 2, 40, $errors);
        $clean['button_url'] = v_link($in, 'button_url', 'Button link', $errors);
    } else {
        $clean['button_label'] = '';
        $clean['button_url'] = '';
    }

    $markets = [];
    $seen = [];
    $raw = is_array($in['markets'] ?? null) ? array_values($in['markets']) : [];
    if (!$raw) $errors['markets'] = 'Add at least one market';
    elseif (count($raw) > MAX_MARKETS) $errors['markets'] = 'You can have at most ' . MAX_MARKETS . ' markets';
    else {
        foreach ($raw as $i => $m) {
            $name = is_array($m) ? (string)($m['name'] ?? '') : (string)$m;
            $tip = is_array($m) ? (string)($m['tooltip'] ?? '') : '';
            $t = trim(preg_replace('/\s+/u', ' ', $name));
            $tip = trim(preg_replace('/\s+/u', ' ', $tip));
            if (mb_strlen($t) < 2 || mb_strlen($t) > 40) { $errors['markets'] = 'Market ' . ($i + 1) . ' must be 2-40 characters'; break; }
            if ($tip !== '' && mb_strlen($tip) > 100) { $errors['markets'] = 'Tooltip for "' . $t . '" must be at most 100 characters'; break; }
            if (isset($seen[mb_strtolower($t)])) { $errors['markets'] = "\"$t\" is listed twice"; break; }
            $seen[mb_strtolower($t)] = true;
            $markets[] = ['name' => $t, 'tooltip' => $tip];
        }
    }

    if ($errors) validation_fail($errors);

    settings_save('markets', $clean + ['markets' => json_encode($markets, JSON_UNESCAPED_UNICODE)]);
    json_out(['data' => $clean + ['markets' => $markets]]);
}

json_out(['error' => 'Method not allowed'], 405);
