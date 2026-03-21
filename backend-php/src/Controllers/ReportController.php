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
     * GET /api/reports/dashboard
     */
    public function dashboard(): void
    {
        AuthMiddleware::admin();

        // Count customers
        $customers = $this->firebase->query('users', 'role', '==', 'customer');
        $totalCustomers = count($customers);

        // Count all orders (non-cancelled)
        $allOrders = $this->firebase->query('orders', 'status', '>', '');
        $totalOrders = count(array_filter($allOrders, fn($o) => ($o['status'] ?? '') !== 'cancelled'));

        // Sum all payments for total revenue (in cents to match frontend division)
        $allPayments = $this->firebase->query('payments', 'method', '>', '');
        $totalRevenue = 0;
        foreach ($allPayments as $p) {
            $totalRevenue += (float) ($p['amount'] ?? 0);
        }
        $totalRevenueCents = (int) round($totalRevenue * 100);

        // Count unpaid/partial invoices as pending payments
        $unpaidInvoices = $this->firebase->query('invoices', 'status', '==', 'unpaid');
        $partialInvoices = $this->firebase->query('invoices', 'status', '==', 'partial');
        $pendingPayments = count($unpaidInvoices) + count($partialInvoices);

        // Count active products
        $allProducts = $this->firebase->query('products', 'isAvailable', '==', true);
        $activeProducts = count($allProducts);

        Response::json([
            'totalCustomers' => $totalCustomers,
            'totalOrders' => $totalOrders,
            'totalRevenue' => $totalRevenueCents,
            'pendingPayments' => $pendingPayments,
            'activeProducts' => $activeProducts,
        ]);
    }

    /**
     * GET /api/reports/sales
     */
    public function sales(): void
    {
        AuthMiddleware::admin();

        $startDate = Request::query('startDate') ?? date('Y-m-01');
        $endDate = Request::query('endDate') ?? date('Y-m-d');

        // Total Orders in range
        $allOrders = $this->firebase->query('orders', 'delivery_date', '>=', $startDate);
        $filteredOrders = array_filter($allOrders, function ($o) use ($endDate) {
            return ($o['status'] ?? '') !== 'cancelled' && ($o['delivery_date'] ?? '') <= $endDate;
        });

        // Total Revenue (from non-cancelled orders' invoices)
        $totalRevenue = 0;
        foreach ($filteredOrders as $o) {
            $invoice = $this->firebase->getDocument('invoices', $o['invoice_id'] ?? '');
            if ($invoice) {
                $totalRevenue += (float) ($invoice['total'] ?? 0);
            }
        }

        // Products Sold
        $productStats = [];
        foreach ($filteredOrders as $o) {
            $items = $this->firebase->query('order_items', 'order_id', '==', $o['id']);
            foreach ($items as $item) {
                $pid = $item['product_id'];
                if (!isset($productStats[$pid])) {
                    $product = $this->firebase->getDocument('products', $pid);
                    $productStats[$pid] = [
                        'productId' => $pid,
                        'productName' => $product['name'] ?? 'Unknown',
                        'quantitySold' => 0,
                        'revenue' => 0
                    ];
                }
                $qty = (float) ($item['quantity'] ?? 0);
                $price = (float) ($item['price_at_order'] ?? 0);
                $productStats[$pid]['quantitySold'] += $qty;
                $productStats[$pid]['revenue'] += $qty * $price;
            }
        }

        $productsSold = array_values($productStats);
        usort($productsSold, fn($a, $b) => $b['revenue'] <=> $a['revenue']);

        Response::json([
            'startDate' => $startDate,
            'endDate' => $endDate,
            'totalRevenue' => $totalRevenue,
            'totalOrders' => count($filteredOrders),
            'productsSold' => $productsSold
        ]);
    }

    /**
     * GET /api/reports/payments
     */
    public function payments(): void
    {
        AuthMiddleware::admin();

        // Find all unpaid or partial invoices
        $unpaid = $this->firebase->query('invoices', 'status', '==', 'unpaid');
        $partial = $this->firebase->query('invoices', 'status', '==', 'partial');
        $outstandingInvoices = array_merge($unpaid, $partial);

        $customerBalances = [];
        $totalOutstanding = 0;

        foreach ($outstandingInvoices as $inv) {
            $cid = $inv['customer_id'];
            $total = (float) ($inv['total'] ?? 0);
            $totalOutstanding += $total;

            if (!isset($customerBalances[$cid])) {
                $customer = $this->firebase->getDocument('users', $cid);
                // Get last payment date
                $payments = $this->firebase->query('payments', 'customer_id', '==', $cid);
                usort($payments, fn($a, $b) => ($b['payment_date'] ?? '') <=> ($a['payment_date'] ?? ''));
                $lastPayment = !empty($payments) ? $payments[0]['payment_date'] : null;

                $customerBalances[$cid] = [
                    'customerId' => $cid,
                    'customerName' => $customer['name'] ?? 'Unknown',
                    'outstandingBalance' => 0,
                    'lastPaymentDate' => $lastPayment
                ];
            }
            $customerBalances[$cid]['outstandingBalance'] += $total;
        }

        Response::json([
            'totalOutstanding' => $totalOutstanding,
            'customers' => array_values($customerBalances)
        ]);
    }

    /**
     * GET /api/reports/products
     */
    public function products(): void
    {
        AuthMiddleware::admin();

        $startDate = Request::query('startDate') ?? date('Y-m-01');
        $endDate = Request::query('endDate') ?? date('Y-m-d');

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
                        'productId' => $pid,
                        'productName' => $product['name'] ?? 'Unknown',
                        'orderCount' => 0,
                        'totalQuantity' => 0,
                        'revenue' => 0
                    ];
                }
                $qty = (float) ($item['quantity'] ?? 0);
                $price = (float) ($item['price_at_order'] ?? 0);

                $productStats[$pid]['orderCount']++;
                $productStats[$pid]['totalQuantity'] += $qty;
                $productStats[$pid]['revenue'] += $qty * $price;
            }
        }

        Response::json([
            'startDate' => $startDate,
            'endDate' => $endDate,
            'products' => array_values($productStats)
        ]);
    }

    /**
     * GET /api/reports/customers
     */
    public function customers(): void
    {
        AuthMiddleware::admin();

        $startDate = Request::query('startDate') ?? date('Y-m-01');
        $endDate = Request::query('endDate') ?? date('Y-m-d');

        $customers = $this->firebase->query('users', 'role', '==', 'customer');
        $report = [];

        foreach ($customers as $c) {
            $orders = $this->firebase->query('orders', 'customer_id', '==', $c['id']);
            $filteredOrders = array_filter($orders, function ($o) use ($startDate, $endDate) {
                return ($o['status'] ?? '') !== 'cancelled' &&
                    ($o['delivery_date'] ?? '') >= $startDate &&
                    ($o['delivery_date'] ?? '') <= $endDate;
            });

            if (empty($filteredOrders))
                continue;

            $totalSpent = 0;
            $lastDate = null;
            foreach ($filteredOrders as $o) {
                $invoice = $this->firebase->getDocument('invoices', $o['invoice_id'] ?? '');
                if ($invoice)
                    $totalSpent += (float) ($invoice['total'] ?? 0);
                if (!$lastDate || $o['delivery_date'] > $lastDate)
                    $lastDate = $o['delivery_date'];
            }

            $count = count($filteredOrders);
            $report[] = [
                'customerId' => $c['id'],
                'customerName' => $c['name'] ?? 'Unknown',
                'orderCount' => $count,
                'totalSpent' => $totalSpent,
                'averageOrderValue' => $count > 0 ? $totalSpent / $count : 0,
                'lastOrderDate' => $lastDate
            ];
        }

        Response::json([
            'startDate' => $startDate,
            'endDate' => $endDate,
            'customers' => $report
        ]);
    }
}
