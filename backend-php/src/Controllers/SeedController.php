<?php
/**
 * Seed Controller
 * 
 * Populates default categories and suppliers in Firestore
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Response;
use App\Services\FirebaseService;
use Ramsey\Uuid\Uuid;

class SeedController
{
    private FirebaseService $firebase;

    public function __construct()
    {
        $this->firebase = new FirebaseService();
    }

    /**
     * GET /api/dev/seed
     */
    public function run(): void
    {
        // 1. Seed Categories
        $categories = [
            ['key' => 'vegetables', 'label' => 'Vegetables', 'sortOrder' => 1],
            ['key' => 'fruit', 'label' => 'Fruit', 'sortOrder' => 2],
            ['key' => 'bakery-pantry', 'label' => 'Bakery & Pantry', 'sortOrder' => 3],
            ['key' => 'meat-protein', 'label' => 'Meat & Protein', 'sortOrder' => 4],
            ['key' => 'dairy', 'label' => 'Dairy', 'sortOrder' => 5],
        ];

        foreach ($categories as $cat) {
            $existing = $this->firebase->query('product_categories', 'key', '==', $cat['key']);
            if (empty($existing)) {
                $id = Uuid::uuid4()->toString();
                $this->firebase->createDocument('product_categories', $id, [
                    'id' => $id,
                    'key' => $cat['key'],
                    'label' => $cat['label'],
                    'description' => null,
                    'sortOrder' => $cat['sortOrder'],
                    'isActive' => true,
                    'createdAt' => date('c'),
                    'updatedAt' => date('c')
                ]);
            }
        }

        // 2. Seed Suppliers
        $suppliers = [
            'Local Farms Co.',
            'Nature Harvest',
            'Green Valley Organics',
            'Mysthill Farms'
        ];

        foreach ($suppliers as $name) {
            $existing = $this->firebase->query('suppliers', 'name', '==', $name);
            if (empty($existing)) {
                $id = Uuid::uuid4()->toString();
                $this->firebase->createDocument('suppliers', $id, [
                    'id' => $id,
                    'name' => $name,
                    'contactInfo' => null,
                    'isAvailable' => true,
                    'createdAt' => date('c'),
                    'updatedAt' => date('c')
                ]);
            }
        }

        Response::success(['message' => 'Database seeded with default categories and suppliers']);
    }

    public function migrateProducts(): void
    {
        $products = $this->firebase->listDocuments('products');

        $updated = 0;
        foreach ($products as $p) {
            $updates = [];
            if (isset($p['categoryId']) && !isset($p['category'])) {
                $updates['category'] = $p['categoryId'];
            }
            if (isset($p['status']) && !isset($p['isAvailable'])) {
                $updates['isAvailable'] = ($p['status'] === 'active');
            }

            if (!empty($updates)) {
                $this->firebase->updateDocument('products', $p['id'], $updates);
                $updated++;
            }
        }

        Response::success(['message' => "Migrated $updated products."]);
    }
}
