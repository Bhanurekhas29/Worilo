<?php
// Sends a test email to the saved notification address. POST /api/settings/email_test (superuser only)
require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/mailer.php';

require_super();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['error' => 'Method not allowed'], 405);

$cfg = email_config();
if (!$cfg || $cfg['notify_email'] === '') {
    json_out(['error' => 'Save your email settings first (host, username, app password and notification email).'], 422);
}

$text = "This is a test email from the WORILO admin panel.\n\nIf you can read this, your email settings work and new quote requests will be sent to this address.";
$html = '<div style="font-family:Arial,sans-serif;max-width:560px;color:#0a1f3c"><h2>Email settings work</h2><p>This is a test email from the WORILO admin panel.</p>'
    . '<p>New quote requests from the website will be sent to this address.</p></div>';

[$ok, $error] = smtp_send($cfg, $cfg['notify_email'], 'WORILO test email', $text, $html);
if (!$ok) json_out(['error' => $error], 422);

log_activity('content', 'Sent a test email to ' . $cfg['notify_email']);
json_out(['ok' => true, 'to' => $cfg['notify_email']]);
