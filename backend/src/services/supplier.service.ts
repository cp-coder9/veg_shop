import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { supplierRepository } from '../repositories/supplier.repository.js';
import { productRepository } from '../repositories/product.repository.js';

export interface CreateSupplierDto {
    name: string;
    contactInfo?: string;
}

export interface UpdateSupplierDto {
    name?: string;
    contactInfo?: string;
    isAvailable?: boolean;
}

export class SupplierService {
    /**
     * Create a new supplier
     */
    async createSupplier(data: CreateSupplierDto): Promise<any> {
        if (env.USE_FIREBASE) {
            return await supplierRepository.create({
                name: data.name,
                contactInfo: data.contactInfo || null,
                isAvailable: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);
        } else {
            return prisma.supplier.create({
                data: {
                    name: data.name,
                    contactInfo: data.contactInfo,
                },
            });
        }
    }

    /**
     * Update an existing supplier
     */
    async updateSupplier(id: string, data: UpdateSupplierDto): Promise<any> {
        if (env.USE_FIREBASE) {
            return await supplierRepository.update(id, {
                ...data,
                updatedAt: new Date(),
            } as any);
        } else {
            return prisma.supplier.update({
                where: { id },
                data,
            });
        }
    }

    /**
     * Get all suppliers
     */
    async getSuppliers(): Promise<any[]> {
        if (env.USE_FIREBASE) {
            const suppliers = await supplierRepository.list([], { field: 'name', direction: 'asc' });
            return Promise.all(suppliers.map(async s => {
                const products = await productRepository.list([{ field: 'supplierId', operator: '==', value: s.id }]);
                return { ...s, _count: { products: products.length } };
            }));
        } else {
            return prisma.supplier.findMany({
                orderBy: {
                    name: 'asc',
                },
                include: {
                    _count: {
                        select: { products: true },
                    },
                },
            });
        }
    }

    /**
     * Get a single supplier by ID
     */
    async getSupplier(id: string): Promise<any | null> {
        if (env.USE_FIREBASE) {
            const supplier = await supplierRepository.findById(id);
            if (!supplier) return null;
            const products = await productRepository.list([{ field: 'supplierId', operator: '==', value: id }]);
            return { ...supplier, products };
        } else {
            return prisma.supplier.findUnique({
                where: { id },
                include: {
                    products: true,
                },
            });
        }
    }

    /**
     * Toggle supplier availability
     * When a supplier is unavailable, their products should logically be treated as unavailable
     */
    async toggleSupplierAvailability(id: string, isAvailable: boolean): Promise<any> {
        if (env.USE_FIREBASE) {
            return await supplierRepository.update(id, { isAvailable, updatedAt: new Date() } as any);
        } else {
            // We update the supplier status
            const supplier = await prisma.supplier.update({
                where: { id },
                data: { isAvailable },
            });

            return supplier;
        }
    }
}

export const supplierService = new SupplierService();
