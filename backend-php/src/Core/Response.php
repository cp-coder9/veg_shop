<?php
/**
 * Response Helper
 * 
 * Standard JSON response methods
 */

declare(strict_types=1);

namespace App\Core;

class Response
{
    /**
     * Send a JSON response
     */
    public static function json(mixed $data, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Send a success response
     */
    public static function success(mixed $data = null, string $message = 'Success', int $statusCode = 200): void
    {
        // If data is an associative array, merge success/message into it for a flatter response
        if (is_array($data) && array_keys($data) !== range(0, count($data) - 1)) {
            $data['success'] = true;
            $data['message'] = $message;
            self::json($data, $statusCode);
        } else {
            self::json([
                'success' => true,
                'message' => $message,
                'data' => $data
            ], $statusCode);
        }
    }

    /**
     * Send an error response
     */
    public static function error(string $message, int $statusCode = 400, mixed $errors = null): void
    {
        $response = [
            'success' => false,
            'error' => $message
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        self::json($response, $statusCode);
    }

    /**
     * Send a 400 Bad Request response
     */
    public static function badRequest(string $message = 'Bad Request'): void
    {
        self::error($message, 400);
    }

    /**
     * Send a 401 Unauthorized response
     */
    public static function unauthorized(string $message = 'Unauthorized'): void
    {
        self::error($message, 401);
    }

    /**
     * Send a 403 Forbidden response
     */
    public static function forbidden(string $message = 'Forbidden'): void
    {
        self::error($message, 403);
    }

    /**
     * Send a 404 Not Found response
     */
    public static function notFound(string $message = 'Not Found'): void
    {
        self::error($message, 404);
    }

    /**
     * Send a 500 Internal Server Error response
     */
    public static function serverError(string $message = 'Internal Server Error'): void
    {
        self::error($message, 500);
    }

    /**
     * Send a created response (201)
     */
    public static function created(mixed $data = null, string $message = 'Created'): void
    {
        self::success($data, $message, 201);
    }

    /**
     * Send a no content response (204)
     */
    public static function noContent(): void
    {
        http_response_code(204);
        exit;
    }

    /**
     * Send paginated response
     */
    public static function paginated(array $items, int $total, int $page, int $perPage): void
    {
        self::json([
            'success' => true,
            'data' => $items,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => ceil($total / $perPage)
            ]
        ]);
    }
}
