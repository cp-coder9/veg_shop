/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductService } from '../services/product.service.js';
import { prisma } from '../lib/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';

// Mock Prisma
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    product: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    priceHistory: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('ProductService', () => {
  let productService: ProductService;

  beforeEach(() => {
    productService = new ProductService();
    vi.clearAllMocks();
  });

  describe('createProduct', () => {
    it('should create a product and track initial price', async () => {
      const productData = {
        name: 'Tomatoes',
        price: 25.50,
        category: 'vegetables',
        unit: 'kg',
        description: 'Fresh organic tomatoes',
        imageUrl: 'https://example.com/tomatoes.jpg',
        isAvailable: true,
        isSeasonal: false,
      };

      const mockProduct = {
        id: 'product-1',
        ...productData,
        price: new Decimal(productData.price),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.product.create).mockResolvedValue(mockProduct);
      vi.mocked(prisma.priceHistory.create).mockResolvedValue({
        id: 'price-1',
        productId: mockProduct.id,
        price: mockProduct.price,
        effectiveDate: new Date(),
      });

      const result = await productService.createProduct(productData);

      expect(result).toEqual(mockProduct);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: productData,
      });
      expect(prisma.priceHistory.create).toHaveBeenCalledWith({
        data: {
          productId: mockProduct.id,
          price: mockProduct.price,
        },
      });
    });
  });

  describe('updateProduct', () => {
    it('should update product and track price change', async () => {
      const productId = 'product-1';
      const existingProduct = {
        id: productId,
        name: 'Tomatoes',
        price: new Decimal(25.50),
        category: 'vegetables',
        unit: 'kg',
        description: 'Fresh organic tomatoes',
        imageUrl: 'https://example.com/tomatoes.jpg',
        isAvailable: true,
        isSeasonal: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateData = {
        price: 30.00,
        isAvailable: false,
      };

      const updatedProduct = {
        ...existingProduct,
        ...updateData,
        price: new Decimal(updateData.price),
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(existingProduct);
      vi.mocked(prisma.product.update).mockResolvedValue(updatedProduct);
      vi.mocked(prisma.priceHistory.create).mockResolvedValue({
        id: 'price-2',
        productId,
        price: new Decimal(updateData.price),
        effectiveDate: new Date(),
      });

      const result = await productService.updateProduct(productId, updateData);

      expect(result).toEqual(updatedProduct);
      expect(prisma.priceHistory.create).toHaveBeenCalledWith({
        data: {
          productId,
          price: updateData.price,
        },
      });
    });

    it('should not track price history if price unchanged', async () => {
      const productId = 'product-1';
      const existingProduct = {
        id: productId,
        name: 'Tomatoes',
        price: new Decimal(25.50),
        category: 'vegetables',
        unit: 'kg',
        description: 'Fresh organic tomatoes',
        imageUrl: 'https://example.com/tomatoes.jpg',
        isAvailable: true,
        isSeasonal: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateData = {
        isAvailable: false,
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(existingProduct);
      vi.mocked(prisma.product.update).mockResolvedValue({
        ...existingProduct,
        ...updateData,
      });

      await productService.updateProduct(productId, updateData);

      expect(prisma.priceHistory.create).not.toHaveBeenCalled();
    });

    it('should throw error if product not found', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      await expect(
        productService.updateProduct('invalid-id', { price: 30 })
      ).rejects.toThrow('Product not found');
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const productId = 'product-1';

      vi.mocked(prisma.product.delete).mockResolvedValue({
        id: productId,
        name: 'Tomatoes',
        price: new Decimal(25.50),
        category: 'vegetables',
        unit: 'kg',
        description: 'Fresh organic tomatoes',
        imageUrl: 'https://example.com/tomatoes.jpg',
        isAvailable: true,
        isSeasonal: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await productService.deleteProduct(productId);

      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: productId },
      });
    });
  });

  describe('getProduct', () => {
    it('should return a product by id', async () => {
      const mockProduct = {
        id: 'product-1',
        name: 'Tomatoes',
        price: new Decimal(25.50),
        category: 'vegetables',
        unit: 'kg',
        description: 'Fresh organic tomatoes',
        imageUrl: 'https://example.com/tomatoes.jpg',
        isAvailable: true,
        isSeasonal: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct);

      const result = await productService.getProduct('product-1');

      expect(result).toEqual(mockProduct);
    });

    it('should return null if product not found', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      const result = await productService.getProduct('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('getProducts', () => {
    it('should return all products without filters', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Tomatoes',
          price: new Decimal(25.50),
          category: 'vegetables',
          unit: 'kg',
          description: 'Fresh organic tomatoes',
          imageUrl: 'https://example.com/tomatoes.jpg',
          isAvailable: true,
          isSeasonal: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts);

      const result = await productService.getProducts();

      expect(result).toEqual(mockProducts);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [
          { category: 'asc' },
          { name: 'asc' },
        ],
      });
    });

    it('should filter products by category', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);

      await productService.getProducts({ category: 'vegetables' });

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { category: 'vegetables' },
        orderBy: [
          { category: 'asc' },
          { name: 'asc' },
        ],
      });
    });

    it('should filter products by availability', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);

      await productService.getProducts({ isAvailable: true });

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { isAvailable: true },
        orderBy: [
          { category: 'asc' },
          { name: 'asc' },
        ],
      });
    });
  });

  describe('getAvailableProducts', () => {
    it('should return only available products', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Tomatoes',
          price: new Decimal(25.50),
          category: 'vegetables',
          unit: 'kg',
          description: 'Fresh organic tomatoes',
          imageUrl: 'https://example.com/tomatoes.jpg',
          isAvailable: true,
          isSeasonal: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts);

      const result = await productService.getAvailableProducts();

      expect(result).toEqual(mockProducts);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { isAvailable: true },
        orderBy: [
          { category: 'asc' },
          { name: 'asc' },
        ],
      });
    });
  });

  describe('getPricingHistory', () => {
    it('should return pricing history for a product', async () => {
      const productId = 'product-1';
      const mockHistory = [
        {
          id: 'price-2',
          productId,
          price: new Decimal(30.00),
          effectiveDate: new Date('2024-01-15'),
        },
        {
          id: 'price-1',
          productId,
          price: new Decimal(25.50),
          effectiveDate: new Date('2024-01-01'),
        },
      ];

      vi.mocked(prisma.priceHistory.findMany).mockResolvedValue(mockHistory);

      const result = await productService.getPricingHistory(productId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('price-2');
      expect(result[0].price).toBe(30.00);
      expect(result[1].id).toBe('price-1');
      expect(result[1].price).toBe(25.50);
      expect(prisma.priceHistory.findMany).toHaveBeenCalledWith({
        where: { productId },
        orderBy: { effectiveDate: 'desc' },
      });
    });
  });

  describe('generateProductList', () => {
    it('should generate WhatsApp-formatted product list', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Tomatoes',
          price: new Decimal(25.50),
          category: 'vegetables',
          unit: 'kg',
          description: 'Fresh organic tomatoes',
          imageUrl: 'https://example.com/tomatoes.jpg',
          isAvailable: true,
          isSeasonal: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'product-2',
          name: 'Strawberries',
          price: new Decimal(45.00),
          category: 'fruits',
          unit: 'pack',
          description: 'Fresh strawberries',
          imageUrl: 'https://example.com/strawberries.jpg',
          isAvailable: true,
          isSeasonal: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts);

      const result = await productService.generateProductList();

      expect(result).toContain('🌱 Weekly Product List 🌱');
      expect(result).toContain('🥬 Vegetables');
      expect(result).toContain('Tomatoes - R25.50/kg');
      expect(result).toContain('🍎 Fruits');
      expect(result).toContain('Strawberries - R45.00/pack 🌟');
      expect(result).toContain('🌟 = Seasonal item');
    });
  });
});
