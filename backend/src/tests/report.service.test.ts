/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportService } from '../services/report.service.js';
import { prisma } from '../lib/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';

// Mock Prisma
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
    },
    orderItem: {
      findMany: vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
    },
  },
}));

describe('ReportService', () => {
  let reportService: ReportService;

  beforeEach(() => {
    reportService = new ReportService();
    vi.clearAllMocks();
  });

  describe('generateSalesReport', () => {
    it('should calculate total revenue and aggregate products sold', async () => {
      const startDate = new Date('2025-10-01');
      const endDate = new Date('2025-10-31');

      const mockOrders = [
        {
          id: 'order-1',
          customerId: 'customer-1',
          deliveryDate: new Date('2025-10-15'),
          deliveryMethod: 'delivery',
          deliveryAddress: '123 Main St',
          specialInstructions: null,
          status: 'delivered',
          createdAt: new Date('2025-10-10'),
          updatedAt: new Date('2025-10-15'),
          deliveryFees: new Decimal(0),
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
            {
              id: 'item-2',
              orderId: 'order-1',
              productId: 'product-2',
              quantity: 2,
              priceAtOrder: new Decimal(15.00),
              product: {
                id: 'product-2',
                name: 'Lettuce',
                price: new Decimal(15.00),
                category: 'vegetables',
                unit: 'piece',
                description: null,
                imageUrl: null,
                isAvailable: true,
                isSeasonal: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
          ],
          invoice: {
            id: 'invoice-1',
            orderId: 'order-1',
            customerId: 'customer-1',
            subtotal: new Decimal(157.50),
            creditApplied: new Decimal(0),
            total: new Decimal(157.50),
            status: 'paid',
            pdfUrl: null,
            createdAt: new Date(),
            dueDate: new Date('2025-10-20'),
          },
        },
        {
          id: 'order-2',
          customerId: 'customer-2',
          deliveryDate: new Date('2025-10-20'),
          deliveryMethod: 'delivery',
          deliveryAddress: '456 Oak Ave',
          specialInstructions: null,
          status: 'delivered',
          createdAt: new Date('2025-10-15'),
          updatedAt: new Date('2025-10-20'),
          deliveryFees: new Decimal(0),
          items: [
            {
              id: 'item-3',
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
          invoice: {
            id: 'invoice-2',
            orderId: 'order-2',
            customerId: 'customer-2',
            subtotal: new Decimal(76.50),
            creditApplied: new Decimal(0),
            total: new Decimal(76.50),
            status: 'paid',
            pdfUrl: null,
            createdAt: new Date(),
            dueDate: new Date('2025-10-25'),
          },
        },
      ];

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders);

      const result = await reportService.generateSalesReport(startDate, endDate);

      expect(result.startDate).toEqual(startDate);
      expect(result.endDate).toEqual(endDate);
      expect(result.totalRevenue).toBe(234); // 157.50 + 76.50
      expect(result.totalOrders).toBe(2);
      expect(result.productsSold).toHaveLength(2);

      // Tomatoes should be first (higher revenue)
      expect(result.productsSold[0].productName).toBe('Tomatoes');
      expect(result.productsSold[0].quantitySold).toBe(8); // 5 + 3
      expect(result.productsSold[0].revenue).toBe(204); // 8 * 25.50

      // Lettuce should be second
      expect(result.productsSold[1].productName).toBe('Lettuce');
      expect(result.productsSold[1].quantitySold).toBe(2);
      expect(result.productsSold[1].revenue).toBe(30); // 2 * 15.00
    });

    it('should exclude cancelled orders from sales report', async () => {
      const startDate = new Date('2025-10-01');
      const endDate = new Date('2025-10-31');

      const mockOrders = [
        {
          id: 'order-1',
          customerId: 'customer-1',
          deliveryDate: new Date('2025-10-15'),
          deliveryMethod: 'delivery',
          deliveryAddress: '123 Main St',
          specialInstructions: null,
          status: 'delivered',
          createdAt: new Date('2025-10-10'),
          updatedAt: new Date('2025-10-15'),
          deliveryFees: new Decimal(0),
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
          invoice: {
            id: 'invoice-1',
            orderId: 'order-1',
            customerId: 'customer-1',
            subtotal: new Decimal(127.50),
            creditApplied: new Decimal(0),
            total: new Decimal(127.50),
            status: 'paid',
            pdfUrl: null,
            createdAt: new Date(),
            dueDate: new Date('2025-10-20'),
          },
        },
      ];

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders);

      const result = await reportService.generateSalesReport(startDate, endDate);

      expect(result.totalOrders).toBe(1);
      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            not: 'cancelled',
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          invoice: true,
        },
      });
    });
  });

  describe('generatePaymentStatusReport', () => {
    it('should calculate outstanding balances by customer', async () => {
      const mockInvoices = [
        {
          id: 'invoice-1',
          orderId: 'order-1',
          customerId: 'customer-1',
          subtotal: new Decimal(200.00),
          creditApplied: new Decimal(0),
          total: new Decimal(200.00),
          status: 'partial',
          pdfUrl: null,
          createdAt: new Date('2025-10-10'),
          dueDate: new Date('2025-10-20'),
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
          payments: [
            {
              id: 'payment-1',
              invoiceId: 'invoice-1',
              customerId: 'customer-1',
              amount: new Decimal(100.00),
              method: 'cash',
              paymentDate: new Date('2025-10-15'),
              notes: null,
            },
          ],
        },
        {
          id: 'invoice-2',
          orderId: 'order-2',
          customerId: 'customer-2',
          subtotal: new Decimal(150.00),
          creditApplied: new Decimal(0),
          total: new Decimal(150.00),
          status: 'unpaid',
          pdfUrl: null,
          createdAt: new Date('2025-10-15'),
          dueDate: new Date('2025-10-25'),
          customer: {
            id: 'customer-2',
            name: 'Jane Smith',
            phone: '+27987654321',
            email: null,
            address: '456 Oak Ave',
            deliveryPreference: 'delivery',
            role: 'customer',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          payments: [],
        },
        {
          id: 'invoice-3',
          orderId: 'order-3',
          customerId: 'customer-1',
          subtotal: new Decimal(100.00),
          creditApplied: new Decimal(0),
          total: new Decimal(100.00),
          status: 'unpaid',
          pdfUrl: null,
          createdAt: new Date('2025-10-20'),
          dueDate: new Date('2025-10-30'),
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
          payments: [],
        },
      ];

      vi.mocked(prisma.invoice.findMany).mockResolvedValue(mockInvoices);

      const result = await reportService.generatePaymentStatusReport();

      expect(result.totalOutstanding).toBe(350); // 100 + 150 + 100
      expect(result.customers).toHaveLength(2);

      // Customer 1 should be first (higher outstanding)
      expect(result.customers[0].customerName).toBe('John Doe');
      expect(result.customers[0].outstandingBalance).toBe(200); // (200 - 100) + 100
      expect(result.customers[0].lastPaymentDate).toEqual(new Date('2025-10-15'));

      // Customer 2 should be second
      expect(result.customers[1].customerName).toBe('Jane Smith');
      expect(result.customers[1].outstandingBalance).toBe(150);
      expect(result.customers[1].lastPaymentDate).toBeNull();
    });

    it('should only include unpaid and partial invoices', async () => {
      const mockInvoices = [
        {
          id: 'invoice-1',
          orderId: 'order-1',
          customerId: 'customer-1',
          subtotal: new Decimal(100.00),
          creditApplied: new Decimal(0),
          total: new Decimal(100.00),
          status: 'unpaid',
          pdfUrl: null,
          createdAt: new Date('2025-10-10'),
          dueDate: new Date('2025-10-20'),
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
          payments: [],
        },
      ];

      vi.mocked(prisma.invoice.findMany).mockResolvedValue(mockInvoices);

      await reportService.generatePaymentStatusReport();

      expect(prisma.invoice.findMany).toHaveBeenCalledWith({
        where: {
          status: {
            in: ['unpaid', 'partial'],
          },
        },
        include: {
          customer: true,
          payments: {
            orderBy: {
              paymentDate: 'desc',
            },
          },
        },
      });
    });
  });

  describe('generateProductPopularityReport', () => {
    it('should calculate product popularity metrics', async () => {
      const startDate = new Date('2025-10-01');
      const endDate = new Date('2025-10-31');

      const mockOrderItems = [
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
          order: {
            id: 'order-1',
            customerId: 'customer-1',
            deliveryDate: new Date('2025-10-15'),
            deliveryMethod: 'delivery',
            deliveryAddress: '123 Main St',
            specialInstructions: null,
            status: 'delivered',
            createdAt: new Date('2025-10-10'),
            updatedAt: new Date('2025-10-15'),
            deliveryFees: new Decimal(0),
          },
        },
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
          order: {
            id: 'order-2',
            customerId: 'customer-2',
            deliveryDate: new Date('2025-10-20'),
            deliveryMethod: 'delivery',
            deliveryAddress: '456 Oak Ave',
            specialInstructions: null,
            status: 'delivered',
            createdAt: new Date('2025-10-15'),
            updatedAt: new Date('2025-10-20'),
            deliveryFees: new Decimal(0),
          },
        },
        {
          id: 'item-3',
          orderId: 'order-1',
          productId: 'product-2',
          quantity: 2,
          priceAtOrder: new Decimal(15.00),
          product: {
            id: 'product-2',
            name: 'Lettuce',
            price: new Decimal(15.00),
            category: 'vegetables',
            unit: 'piece',
            description: null,
            imageUrl: null,
            isAvailable: true,
            isSeasonal: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          order: {
            id: 'order-1',
            customerId: 'customer-1',
            deliveryDate: new Date('2025-10-15'),
            deliveryMethod: 'delivery',
            deliveryAddress: '123 Main St',
            specialInstructions: null,
            status: 'delivered',
            createdAt: new Date('2025-10-10'),
            updatedAt: new Date('2025-10-15'),
            deliveryFees: new Decimal(0),
          },
        },
      ];

      vi.mocked(prisma.orderItem.findMany).mockResolvedValue(mockOrderItems);

      const result = await reportService.generateProductPopularityReport(startDate, endDate);

      expect(result.startDate).toEqual(startDate);
      expect(result.endDate).toEqual(endDate);
      expect(result.products).toHaveLength(2);

      // Tomatoes should be first (higher quantity)
      expect(result.products[0].productName).toBe('Tomatoes');
      expect(result.products[0].orderCount).toBe(2); // 2 unique orders
      expect(result.products[0].totalQuantity).toBe(8); // 5 + 3
      expect(result.products[0].revenue).toBe(204); // 8 * 25.50

      // Lettuce should be second
      expect(result.products[1].productName).toBe('Lettuce');
      expect(result.products[1].orderCount).toBe(1); // 1 unique order
      expect(result.products[1].totalQuantity).toBe(2);
      expect(result.products[1].revenue).toBe(30); // 2 * 15.00
    });

    it('should exclude cancelled orders from popularity report', async () => {
      const startDate = new Date('2025-10-01');
      const endDate = new Date('2025-10-31');

      vi.mocked(prisma.orderItem.findMany).mockResolvedValue([]);

      await reportService.generateProductPopularityReport(startDate, endDate);

      expect(prisma.orderItem.findMany).toHaveBeenCalledWith({
        where: {
          order: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            status: {
              not: 'cancelled',
            },
          },
        },
        include: {
          product: true,
          order: true,
        },
      });
    });
  });

  describe('generateCustomerActivityReport', () => {
    it('should calculate customer activity metrics', async () => {
      const startDate = new Date('2025-10-01');
      const endDate = new Date('2025-10-31');

      const mockOrders = [
        {
          id: 'order-1',
          customerId: 'customer-1',
          deliveryDate: new Date('2025-10-15'),
          deliveryMethod: 'delivery',
          deliveryAddress: '123 Main St',
          specialInstructions: null,
          status: 'delivered',
          createdAt: new Date('2025-10-10'),
          updatedAt: new Date('2025-10-15'),
          deliveryFees: new Decimal(0),
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
          invoice: {
            id: 'invoice-1',
            orderId: 'order-1',
            customerId: 'customer-1',
            subtotal: new Decimal(200.00),
            creditApplied: new Decimal(0),
            total: new Decimal(200.00),
            status: 'paid',
            pdfUrl: null,
            createdAt: new Date(),
            dueDate: new Date('2025-10-20'),
          },
        },
        {
          id: 'order-2',
          customerId: 'customer-1',
          deliveryDate: new Date('2025-10-20'),
          deliveryMethod: 'delivery',
          deliveryAddress: '123 Main St',
          specialInstructions: null,
          status: 'delivered',
          createdAt: new Date('2025-10-15'),
          updatedAt: new Date('2025-10-20'),
          deliveryFees: new Decimal(0),
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
          invoice: {
            id: 'invoice-2',
            orderId: 'order-2',
            customerId: 'customer-1',
            subtotal: new Decimal(100.00),
            creditApplied: new Decimal(0),
            total: new Decimal(100.00),
            status: 'paid',
            pdfUrl: null,
            createdAt: new Date(),
            dueDate: new Date('2025-10-25'),
          },
        },
        {
          id: 'order-3',
          customerId: 'customer-2',
          deliveryDate: new Date('2025-10-25'),
          deliveryMethod: 'delivery',
          deliveryAddress: '456 Oak Ave',
          specialInstructions: null,
          status: 'delivered',
          createdAt: new Date('2025-10-20'),
          updatedAt: new Date('2025-10-25'),
          deliveryFees: new Decimal(0),
          customer: {
            id: 'customer-2',
            name: 'Jane Smith',
            phone: '+27987654321',
            email: null,
            address: '456 Oak Ave',
            deliveryPreference: 'delivery',
            role: 'customer',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          invoice: {
            id: 'invoice-3',
            orderId: 'order-3',
            customerId: 'customer-2',
            subtotal: new Decimal(150.00),
            creditApplied: new Decimal(0),
            total: new Decimal(150.00),
            status: 'paid',
            pdfUrl: null,
            createdAt: new Date(),
            dueDate: new Date('2025-10-30'),
          },
        },
      ];

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders);

      const result = await reportService.generateCustomerActivityReport(startDate, endDate);

      expect(result.startDate).toEqual(startDate);
      expect(result.endDate).toEqual(endDate);
      expect(result.customers).toHaveLength(2);

      // Customer 1 should be first (higher total spent)
      expect(result.customers[0].customerName).toBe('John Doe');
      expect(result.customers[0].orderCount).toBe(2);
      expect(result.customers[0].totalSpent).toBe(300); // 200 + 100
      expect(result.customers[0].averageOrderValue).toBe(150); // 300 / 2
      expect(result.customers[0].lastOrderDate).toEqual(new Date('2025-10-15'));

      // Customer 2 should be second
      expect(result.customers[1].customerName).toBe('Jane Smith');
      expect(result.customers[1].orderCount).toBe(1);
      expect(result.customers[1].totalSpent).toBe(150);
      expect(result.customers[1].averageOrderValue).toBe(150); // 150 / 1
      expect(result.customers[1].lastOrderDate).toEqual(new Date('2025-10-20'));
    });

    it('should exclude cancelled orders from activity report', async () => {
      const startDate = new Date('2025-10-01');
      const endDate = new Date('2025-10-31');

      vi.mocked(prisma.order.findMany).mockResolvedValue([]);

      await reportService.generateCustomerActivityReport(startDate, endDate);

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            not: 'cancelled',
          },
        },
        include: {
          customer: true,
          invoice: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });
});
