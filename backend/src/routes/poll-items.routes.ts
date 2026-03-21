import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

const createPollItemSchema = z.object({
    customerId: z.string(),
    productId: z.string(),
    quantity: z.number().int().positive(),
    price: z.number(),
});

/**
 * GET /api/poll-items/customer/:customerId
 * Fetch pending poll items for a customer
 */
router.get('/customer/:customerId', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    const { customerId } = req.params;
    const items = await prisma.pollItem.findMany({
        where: {
            customerId,
            status: 'pending'
        },
        include: {
            product: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return res.json(items);
}));

/**
 * POST /api/poll-items
 * Admin creates a new poll item for a customer
 */
router.post('/', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
        const data = createPollItemSchema.parse(req.body);

        const pollItem = await prisma.pollItem.create({
            data: {
                customerId: data.customerId,
                productId: data.productId,
                quantity: data.quantity,
                price: data.price,
                status: 'pending'
            },
            include: {
                product: true
            }
        });

        return res.status(201).json(pollItem);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: { message: 'Invalid data', details: error.errors } });
        }
        throw error;
    }
}));

/**
 * DELETE /api/poll-items/:id
 * Delete a pending poll item
 */
router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const existing = await prisma.pollItem.findUnique({ where: { id } });
    if (!existing) {
        return res.status(404).json({ error: { message: 'Poll item not found' } });
    }

    if (existing.status !== 'pending') {
        return res.status(400).json({ error: { message: 'Can only delete pending poll items' } });
    }

    await prisma.pollItem.delete({ where: { id } });
    return res.status(204).end();
}));

/**
 * POST /api/poll-items/customer/:customerId/invoice
 * Generate a standalone invoice from all pending poll items for a customer
 */
router.post('/customer/:customerId/invoice', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    const { customerId } = req.params;
    try {
        const { invoiceService } = await import('../services/invoice.service.js');
        const result = await invoiceService.generatePollItemsInvoice(customerId);
        return res.status(201).json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate invoice';
        return res.status(400).json({ error: { message } });
    }
}));

export default router;
