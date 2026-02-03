<?php
/**
 * Auth Controller
 * 
 * Handles authentication endpoints
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\AuthService;
use App\Middleware\RateLimitMiddleware;

class AuthController
{
    private AuthService $authService;

    public function __construct()
    {
        $this->authService = new AuthService();
    }

    /**
     * POST /api/auth/register
     */
    public function register(): void
    {
        RateLimitMiddleware::auth();

        $data = Request::validate(['name', 'email', 'password']);

        try {
            $result = $this->authService->register([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'phone' => $data['phone'] ?? null,
                'address' => $data['address'] ?? null
            ]);

            Response::success($result, 'Registration successful');
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    /**
     * POST /api/auth/login
     */
    public function login(): void
    {
        RateLimitMiddleware::auth();

        $data = Request::validate(['email', 'password']);

        try {
            $result = $this->authService->login($data['email'], $data['password']);
            Response::success($result, 'Login successful');
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 401);
        }
    }

    /**
     * POST /api/auth/refresh
     */
    public function refresh(): void
    {
        $data = Request::validate(['refreshToken']);

        try {
            $result = $this->authService->refreshToken($data['refreshToken']);
            Response::success($result, 'Token refreshed');
        } catch (\Exception $e) {
            Response::unauthorized($e->getMessage());
        }
    }

    /**
     * POST /api/auth/send-code
     */
    public function sendCode(): void
    {
        RateLimitMiddleware::auth();

        $data = Request::validate(['contact']);
        $contact = $data['contact'];

        $code = $this->authService->generateVerificationCode();
        $this->authService->storeVerificationCode($contact, $code);

        // In development, return the code
        $isDev = ($_ENV['APP_ENV'] ?? 'development') === 'development';

        Response::success([
            'message' => 'Verification code sent',
            'code' => $isDev ? $code : null
        ]);
    }

    /**
     * POST /api/auth/verify-code
     */
    public function verifyCode(): void
    {
        RateLimitMiddleware::auth();

        $data = Request::validate(['contact', 'code']);

        try {
            $result = $this->authService->verifyCode($data['contact'], $data['code']);
            Response::success($result, 'Verification successful');
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 401);
        }
    }

    /**
     * POST /api/auth/dev-login
     */
    public function devLogin(): void
    {
        $data = Request::validate(['email']);

        try {
            $result = $this->authService->devLogin($data['email']);
            Response::success($result, 'Dev login successful');
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 401);
        }
    }

    /**
     * GET /api/auth/me
     */
    public function me(): void
    {
        \App\Middleware\AuthMiddleware::check();

        $userId = Request::userId();

        $firebase = new \App\Services\FirebaseService();
        $user = $firebase->getDocument('users', $userId);

        if (!$user) {
            Response::notFound('User not found');
        }

        // Clean up sensitive fields if any (though getDocument shouldn't return password)
        unset($user['password']);

        Response::success($user);
    }
}
