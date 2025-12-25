import { Router, Request, Response } from 'express';
import { packingListService, SortBy } from '../services/packing-list.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

/**
 * GET /api/packing-lists/order/:orderId
 * Get packing list for a specific order (admin only)
 */
router.get('/order/:orderId', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const packingList = await packingListService.generatePackingList(orderId);

    return res.json(packingList);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Order not found') {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
      }
    }

    console.error('Get packing list error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate packing list',
      },
    });
  }
}));

/**
 * GET /api/packing-lists/date/:date
 * Get packing lists for all orders on a specific delivery date (admin only)
 * Query params: sortBy (name|route)
 */
router.get('/date/:date', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const sortBy = (req.query.sortBy as SortBy) || 'name';

    // Validate sortBy parameter
    if (sortBy !== 'name' && sortBy !== 'route') {
      return res.status(400).json({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'sortBy must be either "name" or "route"',
        },
      });
    }

    // Parse date
    const deliveryDate = new Date(date);
    if (isNaN(deliveryDate.getTime())) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format',
        },
      });
    }

    const packingLists = await packingListService.generatePackingListsByDate(
      deliveryDate,
      sortBy
    );

    return res.json(packingLists);
  } catch (error) {
    console.error('Get packing lists by date error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate packing lists',
      },
    });
  }
}));

/**
 * POST /api/packing-lists/pdf
 * Generate PDF for packing lists (admin only)
 * Body: { orderIds?: string[], date?: string, sortBy?: 'name'|'route' }
 */
router.post('/pdf', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { orderIds, date, sortBy = 'name' } = req.body as { orderIds?: string[]; date?: string; sortBy?: string };

    let pdfBuffer: Buffer;

    if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
      // Generate PDF for specific orders
      pdfBuffer = await packingListService.generateBatchPackingListPDF(orderIds);
    } else if (date) {
      // Generate PDF for all orders on a specific date
      const deliveryDate = new Date(date);
      if (isNaN(deliveryDate.getTime())) {
        return res.status(400).json({
          error: {
            code: 'INVALID_DATE',
            message: 'Invalid date format',
          },
        });
      }

      pdfBuffer = await packingListService.generatePackingListPDFByDate(
        deliveryDate,
        sortBy as SortBy
      );
    } else {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Either orderIds or date must be provided',
        },
      });
    }

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="packing-lists.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate packing list PDF error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate packing list PDF',
      },
    });
  }
}));

export default router;
