
import { Router, Request, Response } from 'express';
import { paymentService } from '../services/payment.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const shortDeliverySchema = z.object({
    orderId: z.string().min(1), // Accept custom format (NAME-YYYYMMDD-XXXX)
    customerId: z.string().uuid(),
    items: z.array(z.object({
        productId: z.string(),
        quantityShort: z.number().int().positive(),
    })).min(1),
});

/**
 * GET /api/credits/customer/:customerId
 * Get customer credit balance and history
 */
router.get('/customer/:customerId', authenticate, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { customerId } = req.params;

        // Check authorization - customers can only view their own credits
        if (req.user?.role !== 'admin' && customerId !== req.user?.userId) {
            return res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'Access denied',
                },
            });
        }

        const [balance, credits] = await Promise.all([
            paymentService.getCreditBalance(customerId),
            paymentService.getCustomerCredits(customerId),
        ]);

        return res.json({
            balance,
            credits,
        });
    } catch (error) {
        return res.status(500).json({
            error: {
                code: 'SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to retrieve credits',
            },
        });
    }
}));

/**
 * POST /api/credits/short-delivery
 * Record short delivery and create credit (admin only)
 */
router.post('/short-delivery', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
        const validatedData = shortDeliverySchema.parse(req.body);

        const credit = await paymentService.recordShortDelivery(validatedData);

        return res.status(201).json(credit);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: error.errors,
                },
            });
        }

        return res.status(400).json({
            error: {
                code: 'SHORT_DELIVERY_ERROR',
                message: error instanceof Error ? error.message : 'Failed to record short delivery',
            },
        });
    }
}));

export default router;
