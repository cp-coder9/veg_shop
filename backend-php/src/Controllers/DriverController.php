<?php
/**
 * Driver Controller
 * 
 * Handles driver specific endpoints
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\FirebaseService;
use App\Middleware\AuthMiddleware;
use App\Services\AuditService;
use Ramsey\Uuid\Uuid;

class DriverController
{
    private FirebaseService $firebase;

    public function __construct()
    {
        $this->firebase = new FirebaseService();
    }

    /**
     * POST /api/driver/log
     */
    public function log(): void
    {
        AuthMiddleware::driver();

        $data = Request::validate(['startKm']);
        $driverId = Request::userId();

        $id = Uuid::uuid4()->toString();

        $logData = [
            'id' => $id,
            'driver_id' => $driverId,
            'start_km' => $data['startKm'],
            'vehicle_reg' => $data['vehicleReg'] ?? null,
            'notes' => $data['notes'] ?? null,
            'date' => date('Y-m-d'),
            'timestamp' => date('c')
        ];

        $this->firebase->createDocument('driver_logs', $id, $logData);

        AuditService::log('CREATE_LOG', 'driver_log', $id);

        Response::created($logData);
    }

    /**
     * GET /api/driver/logs
     */
    public function logs(): void
    {
        AuthMiddleware::driver();
        $driverId = Request::userId();

        $logs = $this->firebase->query('driver_logs', 'driver_id', '==', $driverId);

        // Sort by date DESC
        usort($logs, fn($a, $b) => ($b['timestamp'] ?? '') <=> ($a['timestamp'] ?? ''));

        // Limit to 30
        $logs = array_slice($logs, 0, 30);

        Response::json($logs);
    }
}
