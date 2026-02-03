<?php
/**
 * Payment Controller
 * 
 * Handles payment processing and history
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\FirebaseService;
use App\Middleware\AuthMiddleware;
use App\Services\AuditService;
use Ramsey\Uuid\Uuid;

class PaymentController
{
    private FirebaseService $firebase;

    public function __construct()
    {
        $this->firebase = new FirebaseService();
    }

    /**
     * GET /api/payments
     */
    public function index(): void
    {
        AuthMiddleware::admin();

        $limit = (int) (Request::query('limit') ?? 50);
        $customerId = Request::query('customerId');
        $startDate = Request::query('startDate');
        $endDate = Request::query('endDate');

        $payments = [];
        if ($customerId) {
            $payments = $this->firebase->query('payments', 'customer_id', '==', $customerId);
        } else {
            // Fetch all (with dummy query)
            $payments = $this->firebase->query('payments', 'method', '>', '');
        }

        // Apply remaining filters
        if ($startDate || $endDate) {
            $payments = array_values(array_filter($payments, function ($p) use ($startDate, $endDate) {
                if ($startDate && ($p['payment_date'] ?? '') < $startDate)
                    return false;
                if ($endDate && ($p['payment_date'] ?? '') > $endDate)
                    return false;
                return true;
            }));
        }

        // Sort by payment_date DESC
        usort($payments, fn($a, $b) => ($b['payment_date'] ?? '') <=> ($a['payment_date'] ?? ''));

        if ($limit > 0) {
            $payments = array_slice($payments, 0, $limit);
        }

        // Attach customer name and order_id from invoice
        foreach ($payments as &$p) {
            $p['amount'] = (float) ($p['amount'] ?? 0);

            $customer = $this->firebase->getDocument('users', $p['customer_id']);
            $p['customer_name'] = $customer['name'] ?? 'Unknown';

            $invoice = $this->firebase->getDocument('invoices', $p['invoice_id']);
            $p['order_id'] = $invoice['order_id'] ?? null;
        }

        Response::json($payments);
    }

    /**
     * POST /api/payments
     */
    public function store(): void
    {
        AuthMiddleware::admin();

        $data = Request::validate(['invoiceId', 'amount', 'method', 'paymentDate']);

        $invoice = $this->firebase->getDocument('invoices', $data['invoiceId']);

        if (!$invoice) {
            Response::notFound('Invoice not found');
        }

        $paymentId = Uuid::uuid4()->toString();

        try {
            // Record payment
            $paymentData = [
                'id' => $paymentId,
                'invoice_id' => $data['invoiceId'],
                'customer_id' => $invoice['customer_id'],
                'amount' => (float) $data['amount'],
                'method' => $data['method'],
                'payment_date' => $data['paymentDate'],
                'notes' => $data['notes'] ?? null,
                'timestamp' => date('c')
            ];

            $this->firebase->createDocument('payments', $paymentId, $paymentData);

            // Check total paid for invoice
            $allPayments = $this->firebase->query('payments', 'invoice_id', '==', $data['invoiceId']);
            $totalPaid = array_sum(array_column($allPayments, 'amount'));

            $invoiceTotal = (float) ($invoice['total'] ?? 0);

            // Update invoice status if fully paid
            if ($totalPaid >= $invoiceTotal) {
                $this->firebase->updateDocument('invoices', $data['invoiceId'], ['status' => 'paid']);
            } else if ($totalPaid > 0 && ($invoice['status'] ?? 'unpaid') === 'unpaid') {
                $this->firebase->updateDocument('invoices', $data['invoiceId'], ['status' => 'partial']);
            }

            AuditService::log('CREATE', 'payment', $paymentId, json_encode($data));

            Response::created($paymentData);

        } catch (\Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    /**
     * GET /api/payments/customer/{id}
     */
    public function byCustomer(array $params): void
    {
        AuthMiddleware::check();

        $customerId = $params['id'];
        $role = Request::userRole();
        $userId = Request::userId();

        if ($role === 'customer' && $customerId !== $userId) {
            Response::forbidden('Cannot access these payments');
        }

        $payments = $this->firebase->query('payments', 'customer_id', '==', $customerId);

        // Sort by payment_date DESC
        usort($payments, fn($a, $b) => ($b['payment_date'] ?? '') <=> ($a['payment_date'] ?? ''));

        foreach ($payments as &$p) {
            $p['amount'] = (float) ($p['amount'] ?? 0);
            $invoice = $this->firebase->getDocument('invoices', $p['invoice_id']);
            $p['order_id'] = $invoice['order_id'] ?? null;
        }

        Response::json($payments);
    }
}
