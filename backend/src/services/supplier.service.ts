import { prisma } from '../lib/prisma.js';
import { Supplier } from '@prisma/client';

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
    async createSupplier(data: CreateSupplierDto): Promise<Supplier> {
        return prisma.supplier.create({
            data: {
                name: data.name,
                contactInfo: data.contactInfo,
            },
        });
    }

    /**
     * Update an existing supplier
     */
    async updateSupplier(id: string, data: UpdateSupplierDto): Promise<Supplier> {
        return prisma.supplier.update({
            where: { id },
            data,
        });
    }

    /**
     * Get all suppliers
     */
    async getSuppliers(): Promise<Supplier[]> {
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

    /**
     * Get a single supplier by ID
     */
    async getSupplier(id: string): Promise<Supplier | null> {
        return prisma.supplier.findUnique({
            where: { id },
            include: {
                products: true,
            },
        });
    }

    /**
     * Toggle supplier availability
     * When a supplier is unavailable, their products should logically be treated as unavailable
     */
    async toggleSupplierAvailability(id: string, isAvailable: boolean): Promise<Supplier> {
        // We update the supplier status
        const supplier = await prisma.supplier.update({
            where: { id },
            data: { isAvailable },
        });

        // Optionally: we could cascade this to products' isAvailable boolean, 
        // but usually it's better to check the supplier status during query time 
        // or keep them separate so restoring the supplier restores the exact previous state of products.
        // However, for strict "hiding", we might want to update products.
        // For this implementation, we'll keep it simple: just update the supplier.
        // The frontend catalog should check supplier.isAvailable if needed, 
        // or we update product queries to filter out products from unavailable suppliers.

        return supplier;
    }
}

export const supplierService = new SupplierService();
