<?php
// Builds the WHERE clause shared by the enquiries list and the Excel export.
function enquiry_filters(array $q): array {
    $where = [];
    $params = [];

    $search = trim((string)($q['search'] ?? ''));
    if ($search !== '') {
        $like = '%' . addcslashes($search, '%_\\') . '%';
        $cols = ['name', 'email', 'phone', 'company', 'country', 'product', 'message'];
        $parts = [];
        foreach ($cols as $i => $c) {
            $parts[] = "$c LIKE :s$i";
            $params["s$i"] = $like;
        }
        $where[] = '(' . implode(' OR ', $parts) . ')';
    }
    if (($q['status'] ?? 'all') === 'unread') $where[] = 'is_read = 0';

    return [$where ? 'WHERE ' . implode(' AND ', $where) : '', $params];
}
