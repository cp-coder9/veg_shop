<?php
/**
 * Notification Controller
 * 
 * Handles notification endpoints
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\FirebaseService;
use App\Middleware\AuthMiddleware;
use App\Services\NotificationService;

class NotificationController
{
    private FirebaseService $firebase;

    public function __construct()
    {
        $this->firebase = new FirebaseService();
    }

    /**
     * GET /api/notifications
     */
    public function index(): void
    {
        AuthMiddleware::check();

        $role = Request::userRole();
        $userId = Request::userId();
        $limit = (int) (Request::query('limit') ?? 50);

        $notifications = [];
        if ($role === 'customer') {
            $notifications = $this->firebase->query('notifications', 'customer_id', '==', $userId);
        } else {
            // Fetch all (with dummy query)
            $notifications = $this->firebase->query('notifications', 'status', '>', '');
        }

        // Sort by created_at DESC
        usort($notifications, fn($a, $b) => ($b['created_at'] ?? '') <=> ($a['created_at'] ?? ''));

        if ($limit > 0) {
            $notifications = array_slice($notifications, 0, $limit);
        }

        Response::json($notifications);
    }

    /**
     * PUT /api/notifications/{id}/read
     */
    public function markRead(array $params): void
    {
        AuthMiddleware::check();

        $id = $params['id'];
        $role = Request::userRole();
        $userId = Request::userId();

        $notification = $this->firebase->getDocument('notifications', $id);

        if (!$notification) {
            Response::notFound('Notification not found');
        }

        if ($role === 'customer' && ($notification['customer_id'] ?? '') !== $userId) {
            Response::forbidden();
        }

        $this->firebase->updateDocument('notifications', $id, [
            'status' => 'read',
            'updated_at' => date('c')
        ]);

        Response::success(['id' => $id, 'status' => 'read']);
    }

    /**
     * POST /api/notifications/send (Admin only)
     */
    public function send(): void
    {
        AuthMiddleware::admin();

        $data = Request::validate(['customerId', 'type', 'content']);
        $method = $data['method'] ?? 'email';

        $id = \Ramsey\Uuid\Uuid::uuid4()->toString();

        $notificationData = [
            'id' => $id,
            'customer_id' => $data['customerId'],
            'type' => $data['type'],
            'method' => $method,
            'content' => $data['content'],
            'status' => 'pending',
            'created_at' => date('c'),
            'updated_at' => date('c')
        ];

        $this->firebase->createDocument('notifications', $id, $notificationData);

        Response::success(['message' => 'Notification queued', 'id' => $id]);
    }
}
