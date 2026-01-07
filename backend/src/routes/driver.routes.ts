import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const updateStatusSchema = z.object({
    status: z.enum(['delivered', 'failed']), // Order status
    deliveryProof: z.enum(['handed_to_client', 'left_at_door']).optional(),
    driverNotes: z.string().optional(),
});

const logbookSchema = z.object({
    startKm: z.number().positive(),
    endKm: z.number().positive().optional(),
    vehicleReg: z.string().optional(),
    notes: z.string().optional(),
});

/**
 * GET /api/driver/orders
 * Get active orders for the authenticated driver (pending/out_for_delivery)
 */
router.get('/orders', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const driverId = req.user!.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // For now, if no specific driver assignment logic exists, we might return ALL pending orders
    // OR orders specifically assigned to this driver.
    // The plan said: "Fetch active orders for today (assigned to driver or all pending)"
    // Let's return orders assigned to this driver OR unassigned pending orders for today/future.

    const orders = await prisma.order.findMany({
        where: {
            OR: [
                { driverId: driverId },
                { driverId: null, status: 'pending' } // Pool of unassigned orders
            ],
            status: { in: ['pending', 'out_for_delivery'] },
            deliveryDate: {
                gte: today, // Only today or future
            }
        },
        include: {
            customer: {
                select: {
                    name: true,
                    address: true,
                    phone: true,
                    deliveryPreference: true,
                }
            }
        },
        orderBy: {
            deliveryDate: 'asc'
        }
    });

    return res.json(orders);
}));

/**
 * PATCH /api/driver/orders/:id/status
 * Update order status (Mark as Delivered)
 */
router.patch('/orders/:id/status', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const driverId = req.user!.userId;

    const validatedData = updateStatusSchema.parse(req.body);

    const order = await prisma.order.findUnique({
        where: { id },
    });

    if (!order) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found' } });
    }

    // Assign driver if not already assigned
    const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
            status: validatedData.status,
            driverId: driverId, // Claim the order
            deliveryProof: validatedData.deliveryProof,
            driverNotes: validatedData.driverNotes,
        }
    });

    return res.json(updatedOrder);
}));

/**
 * POST /api/driver/logs
 * Create a new logbook entry
 */
router.post('/logs', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const driverId = req.user!.userId;
    const validatedData = logbookSchema.parse(req.body);

    const log = await prisma.driverLog.create({
        data: {
            driverId,
            startKm: validatedData.startKm,
            endKm: validatedData.endKm,
            vehicleReg: validatedData.vehicleReg,
            notes: validatedData.notes,
        }
    });

    return res.status(201).json(log);
}));

/**
 * GET /api/driver/logs/today
 * Get today's logbook entry
 */
router.get('/logs/today', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const driverId = req.user!.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const log = await prisma.driverLog.findFirst({
        where: {
            driverId,
            date: {
                gte: today,
                lt: tomorrow,
            }
        }
    });

    return res.json(log || null);
}));

/**
 * PATCH /api/driver/logs/:id
 * Update logbook entry (e.g. End KM)
 */
router.patch('/logs/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const driverId = req.user!.userId;

    const validatedData = logbookSchema.partial().parse(req.body);

    const log = await prisma.driverLog.findUnique({ where: { id } });

    if (!log || log.driverId !== driverId) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Log not found' } });
    }

    const updatedLog = await prisma.driverLog.update({
        where: { id },
        data: {
            endKm: validatedData.endKm,
            notes: validatedData.notes,
        }
    });

    return res.json(updatedLog);
}));

export default router;
