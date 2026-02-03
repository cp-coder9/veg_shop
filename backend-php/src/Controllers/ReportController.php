<?php
/**
 * Report Controller
 * 
 * Handles reporting endpoints
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\FirebaseService;
use App\Middleware\AuthMiddleware;

class ReportController
{
    private FirebaseService $firebase;

    public function __construct()
    {
        $this->firebase = new FirebaseService();
    }

    /**
     * GET /api/reports/sales
     */
    public function sales(): void
    {
        AuthMiddleware::admin();

        $startDate = Request::query('startDate');
        $endDate = Request::query('endDate');

        // Defaults
        if (!$startDate)
            $startDate = date('Y-m-01');
        if (!$endDate)
            $endDate = date('Y-m-d');

        // Firestore REST is limited for BETWEEN on dates unless they are strings in ISO format
        // We'll fetch all payments and filter in PHP
        $allPayments = $this->firebase->query('payments', 'payment_date', '>=', $startDate);

        $salesByDay = [];
        foreach ($allPayments as $p) {
            $date = substr($p['payment_date'], 0, 10);
            if ($date > $endDate)
                continue;

            if (!isset($salesByDay[$date])) {
                $salesByDay[$date] = ['date' => $date, 'total' => 0, 'count' => 0];
            }
            $salesByDay[$date]['total'] += (float) ($p['amount'] ?? 0);
            $salesByDay[$date]['count']++;
        }

        $salesReport = array_values($salesByDay);
        usort($salesReport, fn($a, $b) => $a['date'] <=> $b['date']);

        // Sales by product
        // Fetch orders in range to get items
        $allOrders = $this->firebase->query('orders', 'delivery_date', '>=', $startDate);
        $productStats = [];

        foreach ($allOrders as $o) {
            if (($o['status'] ?? '') === 'cancelled')
                continue;
            if (($o['delivery_date'] ?? '') > $endDate)
                continue;

            $items = $this->firebase->query('order_items', 'order_id', '==', $o['id']);
            foreach ($items as $item) {
                $pid = $item['product_id'];
                if (!isset($productStats[$pid])) {
                    $product = $this->firebase->getDocument('products', $pid);
                    $productStats[$pid] = [
                        'name' => $product['name'] ?? 'Unknown',
                        'quantity' => 0,
                        'total' => 0
                    ];
                }
                $qty = (float) ($item['quantity'] ?? 0);
                $price = (float) ($item['price_at_order'] ?? 0);
                $productStats[$pid]['quantity'] += $qty;
                $productStats[$pid]['total'] += $qty * $price;
            }
        }

        $topProducts = array_values($productStats);
        usort($topProducts, fn($a, $b) => $b['total'] <=> $a['total']);
        $topProducts = array_slice($topProducts, 0, 10);

        Response::json([
            'sales' => $salesReport,
            'topProducts' => $topProducts
        ]);
    }

    /**
     * GET /api/reports/customers
     */
    public function customers(): void
    {
        AuthMiddleware::admin();

        // Top customers
        // This is extremely inefficient with REST if many users, 
        // but for now we'll fetch customer list and aggregate
        $customers = $this->firebase->query('users', 'role', '==', 'customer');
        $top = [];

        foreach ($customers as $c) {
            $orders = $this->firebase->query('orders', 'customer_id', '==', $c['id']);
            $payments = $this->firebase->query('payments', 'customer_id', '==', $c['id']);

            $totalSpent = array_sum(array_column($payments, 'amount'));

            $top[] = [
                'id' => $c['id'],
                'name' => $c['name'] ?? 'Unknown',
                'order_count' => count($orders),
                'total_spent' => (float) $totalSpent
            ];
        }

        usort($top, fn($a, $b) => $b['total_spent'] <=> $a['total_spent']);
        $top = array_slice($top, 0, 20);

        Response::json($top);
    }
}
