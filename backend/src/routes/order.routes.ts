import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { orderService } from '../services/order.service.js';
import { authenticate, requireAdmin, requireStaff } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

// Validation schemas
const createOrderSchema = z.object({
  customerId: z.string().optional(), // New: Allow admin to specify customer
  deliveryDate: z.string().transform(str => new Date(str)),
  deliveryMethod: z.enum(['delivery', 'collection']),
  deliveryAddress: z.string().optional(),
  area: z.string().optional(),
  specialInstructions: z.string().optional(),
  deliveryFees: z.number().optional().default(0),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
  })).min(1, 'At least one item is required'),
  coolerBagOption: z.boolean().optional(),
  tcAccepted: z.boolean().optional().default(false),
  groupDelivery: z.boolean().optional(),
  deliveryInstruction: z.enum(['door', 'hand_to_me', 'inside_fridge', 'inside_freezer']).optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'packed', 'delivered', 'out_for_delivery', 'cancelled']),
  stage: z.enum(['pending', 'prepping', 'packed', 'handed_over', 'delivering', 'completed']).optional(),
  packedItems: z.record(z.number().int()).optional(),
  notes: z.string().optional(),
  signature: z.string().optional(),
  handoverConfirmed: z.boolean().optional(),
  packageDetails: z.string().optional(),
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
 * GET /api/orders/window-status
 * Check if the ordering window is currently open
 */
router.get('/window-status', authenticate, asyncHandler(async (_req: Request, res: Response) => {
  const status = orderService.isOrderWindowOpen();
  return res.json(status);
}));

router.get('/delivery-fee/quote', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const address = typeof req.query.address === 'string' ? req.query.address : undefined;
  const method = req.query.method === 'collection' ? 'collection' : 'delivery';
  return res.json(orderService.calculateDeliveryFee(address, method));
}));

router.post('/repeat-invoice/:invoiceId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await orderService.repeatInvoiceAsQuotation(req.params.invoiceId, req.user!.userId);
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: error.message } });
    }
    if (error instanceof Error && error.message.includes('available')) {
      return res.status(400).json({ error: { code: 'NO_AVAILABLE_ITEMS', message: error.message } });
    }
    console.error('Repeat invoice error:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create repeat quotation' } });
  }
}));

/**
 * POST /api/orders
 * Create a new order (authenticated customer)
 */
router.post('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = createOrderSchema.parse(req.body);
    const isAdmin = req.user!.role === 'admin';
    const customerId = (isAdmin && data.customerId) ? data.customerId : req.user!.userId;

    const order = await orderService.createOrder(customerId, {
      deliveryDate: data.deliveryDate,
      deliveryMethod: data.deliveryMethod,
      deliveryAddress: data.deliveryAddress,
      specialInstructions: data.specialInstructions,
      deliveryFees: data.deliveryFees,
      items: data.items.map(item => ({
        productId: item.productId!,
        quantity: item.quantity!
      })),
      coolerBagOption: data.coolerBagOption,
      groupDelivery: data.groupDelivery,
      deliveryInstruction: data.deliveryInstruction
    }, isAdmin);

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
            error.message.includes('Some products do not exist') ||
            error.message.includes('Customer not found') ||
            error.message.includes('Order is not eligible')) {
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
 * GET /api/orders/collation
 * Get collation report for procurement (admin only)
 */
router.get('/collation', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Start date and end date are required',
        },
      });
    }

    const report = await orderService.getCollationReport(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    return res.json(report);
  } catch (error) {
    console.error('Get collation report error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch collation report',
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
 * GET /api/orders/last-week
 * Get the customer's most recent order
 */
router.get('/last-week', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const customerId = req.user!.userId;
    const order = await orderService.getLastWeekOrder(customerId);
    return res.json(order);
  } catch (error) {
    console.error('Get last week order error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch last week order',
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

    // Admins and Staff can view all, Customers only their own
    const isStaff = ['admin', 'packer', 'driver'].includes(req.user!.role);
    if (!isStaff && order.customerId !== req.user!.userId) {
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
    const emailText = orderService.formatBulkOrderForEmailText(bulkOrder);

    return res.json({
      bulkOrder,
      formatted: {
        whatsapp: whatsappMessage,
        email: emailHtml,
        emailText: emailText,
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
 * PATCH /api/orders/:id
 * Update order details (admin only)
 */
router.patch('/:id', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
  const schema = z.object({
    packerId: z.string().nullable().optional(),
    driverId: z.string().nullable().optional(),
    area: z.string().nullable().optional(),
    status: z.enum(['pending', 'confirmed', 'packed', 'delivered', 'out_for_delivery', 'cancelled']).optional(),
    items: z.array(z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
      priceAtOrder: z.number().optional(),
    })).optional(),
  });

    const data = schema.parse(req.body);

    const order = await orderService.updateOrder(id, data);

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
    console.error('Update order error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update order',
      },
    });
  }
}));

/**
 * PATCH /api/orders/:id/status
 * Update order status (staff only - packers need this)
 */
router.patch('/:id/status', authenticate, requireStaff, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateOrderStatusSchema.parse(req.body);

    const order = await orderService.updateOrderStatus(
      id,
      data.status,
      req.user!.userId,
      req.user!.role,
      data.packedItems,
      data.notes,
      data.signature,
      undefined, // deliveryNotes
      undefined, // coolerBagStatus
      data.handoverConfirmed,
      data.packageDetails
    );

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
 * Get all orders with optional filtering (staff only - packers need this)
 */
router.get('/', authenticate, requireStaff, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { status, deliveryDate, startDate, endDate, customerId, packerId, driverId } = req.query;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    const orders = await orderService.getOrders({
      status: status as string,
      deliveryDate: deliveryDate as string,
      startDate: startDate as string,
      endDate: endDate as string,
      customerId: customerId as string,
      packerId: packerId as string,
      driverId: driverId as string,
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

/**
 * GET /api/orders/delivery/:date/packing-list
 * Get packing list grouped by area (admin only)
 */
router.get('/delivery/:date/packing-list', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
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

    const packingList = await orderService.getPackingList(deliveryDate);

    return res.json(packingList);
  } catch (error) {
    console.error('Get packing list error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch packing list',
      },
    });
  }
}));

/**
 * GET /api/orders/quotations
 * Get all quotations (orders with unpaid invoices)
 */
router.get('/quotations', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, customerId } = req.query;

    const quotations = await orderService.getQuotations({
      startDate: startDate as string,
      endDate: endDate as string,
      customerId: customerId as string,
    });

    return res.json(quotations);
  } catch (error) {
    console.error('Get quotations error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch quotations',
      },
    });
  }
}));

/**
 * POST /api/orders/:id/deduct-item
 * Deduct an item from a quotation
 */
router.post('/:id/deduct-item', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { itemId, quantity, reason } = req.body;

    // Validate input
    if (!itemId || !quantity || !reason) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'itemId, quantity, and reason are required',
        },
      });
    }

    const order = await orderService.deductItemFromQuotation(
      id,
      itemId,
      Number(quantity),
      reason
    );

    return res.json(order);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
      }
      if (error.message.includes('exceeds')) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
        });
      }
    }
    console.error('Deduct item error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to deduct item',
      },
    });
  }
}));

/**
 * POST /api/orders/:id/convert
 * Convert a quotation to an order (after payment)
 */
router.post('/:id/convert', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await orderService.convertQuotationToOrder(id);

    return res.json(order);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
    }
    console.error('Convert quotation error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to convert quotation',
      },
    });
  }
}));

export default router;


