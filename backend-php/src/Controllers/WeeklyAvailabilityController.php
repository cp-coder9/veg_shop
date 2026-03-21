<?php
/**
 * Weekly Availability Controller
 *
 * Manages per-product availability for each delivery week.
 * Data is stored in the Firebase `weekly_availability` collection
 * keyed as "{weekStart}_{productId}".
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\FirebaseService;
use App\Middleware\AuthMiddleware;

class WeeklyAvailabilityController
{
    private FirebaseService $firebase;

    public function __construct()
    {
        $this->firebase = new FirebaseService();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /** Return the document ID for a week+product pair */
    private function docId(string $weekStart, string $productId): string
    {
        return $weekStart . '_' . $productId;
    }

    /**
     * Normalise a weekStart date to Y-m-d regardless of whether the client
     * passed ISO-8601 or plain date.
     */
    private function normaliseDate(string $raw): string
    {
        return date('Y-m-d', strtotime($raw));
    }

    /**
     * Ensure availability records exist for the given week.
     * If none exist, auto-generate one for every active product.
     */
    private function ensureWeekRecords(string $weekStart): array
    {
        $existing = $this->firebase->query('weekly_availability', 'weekStart', '==', $weekStart);

        if (!empty($existing)) {
            return $existing;
        }

        // Auto-generate from product catalogue
        $products = $this->firebase->query('products', 'isAvailable', '==', true);
        $records = [];

        foreach ($products as $product) {
            $docId = $this->docId($weekStart, $product['id']);
            $record = [
                'id' => $docId,
                'productId' => $product['id'],
                'weekStart' => $weekStart,
                'isAvailable' => (bool) ($product['isAvailable'] ?? true),
                'confirmedBy' => null,
                'confirmedAt' => null,
            ];
            $this->firebase->createDocument('weekly_availability', $docId, $record);
            $records[] = $record;
        }

        return $records;
    }

    /** Format a raw DB record into the shape the frontend expects */
    private function formatRecord(array $r, ?array $product = null): array
    {
        if (!$product) {
            $product = $this->firebase->getDocument('products', $r['productId'] ?? '');
        }

        $supplier = null;
        if (!empty($product['supplierId'])) {
            $s = $this->firebase->getDocument('suppliers', $product['supplierId']);
            if ($s) {
                $supplier = ['id' => $s['id'], 'name' => $s['name'] ?? ''];
            }
        }

        return [
            'id' => $r['id'],
            'productId' => $r['productId'],
            'weekStart' => $r['weekStart'],
            'isAvailable' => (bool) ($r['isAvailable'] ?? true),
            'confirmedBy' => $r['confirmedBy'] ?? null,
            'confirmedAt' => $r['confirmedAt'] ?? null,
            'product' => [
                'id' => $product['id'] ?? $r['productId'],
                'name' => $product['name'] ?? 'Unknown',
                'price' => (float) ($product['price'] ?? 0),
                'category' => $product['category'] ?? '',
                'unit' => $product['unit'] ?? '',
                'isSeasonal' => (bool) ($product['isSeasonal'] ?? false),
                'isAvailable' => (bool) ($product['isAvailable'] ?? true),
                'imageUrl' => $product['imageUrl'] ?? null,
                'deliveryDay' => $product['deliveryDay'] ?? null,
                'supplierId' => $product['supplierId'] ?? null,
                'supplier' => $supplier,
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // Route handlers
    // -------------------------------------------------------------------------

    /**
     * GET /api/availability/{weekStart}
     */
    public function index(array $params): void
    {
        AuthMiddleware::admin();

        $weekStart = $this->normaliseDate($params['weekStart']);

        $records = $this->ensureWeekRecords($weekStart);

        // Check if confirmed: at least one record has confirmed_by set
        $isConfirmed = false;
        $formatted = [];
        foreach ($records as $r) {
            if (!empty($r['confirmedBy'])) {
                $isConfirmed = true;
            }
            $formatted[] = $this->formatRecord($r);
        }

        // Sort by product name
        usort($formatted, fn($a, $b) => ($a['product']['name'] ?? '') <=> ($b['product']['name'] ?? ''));

        Response::json([
            'availability' => $formatted,
            'isConfirmed' => $isConfirmed,
        ]);
    }

    /**
     * PUT /api/availability/{weekStart}
     * Body: { updates: [{ productId, isAvailable }] }
     */
    public function bulkUpdate(array $params): void
    {
        AuthMiddleware::admin();

        $weekStart = $this->normaliseDate($params['weekStart']);
        $body = Request::body();
        $updates = $body['updates'] ?? [];

        if (empty($updates) || !is_array($updates)) {
            Response::error('updates must be a non-empty array', 400);
            return;
        }

        $results = [];
        foreach ($updates as $upd) {
            $productId = $upd['productId'] ?? null;
            $isAvailable = isset($upd['isAvailable']) ? (bool) $upd['isAvailable'] : true;

            if (!$productId)
                continue;

            $docId = $this->docId($weekStart, $productId);

            $existing = $this->firebase->getDocument('weekly_availability', $docId);
            if ($existing) {
                $this->firebase->updateDocument('weekly_availability', $docId, ['isAvailable' => $isAvailable]);
            } else {
                $record = [
                    'id' => $docId,
                    'productId' => $productId,
                    'weekStart' => $weekStart,
                    'isAvailable' => $isAvailable,
                    'confirmedBy' => null,
                    'confirmedAt' => null,
                ];
                $this->firebase->createDocument('weekly_availability', $docId, $record);
                $existing = $record;
            }

            $existing['isAvailable'] = $isAvailable;
            $results[] = $this->formatRecord($existing);
        }

        Response::json(['updated' => count($results), 'records' => $results]);
    }

    /**
     * PATCH /api/availability/{weekStart}/{productId}
     * Body: { isAvailable: boolean }
     */
    public function toggle(array $params): void
    {
        AuthMiddleware::admin();

        $weekStart = $this->normaliseDate($params['weekStart']);
        $productId = $params['productId'];
        $body = Request::body();
        $isAvailable = isset($body['isAvailable']) ? (bool) $body['isAvailable'] : true;

        $docId = $this->docId($weekStart, $productId);

        $existing = $this->firebase->getDocument('weekly_availability', $docId);
        if ($existing) {
            $this->firebase->updateDocument('weekly_availability', $docId, ['isAvailable' => $isAvailable]);
            $existing['isAvailable'] = $isAvailable;
        } else {
            $existing = [
                'id' => $docId,
                'productId' => $productId,
                'weekStart' => $weekStart,
                'isAvailable' => $isAvailable,
                'confirmedBy' => null,
                'confirmedAt' => null,
            ];
            $this->firebase->createDocument('weekly_availability', $docId, $existing);
        }

        Response::json($this->formatRecord($existing));
    }

    /**
     * POST /api/availability/{weekStart}/confirm
     */
    public function confirm(array $params): void
    {
        AuthMiddleware::admin();

        $weekStart = $this->normaliseDate($params['weekStart']);
        $adminId = Request::userId();
        $now = date('c');

        $records = $this->ensureWeekRecords($weekStart);
        $count = 0;

        foreach ($records as $r) {
            $this->firebase->updateDocument('weekly_availability', $r['id'], [
                'confirmedBy' => $adminId,
                'confirmedAt' => $now,
            ]);
            $count++;
        }

        Response::json(['confirmed' => true, 'updatedCount' => $count, 'confirmedAt' => $now]);
    }

    /**
     * POST /api/availability/{weekStart}/copy-previous
     */
    public function copyPrevious(array $params): void
    {
        AuthMiddleware::admin();

        $weekStart = $this->normaliseDate($params['weekStart']);

        // Previous week = 7 days back
        $prevWeekStart = date('Y-m-d', strtotime($weekStart . ' -7 days'));

        $prevRecords = $this->firebase->query('weekly_availability', 'weekStart', '==', $prevWeekStart);

        if (empty($prevRecords)) {
            Response::json([
                'copied' => false,
                'count' => 0,
                'message' => 'No availability data found for the previous week (' . $prevWeekStart . ')'
            ]);
            return;
        }

        $count = 0;
        foreach ($prevRecords as $prev) {
            $productId = $prev['productId'];
            $docId = $this->docId($weekStart, $productId);

            $newRecord = [
                'id' => $docId,
                'productId' => $productId,
                'weekStart' => $weekStart,
                'isAvailable' => (bool) ($prev['isAvailable'] ?? true),
                'confirmedBy' => null,
                'confirmedAt' => null,
            ];

            $existing = $this->firebase->getDocument('weekly_availability', $docId);
            if ($existing) {
                $this->firebase->updateDocument('weekly_availability', $docId, [
                    'isAvailable' => $newRecord['isAvailable'],
                    'confirmedBy' => null,
                    'confirmedAt' => null,
                ]);
            } else {
                $this->firebase->createDocument('weekly_availability', $docId, $newRecord);
            }
            $count++;
        }

        Response::json(['copied' => true, 'count' => $count, 'fromWeek' => $prevWeekStart, 'toWeek' => $weekStart]);
    }
}
