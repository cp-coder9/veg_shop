import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { productService, ProductFilters } from '../services/product.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { auditLog } from '../middleware/audit.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from '../constants/enums.js';

const router = Router();

// Validation schemas
const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().positive('Price must be positive'),
  category: z.enum(PRODUCT_CATEGORIES),
  unit: z.enum(PRODUCT_UNITS),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isAvailable: z.boolean(),
  isSeasonal: z.boolean(),
});

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  unit: z.enum(PRODUCT_UNITS).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isAvailable: z.boolean().optional(),
  isSeasonal: z.boolean().optional(),
});

/**
 * GET /api/products
 * Get all products with optional filters
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { category, isAvailable, isSeasonal } = req.query;

    const filters: ProductFilters = {};

    if (category) {
      filters.category = category as string;
    }

    if (isAvailable !== undefined) {
      filters.isAvailable = isAvailable === 'true';
    }

    if (isSeasonal !== undefined) {
      filters.isSeasonal = isSeasonal === 'true';
    }

    const products = await productService.getProducts(filters);

    return res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch products',
      },
    });
  }
}));

/**
 * GET /api/products/list/whatsapp
 * Get WhatsApp-formatted product list (admin only)
 * Note: This must come before /:id route to avoid conflicts
 */
router.get('/list/whatsapp', authenticate, requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  try {
    const productList = await productService.generateProductList();

    return res.json({
      message: productList,
    });
  } catch (error) {
    console.error('Generate product list error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate product list',
      },
    });
  }
}));

/**
 * GET /api/products/:id
 * Get a single product by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await productService.getProduct(id);

    if (!product) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      });
    }

    return res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch product',
      },
    });
  }
}));

/**
 * POST /api/products
 * Create a new product (admin only)
 */
router.post('/', authenticate, requireAdmin, auditLog('CREATE', 'product'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = createProductSchema.parse(req.body);

    const product = await productService.createProduct(data);

    return res.status(201).json(product);
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

    console.error('Create product error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create product',
      },
    });
  }
}));

/**
 * PUT /api/products/:id
 * Update a product (admin only)
 */
router.put('/:id', authenticate, requireAdmin, auditLog('UPDATE', 'product'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateProductSchema.parse(req.body);

    const product = await productService.updateProduct(id, data);

    return res.json(product);
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

    if (error instanceof Error && error.message === 'Product not found') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
    }

    console.error('Update product error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update product',
      },
    });
  }
}));

/**
 * DELETE /api/products/:id
 * Delete a product (admin only)
 */
router.delete('/:id', authenticate, requireAdmin, auditLog('DELETE', 'product'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await productService.deleteProduct(id);

    return res.json({
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete product',
      },
    });
  }
}));

export default router;
