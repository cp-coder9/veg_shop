import { Router, Request, Response } from 'express';
import { uploadSingle } from '../middleware/upload.middleware.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import fs from 'fs';
import path from 'path';

const router = Router();

/**
 * POST /api/upload/image
 * Upload a single image (admin only)
 */
router.post(
  '/image',
  authenticate,
  requireAdmin,
  (req: Request, res: Response) => {
    uploadSingle(req, res, (err: unknown) => {
      if (err) {
        console.error('Upload error:', err);
        
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        
        if (errorMessage.includes('Invalid file type')) {
          return res.status(400).json({
            error: {
              code: 'INVALID_FILE_TYPE',
              message: errorMessage,
            },
          });
        }
        
        if (errorMessage.includes('File too large')) {
          return res.status(400).json({
            error: {
              code: 'FILE_TOO_LARGE',
              message: 'File size exceeds 5MB limit',
            },
          });
        }
        
        return res.status(500).json({
          error: {
            code: 'UPLOAD_ERROR',
            message: 'Failed to upload file',
          },
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          error: {
            code: 'NO_FILE',
            message: 'No file uploaded',
          },
        });
      }
      
      // Return the file URL
      const fileUrl = `/uploads/${req.file.filename}`;
      
      return res.json({
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    });
  }
);

/**
 * DELETE /api/upload/image/:filename
 * Delete an uploaded image (admin only)
 */
router.delete(
  '/image/:filename',
  authenticate,
  requireAdmin,
  (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      
      // Validate filename (prevent path traversal)
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({
          error: {
            code: 'INVALID_FILENAME',
            message: 'Invalid filename',
          },
        });
      }
      
      const filePath = path.join(process.cwd(), 'uploads', filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          error: {
            code: 'FILE_NOT_FOUND',
            message: 'File not found',
          },
        });
      }
      
      // Delete the file
      fs.unlinkSync(filePath);
      
      return res.json({
        message: 'File deleted successfully',
        filename,
      });
    } catch (error) {
      console.error('Delete error:', error);
      return res.status(500).json({
        error: {
          code: 'DELETE_ERROR',
          message: 'Failed to delete file',
        },
      });
    }
  }
);

/**
 * GET /api/upload/images
 * List all uploaded images (admin only)
 */
router.get(
  '/images',
  authenticate,
  requireAdmin,
  (_req: Request, res: Response) => {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      
      if (!fs.existsSync(uploadsDir)) {
        return res.json([]);
      }
      
      const files = fs.readdirSync(uploadsDir);
      
      const images = files
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
        })
        .map(file => {
          const filePath = path.join(uploadsDir, file);
          const stats = fs.statSync(filePath);
          
          return {
            filename: file,
            url: `/uploads/${file}`,
            size: stats.size,
            createdAt: stats.birthtime,
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      return res.json(images);
    } catch (error) {
      console.error('List images error:', error);
      return res.status(500).json({
        error: {
          code: 'LIST_ERROR',
          message: 'Failed to list images',
        },
      });
    }
  }
);

export default router;
