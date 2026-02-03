<?php
/**
 * Packing List Controller
 * 
 * Handles packing list generation and management
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\FirebaseService;
use App\Middleware\AuthMiddleware;
use App\Services\AuditService;

class PackingListController
{
    private FirebaseService $firebase;

    public function __construct()
    {
        $this->firebase = new FirebaseService();
    }

    /**
     * GET /api/packing-lists
     * Groups orders/items by delivery area for a specific date
     */
    public function index(): void
    {
        AuthMiddleware::staff();

        $date = Request::query('date');

        if (!$date) {
            Response::badRequest('Date is required');
        }

        // Fetch orders for the date
        // Note: Firestore query is exact. If delivery_date includes time, we need a range
        $orders = $this->firebase->query('orders', 'delivery_date', '==', $date);

        // Filter out cancelled
        $orders = array_filter($orders, fn($o) => ($o['status'] ?? '') !== 'cancelled');

        // Group by area
        $areas = [
            'Paarl' => [],
            'Val de Vie' => [],
            'Pearl Valley' => [],
            'Wellington' => [],
            'Collection' => [],
            'Other' => []
        ];

        foreach ($orders as $order) {
            // Attach customer name
            $customer = $this->firebase->getDocument('users', $order['customer_id']);
            $order['customer_name'] = $customer['name'] ?? 'Unknown';

            // Attach packer name
            if (!empty($order['packer_id'])) {
                $packer = $this->firebase->getDocument('users', $order['packer_id']);
                $order['packer_name'] = $packer['name'] ?? 'Unknown';
            } else {
                $order['packer_name'] = null;
            }

            // Attach items
            $items = $this->firebase->query('order_items', 'order_id', '==', $order['id']);
            foreach ($items as &$item) {
                $product = $this->firebase->getDocument('products', $item['product_id']);
                $item['product_name'] = $product['name'] ?? 'Unknown';
                $item['unit'] = $product['unit'] ?? null;
                $item['category'] = $product['category'] ?? null;
                $item['packing_type'] = $product['packing_type'] ?? null;
            }

            // Sort items by category then name
            usort($items, function ($a, $b) {
                if ($a['category'] !== $b['category'])
                    return ($a['category'] ?? '') <=> ($b['category'] ?? '');
                return ($a['product_name'] ?? '') <=> ($b['product_name'] ?? '');
            });
            $order['items'] = $items;

            $address = strtolower($order['delivery_address'] ?? '');
            $method = $order['delivery_method'] ?? 'delivery';

            if ($method === 'collection') {
                $areas['Collection'][] = $order;
            } elseif (str_contains($address, 'paarl')) {
                $areas['Paarl'][] = $order;
            } elseif (str_contains($address, 'val de vie')) {
                $areas['Val de Vie'][] = $order;
            } elseif (str_contains($address, 'pearl valley')) {
                $areas['Pearl Valley'][] = $order;
            } elseif (str_contains($address, 'wellington')) {
                $areas['Wellington'][] = $order;
            } else {
                $areas['Other'][] = $order;
            }
        }

        // Sort each area by address
        foreach ($areas as $key => &$list) {
            usort($list, fn($a, $b) => ($a['delivery_address'] ?? '') <=> ($b['delivery_address'] ?? ''));
        }

        // Filter empty areas
        $areas = array_filter($areas, fn($list) => !empty($list));

        Response::json($areas);
    }
}
