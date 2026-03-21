<?php
/**
 * Stock Order Controller
 *
 * Manages supplier stock orders.
 * Data stored in Firebase `stock_orders` collection.
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\FirebaseService;
use App\Middleware\AuthMiddleware;
use Ramsey\Uuid\Uuid;

class StockOrderController
{
    private FirebaseService $firebase;

    public function __construct()
    {
        $this->firebase = new FirebaseService();
    }

    /**
     * GET /api/stock-orders
     */
    public function index(): void
    {
        AuthMiddleware::admin();

        $weekStartDate = Request::query('weekStartDate');
        $status = Request::query('status');

        // Base query — fetch all using a dummy always-true filter
        $orders = $this->firebase->query('stock_orders', 'created_at', '>', '');

        // Filter in PHP
        $orders = array_values(array_filter($orders, function ($o) use ($weekStartDate, $status) {
            if ($weekStartDate && ($o['week_start_date'] ?? '') !== date('Y-m-d', strtotime($weekStartDate))) {
                return false;
            }
            if ($status && ($o['status'] ?? '') !== $status) {
                return false;
            }
            return true;
        }));

        // Sort newest first
        usort($orders, fn($a, $b) => ($b['created_at'] ?? '') <=> ($a['created_at'] ?? ''));

        // Enrich items
        foreach ($orders as &$order) {
            if (!empty($order['items']) && is_string($order['items'])) {
                $order['items'] = json_decode($order['items'], true) ?? [];
            }
        }

        Response::json($orders);
    }

    /**
     * POST /api/stock-orders
     */
    public function store(): void
    {
        AuthMiddleware::admin();

        $data = Request::body();

        if (empty($data['items']) || !is_array($data['items'])) {
            Response::error('At least one item is required', 400);
            return;
        }

        $weekStartDate = isset($data['weekStartDate'])
            ? date('Y-m-d', strtotime($data['weekStartDate']))
            : date('Y-m-d', strtotime('monday this week'));

        $id = Uuid::uuid4()->toString();

        $stockOrder = [
            'id' => $id,
            'week_start_date' => $weekStartDate,
            'supplier_id' => $data['supplierId'] ?? null,
            'supplier_name' => $data['supplierName'] ?? null,
            'items' => json_encode($data['items']),
            'notes' => $data['notes'] ?? null,
            'status' => 'pending',
            'created_by_id' => Request::userId(),
            'created_at' => date('c'),
            'updated_at' => date('c'),
        ];

        $this->firebase->createDocument('stock_orders', $id, $stockOrder);

        // Return with items decoded
        $stockOrder['items'] = $data['items'];

        Response::created($stockOrder);
    }

    /**
     * GET /api/stock-orders/{id}
     */
    public function show(array $params): void
    {
        AuthMiddleware::admin();

        $order = $this->firebase->getDocument('stock_orders', $params['id']);

        if (!$order) {
            Response::notFound('Stock order not found');
            return;
        }

        if (!empty($order['items']) && is_string($order['items'])) {
            $order['items'] = json_decode($order['items'], true) ?? [];
        }

        Response::json($order);
    }
}
