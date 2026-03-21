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
            $invoices = $this->firebase->query('invoices', 'customerId', '==', $userId);
        } elseif ($customerId) {
            $invoices = $this->firebase->query('invoices', 'customerId', '==', $customerId);
        } else {
            // Fetch all from catalogues
            $invoices = $this->firebase->listDocuments('invoices');
        }

        // Apply status filter in PHP
        if ($status) {
            $invoices = array_values(array_filter($invoices, fn($i) => ($i['status'] ?? '') === $status));
        }

        // Sort by createdAt DESC
        usort($invoices, fn($a, $b) => ($b['createdAt'] ?? '') <=> ($a['createdAt'] ?? ''));

        // Attach customer name and order info
        foreach ($invoices as &$inv) {
            $inv['subtotal'] = (float) ($inv['subtotal'] ?? 0);
            $inv['creditApplied'] = (float) ($inv['creditApplied'] ?? 0);
            $inv['total'] = (float) ($inv['total'] ?? 0);

            $customer = $this->firebase->getDocument('users', $inv['customerId']);
            $inv['customerName'] = $customer['name'] ?? 'Unknown';
            $inv['customerEmail'] = $customer['email'] ?? 'Unknown';

            $order = $this->firebase->getDocument('orders', $inv['orderId']);
            $inv['deliveryDate'] = $order['deliveryDate'] ?? null;
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

        if ($role === 'customer' && ($invoice['customerId'] ?? '') !== $userId) {
            Response::forbidden('Cannot access this invoice');
        }

        // Attach user info
        $customer = $this->firebase->getDocument('users', $invoice['customerId']);
        $invoice['customerName'] = $customer['name'] ?? 'Unknown';
        $invoice['customerEmail'] = $customer['email'] ?? 'Unknown';
        $invoice['customerPhone'] = $customer['phone'] ?? 'Unknown';
        $invoice['customerAddress'] = $customer['address'] ?? 'Unknown';

        // Attach order info
        $order = $this->firebase->getDocument('orders', $invoice['orderId']);
        $invoice['deliveryDate'] = $order['deliveryDate'] ?? null;
        $invoice['deliveryMethod'] = $order['deliveryMethod'] ?? 'delivery';
        $invoice['deliveryAddress'] = $order['deliveryAddress'] ?? null;

        // Get order items
        $items = $this->firebase->query('order_items', 'orderId', '==', $invoice['orderId']);
        foreach ($items as &$item) {
            $product = $this->firebase->getDocument('products', $item['productId']);
            $item['productName'] = $product['name'] ?? 'Unknown';
            $item['unit'] = $product['unit'] ?? null;
        }
        $invoice['items'] = $items;

        // Get payments
        $payments = $this->firebase->query('payments', 'invoiceId', '==', $id);
        usort($payments, fn($a, $b) => ($b['paymentDate'] ?? '') <=> ($a['paymentDate'] ?? ''));
        $invoice['payments'] = $payments;

        $invoice['subtotal'] = (float) ($invoice['subtotal'] ?? 0);
        $invoice['creditApplied'] = (float) ($invoice['creditApplied'] ?? 0);
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
        $existing = $this->firebase->query('invoices', 'orderId', '==', $data['orderId']);

        if (!empty($existing)) {
            Response::error('Invoice already exists for this order', 400);
        }

        // Get order details
        $order = $this->firebase->getDocument('orders', $data['orderId']);

        if (!$order) {
            Response::notFound('Order not found');
        }

        // Calculate subtotal from order items
        $items = $this->firebase->query('order_items', 'orderId', '==', $data['orderId']);
        $subtotalAmount = 0;
        foreach ($items as $item) {
            $subtotalAmount += ($item['quantity'] ?? 0) * ($item['priceAtOrder'] ?? 0);
        }

        $deliveryFees = (float) ($order['deliveryFees'] ?? 0);
        $creditApplied = (float) ($data['creditApplied'] ?? 0);
        $total = $subtotalAmount + $deliveryFees - $creditApplied;

        $invoiceId = Uuid::uuid4()->toString();
        $dueDate = date('Y-m-d', strtotime('+7 days'));

        $invoiceData = [
            'id' => $invoiceId,
            'orderId' => $data['orderId'],
            'customerId' => $order['customerId'],
            'subtotal' => (float) ($subtotalAmount + $deliveryFees),
            'creditApplied' => (float) $creditApplied,
            'total' => (float) $total,
            'status' => 'unpaid',
            'dueDate' => $dueDate,
            'createdAt' => date('c'),
            'updatedAt' => date('c')
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
            $updates['pdfUrl'] = $data['pdfUrl'];
        if (isset($data['dueDate']))
            $updates['dueDate'] = $data['dueDate'];

        if (empty($updates)) {
            Response::error('No fields to update', 400);
        }

        $updates['updatedAt'] = date('c');
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
        $existing = $this->firebase->query('invoices', 'orderId', '==', $orderId);

        if (!empty($existing)) {
            Response::error('Invoice already exists for this order', 400);
        }

        // Trigger store logic
        $data = ['orderId' => $orderId];
        Request::setBody(['orderId' => $orderId]);
        $this->store();
    }

    /**
     * GET /api/invoices/customer/{id}
     */
    public function byCustomer(array $params): void
    {
        AuthMiddleware::check();

        $customerId = $params['id'];
        if ($customerId === 'me') {
            $customerId = Request::userId();
        }

        $role = Request::userRole();
        $userId = Request::userId();

        if ($role === 'customer' && $customerId !== $userId) {
            Response::forbidden('Cannot access these invoices');
        }

        $invoices = $this->firebase->query('invoices', 'customerId', '==', $customerId);

        // Sort by createdAt DESC
        usort($invoices, fn($a, $b) => ($b['createdAt'] ?? '') <=> ($a['createdAt'] ?? ''));

        Response::json($invoices);
    }
}
