<?php

require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

use App\Services\FirebaseService;

$firebase = new FirebaseService();
$products = $firebase->listDocuments('products');

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
        $firebase->updateDocument('products', $p['id'], $updates);
        // Also remove the old fields to save space and reduce confusion
        //$firebase->deleteField('products', $p['id'], 'categoryId');
        $updated++;
        echo "Updated product {$p['id']}\n";
    }
}

echo "\nTotal updated: {$updated}\n";
