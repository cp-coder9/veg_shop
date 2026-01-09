import { Router, Request, Response } from 'express';
import { customerService, UpdateCustomerDto, CreateCustomerDto } from '../services/customer.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

// ============================================
// IMPORTANT: /me routes MUST come BEFORE /:id
// Otherwise Express treats "me" as an ID param
// ============================================

/**
 * GET /api/customers/me
 * Get current customer profile
 */
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const customerProfile = await customerService.getCustomerProfile(req.user!.userId);

    if (!customerProfile) {
      return res.status(404).json({
        error: {
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Customer profile not found',
        },
      });
    }

    return res.json(customerProfile);
  } catch (error) {
    console.error('Error fetching current customer profile:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch customer profile',
      },
    });
  }
}));

/**
 * PUT /api/customers/me
 * Update current customer profile
 */
router.put('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = req.body as UpdateCustomerDto;
    const customer = await customerService.updateCustomer(req.user!.userId, data);
    return res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);

    if (error instanceof Error && error.message === 'Customer not found') {
      return res.status(404).json({
        error: {
          code: 'CUSTOMER_NOT_FOUND',
          message: error.message,
        },
      });
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_CUSTOMER',
          message: error.message,
        },
      });
    }

    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update customer',
      },
    });
  }
}));

/**
 * GET /api/customers/me/dashboard
 * Get dashboard summary for current customer
 */
router.get('/me/dashboard', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const customerId = req.user!.userId;
    const dashboardData = await customerService.getCustomerDashboard(customerId) as Record<string, unknown>;
    return res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching customer dashboard:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch dashboard data',
      },
    });
  }
}));

/**
 * GET /api/customers/me/payments
 * Get payment history for current customer
 */
router.get('/me/payments', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const customerId = req.user!.userId;
    const payments = await customerService.getCustomerPayments(customerId);
    return res.json(payments);
  } catch (error) {
    console.error('Error fetching customer payments:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch payment history',
      },
    });
  }
}));

// ============================================
// Parameterized routes AFTER /me routes
// ============================================

/**
 * GET /api/customers
 * Get all customers (admin only)
 */
router.get('/', authenticate, requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  try {
    const customers = await customerService.getCustomers();
    return res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch customers',
      },
    });
  }
}));

/**
 * POST /api/customers
 * Create new customer (for registration)
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = req.body as CreateCustomerDto;

    const customer = await customerService.createCustomer(data);
    return res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);

    if (error instanceof Error && error.message === 'Either phone or email must be provided') {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: error.message,
        },
      });
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_CUSTOMER',
          message: error.message,
        },
      });
    }

    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create customer',
      },
    });
  }
}));

/**
 * GET /api/customers/:id
 * Get customer by ID with full profile (order history, credit balance, payment history)
 */
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const includeProfile = req.query.includeProfile === 'true';

    // If includeProfile is requested, return full profile with order history, credits, and payments
    if (includeProfile) {
      const customerProfile = await customerService.getCustomerProfile(id);

      if (!customerProfile) {
        return res.status(404).json({
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: 'Customer not found',
          },
        });
      }

      return res.json(customerProfile);
    }

    // Otherwise, return basic customer info
    const customer = await customerService.getCustomer(id);

    if (!customer) {
      return res.status(404).json({
        error: {
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found',
        },
      });
    }

    return res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch customer',
      },
    });
  }
}));

/**
 * PUT /api/customers/:id
 * Update customer by ID (admin)
 */
router.put('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body as UpdateCustomerDto;

    const customer = await customerService.updateCustomer(id, data);
    return res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);

    if (error instanceof Error && error.message === 'Customer not found') {
      return res.status(404).json({
        error: {
          code: 'CUSTOMER_NOT_FOUND',
          message: error.message,
        },
      });
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_CUSTOMER',
          message: error.message,
        },
      });
    }

    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update customer',
      },
    });
  }
}));

export default router;
