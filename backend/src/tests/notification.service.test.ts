/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from '../services/notification.service.js';
import { prisma } from '../lib/prisma.js';
import axios from 'axios';

// Mock Prisma
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    notification: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
    },
  },
}));

// Mock axios
vi.mock('axios');

describe('NotificationService', () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    notificationService = new NotificationService();
    vi.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification record', async () => {
      const mockNotification = {
        id: 'notif-1',
        customerId: 'customer-1',
        type: 'order_confirmation',
        method: 'whatsapp',
        content: 'Test message',
        status: 'pending',
        sentAt: null,
        createdAt: new Date(),
      };

      vi.mocked(prisma.notification.create).mockResolvedValue(mockNotification);

      const result = await notificationService.createNotification(
        'customer-1',
        'order_confirmation',
        'whatsapp',
        'Test message'
      );

      expect(result).toEqual(mockNotification);
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          customerId: 'customer-1',
          type: 'order_confirmation',
          method: 'whatsapp',
          content: 'Test message',
          status: 'pending',
        },
      });
    });
  });

  describe('updateNotificationStatus', () => {
    it('should update notification status to sent', async () => {
      const sentAt = new Date();
      vi.mocked(prisma.notification.update).mockResolvedValue({} as any);

      await notificationService.updateNotificationStatus('notif-1', 'sent', sentAt);

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: {
          status: 'sent',
          sentAt,
        },
      });
    });

    it('should update notification status to failed', async () => {
      vi.mocked(prisma.notification.update).mockResolvedValue({} as any);

      await notificationService.updateNotificationStatus('notif-1', 'failed');

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: {
          status: 'failed',
          sentAt: null,
        },
      });
    });
  });

  describe('getPendingNotifications', () => {
    it('should retrieve pending notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          customerId: 'customer-1',
          type: 'order_confirmation',
          method: 'whatsapp',
          content: 'Test message',
          status: 'pending',
          sentAt: null,
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.notification.findMany).mockResolvedValue(mockNotifications);

      const result = await notificationService.getPendingNotifications();

      expect(result).toEqual(mockNotifications);
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('sendPaymentReminder', () => {
    it('should send payment reminder via WhatsApp and email', async () => {
      const mockCustomer = {
        id: 'customer-1',
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        address: null,
        deliveryPreference: 'delivery',
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockInvoices = [
        {
          id: 'invoice-1',
          orderId: 'order-1',
          customerId: 'customer-1',
          subtotal: 100,
          creditApplied: 0,
          total: 100,
          status: 'unpaid',
          pdfUrl: null,
          createdAt: new Date(),
          dueDate: new Date(Date.now() - 86400000), // Yesterday
          order: {},
        },
      ];

      const mockNotification = {
        id: 'notif-1',
        customerId: 'customer-1',
        type: 'payment_reminder',
        method: 'whatsapp',
        content: 'Test',
        status: 'pending',
        sentAt: null,
        createdAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockCustomer);
      vi.mocked(prisma.invoice.findMany).mockResolvedValue(mockInvoices as any);
      vi.mocked(prisma.notification.create).mockResolvedValue(mockNotification);
      vi.mocked(prisma.notification.update).mockResolvedValue({} as any);
      vi.mocked(axios.post).mockResolvedValue({ data: {} });

      await notificationService.sendPaymentReminder('customer-1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'customer-1' },
      });
      expect(prisma.invoice.findMany).toHaveBeenCalled();
      expect(prisma.notification.create).toHaveBeenCalledTimes(2); // WhatsApp and Email notifications created
      expect(prisma.notification.update).toHaveBeenCalledTimes(2); // Both marked as sent
    });

    it('should throw error if customer not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(notificationService.sendPaymentReminder('customer-1')).rejects.toThrow(
        'Customer not found'
      );
    });

    it('should not send reminder if no overdue invoices', async () => {
      const mockCustomer = {
        id: 'customer-1',
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        address: null,
        deliveryPreference: 'delivery',
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockCustomer);
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([]);

      await notificationService.sendPaymentReminder('customer-1');

      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  describe('sendOrderConfirmation', () => {
    it('should send order confirmation notification', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'customer-1',
        deliveryDate: new Date(),
        deliveryMethod: 'delivery',
        deliveryAddress: '123 Main St',
        specialInstructions: 'Leave at door',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: {
          id: 'customer-1',
          name: 'John Doe',
          phone: '+1234567890',
          email: 'john@example.com',
          address: null,
          deliveryPreference: 'delivery',
          role: 'customer',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        items: [
          {
            id: 'item-1',
            orderId: 'order-1',
            productId: 'product-1',
            quantity: 2,
            priceAtOrder: 10,
            product: {
              id: 'product-1',
              name: 'Tomatoes',
              price: 10,
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
      };

      const mockNotification = {
        id: 'notif-1',
        customerId: 'customer-1',
        type: 'order_confirmation',
        method: 'whatsapp',
        content: 'Test',
        status: 'pending',
        sentAt: null,
        createdAt: new Date(),
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);
      vi.mocked(prisma.notification.create).mockResolvedValue(mockNotification);
      vi.mocked(prisma.notification.update).mockResolvedValue({} as any);
      vi.mocked(axios.post).mockResolvedValue({ data: {} });

      await notificationService.sendOrderConfirmation('order-1');

      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
      expect(prisma.notification.create).toHaveBeenCalledTimes(2); // WhatsApp and Email notifications created
    });

    it('should throw error if order not found', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      await expect(notificationService.sendOrderConfirmation('order-1')).rejects.toThrow(
        'Order not found'
      );
    });
  });

  describe('sendProductList', () => {
    it('should send product list to specified customers', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Tomatoes',
          price: 10,
          category: 'vegetables',
          unit: 'kg',
          description: null,
          imageUrl: null,
          isAvailable: true,
          isSeasonal: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockCustomer = {
        id: 'customer-1',
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        address: null,
        deliveryPreference: 'delivery',
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockNotification = {
        id: 'notif-1',
        customerId: 'customer-1',
        type: 'product_list',
        method: 'whatsapp',
        content: 'Test',
        status: 'pending',
        sentAt: null,
        createdAt: new Date(),
      };

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockCustomer);
      vi.mocked(prisma.notification.create).mockResolvedValue(mockNotification);
      vi.mocked(prisma.notification.update).mockResolvedValue({} as any);
      vi.mocked(axios.post).mockResolvedValue({ data: {} });

      await notificationService.sendProductList(['customer-1']);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { isAvailable: true },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });
      expect(prisma.notification.create).toHaveBeenCalledTimes(2); // WhatsApp and Email notifications created
    });
  });

  describe('processNotificationQueue', () => {
    it('should process pending notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          customerId: 'customer-1',
          type: 'order_confirmation',
          method: 'whatsapp',
          content: 'Test message',
          status: 'pending',
          sentAt: null,
          createdAt: new Date(),
        },
      ];

      const mockCustomer = {
        id: 'customer-1',
        name: 'John Doe',
        phone: '+1234567890',
        email: null,
        address: null,
        deliveryPreference: 'delivery',
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.notification.findMany).mockResolvedValue(mockNotifications);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockCustomer);
      vi.mocked(prisma.notification.update).mockResolvedValue({} as any);
      vi.mocked(axios.post).mockResolvedValue({ data: {} });

      await notificationService.processNotificationQueue();

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' },
      });
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: {
          status: 'sent',
          sentAt: expect.any(Date),
        },
      });
    });

    it('should mark notification as failed if customer not found', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          customerId: 'customer-1',
          type: 'order_confirmation',
          method: 'whatsapp',
          content: 'Test message',
          status: 'pending',
          sentAt: null,
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.notification.findMany).mockResolvedValue(mockNotifications);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.notification.update).mockResolvedValue({} as any);

      await notificationService.processNotificationQueue();

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: {
          status: 'failed',
          sentAt: null,
        },
      });
    });
  });
});
