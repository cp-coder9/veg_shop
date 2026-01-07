import { Router, Request, Response } from 'express';
import { reportService } from '../services/report.service.js';
import { orderService } from '../services/order.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { reportService } from '../services/report.service.js';
import { orderService } from '../services/order.service.js';
import { customerService } from '../services/customer.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * GET /api/admin/dashboard/metrics
 * Get high-level store metrics
 */
router.get('/dashboard/metrics', authenticate, requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
    try {
        const metrics = await reportService.getDashboardMetrics();
        return res.json(metrics);
    } catch (error) {
        console.error('Get dashboard metrics error:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch dashboard metrics',
            },
        });
    }
}));

/**
 * GET /api/admin/orders
 * Get recent orders with optional limit
 */
router.get('/orders', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        const status = req.query.status as string;

        const orders = await orderService.getOrders({ limit, status });

        // Frontend expects { orders: [] } based on usage
        return res.json({ orders });
    } catch (error) {
        console.error('Get admin orders error:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch orders',
            },
        });
    }
}));

/**
 * GET /api/admin/diagnose
 * Temporary diagnostic route
 */
router.get('/diagnose', authenticate, requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
    const { prisma } = await import('../lib/prisma.js');
    const users = await prisma.user.findMany();
    const orders = await prisma.order.findMany();
    return res.json({ users, orders });
}));

export default router;
