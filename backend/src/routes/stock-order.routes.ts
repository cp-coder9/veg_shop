import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { stockOrderService } from '../services/stock-order.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

// Validation schemas
const createStockOrderSchema = z.object({
  weekStartDate: z.string().transform(str => new Date(str)),
  supplierId: z.string().optional(),
  supplierName: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    category: z.string(),
    unit: z.string(),
    orderedQuantity: z.number().int().positive(),
    pricePerUnit: z.number(),
    customerId: z.string().optional(),
    orderId: z.string().optional(),
  })).min(1, 'At least one item is required'),
  notes: z.string().optional(),
});

const updateReceivedSchema = z.object({
  items: z.array(z.object({
    stockOrderItemId: z.string(),
    receivedQuantity: z.number().int().min(0),
  })).min(1),
});

const historySchema = z.object({
  startDate: z.string().transform(str => new Date(str)).optional(),
  endDate: z.string().transform(str => new Date(str)).optional(),
  status: z.string().optional(),
});

/**
 * POST /api/stock-orders
 * Create a new stock order from collation (admin only)
 */
router.post('/', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = createStockOrderSchema.parse(req.body);
    
    const stockOrder = await stockOrderService.createStockOrder({
      ...data,
      createdById: req.user?.userId,
    });

    return res.status(201).json(stockOrder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
      });
    }

    console.error('Create stock order error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create stock order',
      },
    });
  }
}));

/**
 * GET /api/stock-orders
 * List all stock orders (admin only)
 */
router.get('/', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { weekStartDate, status } = req.query;

    const orders = await stockOrderService.getStockOrders({
      weekStartDate: weekStartDate ? new Date(weekStartDate as string) : undefined,
      status: status as string,
    });

    return res.json(orders);
  } catch (error) {
    console.error('Get stock orders error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch stock orders',
      },
    });
  }
}));

/**
 * GET /api/stock-orders/history
 * Get weekly collation history (admin only)
 */
router.get('/history', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, status } = req.query;

    const history = await stockOrderService.getCollationHistory({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      status: status as string,
    });

    // Parse the JSON report data for each entry
    const parsedHistory = history.map(entry => ({
      ...entry,
      reportData: entry.reportData ? JSON.parse(entry.reportData) : null,
    }));

    return res.json(parsedHistory);
  } catch (error) {
    console.error('Get collation history error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch collation history',
      },
    });
  }
}));

/**
 * GET /api/stock-orders/:id
 * Get a specific stock order (admin only)
 */
router.get('/:id', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await stockOrderService.getStockOrder(id);

    if (!order) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Stock order not found',
        },
      });
    }

    return res.json(order);
  } catch (error) {
    console.error('Get stock order error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch stock order',
      },
    });
  }
}));

/**
 * PATCH /api/stock-orders/:id/received
 * Update quantities received (admin only)
 */
router.patch('/:id/received', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateReceivedSchema.parse(req.body);

    const order = await stockOrderService.updateReceivedQuantities(id, data);

    return res.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
      });
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
    }

    console.error('Update received quantities error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update received quantities',
      },
    });
  }
}));

/**
 * POST /api/stock-orders/:id/fulfill
 * Handle fulfillment with credit for short deliveries (admin only)
 */
router.post('/:id/fulfill', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await stockOrderService.fulfillStockOrder(id);

    return res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
    }

    console.error('Fulfill stock order error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fulfill stock order',
      },
    });
  }
}));

export default router;