<?php
// Mock Response class locally to test logic
class Response
{
    public static function json(mixed $data, int $statusCode = 200): void
    {
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

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
}

// Mock data from AuthService
$data = [
    'accessToken' => 'access...',
    'refreshToken' => 'refresh...',
    'user' => [
        'id' => '123',
        'name' => 'Test',
        'role' => 'customer'
    ]
];

echo "Testing data array:\n";
Response::success($data, 'Login successful');

echo "\n\nTesting object cast to array (if AuthService returned object cast to array elsewhere):\n";
$objData = (array) (object) $data;
Response::success($objData, 'Login successful');
