<?php
// Public, read-only content for the website. GET /api/public/site
// Re-uses the admin settings endpoints (so defaults live in one place) by running each of them
// in capture mode, then keeps only what visitors may see.
define('CAPTURE_JSON', true);
require_once __DIR__ . '/../../includes/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_out(['error' => 'Method not allowed'], 405);

$_SERVER['REQUEST_METHOD'] = 'GET';
$groups = ['brand', 'seo', 'cta', 'hero', 'ticker', 'products', 'farmgate', 'partner', 'process', 'markets', 'faq', 'quote', 'footer', 'floating', 'credits'];
$site = [];

foreach ($groups as $g) {
    try {
        include __DIR__ . "/../settings/$g.php";
    } catch (JsonCaptured $c) {
        $site[$g] = $c->data['data'] ?? null;
    }
}

// Navbar menu: visible items only.
try {
    include __DIR__ . '/../menu/index.php';
} catch (JsonCaptured $c) {
    $site['menu'] = array_values(array_filter($c->data['items'] ?? [], fn($i) => $i['is_active']));
}

// Hidden product categories stay hidden.
if (isset($site['products']['categories'])) {
    $site['products']['categories'] = array_values(array_filter($site['products']['categories'], fn($c) => !empty($c['is_active'])));
}

header_remove('Content-Type');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=30');
http_response_code(200);
echo json_encode($site, JSON_UNESCAPED_UNICODE);
