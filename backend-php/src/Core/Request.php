<?php
/**
 * Request Helper
 * 
 * Provides easy access to request data
 */

declare(strict_types=1);

namespace App\Core;

class Request
{
    private static ?array $body = null;
    private static ?array $user = null;

    /**
     * Get the request body as an array
     */
    public static function body(): array
    {
        if (self::$body === null) {
            $input = file_get_contents('php://input');
            self::$body = json_decode($input, true) ?? [];
        }
        return self::$body;
    }

    /**
     * Set the request body manually
     */
    public static function setBody(array $body): void
    {
        self::$body = $body;
    }

    /**
     * Get a specific field from the request body
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        return self::body()[$key] ?? $default;
    }

    /**
     * Get query parameters
     */
    public static function query(string $key = null, mixed $default = null): mixed
    {
        if ($key === null) {
            return $_GET;
        }
        return $_GET[$key] ?? $default;
    }

    /**
     * Get a header value
     */
    public static function header(string $name): ?string
    {
        $name = strtoupper(str_replace('-', '_', $name));

        // Check for Authorization header specifically
        if ($name === 'AUTHORIZATION') {
            if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
                return $_SERVER['HTTP_AUTHORIZATION'];
            }
            if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
                return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
            }
            // For Apache with mod_rewrite
            if (function_exists('apache_request_headers')) {
                $headers = apache_request_headers();
                if (isset($headers['Authorization'])) {
                    return $headers['Authorization'];
                }
            }
        }

        return $_SERVER['HTTP_' . $name] ?? null;
    }

    /**
     * Get Bearer token from Authorization header
     */
    public static function bearerToken(): ?string
    {
        $header = self::header('Authorization');
        if ($header && preg_match('/Bearer\s+(.+)/i', $header, $matches)) {
            return $matches[1];
        }
        return null;
    }

    /**
     * Set authenticated user
     */
    public static function setUser(array $user): void
    {
        self::$user = $user;
    }

    /**
     * Get authenticated user
     */
    public static function user(): ?array
    {
        return self::$user;
    }

    /**
     * Get authenticated user ID
     */
    public static function userId(): ?string
    {
        return self::$user['userId'] ?? null;
    }

    /**
     * Get authenticated user role
     */
    public static function userRole(): ?string
    {
        return self::$user['role'] ?? null;
    }

    /**
     * Get client IP address
     */
    public static function ip(): string
    {
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            return trim($ips[0]);
        }
        if (!empty($_SERVER['HTTP_X_REAL_IP'])) {
            return $_SERVER['HTTP_X_REAL_IP'];
        }
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }

    /**
     * Get user agent
     */
    public static function userAgent(): string
    {
        return $_SERVER['HTTP_USER_AGENT'] ?? '';
    }

    /**
     * Get request method
     */
    public static function method(): string
    {
        return $_SERVER['REQUEST_METHOD'];
    }

    /**
     * Check if request expects JSON
     */
    public static function wantsJson(): bool
    {
        $accept = self::header('Accept') ?? '';
        return str_contains($accept, 'application/json');
    }

    /**
     * Validate required fields
     */
    public static function validate(array $required): array
    {
        $body = self::body();
        $errors = [];

        foreach ($required as $field) {
            if (!isset($body[$field]) || $body[$field] === '') {
                $errors[] = "{$field} is required";
            }
        }

        if (!empty($errors)) {
            Response::error(implode(', ', $errors), 400);
        }

        return $body;
    }
}
