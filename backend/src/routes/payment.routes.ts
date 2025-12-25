import { Router, Request, Response } from 'express';
import { paymentService } from '../services/payment.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { auditLog } from '../middleware/audit.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const recordPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  customerId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(['cash', 'yoco', 'eft']),
  paymentDate: z.string().datetime().or(z.date()),
  notes: z.string().optional(),
});



/**
 * POST /api/payments
 * Record a payment (admin only)
 */
router.post('/', authenticate, requireAdmin, auditLog('CREATE', 'payment'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const validatedData = recordPaymentSchema.parse(req.body);

    const payment = await paymentService.recordPayment({
      ...validatedData,
      paymentDate: new Date(validatedData.paymentDate),
    });

    return res.status(201).json(payment);
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
        code: 'PAYMENT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to record payment',
      },
    });
  }
}));

/**
 * GET /api/payments/:id
 * Get payment details
 */
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPayment(id);

    if (!payment) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Payment not found',
        },
      });
    }

    // Check authorization - customers can only view their own payments
    if (req.user?.role !== 'admin' && payment.customerId !== req.user?.userId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
        },
      });
    }

    return res.json(payment);
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retrieve payment',
      },
    });
  }
}));

/**
 * GET /api/payments/customer/me
 * Get all payments for authenticated customer
 */
router.get('/customer/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const customerId = req.user!.userId;
    const payments = await paymentService.getCustomerPayments(customerId);
    return res.json(payments);
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retrieve payments',
      },
    });
  }
}));

/**
 * GET /api/payments/customer/:customerId
 * Get all payments for a customer
 */
router.get('/customer/:customerId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    // Check authorization - customers can only view their own payments
    if (req.user?.role !== 'admin' && customerId !== req.user?.userId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
        },
      });
    }

    const payments = await paymentService.getCustomerPayments(customerId);
    return res.json(payments);
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retrieve payments',
      },
    });
  }
}));

/**
 * GET /api/payments/invoice/:invoiceId
 * Get all payments for an invoice
 */
router.get('/invoice/:invoiceId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;

    // Get invoice to check authorization
    const payments = await paymentService.getInvoicePayments(invoiceId);

    if (payments.length > 0) {
      const firstPayment = payments[0];
      // Check authorization - customers can only view their own invoice payments
      if (req.user?.role !== 'admin' && firstPayment.customerId !== req.user?.userId) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied',
          },
        });
      }
    }

    return res.json(payments);
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retrieve payments',
      },
    });
  }
}));

// Credit routes moved to credits.routes.ts

export default router;
