<?php
/**
 * Invoice Controller
 * 
 * Handles invoice management endpoints
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\FirebaseService;
use App\Middleware\AuthMiddleware;
use App\Services\AuditService;
use Ramsey\Uuid\Uuid;

class InvoiceController
{
    private FirebaseService $firebase;

    public function __construct()
    {
        $this->firebase = new FirebaseService();
    }

    /**
     * GET /api/invoices
     */
    public function index(): void
    {
        AuthMiddleware::check();

        $role = Request::userRole();
        $userId = Request::userId();
        $status = Request::query('status');
        $customerId = Request::query('customerId');

        $invoices = [];
        if ($role === 'customer') {
            $invoices = $this->firebase->query('invoices', 'customer_id', '==', $userId);
        } elseif ($customerId) {
            $invoices = $this->firebase->query('invoices', 'customer_id', '==', $customerId);
        } else {
            // Fetch all (with dummy query)
            $invoices = $this->firebase->query('invoices', 'status', '>', '');
        }

        // Apply status filter in PHP
        if ($status) {
            $invoices = array_values(array_filter($invoices, fn($i) => ($i['status'] ?? '') === $status));
        }

        // Sort by created_at DESC
        usort($invoices, fn($a, $b) => ($b['created_at'] ?? '') <=> ($a['created_at'] ?? ''));

        // Attach customer name and order info
        foreach ($invoices as &$inv) {
            $inv['subtotal'] = (float) ($inv['subtotal'] ?? 0);
            $inv['credit_applied'] = (float) ($inv['credit_applied'] ?? 0);
            $inv['total'] = (float) ($inv['total'] ?? 0);

            $customer = $this->firebase->getDocument('users', $inv['customer_id']);
            $inv['customer_name'] = $customer['name'] ?? 'Unknown';
            $inv['customer_email'] = $customer['email'] ?? 'Unknown';

            $order = $this->firebase->getDocument('orders', $inv['order_id']);
            $inv['delivery_date'] = $order['delivery_date'] ?? null;
        }

        Response::json($invoices);
    }

    /**
     * GET /api/invoices/{id}
     */
    public function show(array $params): void
    {
        AuthMiddleware::check();

        $id = $params['id'];
        $role = Request::userRole();
        $userId = Request::userId();

        $invoice = $this->firebase->getDocument('invoices', $id);

        if (!$invoice) {
            Response::notFound('Invoice not found');
        }

        if ($role === 'customer' && ($invoice['customer_id'] ?? '') !== $userId) {
            Response::forbidden('Cannot access this invoice');
        }

        // Attach user info
        $customer = $this->firebase->getDocument('users', $invoice['customer_id']);
        $invoice['customer_name'] = $customer['name'] ?? 'Unknown';
        $invoice['customer_email'] = $customer['email'] ?? 'Unknown';
        $invoice['customer_phone'] = $customer['phone'] ?? 'Unknown';
        $invoice['customer_address'] = $customer['address'] ?? 'Unknown';

        // Attach order info
        $order = $this->firebase->getDocument('orders', $invoice['order_id']);
        $invoice['delivery_date'] = $order['delivery_date'] ?? null;
        $invoice['delivery_method'] = $order['delivery_method'] ?? 'delivery';
        $invoice['delivery_address'] = $order['delivery_address'] ?? null;

        // Get order items
        $items = $this->firebase->query('order_items', 'order_id', '==', $invoice['order_id']);
        foreach ($items as &$item) {
            $product = $this->firebase->getDocument('products', $item['product_id']);
            $item['product_name'] = $product['name'] ?? 'Unknown';
            $item['unit'] = $product['unit'] ?? null;
        }
        $invoice['items'] = $items;

        // Get payments
        $payments = $this->firebase->query('payments', 'invoice_id', '==', $id);
        usort($payments, fn($a, $b) => ($b['payment_date'] ?? '') <=> ($a['payment_date'] ?? ''));
        $invoice['payments'] = $payments;

        $invoice['subtotal'] = (float) ($invoice['subtotal'] ?? 0);
        $invoice['credit_applied'] = (float) ($invoice['credit_applied'] ?? 0);
        $invoice['total'] = (float) ($invoice['total'] ?? 0);

        Response::json($invoice);
    }

    /**
     * POST /api/invoices
     */
    public function store(): void
    {
        AuthMiddleware::admin();

        $data = Request::validate(['orderId']);

        // Check if invoice already exists for this order
        $existing = $this->firebase->query('invoices', 'order_id', '==', $data['orderId']);

        if (!empty($existing)) {
            Response::error('Invoice already exists for this order', 400);
        }

        // Get order details
        $order = $this->firebase->getDocument('orders', $data['orderId']);

        if (!$order) {
            Response::notFound('Order not found');
        }

        // Calculate subtotal from order items
        $items = $this->firebase->query('order_items', 'order_id', '==', $data['orderId']);
        $subtotalAmount = 0;
        foreach ($items as $item) {
            $subtotalAmount += ($item['quantity'] ?? 0) * ($item['price_at_order'] ?? 0);
        }

        $deliveryFees = (float) ($order['delivery_fees'] ?? 0);
        $creditApplied = (float) ($data['creditApplied'] ?? 0);
        $total = $subtotalAmount + $deliveryFees - $creditApplied;

        $invoiceId = Uuid::uuid4()->toString();
        $dueDate = date('Y-m-d', strtotime('+7 days'));

        $invoiceData = [
            'id' => $invoiceId,
            'order_id' => $data['orderId'],
            'customer_id' => $order['customer_id'],
            'subtotal' => (float) ($subtotalAmount + $deliveryFees),
            'credit_applied' => (float) $creditApplied,
            'total' => (float) $total,
            'status' => 'unpaid',
            'due_date' => $dueDate,
            'created_at' => date('c'),
            'updated_at' => date('c')
        ];

        $this->firebase->createDocument('invoices', $invoiceId, $invoiceData);

        AuditService::log('CREATE', 'invoice', $invoiceId, json_encode(['orderId' => $data['orderId']]));

        Response::created($invoiceData);
    }

    /**
     * PUT /api/invoices/{id}
     */
    public function update(array $params): void
    {
        AuthMiddleware::admin();

        $id = $params['id'];
        $data = Request::body();

        $invoice = $this->firebase->getDocument('invoices', $id);

        if (!$invoice) {
            Response::notFound('Invoice not found');
        }

        $updates = [];
        if (isset($data['status']))
            $updates['status'] = $data['status'];
        if (isset($data['pdfUrl']))
            $updates['pdf_url'] = $data['pdfUrl'];
        if (isset($data['dueDate']))
            $updates['due_date'] = $data['dueDate'];

        if (empty($updates)) {
            Response::error('No fields to update', 400);
        }

        $updates['updated_at'] = date('c');
        $this->firebase->updateDocument('invoices', $id, $updates);

        AuditService::log('UPDATE', 'invoice', $id, json_encode($data));

        $invoice = $this->firebase->getDocument('invoices', $id);
        Response::success($invoice);
    }

    /**
     * POST /api/invoices/generate-for-order/{orderId}
     */
    public function generateForOrder(array $params): void
    {
        AuthMiddleware::admin();

        $orderId = $params['orderId'];

        // Check if invoice already exists
        $existing = $this->firebase->query('invoices', 'order_id', '==', $orderId);

        if (!empty($existing)) {
            Response::error('Invoice already exists for this order', 400);
        }

        // Trigger store logic
        $data = ['orderId' => $orderId];
        Request::setBody(['orderId' => $orderId]);
        $this->store();
    }
}
