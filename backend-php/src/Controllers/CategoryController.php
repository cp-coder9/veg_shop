<?php
/**
 * Category Controller
 * 
 * Handles product category endpoints
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\FirebaseService;
use App\Middleware\AuthMiddleware;
use App\Services\AuditService;
use Ramsey\Uuid\Uuid;

class CategoryController
{
    private FirebaseService $firebase;

    public function __construct()
    {
        $this->firebase = new FirebaseService();
    }

    /**
     * GET /api/categories
     */
    public function index(): void
    {
        // Fetch active categories
        $categories = $this->firebase->query('product_categories', 'is_active', '==', true);

        // Sort manually by sort_order then label
        usort($categories, function ($a, $b) {
            $sortA = (int) ($a['sort_order'] ?? 0);
            $sortB = (int) ($b['sort_order'] ?? 0);
            if ($sortA !== $sortB)
                return $sortA <=> $sortB;
            return ($a['label'] ?? '') <=> ($b['label'] ?? '');
        });

        Response::json($categories);
    }

    /**
     * GET /api/categories/{id}
     */
    public function show(array $params): void
    {
        $category = $this->firebase->getDocument('product_categories', $params['id']);

        if (!$category) {
            Response::notFound('Category not found');
        }

        Response::json($category);
    }

    /**
     * POST /api/categories
     */
    public function store(): void
    {
        AuthMiddleware::admin();

        $data = Request::validate(['key', 'label']);

        // Check if key already exists
        $existing = $this->firebase->query('product_categories', 'key', '==', $data['key']);

        if (!empty($existing)) {
            Response::error('Category key already exists', 400);
        }

        $id = Uuid::uuid4()->toString();

        $categoryData = [
            'id' => $id,
            'key' => $data['key'],
            'label' => $data['label'],
            'description' => $data['description'] ?? null,
            'sort_order' => (int) ($data['sortOrder'] ?? 0),
            'is_active' => true,
            'createdAt' => date('c'),
            'updatedAt' => date('c')
        ];

        $this->firebase->createDocument('product_categories', $id, $categoryData);

        AuditService::log('CREATE', 'category', $id, json_encode($data));

        Response::created($categoryData);
    }

    /**
     * PUT /api/categories/{id}
     */
    public function update(array $params): void
    {
        AuthMiddleware::admin();

        $id = $params['id'];
        $data = Request::body();

        $existing = $this->firebase->getDocument('product_categories', $id);

        if (!$existing) {
            Response::notFound('Category not found');
        }

        $updates = [];
        if (isset($data['label']))
            $updates['label'] = $data['label'];
        if (isset($data['description']))
            $updates['description'] = $data['description'];
        if (isset($data['isActive']))
            $updates['is_active'] = (bool) $data['isActive'];
        if (isset($data['sortOrder']))
            $updates['sort_order'] = (int) $data['sortOrder'];

        if (empty($updates)) {
            Response::error('No fields to update', 400);
        }

        $updates['updatedAt'] = date('c');
        $this->firebase->updateDocument('product_categories', $id, $updates);

        AuditService::log('UPDATE', 'category', $id, json_encode($data));

        $category = $this->firebase->getDocument('product_categories', $id);
        Response::success($category);
    }

    /**
     * DELETE /api/categories/{id}
     */
    public function destroy(array $params): void
    {
        AuthMiddleware::admin();

        $id = $params['id'];

        $existing = $this->firebase->getDocument('product_categories', $id);
        if (!$existing) {
            Response::notFound('Category not found');
        }

        // Check if category has products
        $products = $this->firebase->query('products', 'category', '==', $existing['key']);

        if (!empty($products)) {
            Response::error('Cannot delete category with existing products', 400);
        }

        $this->firebase->deleteDocument('product_categories', $id);

        AuditService::log('DELETE', 'category', $id);

        Response::noContent();
    }
}
