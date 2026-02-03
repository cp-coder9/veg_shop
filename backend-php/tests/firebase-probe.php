<?php
/**
 * Firebase Connectivity Probe
 * 
 * Verifies that the FirebaseService can connect to Firestore
 * and fetch data using the configured credentials.
 */

require_once __DIR__ . '/../vendor/autoload.php';

use App\Services\FirebaseService;
use Dotenv\Dotenv;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

echo "--- Firebase Connectivity Probe ---\n";
echo "Project ID: " . ($_ENV['FIREBASE_PROJECT_ID'] ?? 'NOT SET') . "\n";
echo "API Key Prefix: " . substr($_ENV['FIREBASE_API_KEY'] ?? 'NONE', 0, 8) . "...\n\n";

try {
    $firebase = new FirebaseService();

    echo "1. Testing Product Fetch (Collection: products)...\n";
    // We'll use a dummy query or getDocument if we knew an ID, 
    // but query by status or something is safer for list.
    // Let's just try to fetch categories (usually smaller)
    $categories = $firebase->query('categories', 'name', '>', '');

    echo "Successfully fetched " . count($categories) . " categories.\n";
    if (count($categories) > 0) {
        echo "First category: " . ($categories[0]['name'] ?? 'Unknown') . "\n";
    }

    echo "\n2. Testing Product Fetch (Collection: products)...\n";
    $products = $firebase->query('products', 'name', '>', '');
    echo "Successfully fetched " . count($products) . " products.\n";

    echo "\n--- PROBE SUCCESSFUL ---\n";
} catch (\Exception $e) {
    echo "\n!!! PROBE FAILED !!!\n";
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
