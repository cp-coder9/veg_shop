import { prisma } from '../lib/prisma.js';

/**
 * Get the Monday (start) of the week for a given date
 */
function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun, 1=Mon, ...
    const diff = day === 0 ? -6 : 1 - day; // Adjust to Monday
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Get the Monday of *next* week relative to the given date
 */
function getNextWeekStart(date: Date = new Date()): Date {
    const d = getWeekStart(date);
    d.setDate(d.getDate() + 7);
    return d;
}

export interface WeeklyAvailabilityItem {
    id: string;
    productId: string;
    weekStart: Date;
    isAvailable: boolean;
    confirmedBy: string | null;
    confirmedAt: Date | null;
    product: {
        id: string;
        name: string;
        price: any;
        category: string;
        unit: string;
        isSeasonal: boolean;
        isAvailable: boolean;
        imageUrl: string | null;
        deliveryDay: string | null;
        supplierId: string | null;
        supplier: { id: string; name: string } | null;
    };
}

export class WeeklyAvailabilityService {

    /**
     * Get availability for a specific week.
     * If no records exist yet, auto-generate them from the product catalogue.
     */
    async getWeekAvailability(weekStart: Date): Promise<WeeklyAvailabilityItem[]> {
        const monday = getWeekStart(weekStart);

        // Check if records already exist for this week
        const existing = await prisma.weeklyAvailability.findMany({
            where: { weekStart: monday },
            include: {
                product: {
                    include: { supplier: true },
                },
            },
            orderBy: [
                { product: { category: 'asc' } },
                { product: { name: 'asc' } },
            ],
        });

        if (existing.length > 0) {
            return existing as unknown as WeeklyAvailabilityItem[];
        }

        // Auto-generate from product catalogue (copy base isAvailable)
        const products = await prisma.product.findMany({
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        });

        if (products.length === 0) return [];

        // SQLite doesn't support skipDuplicates, so filter manually
        const existingForWeek = await prisma.weeklyAvailability.findMany({
            where: { weekStart: monday },
            select: { productId: true }
        });
        const existingProductIds = new Set(existingForWeek.map(e => e.productId));
        const newProducts = products.filter(p => !existingProductIds.has(p.id));

        if (newProducts.length > 0) {
            await prisma.weeklyAvailability.createMany({
                data: newProducts.map((p) => ({
                    productId: p.id,
                    weekStart: monday,
                    isAvailable: p.isAvailable,
                })),
            });
        }

        // Re-fetch with relations
        return (await prisma.weeklyAvailability.findMany({
            where: { weekStart: monday },
            include: {
                product: {
                    include: { supplier: true },
                },
            },
            orderBy: [
                { product: { category: 'asc' } },
                { product: { name: 'asc' } },
            ],
        })) as unknown as WeeklyAvailabilityItem[];
    }

    /**
     * Toggle a single product's availability for a week
     */
    async toggleProductAvailability(
        productId: string,
        weekStart: Date,
        isAvailable: boolean,
    ): Promise<any> {
        const monday = getWeekStart(weekStart);

        return prisma.weeklyAvailability.upsert({
            where: {
                productId_weekStart: { productId, weekStart: monday },
            },
            update: { isAvailable },
            create: { productId, weekStart: monday, isAvailable },
        });
    }

    /**
     * Bulk update availability for a week (arrays of { productId, isAvailable })
     */
    async bulkUpdateAvailability(
        weekStart: Date,
        updates: Array<{ productId: string; isAvailable: boolean }>,
    ): Promise<{ updated: number }> {
        const monday = getWeekStart(weekStart);

        const results = await prisma.$transaction(
            updates.map((u) =>
                prisma.weeklyAvailability.upsert({
                    where: {
                        productId_weekStart: { productId: u.productId, weekStart: monday },
                    },
                    update: { isAvailable: u.isAvailable },
                    create: { productId: u.productId, weekStart: monday, isAvailable: u.isAvailable },
                }),
            ),
        );

        return { updated: results.length };
    }

    /**
     * Confirm the week's availability — locks it and records who confirmed
     */
    async confirmWeekAvailability(weekStart: Date, adminId: string): Promise<{ confirmed: number }> {
        const monday = getWeekStart(weekStart);

        const result = await prisma.weeklyAvailability.updateMany({
            where: { weekStart: monday },
            data: {
                confirmedBy: adminId,
                confirmedAt: new Date(),
            },
        });

        return { confirmed: result.count };
    }

    /**
     * Copy last week's availability to target week
     */
    async copyPreviousWeek(weekStart: Date): Promise<{ copied: number }> {
        const targetMonday = getWeekStart(weekStart);
        const previousMonday = new Date(targetMonday);
        previousMonday.setDate(previousMonday.getDate() - 7);

        const previousWeek = await prisma.weeklyAvailability.findMany({
            where: { weekStart: previousMonday },
        });

        if (previousWeek.length === 0) {
            throw new Error('No availability data found for the previous week');
        }

        const existingTargetWeek = await prisma.weeklyAvailability.findMany({
            where: { weekStart: targetMonday },
            select: { productId: true }
        });
        const existingProductIds = new Set(existingTargetWeek.map(e => e.productId));
        const newProducts = previousWeek.filter(p => !existingProductIds.has(p.productId));

        if (newProducts.length > 0) {
            await prisma.weeklyAvailability.createMany({
                data: newProducts.map((p) => ({
                    productId: p.productId,
                    weekStart: targetMonday,
                    isAvailable: p.isAvailable,
                })),
            });
        }

        return { copied: previousWeek.length };
    }

    /**
     * Check if the current week's availability has been confirmed
     */
    async isWeekConfirmed(weekStart: Date): Promise<boolean> {
        const monday = getWeekStart(weekStart);

        const confirmed = await prisma.weeklyAvailability.findFirst({
            where: { weekStart: monday, confirmedAt: { not: null } },
        });

        return !!confirmed;
    }

    /**
     * Get products available for the currently-active ordering week
     * (Used by the products page to filter what clients can order)
     */
    async getAvailableProductsForWeek(weekStart: Date): Promise<any[]> {
        const monday = getWeekStart(weekStart);

        const availability = await prisma.weeklyAvailability.findMany({
            where: { weekStart: monday, isAvailable: true },
            include: {
                product: {
                    include: { supplier: true },
                },
            },
            orderBy: [
                { product: { category: 'asc' } },
                { product: { name: 'asc' } },
            ],
        });

        return availability.map((a) => a.product);
    }

    // Helper exports
    static getWeekStart = getWeekStart;
    static getNextWeekStart = getNextWeekStart;
}

export const weeklyAvailabilityService = new WeeklyAvailabilityService();
