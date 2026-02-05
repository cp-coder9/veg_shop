import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';
import { env } from '../config/env.js';
import { productRepository, Product } from '../repositories/product.repository.js';
import { priceHistoryRepository } from '../repositories/price-history.repository.js';

export interface CreateProductDto {
  name: string;
  price: number;
  category: string;
  unit: string;
  description?: string;
  imageUrl?: string;
  isAvailable: boolean;
  isSeasonal: boolean;
  supplierId?: string | null;
}

export interface UpdateProductDto {
  name?: string;
  price?: number;
  category?: string;
  unit?: string;
  description?: string;
  imageUrl?: string;
  isAvailable?: boolean;
  isSeasonal?: boolean;
  supplierId?: string | null;
}

export interface ProductFilters {
  category?: string;
  isAvailable?: boolean;
  isSeasonal?: boolean;
}

export class ProductService {
  async createProduct(data: CreateProductDto): Promise<any> {
    if (env.USE_FIREBASE) {
      const product = await productRepository.create({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await priceHistoryRepository.create({
        productId: product.id,
        price: product.price,
        effectiveDate: new Date(),
      });

      return product;
    } else {
      const product = await prisma.product.create({
        data: {
          name: data.name,
          price: data.price,
          category: data.category,
          unit: data.unit,
          description: data.description,
          imageUrl: data.imageUrl,
          isAvailable: data.isAvailable,
          isSeasonal: data.isSeasonal,
          supplierId: data.supplierId,
        },
      });

      // Track initial price in history
      await prisma.priceHistory.create({
        data: {
          productId: product.id,
          price: product.price,
        },
      });

      return product;
    }
  }

  async updateProduct(id: string, data: UpdateProductDto): Promise<any> {
    if (env.USE_FIREBASE) {
      const existingProduct = await productRepository.findById(id);
      if (!existingProduct) throw new Error('Product not found');

      const product = await productRepository.update(id, {
        ...data,
        updatedAt: new Date(),
      });

      if (data.price !== undefined && data.price !== existingProduct.price) {
        await priceHistoryRepository.create({
          productId: id,
          price: data.price,
          effectiveDate: new Date(),
        });
      }
      return product;
    } else {
      const existingProduct = await prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        throw new Error('Product not found');
      }

      const product = await prisma.product.update({
        where: { id },
        data,
      });

      // Track price change in history if price was updated
      if (data.price !== undefined && data.price !== existingProduct.price.toNumber()) {
        await prisma.priceHistory.create({
          data: {
            productId: product.id,
            price: data.price,
          },
        });
      }

      return product;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    if (env.USE_FIREBASE) {
      await productRepository.delete(id);
    } else {
      await prisma.product.delete({
        where: { id },
      });
    }
  }

  async getProduct(id: string): Promise<any> {
    if (env.USE_FIREBASE) {
      return productRepository.findById(id);
    } else {
      return prisma.product.findUnique({
        where: { id },
      });
    }
  }

  async getProducts(filters?: ProductFilters): Promise<any[]> {
    if (env.USE_FIREBASE) {
      const fsFilters: any[] = [];
      if (filters?.category) fsFilters.push({ field: 'category', operator: '==', value: filters.category });
      if (filters?.isAvailable !== undefined) fsFilters.push({ field: 'isAvailable', operator: '==', value: filters.isAvailable });
      if (filters?.isSeasonal !== undefined) fsFilters.push({ field: 'isSeasonal', operator: '==', value: filters.isSeasonal });

      return productRepository.list(fsFilters);
    } else {
      const where: Prisma.ProductWhereInput = {};

      if (filters?.category) {
        where.category = filters.category;
      }

      if (filters?.isAvailable !== undefined) {
        where.isAvailable = filters.isAvailable;
      }

      if (filters?.isSeasonal !== undefined) {
        where.isSeasonal = filters.isSeasonal;
      }

      return prisma.product.findMany({
        where,
        orderBy: [
          { category: 'asc' },
          { name: 'asc' },
        ],
      });
    }
  }

  async getAvailableProducts(): Promise<any[]> {
    if (env.USE_FIREBASE) {
      return productRepository.listAvailable();
    } else {
      return prisma.product.findMany({
        where: {
          isAvailable: true,
          OR: [
            { supplierId: null },
            { supplier: { isAvailable: true } }
          ]
        },
        orderBy: [
          { category: 'asc' },
          { name: 'asc' },
        ],
      });
    }
  }

  /**
   * Get pricing history for a product
   */
  async getPricingHistory(productId: string): Promise<Array<{ id: string; productId: string; price: number; effectiveDate: Date; createdAt: Date }>> {
    const history = await prisma.priceHistory.findMany({
      where: {
        productId,
      },
      orderBy: {
        effectiveDate: 'desc',
      },
    });

    return history.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      price: Number(item.price),
      effectiveDate: item.effectiveDate,
      createdAt: item.effectiveDate, // Use effectiveDate as createdAt since schema doesn't have createdAt
    }));
  }

  /**
   * Generate WhatsApp-friendly product list grouped by category
   */
  async generateProductList(): Promise<string> {
    const products = await this.getAvailableProducts();

    // Group products by category
    const categoryMap: Record<string, Product[]> = {};

    products.forEach((product: any) => {
      if (!categoryMap[product.category]) {
        categoryMap[product.category] = [];
      }
      categoryMap[product.category].push(product);
    });

    // Category display names (matching seed data labels)
    const categoryNames: Record<string, string> = {
      bakery: '🍞 Pantry & Bakery',
      broths: '🥣 Broths & Brothcicles',
      nuts_fruit: '🥜 Nuts & Dried Fruit',
      vegetables: '🥬 Vegetables',
      fruit: '🍎 Fruit',
      local_produce: '🏞️ Local Farm Produce',
      plant_based: '🌱 Plant Based (Tabu)',
      dairy: '🥛 Dairy',
      meat: '🥩 Meat & Poultry',
    };

    // Build WhatsApp message
    let message = '*🌱 Weekly Product List 🌱*\n\n';

    // Sort categories in the desired order (matching seed data)
    const categoryOrder = ['bakery', 'broths', 'nuts_fruit', 'vegetables', 'fruit', 'local_produce', 'plant_based', 'dairy', 'meat'];

    categoryOrder.forEach(category => {
      if (categoryMap[category] && categoryMap[category].length > 0) {
        message += `*${categoryNames[category] || category}*\n`;

        categoryMap[category].forEach(product => {
          const price = Number(product.price).toFixed(2);
          const seasonal = product.isSeasonal ? ' 🌟' : '';
          message += `• ${product.name} - R${price}/${product.unit}${seasonal}\n`;
        });

        message += '\n';
      }
    });

    message += '🌟 = Seasonal item\n\n';
    message += '_Place your order by Friday for next week\'s delivery!_';

    return message;
  }
}

export const productService = new ProductService();
