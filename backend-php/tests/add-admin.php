<?php
/**
 * Add Admin User Script
 * 
 * Registers a new admin user in Firebase Auth and Firestore.
 */

require_once __DIR__ . '/../vendor/autoload.php';

use App\Services\AuthService;
use Dotenv\Dotenv;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

$adminEmail = 'sasha@ourharvesttote.store';
$adminPassword = 'admintote777';
$adminName = 'Sasha - Admin';

echo "--- Adding Admin User ---\n";
echo "Email: $adminEmail\n\n";

try {
    $auth = new AuthService();

    $result = $auth->register([
        'email' => $adminEmail,
        'password' => $adminPassword,
        'name' => $adminName,
        'role' => 'admin'
    ]);

    echo "Successfully created admin user!\n";
    echo "User ID: " . ($result['user']['id'] ?? 'Unknown') . "\n";
    echo "--- SUCCESS ---\n";
} catch (\Exception $e) {
    echo "!!! FAILED !!!\n";
    echo "Error: " . $e->getMessage() . "\n";

    if (str_contains($e->getMessage(), 'Email already registered')) {
        echo "\nTip: If you've already created this user in Firebase Auth but not in Firestore,\nyou may need to manually add the profile or delete the user in the console and retry.\n";
    }

    exit(1);
}
