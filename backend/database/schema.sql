CREATE DATABASE IF NOT EXISTS worilo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE worilo;

-- Admin users. is_super = 1 is the single superuser (created via scripts/create_admin.php).
CREATE TABLE IF NOT EXISTS admins (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL DEFAULT '',
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_super TINYINT(1) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    avatar TEXT NULL,                    -- small (<=100KB) data-URL profile picture
    last_login_at DATETIME NULL,
    failed_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
    locked_until DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Key/value store for Brand, SEO, Email and Credits settings (keys are prefixed by group).
CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Enquiries submitted from the website contact / RFQ form.
CREATE TABLE IF NOT EXISTS enquiries (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(190) NOT NULL,
    phone VARCHAR(40) NULL,
    company VARCHAR(150) NULL,
    category VARCHAR(80) NULL,
    country VARCHAR(150) NULL,          -- destination country / port
    product VARCHAR(150) NULL,          -- product(s) of interest
    quantity VARCHAR(100) NULL,
    delivery_terms VARCHAR(30) NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    ip VARCHAR(45) NULL,                -- used to rate-limit the public form
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_read (is_read),
    INDEX idx_created (created_at),
    INDEX idx_ip_created (ip, created_at)
);

-- Website navbar menu items (managed from Website > Menu & CTA).
CREATE TABLE IF NOT EXISTS menu_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(40) NOT NULL,
    url VARCHAR(255) NOT NULL,
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    INDEX idx_sort (sort_order)
);

-- Default menu, inserted only when the table is empty.
INSERT INTO menu_items (label, url, sort_order)
SELECT * FROM (
    SELECT 'Home' AS label, '/' AS url, 1 AS sort_order
    UNION ALL SELECT 'About Us', '#about', 2
    UNION ALL SELECT 'Our Products', '#products', 3
    UNION ALL SELECT 'Our Services', '#services', 4
    UNION ALL SELECT 'Global Markets', '#markets', 5
    UNION ALL SELECT 'Contact Us', '#contact', 6
) AS defaults
WHERE NOT EXISTS (SELECT 1 FROM menu_items);

-- Audit trail shown as "Recent activities" on the dashboard (entries older than 90 days are purged).
CREATE TABLE IF NOT EXISTS activity_log (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id INT UNSIGNED NULL,
    admin_name VARCHAR(80) NOT NULL DEFAULT '',
    type VARCHAR(20) NOT NULL,          -- login | content | user | enquiry | account | security
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created (created_at)
);
