/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PaymentService } from '../services/payment.service.js';
import { prisma } from '../lib/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';

// Mock Prisma
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    payment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    credit: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    invoice: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('PaymentService', () => {
  let paymentService: PaymentService;

  beforeEach(() => {
    paymentService = new PaymentService();
    vi.clearAllMocks();
  });

  describe('recordPayment', () => {
    it('should record payment and update invoice status to paid', async () => {
      const paymentData = {
        invoiceId: 'invoice-1',
        customerId: 'customer-1',
        amount: 100.00,
        method: 'cash' as const,
        paymentDate: new Date('2025-10-27'),
        notes: 'Cash payment',
      };

      const mockInvoice = {
        id: 'invoice-1',
        orderId: 'order-1',
        customerId: 'customer-1',
        subtotal: new Decimal(100.00),
        creditApplied: new Decimal(0),
        total: new Decimal(100.00),
        status: 'unpaid',
        pdfUrl: null,
        createdAt: new Date(),
        dueDate: new Date(),
      };

      const mockPayment = {
        id: 'payment-1',
        invoiceId: 'invoice-1',
        customerId: 'customer-1',
        amount: new Decimal(100.00),
        method: 'cash',
        paymentDate: new Date('2025-10-27'),
        notes: 'Cash payment',
        invoice: mockInvoice,
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

      vi.mocked(prisma.invoice.findUnique).mockResolvedValue(mockInvoice);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          payment: {
            create: vi.fn().mockResolvedValue(mockPayment),
            findMany: vi.fn().mockResolvedValue([mockPayment]),
          },
          invoice: {
            update: vi.fn().mockResolvedValue({ ...mockInvoice, status: 'paid' }),
          },
          credit: {
            create: vi.fn(),
          },
        });
      });

      const result = await paymentService.recordPayment(paymentData);

      expect(result.amount).toBe(100.00);
      expect(result.method).toBe('cash');
    });

    it('should create credit for overpayment', async () => {
      const paymentData = {
        invoiceId: 'invoice-1',
        customerId: 'customer-1',
        amount: 150.00,
        method: 'eft' as const,
        paymentDate: new Date('2025-10-27'),
      };

      const mockInvoice = {
        id: 'invoice-1',
        orderId: 'order-1',
        customerId: 'customer-1',
        subtotal: new Decimal(100.00),
        creditApplied: new Decimal(0),
        total: new Decimal(100.00),
        status: 'unpaid',
        pdfUrl: null,
        createdAt: new Date(),
        dueDate: new Date(),
      };

      const mockPayment = {
        id: 'payment-1',
        invoiceId: 'invoice-1',
        customerId: 'customer-1',
        amount: new Decimal(150.00),
        method: 'eft',
        paymentDate: new Date('2025-10-27'),
        notes: null,
        invoice: mockInvoice,
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

      const mockCreditCreate = vi.fn().mockResolvedValue({
        id: 'credit-1',
        customerId: 'customer-1',
        amount: new Decimal(50.00),
        reason: 'Overpayment on invoice invoice-1',
        type: 'overpayment',
        createdAt: new Date(),
      });

      vi.mocked(prisma.invoice.findUnique).mockResolvedValue(mockInvoice);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          payment: {
            create: vi.fn().mockResolvedValue(mockPayment),
            findMany: vi.fn().mockResolvedValue([mockPayment]),
          },
          invoice: {
            update: vi.fn().mockResolvedValue({ ...mockInvoice, status: 'paid' }),
          },
          credit: {
            create: mockCreditCreate,
          },
        });
      });

      await paymentService.recordPayment(paymentData);

      expect(mockCreditCreate).toHaveBeenCalledWith({
        data: {
          customerId: 'customer-1',
          amount: new Decimal(50.00),
          reason: 'Overpayment on invoice invoice-1',
          type: 'overpayment',
        },
      });
    });

    it('should update invoice status to partial for partial payment', async () => {
      const paymentData = {
        invoiceId: 'invoice-1',
        customerId: 'customer-1',
        amount: 50.00,
        method: 'yoco' as const,
        paymentDate: new Date('2025-10-27'),
      };

      const mockInvoice = {
        id: 'invoice-1',
        orderId: 'order-1',
        customerId: 'customer-1',
        subtotal: new Decimal(100.00),
        creditApplied: new Decimal(0),
        total: new Decimal(100.00),
        status: 'unpaid',
        pdfUrl: null,
        createdAt: new Date(),
        dueDate: new Date(),
      };

      const mockPayment = {
        id: 'payment-1',
        invoiceId: 'invoice-1',
        customerId: 'customer-1',
        amount: new Decimal(50.00),
        method: 'yoco',
        paymentDate: new Date('2025-10-27'),
        notes: null,
        invoice: mockInvoice,
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

      const mockInvoiceUpdate = vi.fn().mockResolvedValue({ ...mockInvoice, status: 'partial' });

      vi.mocked(prisma.invoice.findUnique).mockResolvedValue(mockInvoice);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          payment: {
            create: vi.fn().mockResolvedValue(mockPayment),
            findMany: vi.fn().mockResolvedValue([mockPayment]),
          },
          invoice: {
            update: mockInvoiceUpdate,
          },
          credit: {
            create: vi.fn(),
          },
        });
      });

      await paymentService.recordPayment(paymentData);

      expect(mockInvoiceUpdate).toHaveBeenCalledWith({
        where: { id: 'invoice-1' },
        data: { status: 'partial' },
      });
    });

    it('should throw error if invoice not found', async () => {
      const paymentData = {
        invoiceId: 'invoice-1',
        customerId: 'customer-1',
        amount: 100.00,
        method: 'cash' as const,
        paymentDate: new Date('2025-10-27'),
      };

      vi.mocked(prisma.invoice.findUnique).mockResolvedValue(null);

      await expect(paymentService.recordPayment(paymentData)).rejects.toThrow(
        'Invoice not found'
      );
    });

    it('should throw error if customer does not match invoice', async () => {
      const paymentData = {
        invoiceId: 'invoice-1',
        customerId: 'customer-2',
        amount: 100.00,
        method: 'cash' as const,
        paymentDate: new Date('2025-10-27'),
      };

      const mockInvoice = {
        id: 'invoice-1',
        orderId: 'order-1',
        customerId: 'customer-1',
        subtotal: new Decimal(100.00),
        creditApplied: new Decimal(0),
        total: new Decimal(100.00),
        status: 'unpaid',
        pdfUrl: null,
        createdAt: new Date(),
        dueDate: new Date(),
      };

      vi.mocked(prisma.invoice.findUnique).mockResolvedValue(mockInvoice);

      await expect(paymentService.recordPayment(paymentData)).rejects.toThrow(
        'Customer does not match invoice'
      );
    });

    it('should throw error for invalid payment amount', async () => {
      const paymentData = {
        invoiceId: 'invoice-1',
        customerId: 'customer-1',
        amount: -50.00,
        method: 'cash' as const,
        paymentDate: new Date('2025-10-27'),
      };

      const mockInvoice = {
        id: 'invoice-1',
        orderId: 'order-1',
        customerId: 'customer-1',
        subtotal: new Decimal(100.00),
        creditApplied: new Decimal(0),
        total: new Decimal(100.00),
        status: 'unpaid',
        pdfUrl: null,
        createdAt: new Date(),
        dueDate: new Date(),
      };

      vi.mocked(prisma.invoice.findUnique).mockResolvedValue(mockInvoice);

      await expect(paymentService.recordPayment(paymentData)).rejects.toThrow(
        'Payment amount must be positive'
      );
    });
  });

  describe('getCreditBalance', () => {
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

      const result = await paymentService.getCreditBalance(customerId);

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

      const result = await paymentService.getCreditBalance(customerId);

      expect(result).toBe(0); // Never return negative
    });
  });

  describe('recordShortDelivery', () => {
    it('should create credit for short delivery', async () => {
      const shortDeliveryData = {
        orderId: 'order-1',
        customerId: 'customer-1',
        items: [
          {
            productId: 'product-1',
            quantityShort: 2,
          },
        ],
      };

      const mockOrder = {
        id: 'order-1',
        customerId: 'customer-1',
        deliveryDate: new Date('2025-10-29'),
        deliveryMethod: 'delivery',
        deliveryAddress: '123 Main St',
        specialInstructions: null,
        status: 'delivered',
        createdAt: new Date(),
        updatedAt: new Date(),
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
            },
          },
        ],
      };

      const mockCredit = {
        id: 'credit-1',
        customerId: 'customer-1',
        amount: new Decimal(51.00), // 2 * 25.50
        reason: 'Short delivery on order order-1: Tomatoes: 2 x R25.50 = R51.00',
        type: 'short_delivery',
        createdAt: new Date(),
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
      vi.mocked(prisma.credit.create).mockResolvedValue(mockCredit);

      const result = await paymentService.recordShortDelivery(shortDeliveryData);

      expect(result.amount).toEqual(new Decimal(51.00));
      expect(result.type).toBe('short_delivery');
      expect(prisma.credit.create).toHaveBeenCalledWith({
        data: {
          customerId: 'customer-1',
          amount: new Decimal(51.00),
          reason: expect.stringContaining('Short delivery on order order-1'),
          type: 'short_delivery',
        },
        include: {
          customer: true,
        },
      });
    });

    it('should handle multiple short delivery items', async () => {
      const shortDeliveryData = {
        orderId: 'order-1',
        customerId: 'customer-1',
        items: [
          {
            productId: 'product-1',
            quantityShort: 2,
          },
          {
            productId: 'product-2',
            quantityShort: 1,
          },
        ],
      };

      const mockOrder = {
        id: 'order-1',
        customerId: 'customer-1',
        deliveryDate: new Date('2025-10-29'),
        deliveryMethod: 'delivery',
        deliveryAddress: '123 Main St',
        specialInstructions: null,
        status: 'delivered',
        createdAt: new Date(),
        updatedAt: new Date(),
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
            },
          },
          {
            id: 'item-2',
            orderId: 'order-1',
            productId: 'product-2',
            quantity: 3,
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
      };

      const mockCredit = {
        id: 'credit-1',
        customerId: 'customer-1',
        amount: new Decimal(66.00), // (2 * 25.50) + (1 * 15.00)
        reason: 'Short delivery on order order-1: Tomatoes: 2 x R25.50 = R51.00; Lettuce: 1 x R15.00 = R15.00',
        type: 'short_delivery',
        createdAt: new Date(),
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
      vi.mocked(prisma.credit.create).mockResolvedValue(mockCredit);

      const result = await paymentService.recordShortDelivery(shortDeliveryData);

      expect(result.amount).toEqual(new Decimal(66.00));
    });

    it('should throw error if order not found', async () => {
      const shortDeliveryData = {
        orderId: 'order-1',
        customerId: 'customer-1',
        items: [
          {
            productId: 'product-1',
            quantityShort: 2,
          },
        ],
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      await expect(paymentService.recordShortDelivery(shortDeliveryData)).rejects.toThrow(
        'Order not found'
      );
    });

    it('should throw error if customer does not match order', async () => {
      const shortDeliveryData = {
        orderId: 'order-1',
        customerId: 'customer-2',
        items: [
          {
            productId: 'product-1',
            quantityShort: 2,
          },
        ],
      };

      const mockOrder = {
        id: 'order-1',
        customerId: 'customer-1',
        deliveryDate: new Date('2025-10-29'),
        deliveryMethod: 'delivery',
        deliveryAddress: '123 Main St',
        specialInstructions: null,
        status: 'delivered',
        createdAt: new Date(),
        updatedAt: new Date(),
        deliveryFees: new Decimal(0),
        items: [],
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder);

      await expect(paymentService.recordShortDelivery(shortDeliveryData)).rejects.toThrow(
        'Customer does not match order'
      );
    });

    it('should throw error if short quantity exceeds ordered quantity', async () => {
      const shortDeliveryData = {
        orderId: 'order-1',
        customerId: 'customer-1',
        items: [
          {
            productId: 'product-1',
            quantityShort: 10,
          },
        ],
      };

      const mockOrder = {
        id: 'order-1',
        customerId: 'customer-1',
        deliveryDate: new Date('2025-10-29'),
        deliveryMethod: 'delivery',
        deliveryAddress: '123 Main St',
        specialInstructions: null,
        status: 'delivered',
        createdAt: new Date(),
        updatedAt: new Date(),
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
            },
          },
        ],
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder);

      await expect(paymentService.recordShortDelivery(shortDeliveryData)).rejects.toThrow(
        'Short quantity for Tomatoes exceeds ordered quantity'
      );
    });
  });

  describe('getPayment', () => {
    it('should return payment with details', async () => {
      const paymentId = 'payment-1';

      const mockPayment = {
        id: paymentId,
        invoiceId: 'invoice-1',
        customerId: 'customer-1',
        amount: new Decimal(100.00),
        method: 'cash',
        paymentDate: new Date('2025-10-27'),
        notes: 'Cash payment',
        invoice: {
          id: 'invoice-1',
          orderId: 'order-1',
          customerId: 'customer-1',
          subtotal: new Decimal(100.00),
          creditApplied: new Decimal(0),
          total: new Decimal(100.00),
          status: 'paid',
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
            status: 'delivered',
            createdAt: new Date(),
            updatedAt: new Date(),
            deliveryFees: new Decimal(0),
          },
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
      };

      vi.mocked(prisma.payment.findUnique).mockResolvedValue(mockPayment);

      const result = await paymentService.getPayment(paymentId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockPayment.id);
      expect(result?.amount).toBe(100.00);
      expect(result?.method).toBe(mockPayment.method);
    });

    it('should return null if payment not found', async () => {
      vi.mocked(prisma.payment.findUnique).mockResolvedValue(null);

      const result = await paymentService.getPayment('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getCustomerPayments', () => {
    it('should return all payments for a customer', async () => {
      const customerId = 'customer-1';

      const mockPayments = [
        {
          id: 'payment-1',
          invoiceId: 'invoice-1',
          customerId,
          amount: new Decimal(100.00),
          method: 'cash',
          paymentDate: new Date('2025-10-27'),
          notes: null,
          invoice: {
            id: 'invoice-1',
            orderId: 'order-1',
            customerId,
            subtotal: new Decimal(100.00),
            creditApplied: new Decimal(0),
            total: new Decimal(100.00),
            status: 'paid',
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
              status: 'delivered',
              createdAt: new Date(),
              updatedAt: new Date(),
              deliveryFees: new Decimal(0),
            },
          },
        },
      ];

      vi.mocked(prisma.payment.findMany).mockResolvedValue(mockPayments);

      const result = await paymentService.getCustomerPayments(customerId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('payment-1');
      expect(result[0].amount).toBe(100.00);
      expect(result[0].customerId).toBe(customerId);
    });
  });
});
