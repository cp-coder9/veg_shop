-- Veg Shop MySQL Database Schema
-- Converted from Prisma schema

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS veg_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE veg_shop;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    delivery_preference VARCHAR(50) DEFAULT 'delivery',
    role VARCHAR(50) DEFAULT 'customer',
    status VARCHAR(50) DEFAULT 'active',
    birthday DATE,
    loyalty_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role (role),
    INDEX idx_users_status (status)
) ENGINE=InnoDB;

-- Product categories table
CREATE TABLE IF NOT EXISTS product_categories (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    `key` VARCHAR(100) UNIQUE NOT NULL,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) UNIQUE NOT NULL,
    contact_info TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) UNIQUE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    is_available BOOLEAN DEFAULT TRUE,
    is_seasonal BOOLEAN DEFAULT FALSE,
    packing_type VARCHAR(50) DEFAULT 'box',
    supplier_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category) REFERENCES product_categories(`key`) ON DELETE RESTRICT,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    INDEX idx_products_category (category),
    INDEX idx_products_supplier (supplier_id)
) ENGINE=InnoDB;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    customer_id VARCHAR(36) NOT NULL,
    delivery_date DATE NOT NULL,
    delivery_method VARCHAR(50) DEFAULT 'delivery',
    delivery_address TEXT,
    special_instructions TEXT,
    delivery_fees DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'pending',
    cooler_bag_option BOOLEAN DEFAULT FALSE,
    cooler_bag_status VARCHAR(50) DEFAULT 'none',
    packer_signature TEXT,
    delivery_notes TEXT,
    driver_id VARCHAR(36),
    delivery_proof VARCHAR(50),
    driver_notes TEXT,
    packer_id VARCHAR(36),
    packer_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (packer_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_orders_customer (customer_id),
    INDEX idx_orders_delivery_date (delivery_date),
    INDEX idx_orders_status (status),
    INDEX idx_orders_driver (driver_id),
    INDEX idx_orders_packer (packer_id)
) ENGINE=InnoDB;

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL,
    price_at_order DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB;

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_id VARCHAR(36) UNIQUE NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    credit_applied DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'unpaid',
    pdf_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_invoices_customer_status (customer_id, status)
) ENGINE=InnoDB;

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    invoice_id VARCHAR(36) NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(50) NOT NULL,
    payment_date DATETIME NOT NULL,
    notes TEXT,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_payments_customer (customer_id)
) ENGINE=InnoDB;

-- Credits table
CREATE TABLE IF NOT EXISTS credits (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    customer_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_credits_customer (customer_id)
) ENGINE=InnoDB;

-- Driver logs table
CREATE TABLE IF NOT EXISTS driver_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    driver_id VARCHAR(36) NOT NULL,
    date DATE DEFAULT (CURRENT_DATE),
    start_km DECIMAL(10,2) NOT NULL,
    end_km DECIMAL(10,2),
    vehicle_reg VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_driver_logs_driver (driver_id),
    INDEX idx_driver_logs_date (date)
) ENGINE=InnoDB;

-- Price history table
CREATE TABLE IF NOT EXISTS price_history (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id VARCHAR(36) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    effective_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_price_history_product (product_id)
) ENGINE=InnoDB;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    customer_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    method VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    sent_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_customer (customer_id)
) ENGINE=InnoDB;

-- Verification codes table (for OTP)
CREATE TABLE IF NOT EXISTS verification_codes (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    contact VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_verification_codes_contact (contact)
) ENGINE=InnoDB;

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(36),
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_logs_user (user_id),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_resource (resource),
    INDEX idx_audit_logs_created (created_at)
) ENGINE=InnoDB;
