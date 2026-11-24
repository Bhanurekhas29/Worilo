<?php
// POST { ids: [3, 1, 2] } -> saves the new menu order.
require_once __DIR__ . '/../../includes/bootstrap.php';

require_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['error' => 'Method not allowed'], 405);

$ids = array_map('intval', (array)(json_body()['ids'] ?? []));
$existing = db()->query('SELECT id FROM menu_items')->fetchAll(PDO::FETCH_COLUMN);
sort($existing);
$check = $ids;
sort($check);
if ($check !== array_map('intval', $existing)) json_out(['error' => 'Invalid menu order'], 422);

$st = db()->prepare('UPDATE menu_items SET sort_order = ? WHERE id = ?');
foreach ($ids as $i => $id) $st->execute([$i + 1, $id]);
log_activity('content', 'Reordered the navigation menu');
json_out(['ok' => true]);
