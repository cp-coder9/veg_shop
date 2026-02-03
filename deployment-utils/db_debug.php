<?php
header('Content-Type: application/json');

// Autoload and Env Loading
require_once __DIR__ . '/api/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/api');
$dotenv->safeLoad();

$host = $_ENV['DB_HOST'] ?? 'localhost';
$port = $_ENV['DB_PORT'] ?? '3306';
$dbname = $_ENV['DB_NAME'] ?? 'veg_shop';
$username = $_ENV['DB_USER'] ?? 'root';
$password = $_ENV['DB_PASS'] ?? '';

$results = [
    'env_checks' => [
        'host' => $host,
        'port' => $port,
        'db' => $dbname,
        'user' => $username,
        'pass_set' => !empty($password),
    ],
    'connection_test' => null
];

try {
    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5
    ];

    $start = microtime(true);
    $pdo = new PDO($dsn, $username, $password, $options);
    $end = microtime(true);

    $results['connection_test'] = [
        'status' => 'success',
        'time' => round($end - $start, 4) . 's',
        'server_info' => $pdo->getAttribute(PDO::ATTR_SERVER_INFO)
    ];
} catch (PDOException $e) {
    $results['connection_test'] = [
        'status' => 'failed',
        'error_code' => $e->getCode(),
        'error_message' => $e->getMessage()
    ];
}

echo json_encode($results, JSON_PRETTY_PRINT);
