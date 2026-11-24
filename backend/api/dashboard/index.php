<?php
// Dashboard overview for the signed-in admin. GET /api/dashboard
require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/settings.php';

require_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_out(['error' => 'Method not allowed'], 405);

$pdo = db();

// ---- Enquiry counts ----
$c = $pdo->query(
    "SELECT COUNT(*) AS total,
            COALESCE(SUM(is_read = 0), 0) AS unread,
            COALESCE(SUM(created_at >= CURDATE()), 0) AS today,
            COALESCE(SUM(created_at >= (NOW() - INTERVAL 7 DAY)), 0) AS last7,
            COALESCE(SUM(created_at >= (NOW() - INTERVAL 14 DAY) AND created_at < (NOW() - INTERVAL 7 DAY)), 0) AS prev7,
            COALESCE(SUM(created_at >= (NOW() - INTERVAL 30 DAY)), 0) AS last30
     FROM enquiries"
)->fetch();
$counts = array_map('intval', $c);

// % change of the last 7 days vs the 7 days before (null when there is nothing to compare with)
$trend = $counts['prev7'] > 0 ? (int)round((($counts['last7'] - $counts['prev7']) / $counts['prev7']) * 100) : null;

// ---- Enquiries per day, last 14 days (zero-filled) ----
$rows = $pdo->query(
    "SELECT DATE(created_at) AS d, COUNT(*) AS n FROM enquiries
     WHERE created_at >= (CURDATE() - INTERVAL 13 DAY) GROUP BY DATE(created_at)"
)->fetchAll(PDO::FETCH_KEY_PAIR);
$daily = [];
for ($i = 13; $i >= 0; $i--) {
    $d = date('Y-m-d', strtotime("-$i day"));
    $daily[] = ['date' => $d, 'count' => (int)($rows[$d] ?? 0)];
}

// ---- By category / top destinations ----
$byCategory = array_map(
    fn($r) => ['label' => $r['label'], 'count' => (int)$r['n']],
    $pdo->query("SELECT COALESCE(NULLIF(category, ''), 'Other') AS label, COUNT(*) AS n FROM enquiries GROUP BY label ORDER BY n DESC LIMIT 6")->fetchAll()
);
$destinations = array_map(
    fn($r) => ['label' => $r['country'], 'count' => (int)$r['n']],
    $pdo->query("SELECT country, COUNT(*) AS n FROM enquiries WHERE country IS NOT NULL AND country <> '' GROUP BY country ORDER BY n DESC, country LIMIT 5")->fetchAll()
);

// ---- Recent activities ----
$activities = array_map(
    fn($r) => ['id' => (int)$r['id'], 'actor' => $r['admin_name'], 'type' => $r['type'], 'text' => $r['description'], 'created_at' => $r['created_at']],
    $pdo->query('SELECT id, admin_name, type, description, created_at FROM activity_log ORDER BY id DESC LIMIT 6')->fetchAll()
);

// ---- Admins ----
$a = $pdo->query('SELECT COUNT(*) AS total, COALESCE(SUM(is_active), 0) AS active FROM admins')->fetch();

// ---- Setup checklist: which settings groups have been reviewed and saved ----
$savedGroups = $pdo->query("SELECT DISTINCT SUBSTRING_INDEX(setting_key, '_', 1) FROM settings")->fetchAll(PDO::FETCH_COLUMN);
$saved = fn(string $g) => in_array($g, $savedGroups, true);
$email = settings_get('email', ['smtp_host', 'smtp_password']);

$checklist = [
    ['key' => 'brand',  'label' => 'Review your brand name, logos and favicon',    'done' => $saved('brand'),  'to' => '/admin/brand'],
    ['key' => 'seo',    'label' => 'Add SEO title, description and keywords',      'done' => $saved('seo'),    'to' => '/admin/seo'],
    ['key' => 'email',  'label' => 'Set up email (SMTP) for enquiry notifications', 'done' => $email['smtp_host'] !== '' && $email['smtp_password'] !== '', 'to' => '/admin/email-settings'],
    ['key' => 'quote',  'label' => 'Check contact details and the quote form',     'done' => $saved('quote'),  'to' => '/admin/quote-form'],
    ['key' => 'footer', 'label' => 'Review the footer and credits',                'done' => $saved('footer'), 'to' => '/admin/footer'],
];

json_out([
    'counts' => $counts + ['trend' => $trend],
    'daily' => $daily,
    'by_category' => $byCategory,
    'destinations' => $destinations,
    'activities' => $activities,
    'admins' => ['total' => (int)$a['total'], 'active' => (int)$a['active']],
    'checklist' => $checklist,
    'sections_total' => 12,
    'sections_saved' => count(array_intersect($savedGroups, ['hero', 'ticker', 'products', 'farmgate', 'partner', 'process', 'markets', 'faq', 'quote', 'footer', 'brand', 'seo'])),
]);
