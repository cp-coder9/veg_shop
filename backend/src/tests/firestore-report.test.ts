/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportService } from '../services/report.service.js';
import { env } from '../config/env.js';
import { orderRepository } from '../repositories/order.repository.js';
import { orderItemRepository } from '../repositories/order-item.repository.js';
import { invoiceRepository } from '../repositories/invoice.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { productRepository } from '../repositories/product.repository.js';

// Mock the env to force Firebase mode
vi.mock('../config/env.js', () => ({
    env: {
        USE_FIREBASE: true,
    },
    logConfig: vi.fn(),
}));

// Mock the firebase config to prevent initialization errors
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
    default: {
        auth: vi.fn(),
    }
}));

// Mock repositories
vi.mock('../repositories/order.repository.js', () => ({
    orderRepository: {
        list: vi.fn(),
    },
}));
vi.mock('../repositories/order-item.repository.js', () => ({
    orderItemRepository: {
        findByOrder: vi.fn(),
    },
}));
vi.mock('../repositories/invoice.repository.js', () => ({
    invoiceRepository: {
        findByOrder: vi.fn(),
        list: vi.fn(),
    },
}));
vi.mock('../repositories/user.repository.js', () => ({
    userRepository: {
        findById: vi.fn(),
        list: vi.fn(),
    },
}));
vi.mock('../repositories/product.repository.js', () => ({
    productRepository: {
        findById: vi.fn(),
    },
}));

describe('ReportService (Firestore Mode)', () => {
    let reportService: ReportService;

    beforeEach(() => {
        reportService = new ReportService();
        vi.clearAllMocks();
    });

    describe('generateSalesReport', () => {
        it('should calculate total revenue and aggregate products sold using Firestore repositories', async () => {
            const startDate = new Date('2025-10-01');
            const endDate = new Date('2025-10-31');

            const mockOrders = [
                { id: 'order-1', customerId: 'customer-1', createdAt: new Date('2025-10-10'), status: 'delivered' },
            ];

            const mockItems = [
                { productId: 'prod-1', quantity: 2, priceAtOrder: 50 },
                { productId: 'prod-2', quantity: 1, priceAtOrder: 30 },
            ];

            const mockProduct1 = { name: 'Tomatoes' };
            const mockProduct2 = { name: 'Lettuce' };
            const mockInvoice = { total: 130 };

            vi.mocked(orderRepository.list).mockResolvedValue(mockOrders as any);
            vi.mocked(orderItemRepository.findByOrder).mockResolvedValue(mockItems as any);
            vi.mocked(productRepository.findById)
                .mockResolvedValueOnce(mockProduct1 as any)
                .mockResolvedValueOnce(mockProduct2 as any);
            vi.mocked(invoiceRepository.findByOrder).mockResolvedValue(mockInvoice as any);

            const result = await reportService.generateSalesReport(startDate, endDate);

            expect(env.USE_FIREBASE).toBe(true);
            expect(orderRepository.list).toHaveBeenCalled();
            expect(result.totalRevenue).toBe(130);
            expect(result.productsSold).toHaveLength(2);
            expect(result.productsSold[0].productName).toBe('Tomatoes');
            expect(result.productsSold[0].quantitySold).toBe(2);
            expect(result.productsSold[0].revenue).toBe(100);
        });
    });

    describe('getDashboardMetrics', () => {
        it('should calculate metrics using list() and internal counting', async () => {
            vi.mocked(orderRepository.list).mockResolvedValueOnce([{ id: '1' }, { id: '2' }] as any); // allOrders
            vi.mocked(orderRepository.list).mockResolvedValueOnce([{ id: '1' }] as any); // pendingOrders
            vi.mocked(userRepository.list).mockResolvedValue([{ id: 'u1' }] as any);
            vi.mocked(invoiceRepository.list).mockResolvedValue([{ total: 100, status: 'unpaid' }, { total: 50, status: 'paid' }] as any);

            const metrics = await reportService.getDashboardMetrics();

            expect(metrics.totalOrders).toBe(2);
            expect(metrics.pendingOrders).toBe(1);
            expect(metrics.totalRevenue).toBe(150);
            expect(metrics.unpaidInvoices).toBe(1);
            expect(metrics.activeCustomers).toBe(1);
        });
    });
});
