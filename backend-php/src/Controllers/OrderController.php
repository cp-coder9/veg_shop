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
            $orders = $this->firebase->query('orders', 'customerId', '==', $userId);
        } elseif ($customerId) {
            $orders = $this->firebase->query('orders', 'customerId', '==', $customerId);
        } elseif ($status) {
            $orders = $this->firebase->query('orders', 'status', '==', $status);
        } elseif ($deliveryDate) {
            $orders = $this->firebase->query('orders', 'deliveryDate', '==', $deliveryDate);
        } else {
            // Fetch all from catalogues
            $orders = $this->firebase->listDocuments('orders');
        }

        // Apply remaining filters in PHP
        $orders = array_values(array_filter($orders, function ($o) use ($status, $deliveryDate, $startDate, $endDate, $packerId, $driverId) {
            if ($status && $o['status'] !== $status)
                return false;
            if ($deliveryDate && $o['deliveryDate'] !== $deliveryDate)
                return false;
            if ($startDate && $o['deliveryDate'] < $startDate)
                return false;
            if ($endDate && $o['deliveryDate'] > $endDate)
                return false;
            if ($packerId && ($o['packerId'] ?? null) !== $packerId)
                return false;
            if ($driverId && ($o['driverId'] ?? null) !== $driverId)
                return false;
            return true;
        }));

        // Sort by deliveryDate DESC
        usort($orders, fn($a, $b) => ($b['deliveryDate'] ?? '') <=> ($a['deliveryDate'] ?? ''));

        if ($limit > 0) {
            $orders = array_slice($orders, 0, $limit);
        }

        // Get items and customer names
        foreach ($orders as &$order) {
            $order['items'] = $this->firebase->query('order_items', 'orderId', '==', $order['id']);

            // Add product details to items
            foreach ($order['items'] as &$item) {
                $product = $this->firebase->getDocument('products', $item['productId']);
                $item['productName'] = $product['name'] ?? 'Unknown';
                $item['unit'] = $product['unit'] ?? '';
            }

            // Fetch customer name
            $customer = $this->firebase->getDocument('users', $order['customerId']);
            $order['customerName'] = $customer['name'] ?? 'Unknown';

            // Calculate total amount
            $total = 0;
            foreach ($order['items'] as $item) {
                $total += ($item['quantity'] ?? 0) * ($item['priceAtOrder'] ?? 0);
            }
            $order['totalAmount'] = (float) $total;
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
        if ($role === 'customer' && $order['customerId'] !== $userId) {
            Response::forbidden('Cannot access this order');
        }

        // Fetch customer info
        $customer = $this->firebase->getDocument('users', $order['customerId']);
        $order['customerName'] = $customer['name'] ?? 'Unknown';
        $order['customerPhone'] = $customer['phone'] ?? null;
        $order['customerEmail'] = $customer['email'] ?? null;

        // Get order items
        $order['items'] = $this->firebase->query('order_items', 'orderId', '==', $order['id']);
        foreach ($order['items'] as &$item) {
            $product = $this->firebase->getDocument('products', $item['productId']);
            $item['productName'] = $product['name'] ?? 'Unknown';
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
                'customerId' => $customerId,
                'deliveryDate' => $data['deliveryDate'],
                'deliveryMethod' => $data['deliveryMethod'] ?? 'delivery',
                'deliveryAddress' => $data['deliveryAddress'] ?? null,
                'specialInstructions' => $data['specialInstructions'] ?? null,
                'deliveryFees' => (float) ($data['deliveryFees'] ?? $deliveryFees),
                'coolerBagOption' => isset($data['coolerBagOption']) ? (bool) $data['coolerBagOption'] : false,
                'status' => 'pending',
                'createdAt' => date('c'),
                'updatedAt' => date('c')
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
                    'orderId' => $orderId,
                    'productId' => $item['productId'],
                    'quantity' => (float) $item['quantity'],
                    'priceAtOrder' => (float) $product['price']
                ];
                $this->firebase->createDocument('order_items', $itemId, $itemData);

                $itemData['productName'] = $product['name'];
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
            'deliveryDate' => 'deliveryDate',
            'deliveryMethod' => 'deliveryMethod',
            'deliveryAddress' => 'deliveryAddress',
            'specialInstructions' => 'specialInstructions',
            'deliveryFees' => 'deliveryFees',
            'coolerBagOption' => 'coolerBagOption',
            'driverId' => 'driverId',
            'packerId' => 'packerId',
            'deliveryNotes' => 'deliveryNotes',
            'packerNotes' => 'packerNotes',
            'driverNotes' => 'driverNotes'
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

        $updates['updatedAt'] = date('c');
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
            $updates['packerId'] = $userId;
        }

        if (isset($data['packerSignature']))
            $updates['packerSignature'] = $data['packerSignature'];
        if (isset($data['packerNotes']))
            $updates['packerNotes'] = $data['packerNotes'];
        if (isset($data['deliveryProof']))
            $updates['deliveryProof'] = $data['deliveryProof'];
        if (isset($data['driverNotes']))
            $updates['driverNotes'] = $data['driverNotes'];
        if (isset($data['coolerBagStatus']))
            $updates['coolerBagStatus'] = $data['coolerBagStatus'];
        if (isset($data['deliveryNotes']))
            $updates['deliveryNotes'] = $data['deliveryNotes'];

        $updates['updatedAt'] = date('c');
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
        $orders = $this->firebase->query('orders', 'deliveryDate', '>=', $startDate);
        $orders = array_filter($orders, function ($o) use ($endDate) {
            return ($o['deliveryDate'] ?? '') <= $endDate && ($o['status'] ?? '') !== 'cancelled';
        });

        $aggregation = [];
        foreach ($orders as $order) {
            $items = $this->firebase->query('order_items', 'orderId', '==', $order['id']);
            foreach ($items as $item) {
                $pid = $item['productId'];
                if (!isset($aggregation[$pid])) {
                    $product = $this->firebase->getDocument('products', $pid);
                    $aggregation[$pid] = [
                        'productId' => $pid,
                        'productName' => $product['name'] ?? 'Unknown',
                        'unit' => $product['unit'] ?? '',
                        'categoryId' => $product['category'] ?? '',
                        'totalQuantity' => 0,
                        'orderCount' => 0,
                        'orderIds' => []
                    ];
                }
                $aggregation[$pid]['totalQuantity'] += (float) ($item['quantity'] ?? 0);
                if (!in_array($order['id'], $aggregation[$pid]['orderIds'])) {
                    $aggregation[$pid]['orderCount']++;
                    $aggregation[$pid]['orderIds'][] = $order['id'];
                }
            }
        }

        // Remove orderIds helper and convert to indexed array
        $result = array_map(function ($a) {
            unset($a['orderIds']);
            return $a;
        }, array_values($aggregation));

        // Sort by category then name
        usort($result, function ($a, $b) {
            if ($a['categoryId'] !== $b['categoryId'])
                return $a['categoryId'] <=> $b['categoryId'];
            return $a['productName'] <=> $b['productName'];
        });

        Response::json($result);
    }

    /**
     * GET /api/orders/window-status
     * Order window: open Sunday through Tuesday midnight (for Friday delivery).
     */
    public function windowStatus(): void
    {
        AuthMiddleware::check();

        // Day of week: 0 = Sunday, 1 = Monday, 2 = Tuesday, ..., 6 = Saturday
        $dayOfWeek = (int) date('w');

        // Window is open on Sunday (0), Monday (1), Tuesday (2)
        $isOpen = $dayOfWeek <= 2;

        if ($isOpen) {
            // Next change: end of Tuesday (Wednesday 00:00)
            $daysUntilWednesday = 3 - $dayOfWeek;
            $nextChange = date('Y-m-d\T00:00:00\Z', strtotime("+$daysUntilWednesday days"));
            $message = 'Ordering is open. Place your order by Tuesday midnight for Friday delivery.';
        } else {
            // Next change: next Sunday 00:00
            $daysUntilSunday = 7 - $dayOfWeek;
            $nextChange = date('Y-m-d\T00:00:00\Z', strtotime("+$daysUntilSunday days"));
            $message = 'Ordering window is closed. It opens again on Sunday.';
        }

        Response::json([
            'isOpen' => $isOpen,
            'nextStatusChange' => $nextChange,
            'message' => $message,
        ]);
    }

    /**
     * GET /api/orders/customer/{id}
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
            Response::forbidden('Cannot access these orders');
        }

        $orders = $this->firebase->query('orders', 'customerId', '==', $customerId);

        // Sort by deliveryDate DESC
        usort($orders, fn($a, $b) => ($b['deliveryDate'] ?? '') <=> ($a['deliveryDate'] ?? ''));

        // Attach items to each order
        foreach ($orders as &$order) {
            $order['items'] = $this->firebase->query('order_items', 'orderId', '==', $order['id']);
            foreach ($order['items'] as &$item) {
                $product = $this->firebase->getDocument('products', $item['productId'] ?? '');
                $item['productName'] = $product['name'] ?? 'Unknown';
            }
        }

        Response::json($orders);
    }

    /**
     * GET /api/orders/last-week
     */
    public function lastWeek(): void
    {
        AuthMiddleware::check();
        $userId = Request::userId();

        $orders = $this->firebase->query('orders', 'customerId', '==', $userId);
        usort($orders, fn($a, $b) => ($b['deliveryDate'] ?? '') <=> ($a['deliveryDate'] ?? ''));

        if (empty($orders)) {
            Response::json(null);
            return;
        }

        $order = $orders[0];
        $order['items'] = $this->firebase->query('order_items', 'orderId', '==', $order['id']);
        foreach ($order['items'] as &$item) {
            $product = $this->firebase->getDocument('products', $item['productId'] ?? '');
            $item['productName'] = $product['name'] ?? 'Unknown';
            $item['unit'] = $product['unit'] ?? '';
            $item['category'] = $product['category'] ?? '';
        }

        Response::json($order);
    }
}
