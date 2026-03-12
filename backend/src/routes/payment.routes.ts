import { Router, Request, Response } from 'express';
import { paymentService } from '../services/payment.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { auditLog } from '../middleware/audit.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';

import { yocoService, YocoPaymentStatus } from '../services/yoco.service.js';
import { notificationService } from '../services/notification.service.js';

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
 * POST /api/payments/checkout
 * Create a Yoco checkout session for an invoice
 */
interface CreateCheckoutBody {
  invoiceId: string;
}

router.post('/checkout', asyncHandler(async (req: Request, res: Response) => {
  const { invoiceId } = req.body as CreateCheckoutBody;

  if (!invoiceId) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invoice ID is required',
      },
    });
  }

  // Get invoice with customer details
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: true,
    },
  });

  if (!invoice) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Invoice not found',
      },
    });
  }

  // Calculate amount due
  const totalPaid = await prisma.payment.aggregate({
    where: { invoiceId },
    _sum: { amount: true },
  });
  
  const amountDue = Number(invoice.total) - Number(totalPaid._sum.amount || 0);
  
  if (amountDue <= 0) {
    return res.status(400).json({
      error: {
        code: 'ALREADY_PAID',
        message: 'Invoice is already fully paid',
      },
    });
  }

  // Get frontend URL for redirect
  const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
  const redirectUrl = `${frontendUrl}/payment/${invoiceId}/complete`;
  const cancelUrl = `${frontendUrl}/payment/${invoiceId}`;

  // Create Yoco checkout session
  const result = await yocoService.createCheckoutSession({
    amount: Math.round(amountDue * 100), // Convert to cents
    currency: 'ZAR',
    invoiceId: invoice.id,
    customerId: invoice.customerId,
    redirectUrl,
    cancelUrl,
  });

  if (!result.success || !result.redirectUrl) {
    return res.status(400).json({
      error: {
        code: 'CHECKOUT_ERROR',
        message: result.errorMessage || 'Failed to create checkout session',
      },
    });
  }

  return res.json({
    success: true,
    checkoutId: result.checkoutId,
    redirectUrl: result.redirectUrl,
    amount: amountDue,
  });
}));

/**
 * GET /api/payments/verify/:paymentId
 * Verify payment status via Yoco Realtime API
 */
router.get('/verify/:paymentId', asyncHandler(async (req: Request, res: Response) => {
  const { paymentId } = req.params;

  if (!paymentId) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Payment ID is required',
      },
    });
  }

  const result = await yocoService.verifyPayment(paymentId);

  if (!result.success) {
    return res.status(400).json({
      error: {
        code: 'VERIFICATION_FAILED',
        message: result.errorMessage || 'Failed to verify payment',
      },
    });
  }

  return res.json({
    success: true,
    payment: result.payment,
  });
}));

/**
 * POST /api/payments/webhook/yoco
 * Webhook for Yoco payment status updates
 */
interface YocoWebhookPayload {
  type: string;
  id: string;
  createdDate: string;
  payload: {
    id: string;
    type: string;
    status: string;
    amount: number;
    currency: string;
    metadata?: { invoiceId?: string; customerId?: string };
  }
}

router.post('/webhook/yoco', asyncHandler(async (req: Request, res: Response) => {
  // Get signature from headers
  const signature = req.headers['x-yoco-signature'] as string;
  const rawBody = JSON.stringify(req.body);

  // Verify webhook signature
  const verificationResult = yocoService.handleWebhook(rawBody, signature || '');

  if (!verificationResult.valid) {
    console.error('Invalid Yoco webhook signature');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const payment = verificationResult.payload;

  if (!payment) {
    return res.json({ received: true });
  }

  // Handle different payment statuses
  if (payment.status === 'succeeded' && payment.metadata?.invoiceId) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: payment.metadata.invoiceId },
    });

    if (invoice) {
      await paymentService.recordPayment({
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        amount: payment.amount / 100, // Convert from cents
        method: 'yoco',
        paymentDate: new Date(payment.createdAt),
        notes: `Automated capture from Yoco (Ref: ${payment.id})`,
      });
      console.log(`Payment captured for invoice ${invoice.id} via webhook`);
    }
  } else if (payment.status === 'failed') {
    console.log(`Payment failed for invoice ${payment.metadata?.invoiceId}: ${payment.id}`);
  }

  return res.json({ received: true });
}));

/**
 * POST /api/payments/send-link
 * Send payment link
 */
interface SendLinkPayload {
  invoiceId: string;
  method: 'email' | 'whatsapp';
}

router.post('/send-link', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { invoiceId, method } = req.body as SendLinkPayload;

  if (!invoiceId || !method) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invoice ID and method are required',
      },
    });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Invoice not found',
      },
    });
  }

  const link = yocoService.getPaymentPageUrl(invoice.id, Number(invoice.total));
  await notificationService.sendPaymentLink(invoice.id, link, Number(invoice.total), method);

  return res.json({ success: true, message: `Payment link sent via ${method}` });
}));

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

/**
 * POST /api/payments/public
 * Record a payment via public link
 */
router.post('/public', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { token, ...paymentData } = req.body;

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { invoiceId: string, type: string };

    if (decoded.type !== 'payment_link' || !decoded.invoiceId) {
      return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid payment link' } });
    }

    // Ensure we are paying for the correct invoice
    if (paymentData.invoiceId !== decoded.invoiceId) {
      return res.status(400).json({ error: { code: 'MISMATCH', message: 'Invoice ID mismatch' } });
    }

    const validatedData = recordPaymentSchema.parse(paymentData);

    const payment = await paymentService.recordPayment({
      invoiceId: validatedData.invoiceId,
      customerId: validatedData.customerId,
      amount: validatedData.amount,
      method: validatedData.method as 'cash' | 'yoco' | 'eft',
      paymentDate: new Date(validatedData.paymentDate),
      notes: validatedData.notes,
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

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid token' } });
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
 * POST /api/payments
 * Record a payment (admin only)
 */
router.post('/', authenticate, requireAdmin, auditLog('CREATE', 'payment'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const validatedData = recordPaymentSchema.parse(req.body);

    const payment = await paymentService.recordPayment({
      invoiceId: validatedData.invoiceId,
      customerId: validatedData.customerId,
      amount: validatedData.amount,
      method: validatedData.method as 'cash' | 'yoco' | 'eft',
      paymentDate: new Date(validatedData.paymentDate),
      notes: validatedData.notes,
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
 * GET /api/payments/stats
 * Get payment statistics by method (cash/yoco/eft)
 * NOTE: Must be BEFORE /:id to avoid being caught by catch-all
 */
router.get('/stats', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const stats = await paymentService.getPaymentStatsByMethod();
    return res.json(stats);
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retrieve payment stats',
      },
    });
  }
}));

/**
 * GET /api/payments/stats/yoco
 * Get Yoco-specific payment statistics
 * NOTE: Must be BEFORE /:id to avoid being caught by catch-all
 */
router.get('/stats/yoco', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const stats = await paymentService.getPaymentStatsByMethod();
    const recentTransactions = await paymentService.getRecentYocoTransactions(10);
    
    // Calculate Yoco-specific metrics
    const yocoToday = stats.today.yoco;
    const yocoWeek = stats.week.yoco;
    const yocoMonth = stats.month.yoco;
    
    const yocoSuccessCount = recentTransactions.length;
    const yocoFailedCount = 0;
    
    const averageTransaction = yocoToday > 0 && stats.today.count > 0 
      ? yocoToday / stats.today.count 
      : 0;

    return res.json({
      today: {
        total: yocoToday,
        count: stats.today.count,
        yoco: yocoToday,
        cash: stats.today.cash,
        eft: stats.today.eft,
      },
      week: {
        total: yocoWeek,
        count: stats.week.count,
        yoco: yocoWeek,
        cash: stats.week.cash,
        eft: stats.week.eft,
      },
      month: {
        total: yocoMonth,
        count: stats.month.count,
        yoco: yocoMonth,
        cash: stats.month.cash,
        eft: stats.month.eft,
      },
      recentTransactions,
      metrics: {
        successCount: yocoSuccessCount,
        failedCount: yocoFailedCount,
        averageTransactionValue: averageTransaction,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retrieve Yoco payment stats',
      },
    });
  }
}));

/**
 * GET /api/payments/recent
 * Get recent payments for admin view
 * NOTE: Must be BEFORE /:id to avoid being caught by catch-all
 */
router.get('/recent', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const payments = await paymentService.getRecentPayments(limit);
    return res.json(payments);
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retrieve recent payments',
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

/**
 * GET /api/payments/:id
 * Get payment details
 * NOTE: This must be LAST as it's a catch-all for single-segment paths
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

export default router;
