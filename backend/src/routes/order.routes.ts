import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { orderService } from '../services/order.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

// Validation schemas
const createOrderSchema = z.object({
  deliveryDate: z.string().transform(str => new Date(str)),
  deliveryMethod: z.enum(['delivery', 'collection']),
  deliveryAddress: z.string().optional(),
  specialInstructions: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1, 'At least one item is required'),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'packed', 'delivered', 'cancelled']),
});

const generateBulkOrderSchema = z.object({
  weekStartDate: z.string().transform(str => new Date(str)),
  bufferPercentage: z.number().min(0).max(100).optional().default(10),
});

const sendBulkOrderSchema = z.object({
  weekStartDate: z.string().transform(str => new Date(str)),
  bufferPercentage: z.number().min(0).max(100).optional().default(10),
  supplierPhone: z.string(),
  supplierEmail: z.string().email(),
});

/**
 * POST /api/orders
 * Create a new order (authenticated customer)
 */
router.post('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = createOrderSchema.parse(req.body);
    const customerId = req.user!.userId;

    const order = await orderService.createOrder(customerId, data);

    return res.status(201).json(order);
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

    if (error instanceof Error) {
      // Handle business logic errors
      if (error.message.includes('Delivery date must be') ||
        error.message.includes('Orders must be placed by') ||
        error.message.includes('Products not available') ||
        error.message.includes('Some products do not exist')) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
        });
      }
    }

    console.error('Create order error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create order',
      },
    });
  }
}));

/**
 * GET /api/orders/:id
 * Get a single order by ID
 */
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await orderService.getOrder(id);

    if (!order) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Order not found',
        },
      });
    }

    // Customers can only view their own orders, admins can view all
    if (req.user!.role !== 'admin' && order.customerId !== req.user!.userId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this order',
        },
      });
    }

    return res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch order',
      },
    });
  }
}));

/**
 * GET /api/orders/customer/:customerId
 * Get all orders for a specific customer
 */
router.get('/customer/:customerId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    // Customers can only view their own orders, admins can view all
    if (req.user!.role !== 'admin' && customerId !== req.user!.userId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view these orders',
        },
      });
    }

    const orders = await orderService.getCustomerOrders(customerId);

    return res.json(orders);
  } catch (error) {
    console.error('Get customer orders error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch customer orders',
      },
    });
  }
}));

/**
 * GET /api/orders/delivery/:date
 * Get all orders for a specific delivery date (admin only)
 */
router.get('/delivery/:date', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const deliveryDate = new Date(date);

    if (isNaN(deliveryDate.getTime())) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid date format',
        },
      });
    }

    const orders = await orderService.getOrdersByDeliveryDate(deliveryDate);

    return res.json(orders);
  } catch (error) {
    console.error('Get orders by delivery date error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch orders',
      },
    });
  }
}));

/**
 * POST /api/orders/bulk
 * Generate bulk order consolidation (admin only)
 */
router.post('/bulk', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = generateBulkOrderSchema.parse(req.body);

    const bulkOrder = await orderService.generateBulkOrder(
      data.weekStartDate,
      data.bufferPercentage
    );

    // Generate formatted outputs
    const whatsappMessage = orderService.formatBulkOrderForWhatsApp(bulkOrder);
    const emailHtml = orderService.formatBulkOrderForEmail(bulkOrder);

    return res.json({
      bulkOrder,
      formatted: {
        whatsapp: whatsappMessage,
        email: emailHtml,
      },
    });
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

    console.error('Generate bulk order error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate bulk order',
      },
    });
  }
}));

/**
 * POST /api/orders/bulk/send
 * Send bulk order to supplier (admin only)
 */
router.post('/bulk/send', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = sendBulkOrderSchema.parse(req.body);

    const bulkOrder = await orderService.generateBulkOrder(
      data.weekStartDate,
      data.bufferPercentage
    );

    await orderService.sendBulkOrderToSupplier(bulkOrder, data.supplierPhone, data.supplierEmail);

    return res.json({
      success: true,
      message: 'Bulk order sent successfully',
    });
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

    console.error('Send bulk order error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to send bulk order',
      },
    });
  }
}));

/**
 * PATCH /api/orders/:id/status
 * Update order status (admin only)
 */
router.patch('/:id/status', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateOrderStatusSchema.parse(req.body);

    const order = await orderService.updateOrderStatus(id, data.status);

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

    if (error instanceof Error && error.message.includes('Invalid status')) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      });
    }

    console.error('Update order status error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update order status',
      },
    });
  }
}));

/**
 * GET /api/orders
 * Get all orders with optional filtering (admin only)
 */
router.get('/', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { status, deliveryDate, customerId } = req.query;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    const orders = await orderService.getOrders({
      status: status as string,
      deliveryDate: deliveryDate as string,
      customerId: customerId as string,
      limit,
    });

    return res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch orders',
      },
    });
  }
}));

export default router;
