<?php
require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/account.php';

$admin = require_admin();
json_out(['admin' => account_profile($admin['id'])]);
