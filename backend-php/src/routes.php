<?php
/**
 * API Routes Definition
 */

use App\Controllers\AdminController;
use App\Controllers\AuditController;
use App\Controllers\AuthController;
use App\Controllers\CategoryController;
use App\Controllers\CreditController;
use App\Controllers\CustomerController;
use App\Controllers\DriverController;
use App\Controllers\InvoiceController;
use App\Controllers\NotificationController;
use App\Controllers\OrderController;
use App\Controllers\PackingListController;
use App\Controllers\PaymentController;
use App\Controllers\ProductController;
use App\Controllers\ReportController;
use App\Controllers\UploadController;

/** @var \App\Core\Router $router */

// Auth Routes
$router->post('/api/auth/register', [AuthController::class, 'register'])
    ->post('/api/auth/login', [AuthController::class, 'login'])
    ->post('/api/auth/refresh', [AuthController::class, 'refresh'])
    ->post('/api/auth/send-code', [AuthController::class, 'sendCode'])
    ->post('/api/auth/verify-code', [AuthController::class, 'verifyCode'])
    ->post('/api/auth/dev-login', [AuthController::class, 'devLogin'])
    ->get('/api/auth/me', [AuthController::class, 'me']);

// Category Routes
$router->get('/api/categories', [CategoryController::class, 'index'])
    ->get('/api/categories/{id}', [CategoryController::class, 'show'])
    ->post('/api/categories', [CategoryController::class, 'store'])
    ->put('/api/categories/{id}', [CategoryController::class, 'update'])
    ->delete('/api/categories/{id}', [CategoryController::class, 'destroy']);

// Product Routes
$router->get('/api/products', [ProductController::class, 'index'])
    ->get('/api/products/{id}', [ProductController::class, 'show'])
    ->post('/api/products', [ProductController::class, 'store'])
    ->put('/api/products/{id}', [ProductController::class, 'update'])
    ->delete('/api/products/{id}', [ProductController::class, 'destroy'])
    ->get('/api/products/{id}/price-history', [ProductController::class, 'priceHistory']);

// Order Routes
$router->get('/api/orders', [OrderController::class, 'index'])
    ->post('/api/orders', [OrderController::class, 'store'])
    ->get('/api/orders/collation', [OrderController::class, 'collation'])
    ->get('/api/orders/{id}', [OrderController::class, 'show'])
    ->put('/api/orders/{id}', [OrderController::class, 'update'])
    ->put('/api/orders/{id}/status', [OrderController::class, 'updateStatus']);

// Invoice Routes
$router->get('/api/invoices', [InvoiceController::class, 'index'])
    ->post('/api/invoices', [InvoiceController::class, 'store'])
    ->get('/api/invoices/{id}', [InvoiceController::class, 'show'])
    ->put('/api/invoices/{id}', [InvoiceController::class, 'update'])
    ->post('/api/invoices/generate-for-order/{orderId}', [InvoiceController::class, 'generateForOrder']);

// Payment Routes
$router->get('/api/payments', [PaymentController::class, 'index'])
    ->post('/api/payments', [PaymentController::class, 'store'])
    ->get('/api/payments/customer/{id}', [PaymentController::class, 'byCustomer']);

// Credit Routes
$router->get('/api/credits', [CreditController::class, 'index'])
    ->post('/api/credits', [CreditController::class, 'store'])
    ->get('/api/credits/customer/{id}', [CreditController::class, 'byCustomer']);

// Packing List Routes
$router->get('/api/packing-lists', [PackingListController::class, 'index']);

// Notification Routes
$router->get('/api/notifications', [NotificationController::class, 'index'])
    ->put('/api/notifications/{id}/read', [NotificationController::class, 'markRead'])
    ->post('/api/notifications/send', [NotificationController::class, 'send']);

// Report Routes
$router->get('/api/reports/sales', [ReportController::class, 'sales'])
    ->get('/api/reports/customers', [ReportController::class, 'customers']);

// Customer Routes
$router->get('/api/customers', [CustomerController::class, 'index'])
    ->get('/api/customers/{id}', [CustomerController::class, 'show'])
    ->put('/api/customers/{id}', [CustomerController::class, 'update'])
    ->get('/api/customers/{id}/orders', [CustomerController::class, 'orders'])
    ->get('/api/customers/{id}/balance', [CustomerController::class, 'balance'])
    ->get('/api/customers/{id}/quick-reorder', [CustomerController::class, 'quickReorder'])
    ->get('/api/customers/me/dashboard', [CustomerController::class, 'dashboard']);

// Admin Routes
$router->get('/api/admin/users', [AdminController::class, 'index'])
    ->post('/api/admin/users', [AdminController::class, 'store'])
    ->put('/api/admin/users/{id}/role', [AdminController::class, 'updateRole']);

// Driver Routes
$router->post('/api/driver/log', [DriverController::class, 'log'])
    ->get('/api/driver/logs', [DriverController::class, 'logs']);

// Upload Routes
$router->post('/api/upload', [UploadController::class, 'store']);

// Audit Routes
$router->get('/api/audit-logs', [AuditController::class, 'index']);

// Health Check
$router->get('/api/health', function () {
    \App\Core\Response::success(['status' => 'ok', 'timestamp' => date('c')]);
});
