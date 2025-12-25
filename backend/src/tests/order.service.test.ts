/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderService } from '../services/order.service.js';
import { prisma } from '../lib/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';

// Mock Prisma
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    orderItem: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('OrderService', () => {
  let orderService: OrderService;

  beforeEach(() => {
    orderService = new OrderService();
    vi.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create an order with items', async () => {
      const customerId = 'customer-1';
      const orderData = {
        deliveryDate: new Date('2025-10-29'), // Wednesday
        deliveryMethod: 'delivery' as const,
        deliveryAddress: '123 Main St',
        specialInstructions: 'Leave at door',
        items: [
          { productId: 'product-1', quantity: 2 },
          { productId: 'product-2', quantity: 1 },
        ],
      };

      const mockProducts = [
        {
          id: 'product-1',
          name: 'Tomatoes',
          price: new Decimal(25.50),
          isAvailable: true,
          category: 'vegetables',
          unit: 'kg',
          description: null,
          imageUrl: null,
          isSeasonal: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'product-2',
          name: 'Lettuce',
          price: new Decimal(15.00),
          isAvailable: true,
          category: 'vegetables',
          unit: 'piece',
          description: null,
          imageUrl: null,
          isSeasonal: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockOrder = {
        id: 'order-1',
        customerId,
        deliveryDate: orderData.deliveryDate,
        deliveryMethod: orderData.deliveryMethod,
        deliveryAddress: orderData.deliveryAddress,
        specialInstructions: orderData.specialInstructions,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockOrderItems = [
        {
          id: 'item-1',
          orderId: mockOrder.id,
          productId: 'product-1',
          quantity: 2,
          priceAtOrder: new Decimal(25.50),
        },
        {
          id: 'item-2',
          orderId: mockOrder.id,
          productId: 'product-2',
          quantity: 1,
          priceAtOrder: new Decimal(15.00),
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          order: {
            create: vi.fn().mockResolvedValue(mockOrder),
          },
          orderItem: {
            create: vi.fn()
              .mockResolvedValueOnce(mockOrderItems[0])
              .mockResolvedValueOnce(mockOrderItems[1]),
          },
        });
      });

      const result = await orderService.createOrder(customerId, orderData);

      expect(result.id).toBe(mockOrder.id);
      expect(result.customerId).toBe(customerId);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['product-1', 'product-2'] },
        },
      });
    });

    it('should reject delivery on invalid day', async () => {
      const orderData = {
        deliveryDate: new Date('2025-10-28'), // Tuesday
        deliveryMethod: 'delivery' as const,
        items: [{ productId: 'product-1', quantity: 1 }],
      };

      await expect(
        orderService.createOrder('customer-1', orderData)
      ).rejects.toThrow('Delivery date must be Monday (1), Wednesday (3), or Friday (5)');
    });

    it('should reject unavailable products', async () => {
      const orderData = {
        deliveryDate: new Date('2025-10-29'), // Wednesday
        deliveryMethod: 'delivery' as const,
        items: [{ productId: 'product-1', quantity: 1 }],
      };

      const mockProducts = [
        {
          id: 'product-1',
          name: 'Tomatoes',
          price: new Decimal(25.50),
          isAvailable: false,
          category: 'vegetables',
          unit: 'kg',
          description: null,
          imageUrl: null,
          isSeasonal: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts);

      await expect(
        orderService.createOrder('customer-1', orderData)
      ).rejects.toThrow('Products not available: Tomatoes');
    });
  });

  describe('getOrder', () => {
    it('should return order with items', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'customer-1',
        deliveryDate: new Date('2025-10-29'),
        deliveryMethod: 'delivery',
        deliveryAddress: '123 Main St',
        specialInstructions: null,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: 'item-1',
            orderId: 'order-1',
            productId: 'product-1',
            quantity: 2,
            priceAtOrder: new Decimal(25.50),
            product: {
              id: 'product-1',
              name: 'Tomatoes',
              price: new Decimal(25.50),
              category: 'vegetables',
              unit: 'kg',
              description: null,
              imageUrl: null,
              isAvailable: true,
              isSeasonal: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        ],
        customer: {
          id: 'customer-1',
          name: 'John Doe',
          phone: '+27123456789',
          email: null,
          address: '123 Main St',
          deliveryPreference: 'delivery',
          role: 'customer',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder);

      const result = await orderService.getOrder('order-1');

      expect(result).toEqual(mockOrder);
      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
        },
      });
    });
  });

  describe('getCustomerOrders', () => {
    it('should return all orders for a customer', async () => {
      const customerId = 'customer-1';
      const mockOrders = [
        {
          id: 'order-1',
          customerId,
          deliveryDate: new Date('2025-10-29'),
          deliveryMethod: 'delivery',
          deliveryAddress: '123 Main St',
          specialInstructions: null,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [],
        },
      ];

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders);

      const result = await orderService.getCustomerOrders(customerId);

      expect(result).toEqual(mockOrders);
      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: { customerId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          deliveryDate: 'desc',
        },
      });
    });
  });

  describe('getOrdersByDeliveryDate', () => {
    it('should return orders for specific delivery date', async () => {
      const deliveryDate = new Date('2025-10-29');
      const mockOrders = [
        {
          id: 'order-1',
          customerId: 'customer-1',
          deliveryDate,
          deliveryMethod: 'delivery',
          deliveryAddress: '123 Main St',
          specialInstructions: null,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [],
          customer: {
            id: 'customer-1',
            name: 'John Doe',
            phone: '+27123456789',
            email: null,
            address: '123 Main St',
            deliveryPreference: 'delivery',
            role: 'customer',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders);

      const result = await orderService.getOrdersByDeliveryDate(deliveryDate);

      expect(result).toEqual(mockOrders);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const orderId = 'order-1';
      const newStatus = 'confirmed';

      const mockOrder = {
        id: orderId,
        customerId: 'customer-1',
        deliveryDate: new Date('2025-10-29'),
        deliveryMethod: 'delivery',
        deliveryAddress: '123 Main St',
        specialInstructions: null,
        status: newStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.order.update).mockResolvedValue(mockOrder);

      const result = await orderService.updateOrderStatus(orderId, newStatus);

      expect(result.status).toBe(newStatus);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { status: newStatus },
      });
    });

    it('should reject invalid status', async () => {
      await expect(
        orderService.updateOrderStatus('order-1', 'invalid-status')
      ).rejects.toThrow('Invalid status');
    });
  });

  describe('generateBulkOrder', () => {
    it('should consolidate orders and calculate buffer', async () => {
      const weekStartDate = new Date('2025-10-27');
      const bufferPercentage = 10;

      const mockOrders = [
        {
          id: 'order-1',
          customerId: 'customer-1',
          deliveryDate: new Date('2025-10-29'),
          deliveryMethod: 'delivery',
          deliveryAddress: '123 Main St',
          specialInstructions: null,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [
            {
              id: 'item-1',
              orderId: 'order-1',
              productId: 'product-1',
              quantity: 5,
              priceAtOrder: new Decimal(25.50),
              product: {
                id: 'product-1',
                name: 'Tomatoes',
                price: new Decimal(25.50),
                category: 'vegetables',
                unit: 'kg',
                description: null,
                imageUrl: null,
                isAvailable: true,
                isSeasonal: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
          ],
        },
        {
          id: 'order-2',
          customerId: 'customer-2',
          deliveryDate: new Date('2025-10-31'),
          deliveryMethod: 'delivery',
          deliveryAddress: '456 Oak Ave',
          specialInstructions: null,
          status: 'confirmed',
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [
            {
              id: 'item-2',
              orderId: 'order-2',
              productId: 'product-1',
              quantity: 3,
              priceAtOrder: new Decimal(25.50),
              product: {
                id: 'product-1',
                name: 'Tomatoes',
                price: new Decimal(25.50),
                category: 'vegetables',
                unit: 'kg',
                description: null,
                imageUrl: null,
                isAvailable: true,
                isSeasonal: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
          ],
        },
      ];

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders);

      const result = await orderService.generateBulkOrder(weekStartDate, bufferPercentage);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].productName).toBe('Tomatoes');
      expect(result.items[0].totalQuantity).toBe(8);
      expect(result.items[0].bufferQuantity).toBe(1); // 10% of 8 rounded up
      expect(result.items[0].finalQuantity).toBe(9);
      expect(result.items[0].contributingOrders).toEqual(['order-1', 'order-2']);
    });
  });

  describe('formatBulkOrderForWhatsApp', () => {
    it('should format bulk order for WhatsApp', () => {
      const bulkOrder = {
        weekStartDate: new Date('2025-10-27'),
        items: [
          {
            productId: 'product-1',
            productName: 'Tomatoes',
            totalQuantity: 8,
            bufferQuantity: 1,
            finalQuantity: 9,
            contributingOrders: ['order-1', 'order-2'],
          },
        ],
        generatedAt: new Date('2025-10-27T10:00:00Z'),
      };

      const result = orderService.formatBulkOrderForWhatsApp(bulkOrder);

      expect(result).toContain('📦 Bulk Order');
      expect(result).toContain('Tomatoes');
      expect(result).toContain('Base: 8');
      expect(result).toContain('Buffer: 1');
      expect(result).toContain('Total: 9');
    });
  });

  describe('formatBulkOrderForEmail', () => {
    it('should format bulk order for email', () => {
      const bulkOrder = {
        weekStartDate: new Date('2025-10-27'),
        items: [
          {
            productId: 'product-1',
            productName: 'Tomatoes',
            totalQuantity: 8,
            bufferQuantity: 1,
            finalQuantity: 9,
            contributingOrders: ['order-1', 'order-2'],
          },
        ],
        generatedAt: new Date('2025-10-27T10:00:00Z'),
      };

      const result = orderService.formatBulkOrderForEmail(bulkOrder);

      expect(result).toContain('<h2>Bulk Order');
      expect(result).toContain('<table');
      expect(result).toContain('Tomatoes');
      expect(result).toContain('<td>8</td>');
      expect(result).toContain('<td>1</td>');
      expect(result).toContain('<td><strong>9</strong></td>');
    });
  });
});
