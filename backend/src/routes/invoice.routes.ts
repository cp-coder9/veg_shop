import { Router, Request, Response } from 'express';
import { invoiceService } from '../services/invoice.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { auditLog } from '../middleware/audit.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { z } from 'zod';

const router = Router();

const generateBulkInvoicesSchema = z.object({
  orderIds: z.array(z.string().uuid()).min(1, 'At least one order ID is required'),
});

/**
 * POST /api/invoices/generate/:orderId
 * Generate invoice from order (admin only)
 */
router.post('/generate/:orderId', authenticate, requireAdmin, auditLog('GENERATE', 'invoice'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const invoice = await invoiceService.generateInvoice(orderId);

    return res.status(201).json(invoice);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invoice already exists for this order') {
        return res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: error.message,
          },
        });
      }

      if (error.message === 'Order not found') {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
      }
    }

    console.error('Generate invoice error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate invoice',
      },
    });
  }
}));

/**
 * POST /api/invoices/bulk/generate
 * Generate invoices for multiple orders (admin only)
 */
router.post('/bulk/generate', authenticate, requireAdmin, auditLog('GENERATE_BULK', 'invoice'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { orderIds } = generateBulkInvoicesSchema.parse(req.body);

    const results = await invoiceService.generateBulkInvoices(orderIds);

    return res.status(201).json(results);
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

    console.error('Bulk generate invoices error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate bulk invoices',
      },
    });
  }
}));

/**
 * GET /api/invoices/:id
 * Get invoice details
 */
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await invoiceService.getInvoice(id);

    if (!invoice) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        },
      });
    }

    // Customers can only view their own invoices, admins can view all
    if (req.user!.role !== 'admin' && invoice.customerId !== req.user!.userId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this invoice',
        },
      });
    }

    return res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch invoice',
      },
    });
  }
}));

/**
 * GET /api/invoices/:id/pdf
 * Download invoice PDF
 */
router.get('/:id/pdf', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user has permission to view this invoice
    const invoice = await invoiceService.getInvoice(id);

    if (!invoice) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        },
      });
    }

    // Customers can only view their own invoices, admins can view all
    if (req.user!.role !== 'admin' && invoice.customerId !== req.user!.userId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this invoice',
        },
      });
    }

    // Get PDF buffer
    const pdfBuffer = await invoiceService.getInvoicePDFBuffer(id);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${id.substring(0, 8)}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Get invoice PDF error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate invoice PDF',
      },
    });
  }
}));

/**
 * GET /api/invoices/stats
 * Get invoice statistics (admin only)
 */
router.get('/stats', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { customerId, startDate, endDate } = req.query as { customerId?: string; startDate?: string; endDate?: string };

    const filters: { customerId?: string; startDate?: Date; endDate?: Date } = {};

    if (customerId) filters.customerId = customerId;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const stats = await invoiceService.calculateInvoiceStats(filters);

    return res.json(stats);
  } catch (error) {
    console.error('Get invoice stats error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to calculate invoice statistics',
      },
    });
  }
}));

/**
 * GET /api/invoices
 * Get all invoices with optional filtering (admin only)
 */
router.get('/', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { customerId, customerName, status, startDate, endDate } = req.query as {
      customerId?: string;
      customerName?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    };

    const filters: {
      customerId?: string;
      customerName?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    } = {};

    if (customerId) filters.customerId = customerId;
    if (customerName) filters.customerName = customerName;
    if (status) filters.status = status;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const invoices = await invoiceService.getAllInvoices(filters);

    return res.json(invoices);
  } catch (error) {
    console.error('Get all invoices error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch invoices',
      },
    });
  }
}));

/**
 * GET /api/invoices/customer/me
 * Get all invoices for the currently authenticated customer
 * IMPORTANT: This route must come BEFORE /customer/:customerId
 */
router.get('/customer/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const invoices = await invoiceService.getCustomerInvoices(req.user!.userId);
    return res.json(invoices);
  } catch (error) {
    console.error('Get my invoices error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch your invoices',
      },
    });
  }
}));

/**
 * GET /api/invoices/customer/:customerId
 * Get all invoices for a customer
 */
router.get('/customer/:customerId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    // Customers can only view their own invoices, admins can view all
    if (req.user!.role !== 'admin' && customerId !== req.user!.userId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view these invoices',
        },
      });
    }

    const invoices = await invoiceService.getCustomerInvoices(customerId);

    return res.json(invoices);
  } catch (error) {
    console.error('Get customer invoices error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch customer invoices',
      },
    });
  }
}));

export default router;
