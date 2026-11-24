<?php
// FAQ section: heading, intro and question/answer pairs. GET | PUT
require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/settings.php';

require_admin();
$fields = ['eyebrow', 'heading', 'description', 'items'];
const MAX_FAQS = 20;

function faq_defaults(): array {
    return [
        'eyebrow' => 'Why Source from India',
        'heading' => 'Frequently Asked Questions',
        'description' => 'Straight answers for importers, wholesalers, and procurement teams considering India as their sourcing destination.',
        'items' => [
            ['question' => 'Why source agricultural products from India?', 'answer' => 'India is one of the world’s largest producers of rice, pulses, spices and fresh produce. Sourcing agricultural products directly from Indian farmers, producers and manufacturers gives buyers access to competitive farmgate prices and a wide product range across seasons.'],
            ['question' => 'How does WORILO offer competitive farmgate pricing?', 'answer' => 'WORILO connects buyers directly with farmers, producers and suppliers, reducing unnecessary intermediaries wherever possible. Final prices depend on product grade, quantity, season, availability, logistics, processing and packaging, so we share quotations based on your specific requirements.'],
            ['question' => 'What products can I source through WORILO?', 'answer' => 'You can source agricultural products such as basmati rice, spices, grains, pulses, seeds, fruits and vegetables, industrial chemicals including fertilizers and industrial raw materials, and automotive components such as engine, transmission, brake, bearing and electrical parts. Other products can be enquired about on request.'],
            ['question' => 'Do you support small or trial orders?', 'answer' => 'Order requirements vary by product and supplier. Share your required quantity in the quote request form and we will confirm minimum order quantities and sample or trial order options with the relevant supplier.'],
            ['question' => 'Which markets do you serve?', 'answer' => 'WORILO serves buyers in the United Kingdom, Europe, the UAE, Saudi Arabia, other Gulf countries, Singapore and worldwide markets.'],
            ['question' => 'How do I get started?', 'answer' => 'Submit the quote request form or message us on WhatsApp with your product, grade, quantity, destination country or port and preferred delivery terms. We will identify suitable suppliers and coordinate quotations.'],
            ['question' => 'What does a sourcing agent in India do?', 'answer' => 'A sourcing agent in India connects international buyers with suitable farmers, producers and manufacturers, coordinates quotations and product specifications, and supports communication until the supply arrangement is agreed. WORILO does this for agricultural products, industrial chemicals and automotive components.'],
            ['question' => 'Can you help with basmati rice and spice exports from India?', 'answer' => 'Yes. Share the product, grade, quantity and destination port in the quote request form and WORILO will coordinate with suitable suppliers for basmati rice export from India, spices export from India, pulses and other agricultural products.'],
        ],
    ];
}

function faq_out(array $d): array {
    if ($d['heading'] === '') return faq_defaults();
    $d['items'] = json_decode($d['items'] ?: '[]', true) ?: [];
    return $d;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['data' => faq_out(settings_get('faq', $fields))]);

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $in = json_body();
    $errors = [];

    $clean = [
        'eyebrow' => v_text($in, 'eyebrow', 'Eyebrow text', 2, 40, $errors),
        'heading' => v_text($in, 'heading', 'Heading', 5, 100, $errors),
        'description' => v_text($in, 'description', 'Description', 20, 250, $errors),
    ];

    $raw = is_array($in['items'] ?? null) ? array_values($in['items']) : [];
    if (count($raw) < 1) $errors['items'] = 'Add at least one question';
    elseif (count($raw) > MAX_FAQS) $errors['items'] = 'You can have at most ' . MAX_FAQS . ' questions';

    $items = [];
    $seen = [];
    foreach (array_slice($raw, 0, MAX_FAQS) as $i => $q) {
        $q = is_array($q) ? $q : [];
        $e = [];
        $question = v_text($q, 'question', 'Question', 5, 150, $e);
        $answer = v_text($q, 'answer', 'Answer', 10, 800, $e);
        if ($question !== '' && !isset($e['question'])) {
            $k = mb_strtolower($question);
            if (isset($seen[$k])) $e['question'] = 'This question is already listed';
            $seen[$k] = true;
        }
        $items[] = ['question' => $question, 'answer' => $answer];
        foreach ($e as $field => $msg) $errors["items.$i.$field"] = $msg;
    }

    if ($errors) validation_fail($errors);

    settings_save('faq', $clean + ['items' => json_encode($items, JSON_UNESCAPED_UNICODE)]);
    json_out(['data' => $clean + ['items' => $items]]);
}

json_out(['error' => 'Method not allowed'], 405);
