<?php
// Enquiries. GET list (?page, ?per_page, ?search, ?status=all|unread) | PUT ?id= {is_read} | DELETE ?id=
require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/enquiry_query.php';

require_admin();
$method = $_SERVER['REQUEST_METHOD'];
$id = (int)($_GET['id'] ?? 0);

if ($method === 'GET') {
    [$where, $params] = enquiry_filters($_GET);
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(50, max(5, (int)($_GET['per_page'] ?? 10)));

    $st = db()->prepare("SELECT COUNT(*) FROM enquiries $where");
    $st->execute($params);
    $total = (int)$st->fetchColumn();
    $pages = max(1, (int)ceil($total / $perPage));
    $page = min($page, $pages);
    $offset = ($page - 1) * $perPage;

    $st = db()->prepare("SELECT * FROM enquiries $where ORDER BY created_at DESC, id DESC LIMIT $perPage OFFSET $offset");
    $st->execute($params);
    $items = array_map(function ($r) {
        unset($r['ip']);
        return ['id' => (int)$r['id'], 'is_read' => (bool)$r['is_read']] + $r;
    }, $st->fetchAll());
    $unread = (int)db()->query('SELECT COUNT(*) FROM enquiries WHERE is_read = 0')->fetchColumn();

    json_out(['items' => $items, 'total' => $total, 'page' => $page, 'pages' => $pages, 'unread' => $unread]);
}

if ($method === 'PUT') {
    $in = json_body();
    // PUT ?all=1 {is_read} marks every enquiry (used by the notification bell)
    if (($_GET['all'] ?? '') === '1') {
        db()->prepare('UPDATE enquiries SET is_read = ?')->execute([v_bool($in, 'is_read')]);
        json_out(['ok' => true]);
    }
    if (!$id) json_out(['error' => 'Missing id'], 400);
    db()->prepare('UPDATE enquiries SET is_read = ? WHERE id = ?')->execute([v_bool($in, 'is_read'), $id]);
    json_out(['ok' => true]);
}

if ($method === 'DELETE') {
    if (!$id) json_out(['error' => 'Missing id'], 400);
    $st = db()->prepare('SELECT name FROM enquiries WHERE id = ?');
    $st->execute([$id]);
    $who = $st->fetchColumn();
    db()->prepare('DELETE FROM enquiries WHERE id = ?')->execute([$id]);
    if ($who !== false) log_activity('enquiry', "Deleted the enquiry from $who");
    json_out(['ok' => true]);
}

json_out(['error' => 'Method not allowed'], 405);
