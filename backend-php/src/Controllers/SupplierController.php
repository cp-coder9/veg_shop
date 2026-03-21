<?php
/**
 * Supplier Controller
 * 
 * Handles supplier management endpoints
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\FirebaseService;
use App\Middleware\AuthMiddleware;
use App\Services\AuditService;
use Ramsey\Uuid\Uuid;

class SupplierController
{
    private FirebaseService $firebase;

    public function __construct()
    {
        $this->firebase = new FirebaseService();
    }

    /**
     * GET /api/admin/suppliers
     */
    public function index(): void
    {
        AuthMiddleware::admin();

        // Fetch all suppliers
        $suppliers = $this->firebase->listDocuments('suppliers');

        // Fetch all products to count per supplier
        $allProducts = $this->firebase->listDocuments('products');
        $counts = [];
        foreach ($allProducts as $p) {
            $sid = $p['supplierId'] ?? 'unlinked';
            $counts[$sid] = ($counts[$sid] ?? 0) + 1;
        }

        foreach ($suppliers as &$s) {
            $s['_count'] = [
                'products' => $counts[$s['id']] ?? 0
            ];
        }

        // Sort manually by name
        usort($suppliers, function ($a, $b) {
            return ($a['name'] ?? '') <=> ($b['name'] ?? '');
        });

        Response::json($suppliers);
    }

    /**
     * POST /api/admin/suppliers
     */
    public function store(): void
    {
        AuthMiddleware::admin();

        $data = Request::validate(['name']);

        $id = Uuid::uuid4()->toString();

        $supplierData = [
            'id' => $id,
            'name' => $data['name'],
            'contactInfo' => $data['contactInfo'] ?? null,
            'isAvailable' => true,
            'createdAt' => date('c'),
            'updatedAt' => date('c')
        ];

        $this->firebase->createDocument('suppliers', $id, $supplierData);

        AuditService::log('CREATE', 'supplier', $id, json_encode($data));

        Response::created($supplierData);
    }

    /**
     * PUT /api/admin/suppliers/{id}
     */
    public function update(array $params): void
    {
        AuthMiddleware::admin();

        $id = $params['id'];
        $data = Request::validate(['name']);

        $existing = $this->firebase->getDocument('suppliers', $id);

        if (!$existing) {
            Response::notFound('Supplier not found');
        }

        $updates = [
            'name' => $data['name'],
            'updatedAt' => date('c')
        ];

        if (array_key_exists('contactInfo', Request::body())) {
            $updates['contactInfo'] = Request::body()['contactInfo'] ?? null;
        }

        $this->firebase->updateDocument('suppliers', $id, $updates);

        AuditService::log('UPDATE', 'supplier', $id, json_encode($updates));

        $supplier = $this->firebase->getDocument('suppliers', $id);
        Response::success($supplier);
    }

    /**
     * PATCH /api/admin/suppliers/{id}/availability
     */
    public function updateAvailability(array $params): void
    {
        AuthMiddleware::admin();

        $id = $params['id'];
        $data = Request::body();

        if (!isset($data['isAvailable'])) {
            Response::badRequest('isAvailable field is required');
        }

        $existing = $this->firebase->getDocument('suppliers', $id);

        if (!$existing) {
            Response::notFound('Supplier not found');
        }

        $updates = [
            'isAvailable' => (bool) $data['isAvailable'],
            'updatedAt' => date('c')
        ];

        $this->firebase->updateDocument('suppliers', $id, $updates);

        AuditService::log('UPDATE_AVAILABILITY', 'supplier', $id, json_encode($updates));

        Response::success(['message' => 'Supplier availability updated']);
    }
}
