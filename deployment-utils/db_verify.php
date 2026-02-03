<?php
header('Content-Type: application/json');

// Attempt to load settings from .env manually or just hardcode for test
$host = 'localhost';
$db = 'ourharve_veg_db';
$user = 'prepedb1'; // Based on SERVER_DETAILS.md
$pass = '9876OurHarvestTote'; // Suspected password
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ATTR_ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    echo json_encode(['success' => true, 'message' => 'Database connected successfully!']);
} catch (\PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Connection failed: ' . $e->getMessage()]);
}
