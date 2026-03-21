import { Router, Request, Response } from 'express';
import { productService } from '../services/product.service.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

/**
 * GET /api/public/products
 * Get available products without authentication
 */
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
    try {
        const products = await productService.getAvailableProducts();
        // Strip sensitive information if any - although products are public
        return res.json(products);
    } catch (error) {
        console.error('Public products fetch error:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch public products',
            },
        });
    }
}));

export default router;
