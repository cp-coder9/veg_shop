<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

use App\Services\FirebaseService;

$firebase = new FirebaseService();
$categories = $firebase->listDocuments('product_categories');
echo "Categories:\n";
print_r($categories);

$suppliers = $firebase->listDocuments('suppliers');
echo "\nSuppliers:\n";
print_r($suppliers);
