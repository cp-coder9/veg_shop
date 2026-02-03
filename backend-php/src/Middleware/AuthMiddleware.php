<?php
/**
 * Auth Middleware
 * 
 * JWT Authentication middleware
 */

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;
use App\Services\AuthService;

class AuthMiddleware
{
    private array $allowedRoles;

    public function __construct(array $allowedRoles = [])
    {
        $this->allowedRoles = $allowedRoles;
    }

    /**
     * Handle authentication check
     */
    public function handle(): void
    {
        $token = Request::bearerToken();

        if (!$token) {
            Response::unauthorized('No token provided');
        }

        try {
            $authService = new AuthService();
            $payload = $authService->validateToken($token);

            // Set user context
            Request::setUser([
                'userId' => $payload['userId'],
                'role' => $payload['role']
            ]);

            // Check role if specified
            if (!empty($this->allowedRoles)) {
                if (!in_array($payload['role'], $this->allowedRoles)) {
                    Response::forbidden('Insufficient permissions');
                }
            }
        } catch (\Exception $e) {
            Response::unauthorized($e->getMessage());
        }
    }

    /**
     * Static method for route middleware
     */
    public static function check(): void
    {
        (new self())->handle();
    }

    /**
     * Check for admin role
     */
    public static function admin(): void
    {
        (new self(['admin']))->handle();
    }

    /**
     * Check for staff role (admin, driver, packer)
     */
    public static function staff(): void
    {
        (new self(['admin', 'driver', 'packer']))->handle();
    }

    /**
     * Check for driver role
     */
    public static function driver(): void
    {
        (new self(['admin', 'driver']))->handle();
    }

    /**
     * Check for packer role
     */
    public static function packer(): void
    {
        (new self(['admin', 'packer']))->handle();
    }
}
