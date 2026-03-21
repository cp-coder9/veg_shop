<?php
/**
 * Simple Router Implementation
 * 
 * Handles routing API requests to controllers
 */

declare(strict_types=1);

namespace App\Core;

class Router
{
    private array $routes = [];
    private array $middleware = [];

    /**
     * Add a GET route
     */
    public function get(string $path, callable|array $handler, array $middleware = []): self
    {
        return $this->addRoute('GET', $path, $handler, $middleware);
    }

    /**
     * Add a POST route
     */
    public function post(string $path, callable|array $handler, array $middleware = []): self
    {
        return $this->addRoute('POST', $path, $handler, $middleware);
    }

    /**
     * Add a PUT route
     */
    public function put(string $path, callable|array $handler, array $middleware = []): self
    {
        return $this->addRoute('PUT', $path, $handler, $middleware);
    }

    /**
     * Add a PATCH route
     */
    public function patch(string $path, callable|array $handler, array $middleware = []): self
    {
        return $this->addRoute('PATCH', $path, $handler, $middleware);
    }

    /**
     * Add a DELETE route
     */
    public function delete(string $path, callable|array $handler, array $middleware = []): self
    {
        return $this->addRoute('DELETE', $path, $handler, $middleware);
    }

    /**
     * Add a route
     */
    private function addRoute(string $method, string $path, callable|array $handler, array $middleware = []): self
    {
        // Convert path parameters to regex
        $pattern = preg_replace('/\{([a-zA-Z_]+)\}/', '(?P<$1>[^/]+)', $path);
        $pattern = '#^' . $pattern . '$#';

        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'pattern' => $pattern,
            'handler' => $handler,
            'middleware' => $middleware
        ];

        return $this;
    }

    /**
     * Add global middleware
     */
    public function middleware(string $middleware): self
    {
        $this->middleware[] = $middleware;
        return $this;
    }

    /**
     * Dispatch the request
     */
    public function dispatch(string $method, string $uri): void
    {
        // Normalize URI
        $uri = rtrim($uri, '/') ?: '/';

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            if (preg_match($route['pattern'], $uri, $matches)) {
                // Extract named parameters
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);

                // Run global middleware
                foreach ($this->middleware as $middleware) {
                    $this->runMiddleware($middleware);
                }

                // Run route-specific middleware
                foreach ($route['middleware'] as $middleware) {
                    $this->runMiddleware($middleware);
                }

                // Call the handler
                $handler = $route['handler'];
                if (is_array($handler)) {
                    [$class, $method] = $handler;
                    $controller = new $class();
                    $controller->$method($params);
                } else {
                    $handler($params);
                }
                return;
            }
        }

        // No route matched
        Response::notFound('Route not found');
    }

    /**
     * Run a middleware
     */
    private function runMiddleware(string $middleware): void
    {
        if (class_exists($middleware)) {
            $instance = new $middleware();
            if (method_exists($instance, 'handle')) {
                $instance->handle();
            }
        }
    }
}

// Make router globally available
global $router;
