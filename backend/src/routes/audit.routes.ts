import { Router, Request, Response } from 'express';
import { auditService } from '../services/audit.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

/**
 * GET /api/audit-logs
 * Get audit logs (admin only)
 */
router.get(
  '/',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      userId,
      action,
      resource,
      startDate,
      endDate,
      limit,
      offset,
    } = req.query;

    const filters: {
      userId?: string;
      action?: string;
      resource?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {};

    if (userId) filters.userId = userId as string;
    if (action) filters.action = action as string;
    if (resource) filters.resource = resource as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (limit) filters.limit = parseInt(limit as string, 10);
    if (offset) filters.offset = parseInt(offset as string, 10);

    const result = await auditService.getLogs(filters);

    return res.json(result);
  })
);

export default router;
