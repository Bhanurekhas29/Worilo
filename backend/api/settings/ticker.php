<?php
// Scrolling ticker (right-to-left marquee). GET | PUT
// speed: 1 (very slow) .. 5 (very fast). The website maps it to seconds per item.
require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/settings.php';

require_admin();
$fields = ['items', 'speed', 'pause_on_hover', 'show'];
const MAX_TICKER_ITEMS = 30;

function ticker_defaults(): array {
    return [
        'items' => ['Basmati Rice', 'Turmeric', 'Black Pepper', 'Cardamom', 'Cumin', 'Coriander', 'Onions', 'Coconuts', 'Pulses & Lentils'],
        'speed' => 3,
        'pause_on_hover' => true,
        'show' => true,
    ];
}

function ticker_out(array $d): array {
    if ($d['items'] === '' && $d['show'] === '') return ticker_defaults();
    return [
        'items' => json_decode($d['items'] ?: '[]', true) ?: [],
        'speed' => max(1, min(5, (int)($d['speed'] ?: 3))),
        'pause_on_hover' => $d['pause_on_hover'] === '' ? true : (bool)(int)$d['pause_on_hover'],
        'show' => $d['show'] === '' ? true : (bool)(int)$d['show'],
    ];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['data' => ticker_out(settings_get('ticker', $fields))]);

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $in = json_body();
    $errors = [];

    $items = [];
    $seen = [];
    $raw = $in['items'] ?? [];
    if (!is_array($raw)) $raw = [];
    foreach (array_values($raw) as $i => $text) {
        $n = $i + 1;
        $t = trim(preg_replace('/\s+/u', ' ', (string)$text));
        if (mb_strlen($t) < 2 || mb_strlen($t) > 40) {
            $errors['items'] = "Item $n must be 2-40 characters";
            break;
        }
        $k = mb_strtolower($t);
        if (isset($seen[$k])) {
            $errors['items'] = "\"$t\" is listed twice";
            break;
        }
        $seen[$k] = true;
        $items[] = $t;
    }
    if (!isset($errors['items'])) {
        if (count($items) > MAX_TICKER_ITEMS) $errors['items'] = 'You can have at most ' . MAX_TICKER_ITEMS . ' items';
        elseif (!$items) $errors['items'] = 'Add at least one item';
    }

    $speed = (int)($in['speed'] ?? 0);
    if ($speed < 1 || $speed > 5) $errors['speed'] = 'Choose a speed from 1 to 5';

    if ($errors) validation_fail($errors);

    $clean = [
        'items' => json_encode($items, JSON_UNESCAPED_UNICODE),
        'speed' => (string)$speed,
        'pause_on_hover' => (string)v_bool($in, 'pause_on_hover'),
        'show' => (string)v_bool($in, 'show'),
    ];
    settings_save('ticker', $clean);
    json_out(['data' => ticker_out($clean)]);
}

json_out(['error' => 'Method not allowed'], 405);
