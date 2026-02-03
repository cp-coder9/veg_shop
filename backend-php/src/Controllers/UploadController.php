<?php
/**
 * Upload Controller
 * 
 * Handles file uploads
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\AuditService;

class UploadController
{
    /**
     * POST /api/upload
     */
    public function store(): void
    {
        // Check authentication (admin only for now, or authenticated users)
        $role = Request::userRole();
        if (!$role) {
            Response::unauthorized();
        }

        if (!isset($_FILES['file'])) {
            Response::badRequest('No file uploaded');
        }

        $file = $_FILES['file'];
        
        if ($file['error'] !== UPLOAD_ERR_OK) {
            Response::error('File upload failed', 400);
        }

        // Validate file type
        $allowedTypes = explode(',', $_ENV['UPLOAD_ALLOWED_TYPES'] ?? 'image/jpeg,image/png,application/pdf');
        if (!in_array($file['type'], $allowedTypes)) {
            Response::badRequest('Invalid file type');
        }

        // Validate file size
        $maxSize = (int)($_ENV['UPLOAD_MAX_SIZE'] ?? 10485760);
        if ($file['size'] > $maxSize) {
            Response::badRequest('File too large');
        }

        // Ensure upload directory exists
        $uploadDir = __DIR__ . '/../../public/uploads';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Generate filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid() . '.' . $extension;
        $targetPath = $uploadDir . '/' . $filename;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $url = ($_ENV['APP_URL'] ?? '') . '/uploads/' . $filename;
            
            AuditService::log('UPLOAD', 'file', null, json_encode(['filename' => $filename]));
            
            Response::json(['url' => $url]);
        } else {
            Response::error('Failed to save file', 500);
        }
    }
}
