/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomerService } from '../services/customer.service.js';
import { prisma } from '../lib/prisma.js';
import { orderService } from '../services/order.service.js';
import { paymentService } from '../services/payment.service.js';
import { invoiceService } from '../services/invoice.service.js';
import { Decimal } from '@prisma/client/runtime/library';

// Mock Prisma and services
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../services/order.service.js', () => ({
  orderService: {
    getCustomerOrders: vi.fn(),
  },
}));

vi.mock('../services/payment.service.js', () => ({
  paymentService: {
    getCreditBalance: vi.fn(),
    getCustomerPayments: vi.fn(),
  },
}));

vi.mock('../services/invoice.service.js', () => ({
  invoiceService: {
    getCustomerInvoices: vi.fn(),
  },
}));

describe('CustomerService', () => {
  let customerService: CustomerService;

  beforeEach(() => {
    customerService = new CustomerService();
    vi.clearAllMocks();
  });

  describe('createCustomer', () => {
    it('should create a new customer with phone', async () => {
      const customerData = {
        phone: '+27123456789',
        name: 'John Doe',
        address: '123 Main St',
        deliveryPreference: 'delivery' as const,
      };

      const mockCustomer = {
        id: 'customer-1',
        phone: customerData.phone,
        email: null,
        name: customerData.name,
        address: customerData.address,
        deliveryPreference: customerData.deliveryPreference,
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue(mockCustomer);

      const result = await customerService.createCustomer(customerData);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ phone: customerData.phone }],
        },
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          phone: customerData.phone,
          email: null,
          name: customerData.name,
          address: customerData.address,
          deliveryPreference: customerData.deliveryPreference,
          role: 'customer',
        },
      });
      expect(result).toEqual(mockCustomer);
    });

    it('should create a new customer with email', async () => {
      const customerData = {
        email: 'john@example.com',
        name: 'John Doe',
      };

      const mockCustomer = {
        id: 'customer-2',
        phone: null,
        email: customerData.email,
        name: customerData.name,
        address: null,
        deliveryPreference: 'delivery',
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue(mockCustomer);

      const result = await customerService.createCustomer(customerData);

      expect(result).toEqual(mockCustomer);
      expect(result.email).toBe(customerData.email);
    });

    it('should throw error if neither phone nor email provided', async () => {
      const customerData = {
        name: 'John Doe',
      };

      await expect(customerService.createCustomer(customerData)).rejects.toThrow(
        'Either phone or email must be provided'
      );
    });

    it('should throw error if customer with phone already exists', async () => {
      const customerData = {
        phone: '+27123456789',
        name: 'John Doe',
      };

      const existingCustomer = {
        id: 'existing-1',
        phone: customerData.phone,
        email: null,
        name: 'Existing Customer',
        address: null,
        deliveryPreference: 'delivery',
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findFirst).mockResolvedValue(existingCustomer);

      await expect(customerService.createCustomer(customerData)).rejects.toThrow(
        'Customer with this phone or email already exists'
      );
    });

    it('should throw error if customer with email already exists', async () => {
      const customerData = {
        email: 'john@example.com',
        name: 'John Doe',
      };

      const existingCustomer = {
        id: 'existing-1',
        phone: null,
        email: customerData.email,
        name: 'Existing Customer',
        address: null,
        deliveryPreference: 'delivery',
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findFirst).mockResolvedValue(existingCustomer);

      await expect(customerService.createCustomer(customerData)).rejects.toThrow(
        'Customer with this phone or email already exists'
      );
    });

    it('should default deliveryPreference to delivery if not provided', async () => {
      const customerData = {
        phone: '+27123456789',
        name: 'John Doe',
      };

      const mockCustomer = {
        id: 'customer-3',
        phone: customerData.phone,
        email: null,
        name: customerData.name,
        address: null,
        deliveryPreference: 'delivery',
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue(mockCustomer);

      const result = await customerService.createCustomer(customerData);

      expect(result.deliveryPreference).toBe('delivery');
    });
  });

  describe('updateCustomer', () => {
    it('should update customer details', async () => {
      const customerId = 'customer-1';
      const updateData = {
        name: 'Jane Doe',
        address: '456 Oak Ave',
        deliveryPreference: 'collection' as const,
      };

      const existingCustomer = {
        id: customerId,
        phone: '+27123456789',
        email: null,
        name: 'John Doe',
        address: '123 Main St',
        deliveryPreference: 'delivery',
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedCustomer = {
        ...existingCustomer,
        ...updateData,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(existingCustomer);
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedCustomer);

      const result = await customerService.updateCustomer(customerId, updateData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: customerId },
        data: {
          phone: undefined,
          email: undefined,
          name: updateData.name,
          address: updateData.address,
          deliveryPreference: updateData.deliveryPreference,
        },
      });
      expect(result).toEqual(updatedCustomer);
    });

    it('should throw error if customer not found', async () => {
      const customerId = 'non-existent';
      const updateData = {
        name: 'Jane Doe',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(customerService.updateCustomer(customerId, updateData)).rejects.toThrow(
        'Customer not found'
      );
    });

    it('should update phone number if provided', async () => {
      const customerId = 'customer-1';
      const updateData = {
        phone: '+27987654321',
      };

      const existingCustomer = {
        id: customerId,
        phone: '+27123456789',
        email: null,
        name: 'John Doe',
        address: null,
        deliveryPreference: 'delivery',
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedCustomer = {
        ...existingCustomer,
        phone: updateData.phone,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(existingCustomer);
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedCustomer);

      const result = await customerService.updateCustomer(customerId, updateData);

      expect(result.phone).toBe(updateData.phone);
    });

    it('should throw error if updated phone already exists for another customer', async () => {
      const customerId = 'customer-1';
      const updateData = {
        phone: '+27987654321',
      };

      const existingCustomer = {
        id: customerId,
        phone: '+27123456789',
        email: null,
        name: 'John Doe',
        address: null,
        deliveryPreference: 'delivery',
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const duplicateCustomer = {
        id: 'customer-2',
        phone: updateData.phone,
        email: null,
        name: 'Jane Doe',
        address: null,
        deliveryPreference: 'delivery',
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(existingCustomer);
      vi.mocked(prisma.user.findFirst).mockResolvedValue(duplicateCustomer);

      await expect(customerService.updateCustomer(customerId, updateData)).rejects.toThrow(
        'Another customer with this phone or email already exists'
      );
    });

    it('should throw error if updated email already exists for another customer', async () => {
      const customerId = 'customer-1';
      const updateData = {
        email: 'jane@example.com',
      };

      const existingCustomer = {
        id: customerId,
        phone: null,
        email: 'john@example.com',
        name: 'John Doe',
        address: null,
        deliveryPreference: 'delivery',
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const duplicateCustomer = {
        id: 'customer-2',
        phone: null,
        email: updateData.email,
        name: 'Jane Doe',
        address: null,
        deliveryPreference: 'delivery',
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(existingCustomer);
      vi.mocked(prisma.user.findFirst).mockResolvedValue(duplicateCustomer);

      await expect(customerService.updateCustomer(customerId, updateData)).rejects.toThrow(
        'Another customer with this phone or email already exists'
      );
    });
  });

  describe('getCustomer', () => {
    it('should return customer by id', async () => {
      const customerId = 'customer-1';
      const mockCustomer = {
        id: customerId,
        phone: '+27123456789',
        email: null,
        name: 'John Doe',
        address: '123 Main St',
        deliveryPreference: 'delivery',
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockCustomer);

      const result = await customerService.getCustomer(customerId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: customerId },
      });
      expect(result).toEqual(mockCustomer);
    });

    it('should return null if customer not found', async () => {
      const customerId = 'non-existent';

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await customerService.getCustomer(customerId);

      expect(result).toBeNull();
    });
  });

  describe('getCustomers', () => {
    it('should return all customers sorted by name', async () => {
      const mockCustomers = [
        {
          id: 'customer-1',
          phone: '+27123456789',
          email: null,
          name: 'Alice Smith',
          address: '123 Main St',
          deliveryPreference: 'delivery',
          role: 'customer',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'customer-2',
          phone: null,
          email: 'bob@example.com',
          name: 'Bob Jones',
          address: '456 Oak Ave',
          deliveryPreference: 'collection',
          role: 'customer',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockCustomers);

      const result = await customerService.getCustomers();

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          role: 'customer',
        },
        orderBy: {
          name: 'asc',
        },
      });
      expect(result).toEqual(mockCustomers);
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no customers exist', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      const result = await customerService.getCustomers();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getCustomerProfile', () => {
    it('should return complete customer profile with aggregated data', async () => {
      const customerId = 'customer-1';
      const mockCustomer = {
        id: customerId,
        phone: '+27123456789',
        email: null,
        name: 'John Doe',
        address: '123 Main St',
        deliveryPreference: 'delivery',
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockOrders = [
        {
          id: 'order-1',
          customerId,
          deliveryDate: new Date('2025-10-28'),
          deliveryMethod: 'delivery',
          deliveryAddress: '123 Test St',
          specialInstructions: null,
          status: 'delivered',
          items: [],
          deliveryFees: new Decimal(0),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockCreditBalance = 50.0;

      const mockPayments = [
        {
          id: 'payment-1',
          customerId,
          invoiceId: 'invoice-1',
          amount: 100.0,
          method: 'cash',
          paymentDate: new Date(),
          notes: null,
        },
      ];

      const mockInvoices = [
        {
          id: 'invoice-1',
          orderId: 'order-1',
          customerId,
          subtotal: new Decimal(100.0),
          creditApplied: new Decimal(0),
          total: new Decimal(100.0),
          status: 'paid',
          pdfUrl: null,
          createdAt: new Date(),
          dueDate: new Date(),
        },
      ];

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockCustomer);
      vi.mocked(orderService.getCustomerOrders).mockResolvedValue(mockOrders);
      vi.mocked(paymentService.getCreditBalance).mockResolvedValue(mockCreditBalance);
      vi.mocked(paymentService.getCustomerPayments).mockResolvedValue(mockPayments);
      vi.mocked(invoiceService.getCustomerInvoices).mockResolvedValue(mockInvoices);

      const result = await customerService.getCustomerProfile(customerId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(customerId);
      expect(result?.name).toBe(mockCustomer.name);
      expect(result?.orderHistory).toEqual(mockOrders);
      expect(result?.creditBalance).toBe(mockCreditBalance);
      expect(result?.paymentHistory).toEqual(mockPayments);
      expect(result?.invoices).toEqual(mockInvoices);
    });

    it('should return null if customer not found', async () => {
      const customerId = 'non-existent';

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await customerService.getCustomerProfile(customerId);

      expect(result).toBeNull();
      expect(orderService.getCustomerOrders).not.toHaveBeenCalled();
      expect(paymentService.getCreditBalance).not.toHaveBeenCalled();
    });

    it('should aggregate data from multiple services', async () => {
      const customerId = 'customer-1';
      const mockCustomer = {
        id: customerId,
        phone: '+27123456789',
        email: null,
        name: 'John Doe',
        address: '123 Main St',
        deliveryPreference: 'delivery',
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockCustomer);
      vi.mocked(orderService.getCustomerOrders).mockResolvedValue([]);
      vi.mocked(paymentService.getCreditBalance).mockResolvedValue(0);
      vi.mocked(paymentService.getCustomerPayments).mockResolvedValue([]);
      vi.mocked(invoiceService.getCustomerInvoices).mockResolvedValue([]);

      const result = await customerService.getCustomerProfile(customerId);

      expect(orderService.getCustomerOrders).toHaveBeenCalledWith(customerId);
      expect(paymentService.getCreditBalance).toHaveBeenCalledWith(customerId);
      expect(paymentService.getCustomerPayments).toHaveBeenCalledWith(customerId);
      expect(invoiceService.getCustomerInvoices).toHaveBeenCalledWith(customerId);
      expect(result?.orderHistory).toEqual([]);
      expect(result?.creditBalance).toBe(0);
      expect(result?.paymentHistory).toEqual([]);
      expect(result?.invoices).toEqual([]);
    });
  });
});
