import { Router, Request, Response } from 'express';
import { categoryService, CreateCategoryDto, UpdateCategoryDto } from '../services/category.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { auditLog } from '../middleware/audit.middleware.js';

const router = Router();

/**
 * GET /api/categories
 * Get all categories (public - needed for product browsing)
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const categories = await categoryService.getCategories(includeInactive);
    return res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch categories',
      },
    });
  }
}));

/**
 * GET /api/categories/:key
 * Get category by key
 */
router.get('/:key', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const category = await categoryService.getCategoryByKey(key);

    if (!category) {
      return res.status(404).json({
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Category not found',
        },
      });
    }

    return res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch category',
      },
    });
  }
}));

/**
 * POST /api/categories
 * Create a new category (admin only)
 */
router.post('/', authenticate, requireAdmin, auditLog('CREATE', 'category'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = req.body as CreateCategoryDto;

    if (!data.key || !data.label) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Category key and label are required',
        },
      });
    }

    const category = await categoryService.createCategory(data);
    return res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          error: {
            code: 'DUPLICATE_CATEGORY',
            message: error.message,
          },
        });
      }

      if (error.message.includes('lowercase')) {
        return res.status(400).json({
          error: {
            code: 'INVALID_KEY_FORMAT',
            message: error.message,
          },
        });
      }
    }

    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create category',
      },
    });
  }
}));

/**
 * PUT /api/categories/:key
 * Update a category (admin only)
 */
router.put('/:key', authenticate, requireAdmin, auditLog('UPDATE', 'category'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const data = req.body as UpdateCategoryDto;

    const category = await categoryService.updateCategory(key, data);
    return res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);

    if (error instanceof Error && error.message === 'Category not found') {
      return res.status(404).json({
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: error.message,
        },
      });
    }

    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update category',
      },
    });
  }
}));

/**
 * DELETE /api/categories/:key
 * Delete a category (admin only)
 */
router.delete('/:key', authenticate, requireAdmin, auditLog('DELETE', 'category'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    await categoryService.deleteCategory(key);
    return res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);

    if (error instanceof Error) {
      if (error.message === 'Category not found') {
        return res.status(404).json({
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: error.message,
          },
        });
      }

      if (error.message.includes('Cannot delete category')) {
        return res.status(409).json({
          error: {
            code: 'CATEGORY_IN_USE',
            message: error.message,
          },
        });
      }
    }

    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete category',
      },
    });
  }
}));

/**
 * POST /api/categories/seed
 * Seed default categories (admin only)
 */
router.post('/seed', authenticate, requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  try {
    const categories = await categoryService.seedDefaultCategories();
    return res.json({
      message: 'Default categories seeded successfully',
      categories,
    });
  } catch (error) {
    console.error('Error seeding categories:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to seed categories',
      },
    });
  }
}));

export default router;
