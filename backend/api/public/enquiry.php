<?php
// Public quote request form. POST /api/public/enquiry (no login).
// Stored in `enquiries`; the admin sees them under View Enquiries.
require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/settings.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['error' => 'Method not allowed'], 405);

const ENQUIRIES_PER_HOUR = 5;

$in = json_body();

// Bots fill hidden fields; pretend it worked.
if (trim((string)($in['website'] ?? '')) !== '') json_out(['ok' => true]);

$errors = [];

// Dropdown values must be ones the admin configured.
$quote = settings_get('quote', ['categories', 'delivery_terms', 'success_message']);
$categories = json_decode($quote['categories'] ?: '[]', true) ?: ['Agricultural Products', 'Industrial Chemicals', 'Automotive Components', 'Other'];
$terms = json_decode($quote['delivery_terms'] ?: '[]', true) ?: ['FOB', 'CIF', 'CFR', 'EXW', 'FCA', 'DAP'];

$name = v_text($in, 'name', 'Full name', 2, 100, $errors);
$email = v_email($in, 'email', 'Business email', $errors);
$company = v_text($in, 'company', 'Company', 2, 150, $errors, false);
$product = v_text($in, 'product', 'Products of interest', 2, 150, $errors, false);
$quantity = v_text($in, 'quantity', 'Quantity', 1, 100, $errors, false);
$destination = v_text($in, 'destination', 'Destination', 2, 150, $errors, false);
$message = trim((string)($in['message'] ?? ''));
if (mb_strlen($message) > 2000) $errors['message'] = 'Notes must be at most 2000 characters';

$phone = trim((string)($in['phone'] ?? ''));
if ($phone !== '' && !preg_match('/^\+?[0-9][0-9 ()\-]{5,24}$/', $phone)) {
    $errors['phone'] = 'Enter a valid phone number with country code, e.g. +91 98765 43210';
}

$category = trim((string)($in['category'] ?? ''));
if ($category === '') $errors['category'] = 'Choose a product category';
elseif (!in_array($category, $categories, true)) $errors['category'] = 'Choose a product category from the list';

$delivery = trim((string)($in['delivery_terms'] ?? ''));
if ($delivery !== '' && !in_array($delivery, $terms, true)) $errors['delivery_terms'] = 'Choose a delivery term from the list';

if ($errors) validation_fail($errors);

// Simple per-IP throttle.
$ip = substr((string)($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45);
$st = db()->prepare('SELECT COUNT(*) FROM enquiries WHERE ip = ? AND created_at > (NOW() - INTERVAL 1 HOUR)');
$st->execute([$ip]);
if ((int)$st->fetchColumn() >= ENQUIRIES_PER_HOUR) {
    json_out(['error' => 'Too many requests. Please try again later.'], 429);
}

db()->prepare(
    'INSERT INTO enquiries (name, email, phone, company, category, country, product, quantity, delivery_terms, message, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
)->execute([$name, $email, $phone ?: null, $company ?: null, $category, $destination ?: null, $product ?: null, $quantity ?: null, $delivery ?: null, $message, $ip]);

log_activity('enquiry', 'New quote request from ' . $name . ' (' . $category . ')', ['id' => null, 'name' => 'Website visitor']);

// Email the team. A mail problem never stops the visitor's request from being saved.
require_once __DIR__ . '/../../includes/mailer.php';
[$mailed, $mailError] = send_enquiry_notification([
    'name' => $name, 'email' => $email, 'phone' => $phone, 'company' => $company, 'category' => $category,
    'product' => $product, 'quantity' => $quantity, 'destination' => $destination, 'delivery_terms' => $delivery, 'message' => $message,
]);
if (!$mailed) log_activity('enquiry', 'Could not email the notification: ' . mb_substr($mailError, 0, 150), ['id' => null, 'name' => 'Email system']);

json_out(['ok' => true, 'message' => $quote['success_message'] ?: 'Thank you! Your quote request has been received. Our sourcing team will reply shortly.'], 201);
