<?php
// Audit trail for the dashboard's "Recent activities". Never lets logging break a request.
//   type: login | content | user | enquiry | account | security
function log_activity(string $type, string $text, ?array $actor = null): void {
    try {
        $a = $actor ?? ($GLOBALS['current_admin'] ?? null);
        $id = isset($a['id']) && $a['id'] ? (int)$a['id'] : null;
        $name = $a['name'] ?? ($a['username'] ?? 'System');
        $text = mb_substr($text, 0, 250);

        // Skip an identical entry by the same person within the last minute (e.g. repeated saves)
        $st = db()->prepare('SELECT 1 FROM activity_log WHERE type = ? AND description = ? AND (admin_id <=> ?) AND created_at > (NOW() - INTERVAL 60 SECOND) LIMIT 1');
        $st->execute([$type, $text, $id]);
        if ($st->fetchColumn()) return;

        db()->prepare('INSERT INTO activity_log (admin_id, admin_name, type, description) VALUES (?, ?, ?, ?)')
            ->execute([$id, mb_substr((string)$name, 0, 80), $type, $text]);

        if (random_int(1, 50) === 1) {
            db()->exec('DELETE FROM activity_log WHERE created_at < (NOW() - INTERVAL 90 DAY)');
        }
    } catch (Throwable $e) {
        // ignore: the activity log is a convenience, not a requirement
    }
}

// Friendly names for settings groups.
function settings_group_label(string $group): string {
    return [
        'brand' => 'Brand', 'seo' => 'SEO', 'email' => 'Email Settings', 'credits' => 'Credits', 'cta' => 'the CTA button',
        'hero' => 'Hero Section', 'ticker' => 'Scrolling Ticker', 'products' => 'Our Products', 'farmgate' => 'Farmgate Sourcing',
        'partner' => 'Sourcing Partner', 'process' => 'How It Works', 'markets' => 'Global Markets', 'faq' => 'FAQs',
        'quote' => 'Quote Form', 'footer' => 'Footer', 'floating' => 'Floating Icons',
    ][$group] ?? ucfirst($group);
}
