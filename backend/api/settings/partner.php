<?php
// "Your Sourcing Partner in India" section: heading, background and reason cards. GET | PUT
// A card without an image is shown as a centred text-only card; image side alternates automatically.
require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/settings.php';

require_admin();
$fields = ['heading', 'subtext', 'background_image', 'background_alt', 'cards'];
const MAX_PARTNER_CARDS = 8;
const PARTNER_ICONS = ['tractor', 'tag', 'history', 'message', 'handshake', 'shield', 'globe', 'users', 'truck', 'award', 'leaf', 'badge-check'];

function partner_defaults(): array {
    return [
        'heading' => 'Your Sourcing Partner in India',
        'subtext' => 'Five reasons importers and procurement teams worldwide choose WORILO as their India sourcing partner and long-term reliable sourcing agent.',
        'background_image' => '/images/partner-bg.webp',
        'background_alt' => 'Container terminal with cranes and stacked shipping containers',
        'cards' => [
            ['icon' => 'tractor', 'title' => 'Direct Sourcing', 'description' => 'We connect buyers directly with Indian farmers, manufacturers and suppliers.', 'image' => '/images/partner-direct-sourcing.webp', 'image_alt' => 'Container ship at a port with mountains in the background'],
            ['icon' => 'tag', 'title' => 'Competitive Pricing', 'description' => 'We help buyers explore competitive sourcing options and transparent quotations from Indian suppliers.', 'image' => '/images/partner-competitive-pricing.webp', 'image_alt' => 'Stacks of gold coins on a desk beside a laptop'],
            ['icon' => 'history', 'title' => 'Long-Term Business Relationships', 'description' => 'We focus on building dependable business relationships between international buyers and Indian suppliers.', 'image' => '', 'image_alt' => ''],
            ['icon' => 'tractor', 'title' => 'Transparent Communication', 'description' => 'We aim to provide clear product information, pricing discussions and sourcing requirements.', 'image' => '/images/partner-transparent-communication.webp', 'image_alt' => 'Customer support executive with a headset working at a computer in a modern office'],
            ['icon' => 'tractor', 'title' => 'Supplier Coordination', 'description' => 'We facilitate communication, product enquiries and supplier coordination between buyers and Indian suppliers.', 'image' => '/images/partner-supplier-coordination.webp', 'image_alt' => 'Cargo ship loaded with containers at a port with blue cranes'],
        ],
    ];
}

function partner_out(array $d): array {
    if ($d['heading'] === '') return partner_defaults();
    $d['cards'] = json_decode($d['cards'] ?: '[]', true) ?: [];
    return $d;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['data' => partner_out(settings_get('partner', $fields))]);

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $in = json_body();
    $errors = [];

    $clean = [
        'heading' => v_text($in, 'heading', 'Heading', 5, 80, $errors),
        'subtext' => v_text($in, 'subtext', 'Sub-text', 20, 250, $errors),
        'background_image' => v_image_path($in, 'background_image', 'Background image', $errors),
        'background_alt' => v_text($in, 'background_alt', 'Background image description', 5, 180, $errors, false),
    ];

    $raw = is_array($in['cards'] ?? null) ? array_values($in['cards']) : [];
    if (count($raw) < 1) $errors['cards'] = 'Add at least one card';
    elseif (count($raw) > MAX_PARTNER_CARDS) $errors['cards'] = 'You can have at most ' . MAX_PARTNER_CARDS . ' cards';

    $cards = [];
    foreach (array_slice($raw, 0, MAX_PARTNER_CARDS) as $i => $c) {
        $c = is_array($c) ? $c : [];
        $e = [];
        $icon = (string)($c['icon'] ?? '');
        if (!in_array($icon, PARTNER_ICONS, true)) $e['icon'] = 'Choose a valid icon';
        $cards[] = [
            'icon' => $icon,
            'title' => v_text($c, 'title', 'Title', 2, 50, $e),
            'description' => v_text($c, 'description', 'Description', 10, 160, $e),
            'image' => v_image_path($c, 'image', 'Image', $e),
            'image_alt' => v_text($c, 'image_alt', 'Image description', 5, 180, $e, false),
        ];
        foreach ($e as $field => $msg) $errors["cards.$i.$field"] = $msg;
    }

    if ($errors) validation_fail($errors);

    settings_save('partner', $clean + ['cards' => json_encode($cards, JSON_UNESCAPED_UNICODE)]);
    json_out(['data' => $clean + ['cards' => $cards]]);
}

json_out(['error' => 'Method not allowed'], 405);
