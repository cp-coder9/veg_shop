<?php
/**
 * Credit Controller
 * 
 * Handles customer credits
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\FirebaseService;
use App\Middleware\AuthMiddleware;
use App\Services\AuditService;
use Ramsey\Uuid\Uuid;

class CreditController
{
    private FirebaseService $firebase;

    public function __construct()
    {
        $this->firebase = new FirebaseService();
    }

    /**
     * GET /api/credits
     */
    public function index(): void
    {
        AuthMiddleware::admin();

        $customerId = Request::query('customerId');

        $credits = [];
        if ($customerId) {
            $credits = $this->firebase->query('credits', 'customer_id', '==', $customerId);
        } else {
            // Fetch all (with dummy query)
            $credits = $this->firebase->query('credits', 'type', '>', '');
        }

        // Sort by created_at DESC
        usort($credits, fn($a, $b) => ($b['created_at'] ?? '') <=> ($a['created_at'] ?? ''));

        // Attach customer name
        foreach ($credits as &$c) {
            $c['amount'] = (float) ($c['amount'] ?? 0);
            $customer = $this->firebase->getDocument('users', $c['customer_id']);
            $c['customer_name'] = $customer['name'] ?? 'Unknown';
        }

        Response::json($credits);
    }

    /**
     * POST /api/credits
     */
    public function store(): void
    {
        AuthMiddleware::admin();

        $data = Request::validate(['customerId', 'amount', 'reason', 'type']);

        $customer = $this->firebase->getDocument('users', $data['customerId']);

        if (!$customer) {
            Response::notFound('Customer not found');
        }

        $id = Uuid::uuid4()->toString();

        $creditData = [
            'id' => $id,
            'customer_id' => $data['customerId'],
            'amount' => (float) $data['amount'],
            'reason' => $data['reason'],
            'type' => $data['type'], // 'refund', 'adjustment', 'loyalty'
            'created_at' => date('c'),
            'timestamp' => date('c')
        ];

        $this->firebase->createDocument('credits', $id, $creditData);

        AuditService::log('CREATE', 'credit', $id, json_encode($data));

        Response::created($creditData);
    }

    /**
     * GET /api/credits/customer/{id}
     */
    public function byCustomer(array $params): void
    {
        AuthMiddleware::check();

        $customerId = $params['id'];
        $role = Request::userRole();
        $userId = Request::userId();

        if ($role === 'customer' && $customerId !== $userId) {
            Response::forbidden('Cannot access these credits');
        }

        $credits = $this->firebase->query('credits', 'customer_id', '==', $customerId);

        // Sort by created_at DESC
        usort($credits, fn($a, $b) => ($b['created_at'] ?? '') <=> ($a['created_at'] ?? ''));

        $credits = array_map(function ($c) {
            $c['amount'] = (float) ($c['amount'] ?? 0);
            return $c;
        }, $credits);

        Response::json($credits);
    }
}
