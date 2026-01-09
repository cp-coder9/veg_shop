import { Router, Request, Response } from 'express';
import { reportService } from '../services/report.service.js';
import { orderService } from '../services/order.service.js';
import { customerService } from '../services/customer.service.js';
import { supplierService } from '../services/supplier.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

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

/**
 * GET /api/admin/users
 * Get users by role (e.g. 'packer', 'driver')
 */
router.get('/users', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
        const role = req.query.role as string;

        if (!role) {
            return res.status(400).json({
                error: {
                    code: 'INVALID_INPUT',
                    message: 'Role query parameter is required'
                }
            });
        }

        const users = await customerService.getUsersByRole(role);
        return res.json(users);
    } catch (error) {
        console.error('Get admin users error:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch users',
            },
        });
    }
}));

/**
 * GET /api/admin/suppliers
 * Get all suppliers
 */
router.get('/suppliers', authenticate, requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
    try {
        const suppliers = await supplierService.getSuppliers();
        return res.json(suppliers);
    } catch (error) {
        console.error('Get suppliers error:', error);
        return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch suppliers' } });
    }
}));

/**
 * POST /api/admin/suppliers
 * Create a new supplier
 */
router.post('/suppliers', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
        const supplier = await supplierService.createSupplier(req.body);
        return res.status(201).json(supplier);
    } catch (error) {
        console.error('Create supplier error:', error);
        return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create supplier' } });
    }
}));

/**
 * PUT /api/admin/suppliers/:id
 * Update a supplier
 */
router.put('/suppliers/:id', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const supplier = await supplierService.updateSupplier(id, req.body);
        return res.json(supplier);
    } catch (error) {
        console.error('Update supplier error:', error);
        return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update supplier' } });
    }
}));

/**
 * PATCH /api/admin/suppliers/:id/availability
 * Toggle supplier availability
 */
router.patch('/suppliers/:id/availability', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isAvailable } = req.body;
        const supplier = await supplierService.toggleSupplierAvailability(id, isAvailable);
        return res.json(supplier);
    } catch (error) {
        console.error('Toggle supplier availability error:', error);
        return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update supplier availability' } });
    }
}));

/**
 * POST /api/admin/users
 * Create a new staff member
 */
router.post('/users', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
        const staff = await customerService.createStaff(req.body);
        return res.status(201).json(staff);
    } catch (error) {
        if (error instanceof Error && error.message.includes('exists')) {
            return res.status(409).json({ error: { code: 'CONFLICT', message: error.message } });
        }
        console.error('Create staff error:', error);
        return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create staff' } });
    }
}));

/**
 * PATCH /api/admin/users/:id
 * Update a staff member
 */
router.patch('/users/:id', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const staff = await customerService.updateStaff(id, req.body);
        return res.json(staff);
    } catch (error) {
        console.error('Update staff error:', error);
        return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update staff' } });
    }
}));

/**
 * DELETE /api/admin/users/:id
 * Delete a staff member
 */
router.delete('/users/:id', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await customerService.deleteStaff(id);
        return res.status(204).send();
    } catch (error) {
        if (error instanceof Error && error.message.includes('Foreign key constraint')) {
            return res.status(400).json({ error: { code: 'CONSTRAINT_ERROR', message: 'Cannot delete staff with associated records' } });
        }
        console.error('Delete staff error:', error);
        return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete staff' } });
    }
}));

export default router;
