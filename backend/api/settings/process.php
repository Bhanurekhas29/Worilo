<?php
// "How It Works" section: heading, intro, button and numbered steps. GET | PUT
// Step numbers (01, 02...) are derived from the order on the website, never stored.
require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/settings.php';

require_admin();
$fields = ['eyebrow', 'heading', 'description', 'button_label', 'button_url', 'steps'];
const MAX_PROCESS_STEPS = 8;

function process_defaults(): array {
    return [
        'eyebrow' => 'How It Works',
        'heading' => 'How Our Sourcing Process Works',
        'description' => 'Our sourcing process from India takes you from your product requirements to supplier identification, pricing and specifications, and transaction coordination. Final supply arrangements depend on supplier availability and mutually agreed terms between buyer and supplier.',
        'button_label' => 'Submit a Product Enquiry',
        'button_url' => '#contact',
        'steps' => [
            ['title' => 'Share Your Requirements', 'description' => 'The buyer submits the required product, grade, quantity, destination, and delivery terms.'],
            ['title' => 'Identify Suitable Suppliers', 'description' => 'WORILO handles supplier identification by finding potentially suitable Indian farmers, producers or manufacturers.'],
            ['title' => 'Discuss Pricing & Specifications', 'description' => 'Coordinate quotations, product specifications, samples, packaging, and other requirements.'],
            ['title' => 'Coordinate the Transaction', 'description' => 'Help coordinate the agreed sourcing and supply arrangements, including export-related requirements where applicable.'],
        ],
    ];
}

function process_out(array $d): array {
    if ($d['heading'] === '') return process_defaults();
    $d['steps'] = json_decode($d['steps'] ?: '[]', true) ?: [];
    return $d;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['data' => process_out(settings_get('process', $fields))]);

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $in = json_body();
    $errors = [];

    $clean = [
        'eyebrow' => v_text($in, 'eyebrow', 'Eyebrow text', 2, 40, $errors),
        'heading' => v_text($in, 'heading', 'Heading', 10, 100, $errors),
        'description' => v_text($in, 'description', 'Description', 20, 400, $errors),
    ];

    // Button is optional, but label and link go together.
    if (trim((string)($in['button_label'] ?? '')) !== '' || trim((string)($in['button_url'] ?? '')) !== '') {
        $clean['button_label'] = v_text($in, 'button_label', 'Button label', 2, 40, $errors);
        $clean['button_url'] = v_link($in, 'button_url', 'Button link', $errors);
    } else {
        $clean['button_label'] = '';
        $clean['button_url'] = '';
    }

    $raw = is_array($in['steps'] ?? null) ? array_values($in['steps']) : [];
    if (count($raw) < 1) $errors['steps'] = 'Add at least one step';
    elseif (count($raw) > MAX_PROCESS_STEPS) $errors['steps'] = 'You can have at most ' . MAX_PROCESS_STEPS . ' steps';

    $steps = [];
    foreach (array_slice($raw, 0, MAX_PROCESS_STEPS) as $i => $s) {
        $s = is_array($s) ? $s : [];
        $e = [];
        $steps[] = [
            'title' => v_text($s, 'title', 'Title', 2, 60, $e),
            'description' => v_text($s, 'description', 'Description', 10, 200, $e),
        ];
        foreach ($e as $field => $msg) $errors["steps.$i.$field"] = $msg;
    }

    if ($errors) validation_fail($errors);

    settings_save('process', $clean + ['steps' => json_encode($steps, JSON_UNESCAPED_UNICODE)]);
    json_out(['data' => $clean + ['steps' => $steps]]);
}

json_out(['error' => 'Method not allowed'], 405);
