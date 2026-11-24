<?php
// Minimal SMTP client (no external libraries). Supports SSL (port 465), STARTTLS (587) and plain.
// Settings come from Admin > Email Settings; the app password is stored encrypted.
require_once __DIR__ . '/settings.php';

function email_config(): ?array {
    $d = settings_get('email', ['smtp_host', 'smtp_port', 'encryption', 'smtp_username', 'smtp_password', 'from_email', 'from_name', 'notify_email']);
    if ($d['smtp_host'] === '' || $d['smtp_password'] === '' || $d['smtp_username'] === '' || $d['from_email'] === '') return null;
    return [
        'host' => $d['smtp_host'],
        'port' => (int)($d['smtp_port'] ?: 587),
        'encryption' => $d['encryption'] ?: 'tls',
        'username' => $d['smtp_username'],
        'password' => decrypt_secret($d['smtp_password']),
        'from_email' => $d['from_email'],
        'from_name' => $d['from_name'] ?: 'WORILO',
        'notify_email' => $d['notify_email'],
    ];
}

// Removes line breaks so user input can never inject extra mail headers.
function mail_clean(string $s): string {
    return trim(preg_replace('/[\r\n\0]+/', ' ', $s));
}

function mail_encode_header(string $s): string {
    $s = mail_clean($s);
    return preg_match('/[^\x20-\x7E]/', $s) ? '=?UTF-8?B?' . base64_encode($s) . '?=' : $s;
}

function smtp_expect($fp, array $okCodes, string &$error): ?string {
    $reply = '';
    while (($line = fgets($fp, 1024)) !== false) {
        $reply .= $line;
        if (strlen($line) < 4 || $line[3] !== '-') break; // last line of a multi-line reply has a space after the code
    }
    $code = (int)substr($reply, 0, 3);
    if (!in_array($code, $okCodes, true)) {
        $error = trim($reply) !== '' ? trim(preg_replace('/\s+/', ' ', $reply)) : 'No response from the mail server';
        return null;
    }
    return $reply;
}

function smtp_cmd($fp, string $cmd, array $okCodes, string &$error): ?string {
    fwrite($fp, $cmd . "\r\n");
    return smtp_expect($fp, $okCodes, $error);
}

/**
 * @return array{0: bool, 1: string} [ok, error message]
 */
function smtp_send(array $cfg, string $to, string $subject, string $text, string $html, string $replyTo = ''): array {
    $error = '';
    $secure = $cfg['encryption'] === 'ssl';
    $verify = getenv('SMTP_VERIFY_PEER') !== '0';
    $ctx = stream_context_create(['ssl' => ['verify_peer' => $verify, 'verify_peer_name' => $verify, 'SNI_enabled' => true]]);

    $fp = @stream_socket_client(($secure ? 'ssl://' : 'tcp://') . $cfg['host'] . ':' . $cfg['port'], $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $ctx);
    if (!$fp) return [false, "Could not connect to {$cfg['host']}:{$cfg['port']} ($errstr)"];
    stream_set_timeout($fp, 12);

    $fail = function (string $msg) use ($fp): array {
        @fwrite($fp, "QUIT\r\n");
        @fclose($fp);
        return [false, $msg];
    };

    if (smtp_expect($fp, [220], $error) === null) return $fail($error);
    $ehlo = 'worilo.local';
    if (smtp_cmd($fp, "EHLO $ehlo", [250], $error) === null) return $fail($error);

    if ($cfg['encryption'] === 'tls') {
        if (smtp_cmd($fp, 'STARTTLS', [220], $error) === null) return $fail($error);
        if (!@stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) return $fail('Could not start a secure (TLS) connection');
        if (smtp_cmd($fp, "EHLO $ehlo", [250], $error) === null) return $fail($error);
    }

    if (smtp_cmd($fp, 'AUTH LOGIN', [334], $error) === null) return $fail($error);
    if (smtp_cmd($fp, base64_encode($cfg['username']), [334], $error) === null) return $fail($error);
    if (smtp_cmd($fp, base64_encode($cfg['password']), [235], $error) === null) {
        return $fail('The mail server rejected the username or app password (' . $error . ')');
    }

    if (smtp_cmd($fp, 'MAIL FROM:<' . mail_clean($cfg['from_email']) . '>', [250], $error) === null) return $fail($error);
    if (smtp_cmd($fp, 'RCPT TO:<' . mail_clean($to) . '>', [250, 251], $error) === null) return $fail($error);
    if (smtp_cmd($fp, 'DATA', [354], $error) === null) return $fail($error);

    $boundary = 'b_' . bin2hex(random_bytes(12));
    $headers = [
        'Date: ' . date('r'),
        'From: ' . mail_encode_header($cfg['from_name']) . ' <' . mail_clean($cfg['from_email']) . '>',
        'To: <' . mail_clean($to) . '>',
        'Subject: ' . mail_encode_header($subject),
        'Message-ID: <' . bin2hex(random_bytes(10)) . '@worilo>',
        'MIME-Version: 1.0',
        "Content-Type: multipart/alternative; boundary=\"$boundary\"",
    ];
    if ($replyTo !== '' && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) $headers[] = 'Reply-To: <' . mail_clean($replyTo) . '>';

    $body = "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($text))
        . "--$boundary\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($html))
        . "--$boundary--\r\n";

    // base64 lines never start with ".", so no dot-stuffing is needed.
    fwrite($fp, implode("\r\n", $headers) . "\r\n\r\n" . $body . "\r\n.\r\n");
    if (smtp_expect($fp, [250], $error) === null) return $fail($error);

    @fwrite($fp, "QUIT\r\n");
    @fclose($fp);
    return [true, ''];
}

function h(string $s): string {
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

/** Emails the "new quote request" notification. Returns [ok, error]; [true, ''] also when email is not set up. */
function send_enquiry_notification(array $e): array {
    $cfg = email_config();
    if (!$cfg || $cfg['notify_email'] === '') return [true, 'not configured'];

    $rows = [
        'Name' => $e['name'], 'Email' => $e['email'], 'Phone / WhatsApp' => $e['phone'] ?? '', 'Company' => $e['company'] ?? '',
        'Product category' => $e['category'] ?? '', 'Products of interest' => $e['product'] ?? '', 'Quantity' => $e['quantity'] ?? '',
        'Destination' => $e['destination'] ?? '', 'Delivery terms' => $e['delivery_terms'] ?? '', 'Specifications & notes' => $e['message'] ?? '',
    ];
    $rows = array_filter($rows, fn($v) => trim((string)$v) !== '');

    $text = "New quote request received on the WORILO website\n\n";
    foreach ($rows as $k => $v) $text .= "$k: $v\n";
    $text .= "\nReply directly to this email to answer the buyer.\n";

    $html = '<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#0a1f3c">'
        . '<h2 style="margin:0 0 4px">New quote request</h2><p style="margin:0 0 18px;color:#475569">Received on the WORILO website</p>'
        . '<table style="width:100%;border-collapse:collapse;font-size:15px">';
    foreach ($rows as $k => $v) {
        $html .= '<tr><td style="padding:9px 12px;border:1px solid #e2e8f0;background:#f8fafc;width:38%;font-weight:bold">' . h($k) . '</td>'
            . '<td style="padding:9px 12px;border:1px solid #e2e8f0">' . nl2br(h((string)$v)) . '</td></tr>';
    }
    $html .= '</table><p style="margin:18px 0 0;color:#475569;font-size:13px">Reply to this email to answer the buyer directly.</p></div>';

    $subject = 'New quote request from ' . mail_clean($e['name']) . (!empty($e['category']) ? ' - ' . mail_clean($e['category']) : '');
    return smtp_send($cfg, $cfg['notify_email'], $subject, $text, $html, $e['email']);
}
