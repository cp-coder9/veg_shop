/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupplierService } from '../services/supplier.service.js';
import { env } from '../config/env.js';
import { supplierRepository } from '../repositories/supplier.repository.js';
import { productRepository } from '../repositories/product.repository.js';

// Mock the env to force Firebase mode
vi.mock('../config/env.js', () => ({
    env: {
        USE_FIREBASE: true,
    },
    logConfig: vi.fn(),
}));

// Mock the firebase config
vi.mock('../config/firebase.js', () => ({
    db: {
        collection: vi.fn(() => ({
            where: vi.fn(),
            limit: vi.fn(),
            get: vi.fn(),
            doc: vi.fn(),
            orderBy: vi.fn(),
        })),
    },
}));

// Mock repositories
vi.mock('../repositories/supplier.repository.js', () => ({
    supplierRepository: {
        create: vi.fn(),
        update: vi.fn(),
        list: vi.fn(),
        findById: vi.fn(),
    },
}));
vi.mock('../repositories/product.repository.js', () => ({
    productRepository: {
        list: vi.fn(),
    },
}));

describe('SupplierService (Firestore Mode)', () => {
    let supplierService: SupplierService;

    beforeEach(() => {
        supplierService = new SupplierService();
        vi.clearAllMocks();
    });

    describe('createSupplier', () => {
        it('should use supplierRepository in Firestore mode', async () => {
            const mockData = { name: 'Farm A', contactInfo: '123' };
            const mockResult = { id: 's1', ...mockData, isAvailable: true };

            vi.mocked(supplierRepository.create).mockResolvedValue(mockResult as any);

            const result = await supplierService.createSupplier(mockData);

            expect(env.USE_FIREBASE).toBe(true);
            expect(supplierRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                name: mockData.name,
                contactInfo: mockData.contactInfo,
                isAvailable: true,
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
            }));
            expect(result).toEqual(mockResult);
        });
    });

    describe('toggleSupplierAvailability', () => {
        it('should toggle and update via supplierRepository', async () => {
            const mockSupplier = { id: 's1', name: 'Farm A', isAvailable: true };
            vi.mocked(supplierRepository.findById).mockResolvedValue(mockSupplier as any);
            vi.mocked(supplierRepository.update).mockResolvedValue({ ...mockSupplier, isAvailable: false } as any);

            const result = await supplierService.toggleSupplierAvailability('s1', false);

            expect(supplierRepository.update).toHaveBeenCalledWith('s1', expect.objectContaining({
                isAvailable: false,
                updatedAt: expect.any(Date),
            }));
            expect(result.isAvailable).toBe(false);
        });
    });
});
