<?php
// Remote MySQL Diagnostic Script
header('Content-Type: text/plain');

$host = '169.239.218.68';
$user = 'prepedb1';
$pass = '9876OurHarvestTote';
$db = 'ourharve_veg_db'; // Try the DB name from deploy.js too
$port = 3306;

echo "Diagnostic Start: Remote MySQL Test (Alt Creds)\n";
echo "Target: $host:$port (User: $user)\n";
echo "-----------------------------------\n";

try {
    $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5
    ]);

    echo "✅ SUCCESS: Connected to database!\n";

    // Count Users
    $stmt = $pdo->query("SELECT COUNT(*) FROM users");
    $count = $stmt->fetchColumn();
    echo "User Count in DB: $count\n";

    if ($count > 0) {
        $stmt = $pdo->query("SELECT id, email, role FROM users LIMIT 3");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "Sample Users:\n";
        print_r($users);
    }

} catch (PDOException $e) {
    echo "❌ FAILURE: Connection failed.\n";
    echo "Error: " . $e->getMessage() . "\n";
}

// Also try the other DB name 'prepedb1_prod7' with these creds?
echo "\n--- Test 2: Same user, different DB 'prepedb1_prod7' ---\n";
try {
    $db2 = 'prepedb1_prod7';
    $dsn = "mysql:host=$host;port=$port;dbname=$db2;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5
    ]);
    echo "✅ SUCCESS: Connected to DB '$db2'!\n";
} catch (PDOException $e) {
    echo "❌ FAILURE: Connection to '$db2' failed.\n";
    echo "Error: " . $e->getMessage() . "\n";
}

echo "-----------------------------------\n";
echo "End of Test.\n";
