<?php
/**
 * Order Controller
 * 
 * Handles order management endpoints
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\FirebaseService;
use App\Middleware\AuthMiddleware;
use App\Services\AuditService;
use Ramsey\Uuid\Uuid;

class OrderController
{
    private FirebaseService $firebase;

    private const DELIVERY_FEES = [
        ['keyword' => 'paarl', 'fee' => 35],
        ['keyword' => 'val de vie', 'fee' => 35],
        ['keyword' => 'wellington', 'fee' => 50],
        ['keyword' => 'pearl valley', 'fee' => 50],
    ];

    public function __construct()
    {
        $this->firebase = new FirebaseService();
    }

    /**
     * GET /api/orders
     */
    public function index(): void
    {
        AuthMiddleware::check();

        $role = Request::userRole();
        $userId = Request::userId();

        $limit = (int) (Request::query('limit') ?? 100);
        $status = Request::query('status');
        $deliveryDate = Request::query('deliveryDate');
        $startDate = Request::query('startDate');
        $endDate = Request::query('endDate');
        $customerId = Request::query('customerId');
        $packerId = Request::query('packerId');
        $driverId = Request::query('driverId');

        // Fetch orders. We fetch based on the most exclusive criteria if possible
        $orders = [];
        if ($role === 'customer') {
            $orders = $this->firebase->query('orders', 'customer_id', '==', $userId);
        } elseif ($customerId) {
            $orders = $this->firebase->query('orders', 'customer_id', '==', $customerId);
        } elseif ($status) {
            $orders = $this->firebase->query('orders', 'status', '==', $status);
        } elseif ($deliveryDate) {
            $orders = $this->firebase->query('orders', 'delivery_date', '==', $deliveryDate);
        } else {
            // Fetch all (with dummy query)
            $orders = $this->firebase->query('orders', 'status', '>', '');
        }

        // Apply remaining filters in PHP
        $orders = array_values(array_filter($orders, function ($o) use ($status, $deliveryDate, $startDate, $endDate, $packerId, $driverId) {
            if ($status && $o['status'] !== $status)
                return false;
            if ($deliveryDate && $o['delivery_date'] !== $deliveryDate)
                return false;
            if ($startDate && $o['delivery_date'] < $startDate)
                return false;
            if ($endDate && $o['delivery_date'] > $endDate)
                return false;
            if ($packerId && ($o['packer_id'] ?? null) !== $packerId)
                return false;
            if ($driverId && ($o['driver_id'] ?? null) !== $driverId)
                return false;
            return true;
        }));

        // Sort by delivery_date DESC
        usort($orders, fn($a, $b) => ($b['delivery_date'] ?? '') <=> ($a['delivery_date'] ?? ''));

        if ($limit > 0) {
            $orders = array_slice($orders, 0, $limit);
        }

        // Get items and customer names
        foreach ($orders as &$order) {
            $order['items'] = $this->firebase->query('order_items', 'order_id', '==', $order['id']);

            // Add product details to items
            foreach ($order['items'] as &$item) {
                $product = $this->firebase->getDocument('products', $item['product_id']);
                $item['product_name'] = $product['name'] ?? 'Unknown';
                $item['unit'] = $product['unit'] ?? '';
            }

            // Fetch customer name
            $customer = $this->firebase->getDocument('users', $order['customer_id']);
            $order['customer_name'] = $customer['name'] ?? 'Unknown';

            // Calculate total amount
            $total = 0;
            foreach ($order['items'] as $item) {
                $total += ($item['quantity'] ?? 0) * ($item['price_at_order'] ?? 0);
            }
            $order['total_amount'] = (float) $total;
        }

        Response::json($orders);
    }

    /**
     * GET /api/orders/{id}
     */
    public function show(array $params): void
    {
        AuthMiddleware::check();

        $order = $this->firebase->getDocument('orders', $params['id']);

        if (!$order) {
            Response::notFound('Order found');
        }

        // Check authorization
        $role = Request::userRole();
        $userId = Request::userId();
        if ($role === 'customer' && $order['customer_id'] !== $userId) {
            Response::forbidden('Cannot access this order');
        }

        // Fetch customer info
        $customer = $this->firebase->getDocument('users', $order['customer_id']);
        $order['customer_name'] = $customer['name'] ?? 'Unknown';
        $order['customer_phone'] = $customer['phone'] ?? null;
        $order['customer_email'] = $customer['email'] ?? null;

        // Get order items
        $order['items'] = $this->firebase->query('order_items', 'order_id', '==', $order['id']);
        foreach ($order['items'] as &$item) {
            $product = $this->firebase->getDocument('products', $item['product_id']);
            $item['product_name'] = $product['name'] ?? 'Unknown';
            $item['unit'] = $product['unit'] ?? '';
            $item['category'] = $product['category'] ?? '';
        }

        Response::json($order);
    }

    /**
     * POST /api/orders
     */
    public function store(): void
    {
        AuthMiddleware::check();

        $data = Request::validate(['deliveryDate', 'items']);
        $customerId = Request::userId();

        if (empty($data['items']) || !is_array($data['items'])) {
            Response::error('At least one item is required', 400);
        }

        // Calculate delivery fees
        $deliveryFees = 0;
        $address = strtolower($data['deliveryAddress'] ?? '');
        foreach (self::DELIVERY_FEES as $area) {
            if (str_contains($address, $area['keyword'])) {
                $deliveryFees = $area['fee'];
                break;
            }
        }

        try {
            $orderId = Uuid::uuid4()->toString();

            $orderData = [
                'id' => $orderId,
                'customer_id' => $customerId,
                'delivery_date' => $data['deliveryDate'],
                'delivery_method' => $data['deliveryMethod'] ?? 'delivery',
                'delivery_address' => $data['deliveryAddress'] ?? null,
                'special_instructions' => $data['specialInstructions'] ?? null,
                'delivery_fees' => (float) ($data['deliveryFees'] ?? $deliveryFees),
                'cooler_bag_option' => isset($data['coolerBagOption']) ? (bool) $data['coolerBagOption'] : false,
                'status' => 'pending',
                'created_at' => date('c'),
                'updated_at' => date('c')
            ];

            $this->firebase->createDocument('orders', $orderId, $orderData);

            // Insert order items
            $itemsSummary = [];
            foreach ($data['items'] as $item) {
                $product = $this->firebase->getDocument('products', $item['productId']);

                if (!$product || !($product['is_available'] ?? true)) {
                    throw new \Exception("Product not available: " . $item['productId']);
                }

                $itemId = Uuid::uuid4()->toString();
                $itemData = [
                    'id' => $itemId,
                    'order_id' => $orderId,
                    'product_id' => $item['productId'],
                    'quantity' => (float) $item['quantity'],
                    'price_at_order' => (float) $product['price']
                ];
                $this->firebase->createDocument('order_items', $itemId, $itemData);

                $itemData['product_name'] = $product['name'];
                $itemsSummary[] = $itemData;
            }

            AuditService::log('CREATE', 'order', $orderId, json_encode(['itemCount' => count($data['items'])]));

            $orderData['items'] = $itemsSummary;
            Response::created($orderData);
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    /**
     * PUT /api/orders/{id}
     */
    public function update(array $params): void
    {
        AuthMiddleware::check();

        $id = $params['id'];
        $data = Request::body();

        $order = $this->firebase->getDocument('orders', $id);

        if (!$order) {
            Response::notFound('Order not found');
        }

        // Check authorization
        $role = Request::userRole();
        if ($role === 'customer' && $order['customer_id'] !== Request::userId()) {
            Response::forbidden('Cannot modify this order');
        }

        $updates = [];
        $fieldMap = [
            'deliveryDate' => 'delivery_date',
            'deliveryMethod' => 'delivery_method',
            'deliveryAddress' => 'delivery_address',
            'specialInstructions' => 'special_instructions',
            'deliveryFees' => 'delivery_fees',
            'coolerBagOption' => 'cooler_bag_option',
            'driverId' => 'driver_id',
            'packerId' => 'packer_id',
            'deliveryNotes' => 'delivery_notes',
            'packerNotes' => 'packer_notes',
            'driverNotes' => 'driver_notes'
        ];

        foreach ($fieldMap as $jsonKey => $dbField) {
            if (isset($data[$jsonKey])) {
                $value = $data[$jsonKey];
                if ($jsonKey === 'coolerBagOption')
                    $value = (bool) $value;
                if ($jsonKey === 'deliveryFees')
                    $value = (float) $value;
                $updates[$dbField] = $value;
            }
        }

        if (empty($updates)) {
            Response::error('No fields to update', 400);
        }

        $updates['updated_at'] = date('c');
        $this->firebase->updateDocument('orders', $id, $updates);

        AuditService::log('UPDATE', 'order', $id, json_encode($data));

        $order = $this->firebase->getDocument('orders', $id);
        Response::success($order);
    }

    /**
     * PUT /api/orders/{id}/status
     */
    public function updateStatus(array $params): void
    {
        AuthMiddleware::check();

        $id = $params['id'];
        $data = Request::validate(['status']);

        $order = $this->firebase->getDocument('orders', $id);

        if (!$order) {
            Response::notFound('Order not found');
        }

        $updates = ['status' => $data['status']];

        // Handle packer/driver assignment
        $role = Request::userRole();
        $userId = Request::userId();

        if ($data['status'] === 'packing' && in_array($role, ['admin', 'packer'])) {
            $updates['packer_id'] = $userId;
        }

        if (isset($data['packerSignature']))
            $updates['packer_signature'] = $data['packerSignature'];
        if (isset($data['packerNotes']))
            $updates['packer_notes'] = $data['packerNotes'];
        if (isset($data['deliveryProof']))
            $updates['delivery_proof'] = $data['deliveryProof'];
        if (isset($data['driverNotes']))
            $updates['driver_notes'] = $data['driverNotes'];
        if (isset($data['coolerBagStatus']))
            $updates['cooler_bag_status'] = $data['coolerBagStatus'];
        if (isset($data['deliveryNotes']))
            $updates['delivery_notes'] = $data['deliveryNotes'];

        $updates['updated_at'] = date('c');
        $this->firebase->updateDocument('orders', $id, $updates);

        AuditService::log('STATUS_UPDATE', 'order', $id, json_encode(['status' => $data['status']]));

        $order = $this->firebase->getDocument('orders', $id);
        Response::success($order);
    }

    /**
     * GET /api/orders/collation
     */
    public function collation(): void
    {
        AuthMiddleware::staff();

        $startDate = Request::query('startDate');
        $endDate = Request::query('endDate');

        if (!$startDate || !$endDate) {
            Response::error('startDate and endDate are required', 400);
        }

        // Fetch orders in date range
        $orders = $this->firebase->query('orders', 'delivery_date', '>=', $startDate);
        $orders = array_filter($orders, function ($o) use ($endDate) {
            return ($o['delivery_date'] ?? '') <= $endDate && ($o['status'] ?? '') !== 'cancelled';
        });

        $aggregation = [];
        foreach ($orders as $order) {
            $items = $this->firebase->query('order_items', 'order_id', '==', $order['id']);
            foreach ($items as $item) {
                $pid = $item['product_id'];
                if (!isset($aggregation[$pid])) {
                    $product = $this->firebase->getDocument('products', $pid);
                    $aggregation[$pid] = [
                        'product_id' => $pid,
                        'product_name' => $product['name'] ?? 'Unknown',
                        'unit' => $product['unit'] ?? '',
                        'category_id' => $product['category'] ?? '',
                        'total_quantity' => 0,
                        'order_count' => 0,
                        'order_ids' => []
                    ];
                }
                $aggregation[$pid]['total_quantity'] += (float) ($item['quantity'] ?? 0);
                if (!in_array($order['id'], $aggregation[$pid]['order_ids'])) {
                    $aggregation[$pid]['order_count']++;
                    $aggregation[$pid]['order_ids'][] = $order['id'];
                }
            }
        }

        // Remove order_ids helper and convert to indexed array
        $result = array_map(function ($a) {
            unset($a['order_ids']);
            return $a;
        }, array_values($aggregation));

        // Sort by category then name
        usort($result, function ($a, $b) {
            if ($a['category_id'] !== $b['category_id'])
                return $a['category_id'] <=> $b['category_id'];
            return $a['product_name'] <=> $b['product_name'];
        });

        Response::json($result);
    }
}
