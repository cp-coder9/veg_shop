<?php
/**
 * Audit Service
 * 
 * Handles audit logging for all operations
 */

declare(strict_types=1);

namespace App\Services;

use App\Config\Database;
use App\Core\Request;
use Ramsey\Uuid\Uuid;

class AuditService
{
    /**
     * Log an audit entry
     */
    public static function log(
        string $action,
        string $resource,
        ?string $resourceId = null,
        ?string $details = null,
        ?string $userId = null
    ): void {
        try {
            $userId = $userId ?? Request::userId();
            $firebase = new FirebaseService();
            $id = Uuid::uuid4()->toString();

            $firebase->createDocument('audit_logs', $id, [
                'id' => $id,
                'user_id' => $userId,
                'action' => $action,
                'resource' => $resource,
                'resource_id' => $resourceId,
                'details' => $details,
                'ip_address' => Request::ip(),
                'user_agent' => Request::userAgent(),
                'timestamp' => date('c')
            ]);
        } catch (\Exception $e) {
            error_log("Audit log failed: " . $e->getMessage());
        }
    }

    /**
     * Get audit logs with filtering
     */
    public static function getLogs(array $filters = []): array
    {
        $firebase = new FirebaseService();

        // Simple collection fetch - Firestore runQuery REST API is limited for complex filters without indexes
        // For now, we'll fetch logs based on a single field if provided, or just list
        $logs = [];

        if (!empty($filters['userId'])) {
            $logs = $firebase->query('audit_logs', 'user_id', '==', $filters['userId']);
        } elseif (!empty($filters['action'])) {
            $logs = $firebase->query('audit_logs', 'action', '==', $filters['action']);
        } elseif (!empty($filters['resource'])) {
            $logs = $firebase->query('audit_logs', 'resource', '==', $filters['resource']);
        } else {
            // Firestore REST API listDocuments
            // We'll need a way to list all docs, but FirebaseService only has query/get
            // I'll add a listDocuments method to FirebaseService later if needed
            // For now, let's assume we use query with a limit
            $logs = $firebase->query('audit_logs', 'action', '>', ''); // Dummy query to get all
        }

        // Sort by timestamp manually in PHP if Firestore didn't
        usort($logs, fn($a, $b) => ($b['timestamp'] ?? '') <=> ($a['timestamp'] ?? ''));

        if (!empty($filters['limit'])) {
            $logs = array_slice($logs, 0, (int) $filters['limit']);
        }

        return $logs;
    }
}
