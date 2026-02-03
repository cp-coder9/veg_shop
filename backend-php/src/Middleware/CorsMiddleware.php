<?php
/**
 * CORS Middleware
 * 
 * Handles Cross-Origin Resource Sharing
 */

declare(strict_types=1);

namespace App\Middleware;

class CorsMiddleware
{
    /**
     * Handle CORS headers
     */
    public static function handle(): void
    {
        $allowedOrigins = explode(',', $_ENV['CORS_ORIGIN'] ?? 'http://localhost:5173');
        $allowedOrigins = array_map('trim', $allowedOrigins);

        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if (in_array($origin, $allowedOrigins) || in_array('*', $allowedOrigins)) {
            header("Access-Control-Allow-Origin: {$origin}");
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, bypass-tunnel-reminder');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');
    }
}
