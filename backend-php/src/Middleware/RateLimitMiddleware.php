<?php
/**
 * Rate Limit Middleware
 * 
 * Simple file-based rate limiting
 */

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;

class RateLimitMiddleware
{
    private int $maxRequests;
    private int $windowSeconds;
    private string $cacheDir;

    public function __construct(?int $maxRequests = null, ?int $windowSeconds = null)
    {
        $this->maxRequests = $maxRequests ?? (int)($_ENV['RATE_LIMIT_REQUESTS'] ?? 100);
        $this->windowSeconds = $windowSeconds ?? (int)($_ENV['RATE_LIMIT_WINDOW'] ?? 60);
        $this->cacheDir = __DIR__ . '/../../storage/rate_limits';

        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }
    }

    /**
     * Handle rate limiting
     */
    public function handle(): void
    {
        $ip = Request::ip();
        $key = md5($ip);
        $file = $this->cacheDir . '/' . $key;

        $data = $this->getData($file);
        $now = time();

        // Reset if window has passed
        if ($now - $data['window_start'] >= $this->windowSeconds) {
            $data = [
                'window_start' => $now,
                'count' => 0
            ];
        }

        $data['count']++;

        // Check limit
        if ($data['count'] > $this->maxRequests) {
            $retryAfter = $this->windowSeconds - ($now - $data['window_start']);
            header("Retry-After: {$retryAfter}");
            Response::error('Too many requests', 429);
        }

        // Save data
        file_put_contents($file, json_encode($data));

        // Set rate limit headers
        header("X-RateLimit-Limit: {$this->maxRequests}");
        header("X-RateLimit-Remaining: " . ($this->maxRequests - $data['count']));
        header("X-RateLimit-Reset: " . ($data['window_start'] + $this->windowSeconds));
    }

    /**
     * Get rate limit data from file
     */
    private function getData(string $file): array
    {
        if (file_exists($file)) {
            $content = file_get_contents($file);
            $data = json_decode($content, true);
            if (is_array($data)) {
                return $data;
            }
        }

        return [
            'window_start' => time(),
            'count' => 0
        ];
    }

    /**
     * Static check
     */
    public static function check(): void
    {
        (new self())->handle();
    }

    /**
     * Auth-specific rate limit (stricter)
     */
    public static function auth(): void
    {
        (new self(10, 60))->handle(); // 10 requests per minute for auth
    }
}
