/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InvoiceService } from '../services/invoice.service.js';
import { prisma } from '../lib/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';

// Mock Prisma
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    invoice: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
    },
    credit: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock PDF generator
vi.mock('../lib/pdf-generator.js', () => ({
  pdfGenerator: {
    generateInvoicePDF: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
  },
}));

// Mock file system
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
  },
}));

describe('InvoiceService', () => {
  let invoiceService: InvoiceService;

  beforeEach(() => {
    invoiceService = new InvoiceService();
    vi.clearAllMocks();
  });

  describe('generateInvoice', () => {
    it('should generate invoice from order with credit application', async () => {
      const orderId = 'order-1';
      const customerId = 'customer-1';

      const mockOrder = {
        id: orderId,
        customerId,
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
            orderId,
            productId: 'product-1',
            quantity: 2,
            priceAtOrder: new Decimal(25.50),
            product: {
              id: 'product-1',
              name: 'Tomatoes',
              price: new Decimal(25.50),
              category: 'vegetables',
              unit: 'kg',
            },
          },
          {
            id: 'item-2',
            orderId,
            productId: 'product-2',
            quantity: 1,
            priceAtOrder: new Decimal(15.00),
            product: {
              id: 'product-2',
              name: 'Lettuce',
              price: new Decimal(15.00),
              category: 'vegetables',
              unit: 'piece',
            },
          },
        ],
        customer: {
          id: customerId,
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

      const mockCredits = [
        {
          id: 'credit-1',
          customerId,
          amount: new Decimal(20.00),
          reason: 'Overpayment',
          type: 'overpayment',
          createdAt: new Date(),
        },
      ];

      const mockInvoice = {
        id: 'invoice-1',
        orderId,
        customerId,
        subtotal: new Decimal(66.00), // (25.50 * 2) + 15.00
        creditApplied: new Decimal(20.00),
        total: new Decimal(46.00),
        status: 'unpaid',
        pdfUrl: null,
        createdAt: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        order: mockOrder,
        customer: mockOrder.customer,
        payments: [],
      };

      vi.mocked(prisma.invoice.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder);
      vi.mocked(prisma.credit.findMany).mockResolvedValue(mockCredits);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          invoice: {
            create: vi.fn().mockResolvedValue(mockInvoice),
          },
          credit: {
            create: vi.fn().mockResolvedValue({
              id: 'credit-2',
              customerId,
              amount: new Decimal(-20.00),
              reason: `Applied to invoice ${mockInvoice.id}`,
              type: 'applied',
              createdAt: new Date(),
            }),
          },
        });
      });

      const result = await invoiceService.generateInvoice(orderId);

      expect(result.subtotal).toEqual(new Decimal(66.00));
      expect(result.creditApplied).toEqual(new Decimal(20.00));
      expect(result.total).toEqual(new Decimal(46.00));
      expect(result.status).toBe('unpaid');
    });

    it('should mark invoice as paid when total is zero after credit', async () => {
      const orderId = 'order-1';
      const customerId = 'customer-1';

      const mockOrder = {
        id: orderId,
        customerId,
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
            orderId,
            productId: 'product-1',
            quantity: 1,
            priceAtOrder: new Decimal(50.00),
            product: {
              id: 'product-1',
              name: 'Tomatoes',
              price: new Decimal(50.00),
              category: 'vegetables',
              unit: 'kg',
            },
          },
        ],
        customer: {
          id: customerId,
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

      const mockCredits = [
        {
          id: 'credit-1',
          customerId,
          amount: new Decimal(100.00),
          reason: 'Overpayment',
          type: 'overpayment',
          createdAt: new Date(),
        },
      ];

      const mockInvoice = {
        id: 'invoice-1',
        orderId,
        customerId,
        subtotal: new Decimal(50.00),
        creditApplied: new Decimal(50.00),
        total: new Decimal(0),
        status: 'paid',
        pdfUrl: null,
        createdAt: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        order: mockOrder,
        customer: mockOrder.customer,
        payments: [],
      };

      vi.mocked(prisma.invoice.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder);
      vi.mocked(prisma.credit.findMany).mockResolvedValue(mockCredits);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          invoice: {
            create: vi.fn().mockResolvedValue(mockInvoice),
          },
          credit: {
            create: vi.fn().mockResolvedValue({
              id: 'credit-2',
              customerId,
              amount: new Decimal(-50.00),
              reason: `Applied to invoice ${mockInvoice.id}`,
              type: 'applied',
              createdAt: new Date(),
            }),
          },
        });
      });

      const result = await invoiceService.generateInvoice(orderId);

      expect(result.total).toEqual(new Decimal(0));
      expect(result.status).toBe('paid');
    });

    it('should throw error if invoice already exists', async () => {
      const orderId = 'order-1';

      const existingInvoice = {
        id: 'invoice-1',
        orderId,
        customerId: 'customer-1',
        subtotal: new Decimal(100.00),
        creditApplied: new Decimal(0),
        total: new Decimal(100.00),
        status: 'unpaid',
        pdfUrl: null,
        createdAt: new Date(),
        dueDate: new Date(),
      };

      vi.mocked(prisma.invoice.findUnique).mockResolvedValue(existingInvoice);

      await expect(invoiceService.generateInvoice(orderId)).rejects.toThrow(
        'Invoice already exists for this order'
      );
    });

    it('should throw error if order not found', async () => {
      const orderId = 'order-1';

      vi.mocked(prisma.invoice.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      await expect(invoiceService.generateInvoice(orderId)).rejects.toThrow(
        'Order not found'
      );
    });
  });

  describe('getInvoice', () => {
    it('should return invoice with details', async () => {
      const invoiceId = 'invoice-1';

      const mockInvoice = {
        id: invoiceId,
        orderId: 'order-1',
        customerId: 'customer-1',
        subtotal: new Decimal(100.00),
        creditApplied: new Decimal(20.00),
        total: new Decimal(80.00),
        status: 'unpaid',
        pdfUrl: null,
        createdAt: new Date(),
        dueDate: new Date(),
        order: {
          id: 'order-1',
          customerId: 'customer-1',
          deliveryDate: new Date('2025-10-29'),
          deliveryMethod: 'delivery',
          deliveryAddress: '123 Main St',
          specialInstructions: null,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [],
        },
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
      };

      vi.mocked(prisma.invoice.findUnique).mockResolvedValue(mockInvoice);

      const result = await invoiceService.getInvoice(invoiceId);

      expect(result).toEqual(mockInvoice);
      expect(prisma.invoice.findUnique).toHaveBeenCalledWith({
        where: { id: invoiceId },
        include: {
          order: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
          customer: true,
          payments: true,
        },
      });
    });

    it('should return null if invoice not found', async () => {
      vi.mocked(prisma.invoice.findUnique).mockResolvedValue(null);

      const result = await invoiceService.getInvoice('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getCustomerInvoices', () => {
    it('should return all invoices for a customer', async () => {
      const customerId = 'customer-1';

      const mockInvoices = [
        {
          id: 'invoice-1',
          orderId: 'order-1',
          customerId,
          subtotal: new Decimal(100.00),
          creditApplied: new Decimal(0),
          total: new Decimal(100.00),
          status: 'unpaid',
          pdfUrl: null,
          createdAt: new Date(),
          dueDate: new Date(),
          order: {
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
          payments: [],
        },
      ];

      vi.mocked(prisma.invoice.findMany).mockResolvedValue(mockInvoices);

      const result = await invoiceService.getCustomerInvoices(customerId);

      expect(result).toEqual(mockInvoices);
      expect(prisma.invoice.findMany).toHaveBeenCalledWith({
        where: { customerId },
        include: {
          order: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
          payments: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('getCustomerCreditBalance', () => {
    it('should calculate total credit balance', async () => {
      const customerId = 'customer-1';

      const mockCredits = [
        {
          id: 'credit-1',
          customerId,
          amount: new Decimal(50.00),
          reason: 'Overpayment',
          type: 'overpayment',
          createdAt: new Date(),
        },
        {
          id: 'credit-2',
          customerId,
          amount: new Decimal(30.00),
          reason: 'Short delivery',
          type: 'short_delivery',
          createdAt: new Date(),
        },
        {
          id: 'credit-3',
          customerId,
          amount: new Decimal(-20.00),
          reason: 'Applied to invoice',
          type: 'applied',
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.credit.findMany).mockResolvedValue(mockCredits);

      const result = await invoiceService.getCustomerCreditBalance(customerId);

      expect(result).toBe(60.00); // 50 + 30 - 20
    });

    it('should return 0 for negative balance', async () => {
      const customerId = 'customer-1';

      const mockCredits = [
        {
          id: 'credit-1',
          customerId,
          amount: new Decimal(-50.00),
          reason: 'Applied to invoice',
          type: 'applied',
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.credit.findMany).mockResolvedValue(mockCredits);

      const result = await invoiceService.getCustomerCreditBalance(customerId);

      expect(result).toBe(0); // Never return negative
    });
  });
});
