<?php
// SEO settings. GET | PUT
require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/settings.php';

require_admin();
$fields = ['meta_title', 'meta_description', 'primary_keywords', 'secondary_keywords'];

// Normalises "a, b ,, A" into "a, b" and validates count / length.
function clean_keywords(array $in, string $key, string $label, int $maxCount, array &$errors, bool $required): string {
    $raw = (string)($in[$key] ?? '');
    $seen = [];
    foreach (preg_split('/[,\n]+/', $raw) as $kw) {
        $kw = trim(preg_replace('/\s+/u', ' ', $kw));
        if ($kw === '') continue;
        $seen[mb_strtolower($kw)] ??= $kw;
    }
    $list = array_values($seen);
    if (!$list) {
        if ($required) $errors[$key] = "$label is required";
        return '';
    }
    if (count($list) > $maxCount) $errors[$key] = "$label can have at most $maxCount keywords";
    foreach ($list as $kw) {
        if (mb_strlen($kw) < 2 || mb_strlen($kw) > 60) {
            $errors[$key] = "Each keyword in $label must be 2-60 characters";
            break;
        }
    }
    return implode(', ', $list);
}

function seo_out(array $d): array {
    // Nothing saved yet -> use the SEO document's title and description. Keywords stay blank until supplied.
    if ($d['meta_title'] === '' && $d['meta_description'] === '') {
        $d['meta_title'] = 'India Sourcing Agent | Agri, Chemicals & Auto Parts | WORILO';
        $d['meta_description'] = 'WORILO is a sourcing agent in India connecting global buyers with farmers and suppliers for agri products, industrial chemicals and automotive components.';
    }
    return $d;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['data' => seo_out(settings_get('seo', $fields))]);

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $in = json_body();
    $errors = [];
    $clean = [
        'meta_title' => v_text($in, 'meta_title', 'Meta title', 10, 70, $errors),
        'meta_description' => v_text($in, 'meta_description', 'Meta description', 50, 160, $errors),
        'primary_keywords' => clean_keywords($in, 'primary_keywords', 'Primary keywords', 10, $errors, true),
        'secondary_keywords' => clean_keywords($in, 'secondary_keywords', 'Secondary keywords', 30, $errors, false),
    ];
    if ($errors) validation_fail($errors);
    settings_save('seo', $clean);
    json_out(['data' => $clean]);
}

json_out(['error' => 'Method not allowed'], 405);
