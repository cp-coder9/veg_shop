<?php
require_once __DIR__ . '/vendor/autoload.php';
use Dotenv\Dotenv;
use App\Services\FirebaseService;

$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

$firebase = new FirebaseService();
try {
    $users = $firebase->listDocuments('users');
    echo "Found " . count($users) . " users.\n";
    foreach (array_slice($users, 0, 5) as $u) {
        echo "- {$u['email']} (role: {$u['role']})\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
