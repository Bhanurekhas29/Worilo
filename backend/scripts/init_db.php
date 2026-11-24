<?php
// Creates the database and tables from database/schema.sql on any MySQL/TiDB server.
// Usage (password comes from the DB_PASS env var, never from a file):
//   DB_HOST=... DB_PORT=4000 DB_USER=... DB_PASS=... DB_SSL=1 php scripts/init_db.php
if (PHP_SAPI !== 'cli') { http_response_code(403); exit; }
$c = require __DIR__ . '/../config/config.php';
$dsn = "mysql:host={$c['db_host']};port={$c['db_port']};charset=utf8mb4";
$opts = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION];
if ($c['db_ssl']) {
    $opts[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
    $ca = getenv('DB_CA') ?: '/etc/ssl/certs/ca-certificates.crt';
    if (is_file($ca)) $opts[PDO::MYSQL_ATTR_SSL_CA] = $ca;
}
$pdo = new PDO($dsn, $c['db_user'], $c['db_pass'], $opts);
$sql = preg_replace('/--[^\n]*/', '', file_get_contents(__DIR__ . '/../database/schema.sql'));
$n = 0;
foreach (array_filter(array_map('trim', explode(';', $sql))) as $stmt) { $pdo->exec($stmt); $n++; }
echo "Done: $n statements run, database '{$c['db_name']}' is ready.\n";
