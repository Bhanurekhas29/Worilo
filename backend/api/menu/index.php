<?php
// Navbar menu items. GET list | POST create | PUT ?id= update | DELETE ?id=
require_once __DIR__ . '/../../includes/bootstrap.php';

require_admin();
const MAX_MENU_ITEMS = 8;
$method = $_SERVER['REQUEST_METHOD'];
$id = (int)($_GET['id'] ?? 0);

function menu_row(array $r): array {
    return ['id' => (int)$r['id'], 'label' => $r['label'], 'url' => $r['url'], 'sort_order' => (int)$r['sort_order'], 'is_active' => (bool)$r['is_active']];
}

function find_item(int $id): array {
    $st = db()->prepare('SELECT * FROM menu_items WHERE id = ?');
    $st->execute([$id]);
    $r = $st->fetch();
    if (!$r) json_out(['error' => 'Menu item not found'], 404);
    return $r;
}

if ($method === 'GET') {
    $rows = db()->query('SELECT * FROM menu_items ORDER BY sort_order, id')->fetchAll();
    json_out(['items' => array_map('menu_row', $rows), 'max' => MAX_MENU_ITEMS]);
}

if ($method === 'POST' || $method === 'PUT') {
    $in = json_body();
    $errors = [];
    if ($method === 'PUT') {
        if (!$id) json_out(['error' => 'Missing id'], 400);
        find_item($id);
    }

    $label = v_text($in, 'label', 'Label', 2, 30, $errors);
    $url = v_link($in, 'url', 'Link', $errors);
    $active = v_bool($in, 'is_active');

    if ($label !== '' && !isset($errors['label'])) {
        $st = db()->prepare('SELECT 1 FROM menu_items WHERE label = ? AND id <> ? LIMIT 1');
        $st->execute([$label, $id]);
        if ($st->fetchColumn()) $errors['label'] = 'A menu item with this label already exists';
    }
    if ($method === 'POST' && (int)db()->query('SELECT COUNT(*) FROM menu_items')->fetchColumn() >= MAX_MENU_ITEMS) {
        json_out(['error' => 'You can have at most ' . MAX_MENU_ITEMS . ' menu items'], 422);
    }
    if ($errors) validation_fail($errors);

    if ($method === 'POST') {
        $next = (int)db()->query('SELECT COALESCE(MAX(sort_order), 0) + 1 FROM menu_items')->fetchColumn();
        db()->prepare('INSERT INTO menu_items (label, url, sort_order, is_active) VALUES (?, ?, ?, ?)')->execute([$label, $url, $next, $active]);
        log_activity('content', "Added menu item \"$label\"");
        json_out(['item' => menu_row(find_item((int)db()->lastInsertId()))], 201);
    }
    db()->prepare('UPDATE menu_items SET label = ?, url = ?, is_active = ? WHERE id = ?')->execute([$label, $url, $active, $id]);
    log_activity('content', "Updated menu item \"$label\"");
    json_out(['item' => menu_row(find_item($id))]);
}

if ($method === 'DELETE') {
    if (!$id) json_out(['error' => 'Missing id'], 400);
    $gone = find_item($id);
    db()->prepare('DELETE FROM menu_items WHERE id = ?')->execute([$id]);
    log_activity('content', "Removed menu item \"{$gone['label']}\"");
    json_out(['ok' => true]);
}

json_out(['error' => 'Method not allowed'], 405);
