<?php
/**
 * Customer Controller
 * 
 * Handles customer management endpoints
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\FirebaseService;
use App\Middleware\AuthMiddleware;
use App\Services\AuditService;

class CustomerController
{
    private FirebaseService $firebase;

    public function __construct()
    {
        $this->firebase = new FirebaseService();
    }

    /**
     * GET /api/customers
     */
    public function index(): void
    {
        AuthMiddleware::admin();

        $search = Request::query('search');
        $status = Request::query('status');
        $limit = (int) (Request::query('limit') ?? 100);

        // Fetch customers
        $customers = $this->firebase->query('users', 'role', '==', 'customer');

        // Apply filters in PHP
        if ($search || $status) {
            $customers = array_values(array_filter($customers, function ($c) use ($search, $status) {
                if ($status && ($c['status'] ?? '') !== $status)
                    return false;
                if ($search) {
                    $name = strtolower($c['name'] ?? '');
                    $email = strtolower($c['email'] ?? '');
                    $phone = strtolower($c['phone'] ?? '');
                    $term = strtolower($search);
                    if (!str_contains($name, $term) && !str_contains($email, $term) && !str_contains($phone, $term))
                        return false;
                }
                return true;
            }));
        }

        // Sort by name
        usort($customers, fn($a, $b) => ($a['name'] ?? '') <=> ($b['name'] ?? ''));

        if ($limit > 0) {
            $customers = array_slice($customers, 0, $limit);
        }

        Response::json($customers);
    }

    /**
     * GET /api/customers/{id}
     */
    public function show(array $params): void
    {
        AuthMiddleware::check();

        $id = $params['id'];
        if ($id === 'me') {
            $id = Request::userId();
        }

        $role = Request::userRole();
        $userId = Request::userId();

        // Customers can only view themselves
        if ($role === 'customer' && $id !== $userId) {
            Response::forbidden('Cannot access this customer');
        }

        $customer = $this->firebase->getDocument('users', $id);

        if (!$customer) {
            Response::notFound('Customer not found');
        }

        // Get additional stats from orders
        $orders = $this->firebase->query('orders', 'customerId', '==', $id);

        $customer['order_count'] = count($orders);
        $customer['completed_orders'] = count(array_filter($orders, fn($o) => ($o['status'] ?? '') !== 'cancelled'));

        Response::json($customer);
    }

    /**
     * PUT /api/customers/{id}
     */
    public function update(array $params): void
    {
        AuthMiddleware::check();

        $id = $params['id'];
        $data = Request::body();
        $role = Request::userRole();
        $userId = Request::userId();

        // Customers can only update themselves
        if ($role === 'customer' && $id !== $userId) {
            Response::forbidden('Cannot update this customer');
        }

        $customer = $this->firebase->getDocument('users', $id);

        if (!$customer) {
            Response::notFound('Customer not found');
        }

        $updates = [];
        $fieldMap = [
            'name' => 'name',
            'phone' => 'phone',
            'address' => 'address',
            'birthday' => 'birthday',
            'deliveryPreference' => 'deliveryPreference'
        ];

        // Admin-only fields
        $adminFields = [
            'status' => 'status',
            'loyaltyPoints' => 'loyaltyPoints'
        ];

        foreach ($fieldMap as $jsonKey => $dbField) {
            if (isset($data[$jsonKey])) {
                $updates[$dbField] = $data[$jsonKey];
            }
        }

        // Allow admin to update additional fields
        if ($role === 'admin') {
            foreach ($adminFields as $jsonKey => $dbField) {
                if (isset($data[$jsonKey])) {
                    $value = $data[$jsonKey];
                    if ($jsonKey === 'loyaltyPoints')
                        $value = (float) $value;
                    $updates[$dbField] = $value;
                }
            }
        }

        if (empty($updates)) {
            Response::error('No fields to update', 400);
        }

        $updates['updatedAt'] = date('c');
        $this->firebase->updateDocument('users', $id, $updates);

        AuditService::log('UPDATE', 'customer', $id, json_encode($data));

        $customer = $this->firebase->getDocument('users', $id);
        Response::success($customer);
    }

    /**
     * GET /api/customers/{id}/orders
     */
    public function orders(array $params): void
    {
        AuthMiddleware::check();

        $id = $params['id'];
        $role = Request::userRole();
        $userId = Request::userId();

        if ($role === 'customer' && $id !== $userId) {
            Response::forbidden('Cannot access this customer');
        }

        $limit = (int) (Request::query('limit') ?? 10);

        $orders = $this->firebase->query('orders', 'customerId', '==', $id);

        // Sort by deliveryDate DESC
        usort($orders, fn($a, $b) => ($b['deliveryDate'] ?? '') <=> ($a['deliveryDate'] ?? ''));

        if ($limit > 0) {
            $orders = array_slice($orders, 0, $limit);
        }

        // Add total amount for each order
        foreach ($orders as &$order) {
            $items = $this->firebase->query('order_items', 'orderId', '==', $order['id']);
            $total = 0;
            foreach ($items as $item) {
                $total += ($item['quantity'] ?? 0) * ($item['priceAtOrder'] ?? 0);
            }
            $order['totalAmount'] = (float) $total;
        }

        Response::json($orders);
    }

    /**
     * GET /api/customers/{id}/balance
     */
    public function balance(array $params): void
    {
        AuthMiddleware::check();

        $id = $params['id'];
        $role = Request::userRole();
        $userId = Request::userId();

        if ($role === 'customer' && $id !== $userId) {
            Response::forbidden('Cannot access this customer');
        }

        // Fetch invoices, payments, and credits
        $invoices = $this->firebase->query('invoices', 'customerId', '==', $id);
        $payments = $this->firebase->query('payments', 'customerId', '==', $id);
        $credits = $this->firebase->query('credits', 'customerId', '==', $id);

        $totalInvoiced = array_sum(array_column($invoices, 'total'));
        $totalPaid = array_sum(array_column($payments, 'amount'));
        $totalCredits = array_sum(array_column($credits, 'amount'));

        $balance = [
            'totalInvoiced' => (float) $totalInvoiced,
            'totalPaid' => (float) $totalPaid,
            'availableCredits' => (float) $totalCredits,
            'outstandingBalance' => (float) ($totalInvoiced - $totalPaid)
        ];

        Response::json($balance);
    }

    /**
     * GET /api/customers/{id}/quick-reorder
     */
    public function quickReorder(array $params): void
    {
        AuthMiddleware::check();

        $id = $params['id'];
        $role = Request::userRole();
        $userId = Request::userId();

        if ($role === 'customer' && $id !== $userId) {
            Response::forbidden('Cannot access this customer');
        }

        // Fetch all customer orders to aggregate products
        $orders = $this->firebase->query('orders', 'customerId', '==', $id);

        $aggregation = [];
        foreach ($orders as $order) {
            $items = $this->firebase->query('order_items', 'orderId', '==', $order['id']);
            foreach ($items as $item) {
                $pid = $item['productId'];
                if (!isset($aggregation[$pid])) {
                    $aggregation[$pid] = [
                        'id' => $pid,
                        'totalOrdered' => 0,
                        'orderCount' => 0,
                        'orderIds' => []
                    ];
                }
                $aggregation[$pid]['totalOrdered'] += (float) ($item['quantity'] ?? 0);
                if (!in_array($order['id'], $aggregation[$pid]['orderIds'])) {
                    $aggregation[$pid]['orderCount']++;
                    $aggregation[$pid]['orderIds'][] = $order['id'];
                }
            }
        }

        // Convert to array and sort
        $result = array_values($aggregation);
        usort($result, function ($a, $b) {
            if ($a['order_count'] !== $b['order_count'])
                return $b['order_count'] <=> $a['order_count'];
            return $b['total_ordered'] <=> $a['total_ordered'];
        });

        // Limit to 10 and fetch product details
        $result = array_slice($result, 0, 10);
        foreach ($result as &$res) {
            $product = $this->firebase->getDocument('products', $res['id']);
            if ($product && ($product['isAvailable'] ?? true)) {
                $res = array_merge($res, $product);
            } else {
                // If not available or doesn't exist, we might want to skip it
                // but for now we'll just keep the basic info
            }
            unset($res['orderIds']);
        }

        Response::json(array_values($result));
    }

    /**
     * GET /api/customers/me/payments
     * Returns payments for the currently authenticated customer.
     */
    public function myPayments(): void
    {
        AuthMiddleware::check();
        $userId = Request::userId();

        $payments = $this->firebase->query('payments', 'customerId', '==', $userId);

        usort($payments, fn($a, $b) => ($b['paymentDate'] ?? '') <=> ($a['paymentDate'] ?? ''));

        foreach ($payments as &$p) {
            $p['amount'] = (float) ($p['amount'] ?? 0);

            if (!empty($p['invoiceId'])) {
                $invoice = $this->firebase->getDocument('invoices', $p['invoiceId']);
                $p['invoice'] = $invoice ? [
                    'id' => $invoice['id'],
                    'total' => (float) ($invoice['total'] ?? 0),
                    'status' => $invoice['status'] ?? null,
                    'orderId' => $invoice['orderId'] ?? null,
                ] : null;
            } else {
                $p['invoice'] = null;
            }
        }

        Response::json($payments);
    }

    public function dashboard(): void
    {
        AuthMiddleware::check();
        $userId = Request::userId();

        // 1. Get Customer Profile
        $customer = $this->firebase->getDocument('users', $userId);
        if (!$customer) {
            Response::notFound('Customer profile not found');
        }

        // 2. Fetch Orders (for stats & recent)
        $orders = $this->firebase->query('orders', 'customerId', '==', $userId);
        usort($orders, fn($a, $b) => ($b['deliveryDate'] ?? '') <=> ($a['deliveryDate'] ?? ''));

        $totalOrders = count($orders);
        $totalSpent = 0;
        foreach ($orders as $o) {
            // If total isn't stored on order, calculate it or fetch items
            // For now assuming 'total' might be on order or we sum items
            // Ideally order has 'total'
            $totalSpent += ($o['total'] ?? 0);
        }

        // 3. Fetch Invoices (for outstanding)
        $invoices = $this->firebase->query('invoices', 'customerId', '==', $userId);
        $payments = $this->firebase->query('payments', 'customerId', '==', $userId);
        $credits = $this->firebase->query('credits', 'customerId', '==', $userId);

        $totalInvoiced = array_sum(array_column($invoices, 'total'));
        $totalPaid = array_sum(array_column($payments, 'amount'));
        $totalCredits = array_sum(array_column($credits, 'amount'));
        $outstandingAmount = max(0, $totalInvoiced - $totalPaid - $totalCredits); // Simplify logic

        $outstandingInvoices = array_filter($invoices, fn($i) => ($i['status'] ?? '') === 'payment_pending');
        $outstandingInvoices = array_values($outstandingInvoices); // Reset keys

        // 4. Next Delivery
        // Find first order with status 'pending' or 'confirmed' and delivery_date >= today
        $nextDelivery = null;
        $today = date('Y-m-d');
        $upcomingOrders = array_filter(
            $orders,
            fn($o) =>
            in_array($o['status'] ?? '', ['pending', 'confirmed', 'processing']) &&
            ($o['deliveryDate'] ?? '') >= $today
        );
        usort($upcomingOrders, fn($a, $b) => ($a['deliveryDate'] ?? '') <=> ($b['deliveryDate'] ?? ''));

        if (!empty($upcomingOrders)) {
            $next = $upcomingOrders[0];
            $nextDelivery = [
                'orderId' => $next['id'],
                'date' => $next['deliveryDate'],
                'method' => $next['deliveryMethod'] ?? 'Delivery'
            ];
        }

        // 5. Construct Response
        $data = [
            'customer' => [
                'id' => $userId,
                'name' => $customer['name'] ?? 'Valued Customer',
                'email' => $customer['email'] ?? null,
                'phone' => $customer['phone'] ?? null,
            ],
            'stats' => [
                'creditBalance' => (float) $totalCredits, // Or calculate usable credit
                'loyaltyPoints' => (float) ($customer['loyaltyPoints'] ?? 0),
                'outstandingAmount' => (float) $outstandingAmount,
                'outstandingInvoices' => count($outstandingInvoices),
                'totalOrders' => $totalOrders,
                'totalSpent' => (float) $totalSpent,
            ],
            'recentOrders' => array_slice(array_map(fn($o) => [
                'id' => $o['id'],
                'status' => $o['status'] ?? 'pending',
                'deliveryDate' => $o['deliveryDate'] ?? '',
                'createdAt' => $o['createdAt'] ?? '',
                'itemCount' => 0, // Need to count items if not stored on order
                'total' => (float) ($o['total'] ?? 0)
            ], $orders), 0, 5),
            'nextDelivery' => $nextDelivery,
            'outstandingInvoices' => array_map(fn($i) => [
                'id' => $i['id'],
                'total' => (float) ($i['total'] ?? 0),
                'dueDate' => $i['dueDate'] ?? '',
                'status' => $i['status'] ?? 'pending'
            ], $outstandingInvoices)
        ];

        Response::success($data);
    }
}
