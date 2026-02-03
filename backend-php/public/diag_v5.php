<?php
declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

header('Content-Type: application/json');

$results = [
    'php_version' => PHP_VERSION,
    'env_loaded' => false,
    'curl_enabled' => extension_loaded('curl'),
    'json_enabled' => extension_loaded('json'),
    'db_connection' => 'not_tested',
    'firebase_connectivity' => 'not_tested'
];

// 1. Try Load .env
try {
    $dotenv = Dotenv::createImmutable(__DIR__ . '/..');
    $dotenv->safeLoad();
    $results['env_loaded'] = true;
    $results['project_id'] = $_ENV['FIREBASE_PROJECT_ID'] ?? 'MISSING';
} catch (Exception $e) {
    $results['env_error'] = $e->getMessage();
}

// 2. Test MariaDB Combinations
$combinations = [
    ['host' => 'localhost', 'user' => 'prepedb1', 'pass' => '9876OurHarvestTote', 'db' => 'ourharve_veg_db'],
    ['host' => 'localhost', 'user' => 'prepedb1_prod7', 'pass' => 'prepedb1_prod7', 'db' => 'prepedb1_prod7'],
    ['host' => '169.239.218.68', 'user' => 'prepedb1_prod7', 'pass' => 'prepedb1_prod7', 'db' => 'prepedb1_prod7']
];

$results['db_tests'] = [];
foreach ($combinations as $i => $c) {
    try {
        $dsn = "mysql:host={$c['host']};dbname={$c['db']};port=3306;charset=utf8mb4";
        $pdo = new PDO($dsn, $c['user'], $c['pass'], [PDO::ATTR_TIMEOUT => 2]);
        $results['db_tests']["test_$i"] = "OK ({$c['user']}@{$c['host']})";
        $results['db_connection'] = 'OK'; // Set if any works
    } catch (Exception $e) {
        $results['db_tests']["test_$i"] = "Fail: " . $e->getMessage();
    }
}

// 3. Test Firebase Connection (Identity Toolkit)
if ($results['curl_enabled']) {
    $apiKey = $_ENV['FIREBASE_API_KEY'] ?? '';
    if ($apiKey) {
        $url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={$apiKey}";
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        $payload = [
            'email' => 'diag_test_' . time() . '@example.com',
            'password' => 'wrongpassword',
            'returnSecureToken' => true
        ];
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $decoded = json_decode((string) $response, true);
        $results['firebase_connectivity'] = "HTTP $httpCode";
        $results['firebase_full_response'] = $decoded;
    } else {
        $results['firebase_connectivity'] = 'Error: No API Key';
    }
}

// 4. Test Firebase Signup (Auth + Firestore)
if ($results['curl_enabled'] && $apiKey) {
    try {
        $email = 'diag_' . time() . '@test.com';
        $pass = 'testpass123';

        $urlAuth = "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={$apiKey}";
        $ch = curl_init($urlAuth);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'email' => $email,
            'password' => $pass,
            'returnSecureToken' => true
        ]));
        $respAuth = curl_exec($ch);
        $codeAuth = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $decodedAuth = json_decode((string) $respAuth, true);
        $results['signup_auth'] = "HTTP $codeAuth";

        if ($codeAuth === 200) {
            $userId = $decodedAuth['localId'];
            $results['signup_uid'] = $userId;

            // Try write to Firestore
            $urlDb = "https://firestore.googleapis.com/v1/projects/{$_ENV['FIREBASE_PROJECT_ID']}/databases/(default)/documents/users?documentId={$userId}";
            $ch = curl_init($urlDb);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
                'fields' => [
                    'name' => ['stringValue' => 'Diagnostic User'],
                    'email' => ['stringValue' => $email],
                    'role' => ['stringValue' => 'customer'],
                    'createdAt' => ['stringValue' => date('c')]
                ]
            ]));
            $respDb = curl_exec($ch);
            $codeDb = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            $results['signup_firestore'] = "HTTP $codeDb";
            $results['signup_firestore_resp'] = json_decode((string) $respDb, true);
        }

        if (isset($codeDb) && $codeDb === 200) {
            $userId = $results['signup_uid'];

            // 5. Test Read Back
            $urlGet = "https://firestore.googleapis.com/v1/projects/{$_ENV['FIREBASE_PROJECT_ID']}/databases/(default)/documents/users/{$userId}";
            $ch = curl_init($urlGet);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            $respGet = curl_exec($ch);
            curl_close($ch);
            $results['read_back'] = json_decode((string) $respGet, true)['fields']['email']['stringValue'] ?? 'READ_FAIL';

            // 6. Test devLogin (Integration)
            try {
                $authService = new \App\Services\AuthService();
                $loginResult = $authService->devLogin($email);
                $results['dev_login_test'] = 'OK';
                $results['tokens_generated'] = isset($loginResult['accessToken']);
            } catch (\Exception $e) {
                $results['dev_login_test'] = 'Error: ' . $e->getMessage();
            }
        }
    } catch (\Throwable $e) {
        $results['signup_exception'] = $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine();
    }
}

$results['whatsapp_api_configured'] = !empty($_ENV['WHATSAPP_API_URL']);

echo json_encode($results, JSON_PRETTY_PRINT);
