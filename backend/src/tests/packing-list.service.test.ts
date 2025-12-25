/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PackingListService } from '../services/packing-list.service.js';
import { prisma } from '../lib/prisma.js';
import { pdfGenerator } from '../lib/pdf-generator.js';

// Mock Prisma
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// Mock PDF Generator
vi.mock('../lib/pdf-generator.js', () => ({
  pdfGenerator: {
    generatePackingListPDF: vi.fn(),
    generateBatchPackingListPDF: vi.fn(),
  },
}));

describe('PackingListService', () => {
  let packingListService: PackingListService;

  beforeEach(() => {
    packingListService = new PackingListService();
    vi.clearAllMocks();
  });

  describe('generatePackingList', () => {
    it('should generate a packing list for a single order', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'customer-1',
        deliveryDate: new Date('2025-10-29'),
        deliveryMethod: 'delivery',
        deliveryAddress: '123 Main St',
        specialInstructions: 'Leave at door',
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: {
          id: 'customer-1',
          name: 'John Doe',
          phone: '+27123456789',
          email: 'john@example.com',
          address: '123 Main St',
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
            priceAtOrder: 25.50,
            product: {
              id: 'product-1',
              name: 'Tomatoes',
              price: 25.50,
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
            quantity: 1,
            priceAtOrder: 15.00,
            product: {
              id: 'product-2',
              name: 'Lettuce',
              price: 15.00,
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
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);

      const packingList = await packingListService.generatePackingList('order-1');

      expect(packingList).toEqual({
        orderId: 'order-1',
        customerName: 'John Doe',
        customerAddress: '123 Main St',
        deliveryDate: mockOrder.deliveryDate,
        deliveryMethod: 'delivery',
        specialInstructions: 'Leave at door',
        items: [
          {
            productName: 'Tomatoes',
            quantity: 2,
            unit: 'kg',
          },
          {
            productName: 'Lettuce',
            quantity: 1,
            unit: 'piece',
          },
        ],
      });

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
    });

    it('should throw error if order not found', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      await expect(
        packingListService.generatePackingList('non-existent')
      ).rejects.toThrow('Order not found');
    });
  });

  describe('generatePackingListsByDate', () => {
    it('should generate packing lists for all orders on a specific date', async () => {
      const deliveryDate = new Date('2025-10-29');

      const mockOrders = [
        {
          id: 'order-1',
          customerId: 'customer-1',
          deliveryDate,
          deliveryMethod: 'delivery',
          deliveryAddress: '123 Main St',
          specialInstructions: null,
          status: 'confirmed',
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: 'customer-1',
            name: 'Alice Smith',
            phone: '+27123456789',
            email: 'alice@example.com',
            address: '123 Main St',
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
              priceAtOrder: 25.50,
              product: {
                id: 'product-1',
                name: 'Tomatoes',
                price: 25.50,
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
          deliveryDate,
          deliveryMethod: 'collection',
          deliveryAddress: null,
          specialInstructions: 'Call on arrival',
          status: 'confirmed',
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: 'customer-2',
            name: 'Bob Jones',
            phone: '+27987654321',
            email: 'bob@example.com',
            address: '456 Oak Ave',
            deliveryPreference: 'collection',
            role: 'customer',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          items: [
            {
              id: 'item-2',
              orderId: 'order-2',
              productId: 'product-2',
              quantity: 3,
              priceAtOrder: 15.00,
              product: {
                id: 'product-2',
                name: 'Lettuce',
                price: 15.00,
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
        },
      ];

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any);

      const packingLists = await packingListService.generatePackingListsByDate(
        deliveryDate,
        'name'
      );

      expect(packingLists).toHaveLength(2);
      expect(packingLists[0].customerName).toBe('Alice Smith');
      expect(packingLists[1].customerName).toBe('Bob Jones');

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: {
          deliveryDate: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
          status: {
            in: ['confirmed', 'packed'],
          },
        },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    it('should sort packing lists by customer name', async () => {
      const deliveryDate = new Date('2025-10-29');

      const mockOrders = [
        {
          id: 'order-1',
          customerId: 'customer-1',
          deliveryDate,
          deliveryMethod: 'delivery',
          deliveryAddress: '123 Main St',
          specialInstructions: null,
          status: 'confirmed',
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: 'customer-1',
            name: 'Zoe Adams',
            phone: '+27123456789',
            email: 'zoe@example.com',
            address: '123 Main St',
            deliveryPreference: 'delivery',
            role: 'customer',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          items: [],
        },
        {
          id: 'order-2',
          customerId: 'customer-2',
          deliveryDate,
          deliveryMethod: 'delivery',
          deliveryAddress: '456 Oak Ave',
          specialInstructions: null,
          status: 'confirmed',
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: 'customer-2',
            name: 'Alice Brown',
            phone: '+27987654321',
            email: 'alice@example.com',
            address: '456 Oak Ave',
            deliveryPreference: 'delivery',
            role: 'customer',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          items: [],
        },
      ];

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any);

      const packingLists = await packingListService.generatePackingListsByDate(
        deliveryDate,
        'name'
      );

      expect(packingLists[0].customerName).toBe('Alice Brown');
      expect(packingLists[1].customerName).toBe('Zoe Adams');
    });

    it('should sort packing lists by route (address)', async () => {
      const deliveryDate = new Date('2025-10-29');

      const mockOrders = [
        {
          id: 'order-1',
          customerId: 'customer-1',
          deliveryDate,
          deliveryMethod: 'delivery',
          deliveryAddress: 'Zebra Street',
          specialInstructions: null,
          status: 'confirmed',
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: 'customer-1',
            name: 'Alice',
            phone: '+27123456789',
            email: 'alice@example.com',
            address: 'Zebra Street',
            deliveryPreference: 'delivery',
            role: 'customer',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          items: [],
        },
        {
          id: 'order-2',
          customerId: 'customer-2',
          deliveryDate,
          deliveryMethod: 'delivery',
          deliveryAddress: 'Apple Avenue',
          specialInstructions: null,
          status: 'confirmed',
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: 'customer-2',
            name: 'Bob',
            phone: '+27987654321',
            email: 'bob@example.com',
            address: 'Apple Avenue',
            deliveryPreference: 'delivery',
            role: 'customer',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          items: [],
        },
      ];

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any);

      const packingLists = await packingListService.generatePackingListsByDate(
        deliveryDate,
        'route'
      );

      expect(packingLists[0].customerAddress).toBe('Apple Avenue');
      expect(packingLists[1].customerAddress).toBe('Zebra Street');
    });
  });

  describe('generatePackingListPDF', () => {
    it('should generate PDF for a single packing list', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'customer-1',
        deliveryDate: new Date('2025-10-29'),
        deliveryMethod: 'delivery',
        deliveryAddress: '123 Main St',
        specialInstructions: 'Leave at door',
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: {
          id: 'customer-1',
          name: 'John Doe',
          phone: '+27123456789',
          email: 'john@example.com',
          address: '123 Main St',
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
            priceAtOrder: 25.50,
            product: {
              id: 'product-1',
              name: 'Tomatoes',
              price: 25.50,
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

      const mockPDFBuffer = Buffer.from('mock-pdf-content');

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);
      vi.mocked(pdfGenerator.generatePackingListPDF).mockResolvedValue(mockPDFBuffer);

      const pdfBuffer = await packingListService.generatePackingListPDF('order-1');

      expect(pdfBuffer).toBe(mockPDFBuffer);
      expect(pdfGenerator.generatePackingListPDF).toHaveBeenCalledWith({
        orderId: 'order-1',
        customerName: 'John Doe',
        customerAddress: '123 Main St',
        deliveryDate: mockOrder.deliveryDate,
        deliveryMethod: 'delivery',
        specialInstructions: 'Leave at door',
        items: [
          {
            productName: 'Tomatoes',
            quantity: 2,
            unit: 'kg',
          },
        ],
      });
    });
  });

  describe('generateBatchPackingListPDF', () => {
    it('should generate batch PDF for multiple orders', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          customerId: 'customer-1',
          deliveryDate: new Date('2025-10-29'),
          deliveryMethod: 'delivery',
          deliveryAddress: '123 Main St',
          specialInstructions: null,
          status: 'confirmed',
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: 'customer-1',
            name: 'Alice',
            phone: '+27123456789',
            email: 'alice@example.com',
            address: '123 Main St',
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
              priceAtOrder: 25.50,
              product: {
                id: 'product-1',
                name: 'Tomatoes',
                price: 25.50,
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
          deliveryDate: new Date('2025-10-29'),
          deliveryMethod: 'collection',
          deliveryAddress: null,
          specialInstructions: 'Call on arrival',
          status: 'confirmed',
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: 'customer-2',
            name: 'Bob',
            phone: '+27987654321',
            email: 'bob@example.com',
            address: '456 Oak Ave',
            deliveryPreference: 'collection',
            role: 'customer',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          items: [
            {
              id: 'item-2',
              orderId: 'order-2',
              productId: 'product-2',
              quantity: 3,
              priceAtOrder: 15.00,
              product: {
                id: 'product-2',
                name: 'Lettuce',
                price: 15.00,
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
        },
      ];

      const mockPDFBuffer = Buffer.from('mock-batch-pdf-content');

      vi.mocked(prisma.order.findUnique)
        .mockResolvedValueOnce(mockOrders[0] as any)
        .mockResolvedValueOnce(mockOrders[1] as any);
      vi.mocked(pdfGenerator.generateBatchPackingListPDF).mockResolvedValue(mockPDFBuffer);

      const pdfBuffer = await packingListService.generateBatchPackingListPDF([
        'order-1',
        'order-2',
      ]);

      expect(pdfBuffer).toBe(mockPDFBuffer);
      expect(pdfGenerator.generateBatchPackingListPDF).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ orderId: 'order-1' }),
          expect.objectContaining({ orderId: 'order-2' }),
        ])
      );
    });
  });
});
