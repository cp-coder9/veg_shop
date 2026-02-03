<?php
/**
 * JSON Middleware
 * 
 * Ensures proper JSON handling
 */

declare(strict_types=1);

namespace App\Middleware;

class JsonMiddleware
{
    /**
     * Handle JSON content type
     */
    public static function handle(): void
    {
        // Set default content type
        header('Content-Type: application/json; charset=utf-8');
    }
}
