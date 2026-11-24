<?php
// "Our Products" section: heading, optional intro and any number of product categories. GET | PUT
// Category numbers (01, 02...), the image side (alternating) and the "N sourcing categories"
// caption (= number of checklist items) are all derived on the website, never stored.
require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/settings.php';

require_admin();
$fields = ['heading_line1', 'heading_line2', 'subtext', 'categories'];
const MAX_CATEGORIES = 8;
const MAX_CATEGORY_ITEMS = 12;

function products_defaults(): array {
    return [
        'heading_line1' => 'Quality Products.',
        'heading_line2' => 'Global Opportunities.',
        'subtext' => 'Source agricultural products, industrial chemicals and automotive components directly from Indian farmers, manufacturers and suppliers.',
        'categories' => [
            [
                'title' => 'Agricultural Products',
                'description' => 'We source a wide range of agricultural products from India directly from farmers and producers, including vegetables, fruits, seeds, spices, grains and pulses. As an agricultural sourcing agent in India, we support enquiries for basmati rice, turmeric, black pepper, cardamom, cumin, coriander, onions, coconuts and other agri commodities at competitive farmgate prices.',
                'image' => '/images/agricultural-products.webp',
                'image_alt' => 'Sacks of rice and baskets of mung beans, onions, tomatoes, grapes and spices on a wooden table with farmers working in a field behind',
                'items' => ['Vegetables & Fruits', 'Seeds & Spices', 'Grains & Pulses', 'Other Agri Products', 'Farmgate Prices', 'Premium Quality'],
                'button_label' => 'Explore Agricultural Products',
                'button_url' => '#products',
                'is_active' => true,
            ],
            [
                'title' => 'Industrial Chemicals',
                'description' => 'WORILO helps businesses source industrial chemicals from India through supplier identification and sourcing coordination with Indian chemical suppliers and manufacturers, covering fertilizers, agricultural chemicals, industrial raw materials and selected specialty chemicals, subject to applicable regulations and supplier availability.',
                'image' => '/images/industrial-chemicals.webp',
                'image_alt' => 'Laboratory technician in a mask and safety goggles pouring liquid into glass test tubes',
                'items' => ['Industrial chemicals', 'Agricultural chemicals', 'Fertilizers', 'Industrial raw materials', 'Selected specialty chemicals'],
                'button_label' => 'Explore Chemical Products',
                'button_url' => '#products',
                'is_active' => true,
            ],
            [
                'title' => 'Automotive Components',
                'description' => 'Connecting buyers with Indian automotive component manufacturers and suppliers for business procurement of automotive parts, including engine and transmission components, brake system parts, bearings and precision parts, and electrical components.',
                'image' => '/images/automotive-components.webp',
                'image_alt' => 'Cutaway view of a vehicle transmission showing gears, clutch plates and precision components',
                'items' => ['Engine components', 'Transmission components', 'Bearings and precision parts', 'Electrical components', 'Brake system components', 'Industrial automotive parts', 'Other components upon request'],
                'button_label' => 'Explore Automotive Components',
                'button_url' => '#products',
                'is_active' => true,
            ],
        ],
    ];
}

function products_out(array $d): array {
    if ($d['categories'] === '' && $d['heading_line1'] === '') return products_defaults();
    return [
        'heading_line1' => $d['heading_line1'],
        'heading_line2' => $d['heading_line2'],
        'subtext' => $d['subtext'],
        'categories' => json_decode($d['categories'] ?: '[]', true) ?: [],
    ];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['data' => products_out(settings_get('products', $fields))]);

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $in = json_body();
    $errors = [];

    $line1 = v_text($in, 'heading_line1', 'Heading line 1', 3, 60, $errors);
    $line2 = v_text($in, 'heading_line2', 'Heading line 2', 3, 60, $errors, false);
    $subtext = v_text($in, 'subtext', 'Intro text', 20, 250, $errors, false);

    $raw = $in['categories'] ?? [];
    if (!is_array($raw)) $raw = [];
    if (count($raw) < 1) $errors['categories'] = 'Add at least one category';
    elseif (count($raw) > MAX_CATEGORIES) $errors['categories'] = 'You can have at most ' . MAX_CATEGORIES . ' categories';

    $categories = [];
    foreach (array_slice(array_values($raw), 0, MAX_CATEGORIES) as $i => $c) {
        $c = is_array($c) ? $c : [];
        $e = [];
        $cat = [
            'title' => v_text($c, 'title', 'Title', 2, 60, $e),
            'description' => v_text($c, 'description', 'Description', 20, 500, $e),
            'image' => v_image_path($c, 'image', 'Image', $e),
            'image_alt' => v_text($c, 'image_alt', 'Image description', 5, 180, $e, false),
            'button_label' => v_text($c, 'button_label', 'Button label', 2, 40, $e),
            'button_url' => v_link($c, 'button_url', 'Button link', $e),
            'is_active' => (bool)v_bool($c, 'is_active'),
        ];

        $items = [];
        $seen = [];
        $rawItems = is_array($c['items'] ?? null) ? array_values($c['items']) : [];
        if (!$rawItems) $e['items'] = 'Add at least one checklist item';
        elseif (count($rawItems) > MAX_CATEGORY_ITEMS) $e['items'] = 'Use at most ' . MAX_CATEGORY_ITEMS . ' checklist items';
        else {
            foreach ($rawItems as $k => $text) {
                $t = trim(preg_replace('/\s+/u', ' ', (string)$text));
                if (mb_strlen($t) < 2 || mb_strlen($t) > 50) { $e['items'] = 'Checklist item ' . ($k + 1) . ' must be 2-50 characters'; break; }
                if (isset($seen[mb_strtolower($t)])) { $e['items'] = "\"$t\" is listed twice"; break; }
                $seen[mb_strtolower($t)] = true;
                $items[] = $t;
            }
        }
        $cat['items'] = $items;

        foreach ($e as $field => $msg) $errors["categories.$i.$field"] = $msg;
        $categories[] = $cat;
    }

    if ($errors) validation_fail($errors);

    $clean = ['heading_line1' => $line1, 'heading_line2' => $line2, 'subtext' => $subtext, 'categories' => json_encode($categories, JSON_UNESCAPED_UNICODE)];
    settings_save('products', $clean);
    json_out(['data' => products_out($clean)]);
}

json_out(['error' => 'Method not allowed'], 405);
