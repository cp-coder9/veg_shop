<?php
/**
 * Veg Shop PHP API - Main Entry Point
 * 
 * Routes all API requests to appropriate controllers
 */

declare(strict_types=1);

// Error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Autoload dependencies
require_once __DIR__ . '/../vendor/autoload.php';

// Load environment variables
use Dotenv\Dotenv;
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

// Initialize application
use App\Core\Router;
use App\Core\Request;
use App\Core\Response;
use App\Middleware\CorsMiddleware;
use App\Middleware\JsonMiddleware;

// Set up error handler
set_exception_handler(function (Throwable $e) {
    $isDebug = ($_ENV['APP_DEBUG'] ?? 'false') === 'true';
    
    error_log("Uncaught exception: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Internal Server Error',
        'message' => $isDebug ? $e->getMessage() : 'An unexpected error occurred',
        'trace' => $isDebug ? explode("\n", $e->getTraceAsString()) : null
    ]);
    exit;
});

// Apply CORS middleware
CorsMiddleware::handle();

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Apply JSON middleware
JsonMiddleware::handle();

// Create router and load routes
$router = new Router();
require_once __DIR__ . '/../src/routes.php';

// Get request info
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remove base path if needed (for subdirectory installations)
$basePath = $_ENV['APP_BASE_PATH'] ?? '';
if ($basePath && strpos($uri, $basePath) === 0) {
    $uri = substr($uri, strlen($basePath));
}

// Dispatch the request
try {
    $router->dispatch($method, $uri);
} catch (Exception $e) {
    Response::error($e->getMessage(), $e->getCode() ?: 400);
}
