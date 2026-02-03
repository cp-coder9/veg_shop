<?php
/**
 * Product Controller
 * 
 * Handles product catalog endpoints
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\FirebaseService;
use App\Middleware\AuthMiddleware;
use App\Services\AuditService;
use Ramsey\Uuid\Uuid;

class ProductController
{
    private FirebaseService $firebase;

    public function __construct()
    {
        $this->firebase = new FirebaseService();
    }

    /**
     * GET /api/products
     */
    public function index(): void
    {
        $category = Request::query('category');
        $available = Request::query('available');
        $search = Request::query('search');

        // Firestore REST API doesn't support complex searching like SQL.
        // We'll fetch and filter in PHP for now, or use multiple queries.

        $products = [];
        if ($category) {
            $products = $this->firebase->query('products', 'category', '==', $category);
        } else {
            // Fetch all (using a dummy query as FirebaseService lacks listDocuments)
            $products = $this->firebase->query('products', 'name', '>', '');
        }

        // Apply local filtering for 'available' and 'search'
        if ($available !== null || $search) {
            $products = array_values(array_filter($products, function ($p) use ($available, $search) {
                if ($available !== null) {
                    $isAvailable = $p['is_available'] ?? true;
                    if ($available === 'true' && !$isAvailable)
                        return false;
                    if ($available === 'false' && $isAvailable)
                        return false;
                }
                if ($search) {
                    $name = strtolower($p['name'] ?? '');
                    $desc = strtolower($p['description'] ?? '');
                    $term = strtolower($search);
                    if (!str_contains($name, $term) && !str_contains($desc, $term))
                        return false;
                }
                return true;
            }));
        }

        // Sort by name
        usort($products, fn($a, $b) => ($a['name'] ?? '') <=> ($b['name'] ?? ''));

        Response::json($products);
    }

    /**
     * GET /api/products/{id}
     */
    public function show(array $params): void
    {
        $product = $this->firebase->getDocument('products', $params['id']);

        if (!$product) {
            Response::notFound('Product not found');
        }

        // Add supplier name if needed (would need another fetch)
        if (isset($product['supplier_id'])) {
            $supplier = $this->firebase->getDocument('suppliers', $product['supplier_id']);
            $product['supplier_name'] = $supplier['name'] ?? 'Unknown';
        }

        Response::json($product);
    }

    /**
     * POST /api/products
     */
    public function store(): void
    {
        AuthMiddleware::admin();

        $data = Request::validate(['name', 'price', 'category', 'unit']);

        // Check if product name exists
        $existing = $this->firebase->query('products', 'name', '==', $data['name']);

        if (!empty($existing)) {
            Response::error('Product name already exists', 400);
        }

        $id = Uuid::uuid4()->toString();

        $productData = [
            'id' => $id,
            'name' => $data['name'],
            'price' => (float) $data['price'],
            'category' => $data['category'],
            'unit' => $data['unit'],
            'description' => $data['description'] ?? null,
            'image_url' => $data['imageUrl'] ?? null,
            'is_available' => isset($data['isAvailable']) ? (bool) $data['isAvailable'] : true,
            'is_seasonal' => isset($data['isSeasonal']) ? (bool) $data['isSeasonal'] : false,
            'packing_type' => $data['packingType'] ?? 'box',
            'supplier_id' => $data['supplierId'] ?? null,
            'createdAt' => date('c'),
            'updatedAt' => date('c')
        ];

        $this->firebase->createDocument('products', $id, $productData);

        // Record price history
        $historyId = Uuid::uuid4()->toString();
        $this->firebase->createDocument('price_history', $historyId, [
            'id' => $historyId,
            'product_id' => $id,
            'price' => (float) $data['price'],
            'effective_date' => date('c')
        ]);

        AuditService::log('CREATE', 'product', $id, json_encode($data));

        Response::created($productData);
    }

    /**
     * PUT /api/products/{id}
     */
    public function update(array $params): void
    {
        AuthMiddleware::admin();

        $id = $params['id'];
        $data = Request::body();

        $existing = $this->firebase->getDocument('products', $id);

        if (!$existing) {
            Response::notFound('Product not found');
        }

        $updates = [];
        $fieldMap = [
            'name' => 'name',
            'price' => 'price',
            'category' => 'category',
            'unit' => 'unit',
            'description' => 'description',
            'imageUrl' => 'image_url',
            'isAvailable' => 'is_available',
            'isSeasonal' => 'is_seasonal',
            'packingType' => 'packing_type',
            'supplierId' => 'supplier_id'
        ];

        foreach ($fieldMap as $jsonKey => $dbField) {
            if (isset($data[$jsonKey])) {
                $value = $data[$jsonKey];
                if (in_array($jsonKey, ['isAvailable', 'isSeasonal'])) {
                    $value = (bool) $value;
                }
                if ($jsonKey === 'price') {
                    $value = (float) $value;
                }
                $updates[$dbField] = $value;
            }
        }

        if (empty($updates)) {
            Response::error('No fields to update', 400);
        }

        $updates['updatedAt'] = date('c');
        $this->firebase->updateDocument('products', $id, $updates);

        // Record price history if price changed
        if (isset($data['price']) && (float) $data['price'] != (float) $existing['price']) {
            $historyId = Uuid::uuid4()->toString();
            $this->firebase->createDocument('price_history', $historyId, [
                'id' => $historyId,
                'product_id' => $id,
                'price' => (float) $data['price'],
                'effective_date' => date('c')
            ]);
        }

        AuditService::log('UPDATE', 'product', $id, json_encode($data));

        $product = $this->firebase->getDocument('products', $id);
        Response::success($product);
    }

    /**
     * DELETE /api/products/{id}
     */
    public function destroy(array $params): void
    {
        AuthMiddleware::admin();

        $id = $params['id'];

        // Check if product has order items (needs a query)
        $orderItems = $this->firebase->query('order_items', 'product_id', '==', $id);

        if (!empty($orderItems)) {
            // Soft delete
            $this->firebase->updateDocument('products', $id, ['is_available' => false]);
            AuditService::log('SOFT_DELETE', 'product', $id);
            Response::success(['message' => 'Product marked as unavailable']);
            return;
        }

        $this->firebase->deleteDocument('products', $id);
        AuditService::log('DELETE', 'product', $id);
        Response::noContent();
    }

    /**
     * GET /api/products/{id}/price-history
     */
    public function priceHistory(array $params): void
    {
        AuthMiddleware::admin();

        $history = $this->firebase->query('price_history', 'product_id', '==', $params['id']);

        // Sort DESC
        usort($history, fn($a, $b) => ($b['effective_date'] ?? '') <=> ($a['effective_date'] ?? ''));

        Response::json($history);
    }
}
