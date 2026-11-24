<?php
// Downloads the (optionally filtered) enquiries as an Excel .xlsx file.
require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/enquiry_query.php';
require_once __DIR__ . '/../../includes/xlsx.php';

require_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_out(['error' => 'Method not allowed'], 405);

[$where, $params] = enquiry_filters($_GET);
$st = db()->prepare("SELECT id, name, email, phone, company, category, product, quantity, country, delivery_terms, message, is_read, created_at FROM enquiries $where ORDER BY created_at DESC, id DESC");
$st->execute($params);

$rows = [];
foreach ($st->fetchAll() as $r) {
    $rows[] = [$r['id'], $r['name'], $r['email'], $r['phone'], $r['company'], $r['category'], $r['product'], $r['quantity'], $r['country'], $r['delivery_terms'], $r['message'], $r['is_read'] ? 'Read' : 'Unread', $r['created_at']];
}

log_activity('enquiry', 'Exported ' . count($rows) . ' enquir' . (count($rows) === 1 ? 'y' : 'ies') . ' to Excel');
xlsx_download(
    'worilo-enquiries-' . date('Y-m-d') . '.xlsx',
    'Enquiries',
    ['ID', 'Name', 'Email', 'Phone', 'Company', 'Category', 'Products of interest', 'Quantity', 'Destination', 'Delivery terms', 'Notes', 'Status', 'Received'],
    $rows,
    [6, 22, 30, 18, 26, 22, 26, 18, 24, 14, 60, 10, 20]
);
