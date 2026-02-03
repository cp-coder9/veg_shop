<?php
/**
 * Audit Controller
 * 
 * Handles audit log retrieval
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Middleware\AuthMiddleware;
use App\Services\AuditService;

class AuditController
{
    /**
     * GET /api/audit-logs
     */
    public function index(): void
    {
        AuthMiddleware::admin();

        $filters = [
            'userId' => Request::query('userId'),
            'action' => Request::query('action'),
            'resource' => Request::query('resource'),
            'startDate' => Request::query('startDate'),
            'endDate' => Request::query('endDate'),
            'limit' => Request::query('limit') ?? 50
        ];

        $logs = AuditService::getLogs($filters);

        Response::json($logs);
    }
}
