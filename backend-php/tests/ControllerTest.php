<?php

declare(strict_types=1);

namespace Tests;

use PHPUnit\Framework\TestCase;
use App\Controllers\ProductController;
use App\Config\Database;
use App\Core\Response;
use App\Core\Request;

/**
 * Controller tests normally require a full app bootstrap or heavy mocking.
 * We'll use a pragmatic approach: ensure they can be instantiated and basic methods exist.
 */
final class ControllerTest extends TestCase
{
    public function testControllersAreInstantiable(): void
    {
        $controllers = [
            \App\Controllers\AuthController::class,
            \App\Controllers\ProductController::class,
            \App\Controllers\OrderController::class,
            \App\Controllers\CustomerController::class,
            \App\Controllers\CategoryController::class,
            \App\Controllers\AdminController::class,
            \App\Controllers\AuditController::class,
            \App\Controllers\DriverController::class,
            \App\Controllers\InvoiceController::class,
            \App\Controllers\NotificationController::class,
            \App\Controllers\PaymentController::class,
            \App\Controllers\CreditController::class,
            \App\Controllers\PackingListController::class,
            \App\Controllers\ReportController::class,
            \App\Controllers\UploadController::class,
        ];

        foreach ($controllers as $controller) {
            $this->assertTrue(class_exists($controller), "Controller $controller should exist");
            $instance = new $controller();
            $this->assertInstanceOf($controller, $instance);
        }
    }

    public function testRouteDefinitionsExist(): void
    {
        $routesPath = __DIR__ . '/../src/routes.php';
        $this->assertFileExists($routesPath);

        // Mock a Router to load the routes
        $router = new class {
            public $routes = [];
            public function get($path, $handler)
            {
                $this->routes[] = ['GET', $path];
                return $this;
            }
            public function post($path, $handler)
            {
                $this->routes[] = ['POST', $path];
                return $this;
            }
            public function put($path, $handler)
            {
                $this->routes[] = ['PUT', $path];
                return $this;
            }
            public function delete($path, $handler)
            {
                $this->routes[] = ['DELETE', $path];
                return $this;
            }
        };

        (function ($router) use ($routesPath) {
            require $routesPath;
        })($router);

        $this->assertNotEmpty($router->routes);
    }
}
