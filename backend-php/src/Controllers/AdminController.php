<?php
/**
 * Admin Controller
 * 
 * Handles user management for admins
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\FirebaseService;
use App\Middleware\AuthMiddleware;
use App\Services\AuditService;
use App\Services\AuthService;

class AdminController
{
    private FirebaseService $firebase;

    public function __construct()
    {
        $this->firebase = new FirebaseService();
    }

    /**
     * GET /api/admin/users
     */
    public function index(): void
    {
        AuthMiddleware::admin();

        $role = Request::query('role');

        $users = [];
        if ($role) {
            $users = $this->firebase->query('users', 'role', '==', $role);
        } else {
            // Fetch all (with dummy query)
            $users = $this->firebase->query('users', 'role', '>', '');
        }

        // Sort by name
        usort($users, fn($a, $b) => ($a['name'] ?? '') <=> ($b['name'] ?? ''));

        // Strip sensitive data if any
        $users = array_map(function ($u) {
            unset($u['password']);
            return $u;
        }, $users);

        Response::json($users);
    }

    /**
     * POST /api/admin/users
     */
    public function store(): void
    {
        AuthMiddleware::admin();

        $data = Request::validate(['name', 'email', 'password', 'role']);

        try {
            $authService = new AuthService();
            // register now supports passing role in $data
            $result = $authService->register($data);

            AuditService::log('CREATE_USER', 'user', $result['user']['id'], json_encode(['role' => $data['role']]));

            Response::created($result['user']);
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    /**
     * PUT /api/admin/users/{id}/role
     */
    public function updateRole(array $params): void
    {
        AuthMiddleware::admin();

        $id = $params['id'];
        $data = Request::validate(['role']);

        if (!in_array($data['role'], ['admin', 'customer', 'driver', 'packer'])) {
            Response::badRequest('Invalid role');
        }

        $this->firebase->updateDocument('users', $id, [
            'role' => $data['role'],
            'updatedAt' => date('c')
        ]);

        AuditService::log('UPDATE_ROLE', 'user', $id, json_encode(['role' => $data['role']]));

        Response::success(['message' => 'Role updated']);
    }
}
