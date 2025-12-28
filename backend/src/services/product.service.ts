import { prisma } from '../lib/prisma.js';
import { Product, Prisma } from '@prisma/client';

export interface CreateProductDto {
  name: string;
  price: number;
  category: string;
  unit: string;
  description?: string;
  imageUrl?: string;
  isAvailable: boolean;
  isSeasonal: boolean;
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
}

export interface ProductFilters {
  category?: string;
  isAvailable?: boolean;
  isSeasonal?: boolean;
}

export class ProductService {
  /**
   * Create a new product
   */
  async createProduct(data: CreateProductDto): Promise<Product> {
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

  /**
   * Update an existing product
   */
  async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
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

  /**
   * Delete a product
   */
  async deleteProduct(id: string): Promise<void> {
    await prisma.product.delete({
      where: { id },
    });
  }

  /**
   * Get a single product by ID
   */
  async getProduct(id: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { id },
    });
  }

  /**
   * Get products with optional filtering
   */
  async getProducts(filters?: ProductFilters): Promise<Product[]> {
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

  /**
   * Get available products for customer view (grouped by category)
   */
  async getAvailableProducts(): Promise<Product[]> {
    return prisma.product.findMany({
      where: {
        isAvailable: true,
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });
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

    return history.map(item => ({
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

    products.forEach(product => {
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
