<?php
/**
 * Seed Products from Google Form
 * 
 * This script populates the Firestore database with categories and products
 * extracted from the "Our Harvest Tote" Google Form.
 */

require_once __DIR__ . '/../vendor/autoload.php';

use App\Services\FirebaseService;
use Dotenv\Dotenv;
use Ramsey\Uuid\Uuid;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

$firebase = new FirebaseService();

$categories = [
    'Bakery & Pantry' => ['Monday: Bakery items, broths, eggs, So natural nut and date products'],
    'Vegetables' => ['Wednesday: Fresh vegetables'],
    'Fruit' => ['Wednesday: Fruit'],
    'Dairy' => ['Every second Friday: Raw dairy from Mysthill'],
    'Meat & Protein' => ['Pasture-raised frozen chicken, beef, trout, tofu, tempeh'],
];

$categoryIds = [];

echo "--- Seeding Categories ---\n";
foreach ($categories as $name => $desc) {
    if (is_array($desc))
        $desc = implode(' ', $desc);
    $id = strtolower(str_replace([' ', '&'], ['-', 'n'], $name));
    echo "Creating category: $name ($id)... ";
    $firebase->createDocument('categories', $id, [
        'id' => $id,
        'name' => $name,
        'description' => $desc,
        'status' => 'active',
        'createdAt' => date('c'),
        'updatedAt' => date('c')
    ]);
    $categoryIds[$name] = $id;
    echo "OK\n";
}

$raw_products = [
    ["name" => "Wholewheat Sourdough Loaf 800g", "price" => 68.0, "category" => "Bakery & Pantry"],
    ["name" => "White Sourdough Loaf 800g", "price" => 68.0, "category" => "Bakery & Pantry"],
    ["name" => "Ciabatta 400g", "price" => 40.0, "category" => "Bakery & Pantry"],
    ["name" => "Baguette Loaf", "price" => 35.0, "category" => "Bakery & Pantry"],
    ["name" => "Wholewheat focaccia", "price" => 40.0, "category" => "Bakery & Pantry"],
    ["name" => "Seeded focaccia", "price" => 40.0, "category" => "Bakery & Pantry"],
    ["name" => "Beef bone broth 1L", "price" => 95.0, "category" => "Bakery & Pantry"],
    ["name" => "Chicken bone broth 1L", "price" => 95.0, "category" => "Bakery & Pantry"],
    ["name" => "Vegetable broth 1L", "price" => 85.0, "category" => "Bakery & Pantry"],
    ["name" => "Pasture-raised Eggs XL doz", "price" => 64.0, "category" => "Bakery & Pantry"],
    ["name" => "Free-range eggs XL 6pk", "price" => 32.0, "category" => "Bakery & Pantry"],
    ["name" => "Roasted almonds XL 500g", "price" => 140.0, "category" => "Bakery & Pantry"],
    ["name" => "Roasted cashews XL 500g", "price" => 140.0, "category" => "Bakery & Pantry"],
    ["name" => "Roasted mixed nuts 500g", "price" => 140.0, "category" => "Bakery & Pantry"],
    ["name" => "Pecan nuts 500g", "price" => 160.0, "category" => "Bakery & Pantry"],
    ["name" => "Raisins 500g", "price" => 80.0, "category" => "Bakery & Pantry"],
    ["name" => "Nut butter - Crunchy mix roasted 350g", "price" => 120.0, "category" => "Bakery & Pantry"],
    ["name" => "Nut butter - roasted almond 350g", "price" => 95.0, "category" => "Bakery & Pantry"],
    ["name" => "Nut butter - macadamia raw 350g", "price" => 95.0, "category" => "Bakery & Pantry"],
    ["name" => "Nut butter - Pecan & date 350g", "price" => 110.0, "category" => "Bakery & Pantry"],
    ["name" => "Nut butter cashew roasted 350g", "price" => 95.0, "category" => "Bakery & Pantry"],
    ["name" => "Vanilla extract 125ml", "price" => 135.0, "category" => "Bakery & Pantry"],
    ["name" => "Raw honey fynbos 500g", "price" => 110.0, "category" => "Bakery & Pantry"],
    ["name" => "Raw honey fynbos 1.3kg", "price" => 230.0, "category" => "Bakery & Pantry"],
    ["name" => "Macadamia oil 750ml", "price" => 150.0, "category" => "Bakery & Pantry"],
    ["name" => "Snacking Cucumber 500g", "price" => 60.0, "category" => "Vegetables"],
    ["name" => "Asparagus green bunch", "price" => 65.0, "category" => "Vegetables"],
    ["name" => "Pak choi", "price" => 38.0, "category" => "Vegetables"],
    ["name" => "Baby spinach 120g", "price" => 37.0, "category" => "Vegetables"],
    ["name" => "Baby marrow 500g", "price" => 55.0, "category" => "Vegetables"],
    ["name" => "Beetroot bunch", "price" => 30.0, "category" => "Vegetables"],
    ["name" => "Green beans 500g", "price" => 40.0, "category" => "Vegetables"],
    ["name" => "Onions 1kg", "price" => 35.0, "category" => "Vegetables"],
    ["name" => "Ginger 200g", "price" => 60.0, "category" => "Vegetables"],
    ["name" => "QC Leeks", "price" => 32.0, "category" => "Vegetables"],
    ["name" => "Mint bunch", "price" => 25.0, "category" => "Vegetables"],
    ["name" => "Lettuce cos head", "price" => 27.0, "category" => "Vegetables"],
    ["name" => "Sweet potato 1kg", "price" => 42.0, "category" => "Vegetables"],
    ["name" => "Organic lemons 1kg", "price" => 35.0, "category" => "Fruit"],
    ["name" => "Frozen blueberries 500g", "price" => 70.0, "category" => "Fruit"],
    ["name" => "Organic Grapefruit 1kg", "price" => 40.0, "category" => "Fruit"],
    ["name" => "Free range beef biltong 100g", "price" => 70.0, "category" => "Meat & Protein"],
    ["name" => "Tofu 350g", "price" => 60.0, "category" => "Meat & Protein"],
    ["name" => "Raw milk 1L plastic", "price" => 37.0, "category" => "Dairy"],
    ["name" => "Ghee 250ml", "price" => 84.0, "category" => "Dairy"],
    ["name" => "Feta 250ml", "price" => 62.0, "category" => "Dairy"],
];

echo "\n--- Seeding Products ---\n";
foreach ($raw_products as $p) {
    $id = Uuid::uuid4()->toString();
    $catId = $categoryIds[$p['category']] ?? 'others';
    echo "Creating product: {$p['name']}... ";

    $productData = [
        'id' => $id,
        'categoryId' => $catId,
        'name' => $p['name'],
        'description' => '',
        'price' => (float) $p['price'],
        'stock' => 100,
        'unit' => 'unit',
        'image' => '',
        'status' => 'active',
        'createdAt' => date('c'),
        'updatedAt' => date('c')
    ];

    $firebase->createDocument('products', $id, $productData);
    echo "OK\n";
}

echo "\n--- SEEDING COMPLETE ---\n";
