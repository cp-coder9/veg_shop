import { z } from 'zod';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from '../constants/enums.js';

// ============================================
// Authentication Schemas
// ============================================

export const sendCodeSchema = z.object({
  contact: z.string()
    .min(1, 'Contact is required')
    .refine(
      (val) => {
        // Check if it's a valid email or phone number
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return emailRegex.test(val) || phoneRegex.test(val);
      },
      { message: 'Contact must be a valid email or phone number' }
    ),
});

export const verifyCodeSchema = z.object({
  contact: z.string().min(1, 'Contact is required'),
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d{6}$/, 'Code must contain only digits'),
});

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional().or(z.literal('')),
  address: z.string().max(500, 'Address too long').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ============================================
// Product Schemas
// ============================================

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100, 'Product name too long'),
  price: z.number().positive('Price must be positive').max(10000, 'Price too high'),
  category: z.enum(PRODUCT_CATEGORIES, {
    errorMap: () => ({ message: 'Invalid product category' }),
  }),
  unit: z.enum(PRODUCT_UNITS, {
    errorMap: () => ({ message: 'Invalid product unit' }),
  }),
  description: z.string().max(500, 'Description too long').optional(),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  isAvailable: z.boolean().optional(),
  isSeasonal: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();

// ============================================
// Order Schemas
// ============================================

const deliveryMethods = ['delivery', 'collection'] as const;
const orderStatuses = ['pending', 'confirmed', 'packed', 'delivered', 'cancelled'] as const;

export const createOrderSchema = z.object({
  deliveryDate: z.string()
    .refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: 'Invalid delivery date' }
    )
    .refine(
      (val) => {
        const date = new Date(val);
        const day = date.getDay();
        // Monday = 1, Wednesday = 3, Friday = 5
        return day === 1 || day === 3 || day === 5;
      },
      { message: 'Delivery date must be Monday, Wednesday, or Friday' }
    ),
  deliveryMethod: z.enum(deliveryMethods, {
    errorMap: () => ({ message: 'Invalid delivery method' }),
  }),
  deliveryAddress: z.string().max(500, 'Delivery address too long').optional(),
  specialInstructions: z.string().max(1000, 'Special instructions too long').optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid('Invalid product ID'),
      quantity: z.number().int('Quantity must be an integer').positive('Quantity must be positive').max(1000, 'Quantity too high'),
    })
  ).min(1, 'Order must contain at least one item'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(orderStatuses, {
    errorMap: () => ({ message: 'Invalid order status' }),
  }),
});

export const bulkOrderSchema = z.object({
  startDate: z.string().refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid start date' }
  ),
  endDate: z.string().refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid end date' }
  ),
  bufferPercentage: z.number().min(0, 'Buffer percentage cannot be negative').max(100, 'Buffer percentage too high').optional(),
});

// ============================================
// Payment Schemas
// ============================================

const paymentMethods = ['cash', 'yoco', 'eft'] as const;

export const createPaymentSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
  amount: z.number().positive('Amount must be positive').max(1000000, 'Amount too high'),
  method: z.enum(paymentMethods, {
    errorMap: () => ({ message: 'Invalid payment method' }),
  }),
  paymentDate: z.string().refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid payment date' }
  ),
  notes: z.string().max(500, 'Notes too long').optional(),
});

export const shortDeliverySchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'), // Accept custom format (NAME-YYYYMMDD-XXXX)
  items: z.array(
    z.object({
      productId: z.string().uuid('Invalid product ID'),
      quantityShort: z.number().int('Quantity must be an integer').positive('Quantity must be positive'),
    })
  ).min(1, 'Must specify at least one short item'),
  reason: z.string().max(500, 'Reason too long').optional(),
});

// ============================================
// Customer Schemas
// ============================================

const baseCustomerSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  email: z.string().email('Invalid email address').optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  address: z.string().max(500, 'Address too long').optional(),
  deliveryPreference: z.enum(['delivery', 'collection']).optional(),
});

export const createCustomerSchema = baseCustomerSchema.refine(
  (data) => data.phone || data.email,
  { message: 'Either phone or email is required' }
);

export const updateCustomerSchema = baseCustomerSchema.partial();

// ============================================
// Notification Schemas
// ============================================

const notificationMethods = ['whatsapp', 'email'] as const;

export const sendNotificationSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
  method: z.enum(notificationMethods, {
    errorMap: () => ({ message: 'Invalid notification method' }),
  }),
});

export const sendPaymentReminderSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
});

export const sendProductListSchema = z.object({
  customerIds: z.array(z.string().uuid('Invalid customer ID')).min(1, 'Must specify at least one customer'),
});
