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
            $payments = $this->firebase->query('payments', 'customerId', '==', $customerId);
        } else {
            $payments = $this->firebase->listDocuments('payments');
        }

        // Apply remaining filters
        if ($startDate || $endDate) {
            $payments = array_values(array_filter($payments, function ($p) use ($startDate, $endDate) {
                if ($startDate && ($p['paymentDate'] ?? '') < $startDate)
                    return false;
                if ($endDate && ($p['paymentDate'] ?? '') > $endDate)
                    return false;
                return true;
            }));
        }

        // Sort by paymentDate DESC
        usort($payments, fn($a, $b) => ($b['paymentDate'] ?? '') <=> ($a['paymentDate'] ?? ''));

        if ($limit > 0) {
            $payments = array_slice($payments, 0, $limit);
        }

        // Attach customer name and orderId from invoice
        foreach ($payments as &$p) {
            $p['amount'] = (float) ($p['amount'] ?? 0);

            $customer = $this->firebase->getDocument('users', $p['customerId'] ?? '');
            $p['customerName'] = $customer['name'] ?? 'Unknown';

            $invoice = $this->firebase->getDocument('invoices', $p['invoiceId'] ?? '');
            $p['orderId'] = $invoice['orderId'] ?? null;
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
                'invoiceId' => $data['invoiceId'],
                'customerId' => $invoice['customerId'],
                'amount' => (float) $data['amount'],
                'method' => $data['method'],
                'paymentDate' => $data['paymentDate'],
                'notes' => $data['notes'] ?? null,
                'createdAt' => date('c')
            ];

            $this->firebase->createDocument('payments', $paymentId, $paymentData);

            // Check total paid for invoice
            $allPayments = $this->firebase->query('payments', 'invoiceId', '==', $data['invoiceId']);
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
        if ($customerId === 'me') {
            $customerId = Request::userId();
        }

        $role = Request::userRole();
        $userId = Request::userId();

        if ($role === 'customer' && $customerId !== $userId) {
            Response::forbidden('Cannot access these payments');
        }

        $payments = $this->firebase->query('payments', 'customerId', '==', $customerId);

        // Sort by paymentDate DESC
        usort($payments, fn($a, $b) => ($b['paymentDate'] ?? '') <=> ($a['paymentDate'] ?? ''));

        foreach ($payments as &$p) {
            $p['amount'] = (float) ($p['amount'] ?? 0);
            $invoice = $this->firebase->getDocument('invoices', $p['invoiceId'] ?? '');
            $p['orderId'] = $invoice['orderId'] ?? null;
        }

        Response::json($payments);
    }

    /**
     * GET /api/payments/stats
     * Payment statistics by method grouped by today / this week / this month.
     * Values are stored as real amounts but returned as cents (×100) to match frontend.
     */
    public function stats(): void
    {
        AuthMiddleware::admin();

        $allPayments = $this->firebase->listDocuments('payments');

        $today = date('Y-m-d');
        $weekStart = date('Y-m-d', strtotime('monday this week'));
        $monthStart = date('Y-m-01');

        $buckets = [
            'today' => ['total' => 0, 'count' => 0, 'yoco' => 0, 'cash' => 0, 'eft' => 0],
            'week' => ['total' => 0, 'count' => 0, 'yoco' => 0, 'cash' => 0, 'eft' => 0],
            'month' => ['total' => 0, 'count' => 0, 'yoco' => 0, 'cash' => 0, 'eft' => 0],
        ];

        foreach ($allPayments as $p) {
            $date = substr($p['paymentDate'] ?? '', 0, 10);
            $amount = (float) ($p['amount'] ?? 0);
            $method = $p['method'] ?? 'cash';
            // centify amount so frontend divides by 100
            $amountCents = (int) round($amount * 100);

            foreach (['today' => $today, 'week' => $weekStart, 'month' => $monthStart] as $key => $cutoff) {
                if ($date >= $cutoff) {
                    $buckets[$key]['total'] += $amountCents;
                    $buckets[$key]['count']++;
                    if (in_array($method, ['yoco', 'cash', 'eft'])) {
                        $buckets[$key][$method] += $amountCents;
                    }
                }
            }
        }

        Response::json($buckets);
    }

    /**
     * GET /api/payments/recent
     * Recent payments enriched with customer info and invoice status.
     */
    public function recent(): void
    {
        AuthMiddleware::admin();

        $limit = (int) (Request::query('limit') ?? 20);

        $allPayments = $this->firebase->listDocuments('payments');

        // Sort DESC by paymentDate
        usort($allPayments, fn($a, $b) => ($b['paymentDate'] ?? '') <=> ($a['paymentDate'] ?? ''));

        if ($limit > 0) {
            $allPayments = array_slice($allPayments, 0, $limit);
        }

        foreach ($allPayments as &$p) {
            $p['amount'] = (float) ($p['amount'] ?? 0);

            // Enrich with customer info
            $customer = $this->firebase->getDocument('users', $p['customerId'] ?? '');
            $p['customer'] = [
                'id' => $p['customerId'] ?? null,
                'name' => $customer['name'] ?? 'Unknown',
                'email' => $customer['email'] ?? null,
            ];

            // Enrich with invoice info
            $invoice = $this->firebase->getDocument('invoices', $p['invoiceId'] ?? '');
            $p['invoiceStatus'] = $invoice['status'] ?? null;
        }

        Response::json($allPayments);
    }
}
