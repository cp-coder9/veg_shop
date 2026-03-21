import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { weeklyAvailabilityService } from '../services/weekly-availability.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { auditLog } from '../middleware/audit.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

/**
 * GET /api/availability/:weekStart
 * Get all product availability for a specific week.
 * If no records exist, auto-generates from product catalogue.
 * Requires admin auth.
 */
router.get('/:weekStart', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
        const weekStart = new Date(req.params.weekStart);
        if (isNaN(weekStart.getTime())) {
            return res.status(400).json({ error: { code: 'INVALID_DATE', message: 'Invalid weekStart date' } });
        }

        const availability = await weeklyAvailabilityService.getWeekAvailability(weekStart);
        const isConfirmed = await weeklyAvailabilityService.isWeekConfirmed(weekStart);

        return res.json({ availability, isConfirmed });
    } catch (error) {
        console.error('Get week availability error:', error);
        return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch availability' } });
    }
}));

/**
 * PUT /api/availability/:weekStart
 * Bulk update availability for a week.
 * Body: { updates: [{ productId, isAvailable }] }
 */
const bulkUpdateSchema = z.object({
    updates: z.array(z.object({
        productId: z.string().min(1),
        isAvailable: z.boolean(),
    })).min(1),
});

router.put('/:weekStart', authenticate, requireAdmin, auditLog('UPDATE', 'weekly_availability'), asyncHandler(async (req: Request, res: Response) => {
    try {
        const weekStart = new Date(req.params.weekStart);
        if (isNaN(weekStart.getTime())) {
            return res.status(400).json({ error: { code: 'INVALID_DATE', message: 'Invalid weekStart date' } });
        }

        const { updates } = bulkUpdateSchema.parse(req.body);
        const result = await weeklyAvailabilityService.bulkUpdateAvailability(weekStart, updates);

        return res.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.errors } });
        }
        console.error('Bulk update availability error:', error);
        return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update availability' } });
    }
}));

/**
 * PATCH /api/availability/:weekStart/:productId
 * Toggle a single product's availability for a week.
 * Body: { isAvailable: boolean }
 */
router.patch('/:weekStart/:productId', authenticate, requireAdmin, auditLog('UPDATE', 'weekly_availability'), asyncHandler(async (req: Request, res: Response) => {
    try {
        const weekStart = new Date(req.params.weekStart);
        if (isNaN(weekStart.getTime())) {
            return res.status(400).json({ error: { code: 'INVALID_DATE', message: 'Invalid weekStart date' } });
        }

        const { isAvailable } = z.object({ isAvailable: z.boolean() }).parse(req.body);
        const result = await weeklyAvailabilityService.toggleProductAvailability(
            req.params.productId,
            weekStart,
            isAvailable,
        );

        return res.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.errors } });
        }
        console.error('Toggle availability error:', error);
        return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to toggle availability' } });
    }
}));

/**
 * POST /api/availability/:weekStart/confirm
 * Mark the week's availability as confirmed (locks it).
 */
router.post('/:weekStart/confirm', authenticate, requireAdmin, auditLog('CONFIRM', 'weekly_availability'), asyncHandler(async (req: Request, res: Response) => {
    try {
        const weekStart = new Date(req.params.weekStart);
        if (isNaN(weekStart.getTime())) {
            return res.status(400).json({ error: { code: 'INVALID_DATE', message: 'Invalid weekStart date' } });
        }

        const adminId = req.user!.userId;
        const result = await weeklyAvailabilityService.confirmWeekAvailability(weekStart, adminId);

        return res.json(result);
    } catch (error) {
        console.error('Confirm availability error:', error);
        return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to confirm availability' } });
    }
}));

/**
 * POST /api/availability/:weekStart/copy-previous
 * Copy last week's availability to the target week.
 */
router.post('/:weekStart/copy-previous', authenticate, requireAdmin, auditLog('COPY', 'weekly_availability'), asyncHandler(async (req: Request, res: Response) => {
    try {
        const weekStart = new Date(req.params.weekStart);
        if (isNaN(weekStart.getTime())) {
            return res.status(400).json({ error: { code: 'INVALID_DATE', message: 'Invalid weekStart date' } });
        }

        const result = await weeklyAvailabilityService.copyPreviousWeek(weekStart);

        return res.json(result);
    } catch (error: any) {
        if (error.message?.includes('No availability data found')) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: error.message } });
        }
        console.error('Copy previous week error:', error);
        return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to copy previous week' } });
    }
}));

export default router;
