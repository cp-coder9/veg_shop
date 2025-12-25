import { prisma } from '../lib/prisma.js';

export interface CreateCategoryDto {
  key: string;
  label: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateCategoryDto {
  label?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export class CategoryService {
  /**
   * Get all categories
   */
  async getCategories(includeInactive = false): Promise<unknown[]> {
    const where = includeInactive ? {} : { isActive: true };
    
    return prisma.productCategory.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { label: 'asc' },
      ],
    });
  }

  /**
   * Get category by key
   */
  async getCategoryByKey(key: string): Promise<unknown> {
    return prisma.productCategory.findUnique({
      where: { key },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  /**
   * Create a new category
   */
  async createCategory(data: CreateCategoryDto): Promise<unknown> {
    // Validate key format (lowercase, underscores only)
    if (!/^[a-z_]+$/.test(data.key)) {
      throw new Error('Category key must contain only lowercase letters and underscores');
    }

    // Check if key already exists
    const existing = await prisma.productCategory.findUnique({
      where: { key: data.key },
    });

    if (existing) {
      throw new Error('Category key already exists');
    }

    return prisma.productCategory.create({
      data: {
        key: data.key,
        label: data.label,
        description: data.description,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  /**
   * Update a category
   */
  async updateCategory(key: string, data: UpdateCategoryDto): Promise<unknown> {
    const category = await prisma.productCategory.findUnique({
      where: { key },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return prisma.productCategory.update({
      where: { key },
      data,
    });
  }

  /**
   * Delete a category
   */
  async deleteCategory(key: string): Promise<unknown> {
    const category = await prisma.productCategory.findUnique({
      where: { key },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Check if category has products
    if (category._count.products > 0) {
      throw new Error(`Cannot delete category with ${category._count.products} products. Reassign products first.`);
    }

    return prisma.productCategory.delete({
      where: { key },
    });
  }

  /**
   * Seed default categories
   */
  async seedDefaultCategories(): Promise<unknown[]> {
    const defaultCategories = [
      { key: 'vegetables', label: 'Vegetables', sortOrder: 1 },
      { key: 'fruits', label: 'Fruits', sortOrder: 2 },
      { key: 'dairy_eggs', label: 'Dairy & Eggs', sortOrder: 3 },
      { key: 'bread_bakery', label: 'Bread & Bakery', sortOrder: 4 },
      { key: 'pantry', label: 'Pantry Items', sortOrder: 5 },
      { key: 'meat_protein', label: 'Meat & Protein', sortOrder: 6 },
    ];

    const results = [];
    for (const category of defaultCategories) {
      const existing = await prisma.productCategory.findUnique({
        where: { key: category.key },
      });

      if (!existing) {
        const created = await prisma.productCategory.create({
          data: category,
        });
        results.push(created);
      }
    }

    return results;
  }
}

export const categoryService = new CategoryService();
