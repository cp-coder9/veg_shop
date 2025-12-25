import { Router, Request, Response } from 'express';
import { notificationService } from '../services/notification.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const sendWhatsAppSchema = z.object({
  phone: z.string().min(1),
  message: z.string().min(1),
});

const sendEmailSchema = z.object({
  email: z.string().email(),
  subject: z.string().min(1),
  content: z.string().min(1),
});

const sendProductListSchema = z.object({
  customerIds: z.array(z.string().uuid()).optional(),
});

/**
 * POST /api/notifications/whatsapp
 * Send WhatsApp message (admin only)
 */
router.post('/whatsapp', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { phone, message } = sendWhatsAppSchema.parse(req.body);

    await notificationService.sendWhatsAppMessage(phone, message);

    res.json({
      success: true,
      message: 'WhatsApp message sent successfully',
    });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
      });
    } else {
      res.status(500).json({
        error: {
          code: 'SEND_FAILED',
          message: error instanceof Error ? error.message : 'Failed to send WhatsApp message',
        },
      });
    }
  }
}));

/**
 * POST /api/notifications/email
 * Send email (admin only)
 */
router.post('/email', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { email, subject, content } = sendEmailSchema.parse(req.body);

    await notificationService.sendEmailMessage(email, subject, content);

    res.json({
      success: true,
      message: 'Email sent successfully',
    });
  } catch (error) {
    console.error('Error sending email:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
      });
    } else {
      res.status(500).json({
        error: {
          code: 'SEND_FAILED',
          message: error instanceof Error ? error.message : 'Failed to send email',
        },
      });
    }
  }
}));

/**
 * POST /api/notifications/payment-reminder/:customerId
 * Send payment reminder to customer (admin only)
 */
router.post('/payment-reminder/:customerId', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    await notificationService.sendPaymentReminder(customerId);

    res.json({
      success: true,
      message: 'Payment reminder sent successfully',
    });
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    res.status(500).json({
      error: {
        code: 'SEND_FAILED',
        message: error instanceof Error ? error.message : 'Failed to send payment reminder',
      },
    });
  }
}));

/**
 * POST /api/notifications/product-list
 * Send product list to customers (admin only)
 */
router.post('/product-list', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { customerIds } = sendProductListSchema.parse(req.body);

    // If no customer IDs provided, send to all customers
    let targetCustomerIds = customerIds;
    if (!targetCustomerIds || targetCustomerIds.length === 0) {
      const { prisma } = await import('../lib/prisma.js');
      const allCustomers = await prisma.user.findMany({
        where: { role: 'customer' },
        select: { id: true },
      });
      targetCustomerIds = allCustomers.map((c) => c.id);
    }

    await notificationService.sendProductList(targetCustomerIds);

    res.json({
      success: true,
      message: `Product list sent to ${targetCustomerIds.length} customers`,
    });
  } catch (error) {
    console.error('Error sending product list:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
      });
    } else {
      res.status(500).json({
        error: {
          code: 'SEND_FAILED',
          message: error instanceof Error ? error.message : 'Failed to send product list',
        },
      });
    }
  }
}));

/**
 * POST /api/notifications/process-queue
 * Process pending notifications (admin only)
 */
router.post('/process-queue', authenticate, requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  try {
    await notificationService.processNotificationQueue();

    res.json({
      success: true,
      message: 'Notification queue processed successfully',
    });
  } catch (error) {
    console.error('Error processing notification queue:', error);
    res.status(500).json({
      error: {
        code: 'PROCESS_FAILED',
        message: error instanceof Error ? error.message : 'Failed to process notification queue',
      },
    });
  }
}));

/**
 * POST /api/notifications/seasonal-poll
 * Send seasonal items poll to customers (admin only)
 */
router.post('/seasonal-poll', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { customerIds } = sendProductListSchema.parse(req.body);

    let targetCustomerIds = customerIds;
    if (!targetCustomerIds || targetCustomerIds.length === 0) {
      const { prisma } = await import('../lib/prisma.js');
      const allCustomers = await prisma.user.findMany({
        where: { role: 'customer' },
        select: { id: true },
      });
      targetCustomerIds = allCustomers.map((c) => c.id);
    }

    await notificationService.sendSeasonalItemsPoll(targetCustomerIds);

    res.json({
      success: true,
      message: `Seasonal poll sent to ${targetCustomerIds.length} customers`,
    });
  } catch (error) {
    console.error('Error sending seasonal poll:', error);
    res.status(500).json({
      error: {
        code: 'SEND_FAILED',
        message: error instanceof Error ? error.message : 'Failed to send seasonal poll',
      },
    });
  }
}));

export default router;
