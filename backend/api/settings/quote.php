<?php
// "Get in touch" + Quote request form section. GET | PUT
// Left side: heading and contact cards. Right side: form text and dropdown options.
require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/settings.php';

require_admin();
$fields = ['eyebrow', 'heading', 'description', 'email', 'phone_country_code', 'phone_number', 'origin_country',
           'chat_show', 'chat_title', 'form_title', 'form_subtitle', 'submit_label', 'disclaimer', 'success_message',
           'categories', 'delivery_terms'];
const MAX_QUOTE_OPTIONS = 12;

function quote_defaults(): array {
    return [
        'eyebrow' => 'Get in Touch',
        'heading' => 'Talk directly with our sourcing team',
        'description' => 'Whether you are an importer, wholesaler, distributor, manufacturer or procurement manager, contact WORILO, your sourcing agent in India. We reply to every serious business enquiry.',
        'email' => 'worilobusiness@gmail.com',
        'phone' => ['country_code' => '91', 'number' => '7010945812'],
        'origin_country' => 'India',
        'chat_show' => true,
        'chat_title' => 'Message us on WhatsApp',
        'form_title' => 'Quote request form',
        'form_subtitle' => 'The more detail you share, the more accurate the quotation.',
        'submit_label' => 'Submit Quote Request',
        'disclaimer' => 'Submitting your requirements does not constitute a confirmed order. Final supply arrangements depend on supplier availability and mutually agreed terms.',
        'success_message' => 'Thank you! Your quote request has been received. Our sourcing team will reply shortly.',
        'categories' => ['Agricultural Products', 'Industrial Chemicals', 'Automotive Components', 'Other'],
        'delivery_terms' => ['FOB', 'CIF', 'CFR', 'EXW', 'Other'],
    ];
}

function quote_out(array $d): array {
    if ($d['heading'] === '') return quote_defaults();
    return [
        'eyebrow' => $d['eyebrow'],
        'heading' => $d['heading'],
        'description' => $d['description'],
        'email' => $d['email'],
        'phone' => ['country_code' => $d['phone_country_code'] ?: '91', 'number' => $d['phone_number']],
        'origin_country' => $d['origin_country'],
        'chat_show' => $d['chat_show'] === '' ? true : (bool)(int)$d['chat_show'],
        'chat_title' => $d['chat_title'],
        'form_title' => $d['form_title'],
        'form_subtitle' => $d['form_subtitle'],
        'submit_label' => $d['submit_label'],
        'disclaimer' => $d['disclaimer'],
        'success_message' => $d['success_message'],
        'categories' => json_decode($d['categories'] ?: '[]', true) ?: [],
        'delivery_terms' => json_decode($d['delivery_terms'] ?: '[]', true) ?: [],
    ];
}

// Validates a list of dropdown options (2..$max chars each, unique).
function clean_options(array $in, string $key, string $label, int $maxLen, array &$errors): array {
    $raw = is_array($in[$key] ?? null) ? array_values($in[$key]) : [];
    if (!$raw) { $errors[$key] = "Add at least one $label"; return []; }
    if (count($raw) > MAX_QUOTE_OPTIONS) { $errors[$key] = 'You can have at most ' . MAX_QUOTE_OPTIONS . " {$label}s"; return []; }
    $out = [];
    $seen = [];
    foreach ($raw as $i => $text) {
        $t = trim(preg_replace('/\s+/u', ' ', (string)$text));
        if (mb_strlen($t) < 2 || mb_strlen($t) > $maxLen) { $errors[$key] = ucfirst($label) . ' ' . ($i + 1) . " must be 2-$maxLen characters"; return []; }
        if (isset($seen[mb_strtolower($t)])) { $errors[$key] = "\"$t\" is listed twice"; return []; }
        $seen[mb_strtolower($t)] = true;
        $out[] = $t;
    }
    return $out;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['data' => quote_out(settings_get('quote', $fields))]);

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $in = json_body();
    $errors = [];

    $phone = v_phone($in, 'phone', 'Phone number', $errors, true);
    $p = is_array($in['phone'] ?? null) ? $in['phone'] : [];

    $chatShow = v_bool($in, 'chat_show');
    $clean = [
        'eyebrow' => v_text($in, 'eyebrow', 'Eyebrow text', 2, 40, $errors),
        'heading' => v_text($in, 'heading', 'Heading', 10, 100, $errors),
        'description' => v_text($in, 'description', 'Description', 20, 400, $errors),
        'email' => v_email($in, 'email', 'Business email', $errors),
        'phone_country_code' => (string)($p['country_code'] ?? ''),
        'phone_number' => trim((string)($p['number'] ?? '')),
        'origin_country' => v_text($in, 'origin_country', 'Country of origin', 2, 40, $errors),
        'chat_show' => (string)$chatShow,
        'chat_title' => v_text($in, 'chat_title', 'Chat card title', 2, 40, $errors, (bool)$chatShow),
        'form_title' => v_text($in, 'form_title', 'Form title', 3, 60, $errors),
        'form_subtitle' => v_text($in, 'form_subtitle', 'Form sub-text', 10, 150, $errors),
        'submit_label' => v_text($in, 'submit_label', 'Submit button label', 2, 40, $errors),
        'disclaimer' => v_text($in, 'disclaimer', 'Disclaimer', 20, 300, $errors),
        'success_message' => v_text($in, 'success_message', 'Success message', 10, 200, $errors),
    ];
    $categories = clean_options($in, 'categories', 'product category', 50, $errors);
    $terms = clean_options($in, 'delivery_terms', 'delivery term', 30, $errors);

    if ($errors) validation_fail($errors);

    $clean['categories'] = json_encode($categories, JSON_UNESCAPED_UNICODE);
    $clean['delivery_terms'] = json_encode($terms, JSON_UNESCAPED_UNICODE);
    settings_save('quote', $clean);
    json_out(['data' => quote_out($clean)]);
}

json_out(['error' => 'Method not allowed'], 405);
