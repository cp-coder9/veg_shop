import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { reportService } from '../services/report.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

// Validation schema for date range queries
const dateRangeSchema = z.object({
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
});

/**
 * GET /api/reports/sales
 * Generate sales report (admin only)
 * Query params: startDate, endDate
 */
router.get('/sales', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);

    // Validate date range
    if (startDate > endDate) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Start date must be before or equal to end date',
        },
      });
    }

    const report = await reportService.generateSalesReport(startDate, endDate);

    return res.json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid date parameters. Expected format: YYYY-MM-DD',
          details: error.errors,
        },
      });
    }

    console.error('Generate sales report error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate sales report',
      },
    });
  }
}));

/**
 * GET /api/reports/payments
 * Generate payment status report (admin only)
 */
router.get('/payments', authenticate, requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  try {
    const report = await reportService.generatePaymentStatusReport();

    return res.json(report);
  } catch (error) {
    console.error('Generate payment status report error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate payment status report',
      },
    });
  }
}));

/**
 * GET /api/reports/products
 * Generate product popularity report (admin only)
 * Query params: startDate, endDate
 */
router.get('/products', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);

    // Validate date range
    if (startDate > endDate) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Start date must be before or equal to end date',
        },
      });
    }

    const report = await reportService.generateProductPopularityReport(startDate, endDate);

    return res.json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid date parameters. Expected format: YYYY-MM-DD',
          details: error.errors,
        },
      });
    }

    console.error('Generate product popularity report error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate product popularity report',
      },
    });
  }
}));

/**
 * GET /api/reports/customers
 * Generate customer activity report (admin only)
 * Query params: startDate, endDate
 */
router.get('/customers', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);

    // Validate date range
    if (startDate > endDate) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Start date must be before or equal to end date',
        },
      });
    }

    const report = await reportService.generateCustomerActivityReport(startDate, endDate);

    return res.json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid date parameters. Expected format: YYYY-MM-DD',
          details: error.errors,
        },
      });
    }

    console.error('Generate customer activity report error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate customer activity report',
      },
    });
  }
}));

/**
 * GET /api/admin/reports/collation
 * Generate weekly procurement list
 */
router.get('/collation', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Start date and end date are required' } });
  }

  const report = await reportService.generateOrderCollationReport(
    new Date(startDate as string),
    new Date(endDate as string)
  );

  return res.json(report);
}));

export default router;
