<?php
/**
 * Test Login Script
 */

require_once __DIR__ . '/../vendor/autoload.php';

use App\Services\AuthService;
use Dotenv\Dotenv;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

$email = 'sasha@ourharvesttote.store';
$password = 'admintote777';

echo "--- Testing Login ---\n";
echo "Email: $email\n";

try {
    $auth = new AuthService();
    $result = $auth->login($email, $password);

    echo "Login successful!\n";
    echo "AccessToken: " . substr($result['accessToken'], 0, 20) . "...\n";
    echo "RefreshToken: " . substr($result['refreshToken'], 0, 20) . "...\n";
    echo "User: " . $result['user']['name'] . " (" . $result['user']['role'] . ")\n";
} catch (\Exception $e) {
    echo "Login failed!\n";
    echo "Error: " . $e->getMessage() . "\n";
}
