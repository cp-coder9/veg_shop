import { PrismaClient, StockOrder, StockOrderItem, WeeklyCollationHistory } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export interface CreateStockOrderInput {
  weekStartDate: Date;
  supplierId?: string | null;
  supplierName?: string | null;
  items: Array<{
    productId: string;
    productName: string;
    category: string;
    unit: string;
    orderedQuantity: number;
    pricePerUnit: number;
    customerId?: string;
    orderId?: string;
  }>;
  notes?: string;
  createdById?: string;
}

export interface UpdateReceivedQuantityInput {
  items: Array<{
    stockOrderItemId: string;
    receivedQuantity: number;
  }>;
}

export interface StockOrderWithItems extends StockOrder {
  items: StockOrderItem[];
}

export const stockOrderService = {
  /**
   * Create a new stock order from weekly collation
   */
  async createStockOrder(input: CreateStockOrderInput): Promise<StockOrderWithItems> {
    const { items, ...orderData } = input;

    // Calculate totals
    const totalItems = items.length;
    const totalOrdered = items.reduce((sum, item) =>
      sum + (item.orderedQuantity * item.pricePerUnit), 0
    );

    const stockOrder = await prisma.stockOrder.create({
      data: {
        weekStartDate: orderData.weekStartDate,
        supplierId: orderData.supplierId,
        supplierName: orderData.supplierName,
        totalItems,
        totalOrdered: new Decimal(totalOrdered),
        notes: orderData.notes,
        createdById: orderData.createdById,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            category: item.category,
            unit: item.unit,
            orderedQuantity: item.orderedQuantity,
            receivedQuantity: 0,
            pricePerUnit: new Decimal(item.pricePerUnit),
            customerId: item.customerId,
            orderId: item.orderId,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return stockOrder as StockOrderWithItems;
  },

  /**
   * Get all stock orders with optional filters
   */
  async getStockOrders(filters?: {
    weekStartDate?: Date;
    status?: string;
  }): Promise<StockOrderWithItems[]> {
    const where: any = {};

    if (filters?.weekStartDate) {
      where.weekStartDate = filters.weekStartDate;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    const orders = await prisma.stockOrder.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders as StockOrderWithItems[];
  },

  /**
   * Get a specific stock order by ID
   */
  async getStockOrder(id: string): Promise<StockOrderWithItems | null> {
    const order = await prisma.stockOrder.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    return order as StockOrderWithItems | null;
  },

  /**
   * Update received quantities for stock order items
   */
  async updateReceivedQuantities(
    stockOrderId: string,
    input: UpdateReceivedQuantityInput
  ): Promise<StockOrderWithItems> {
    // Update each item's received quantity
    for (const item of input.items) {
      await prisma.stockOrderItem.update({
        where: { id: item.stockOrderItemId },
        data: {
          receivedQuantity: item.receivedQuantity,
          isShort: item.receivedQuantity < 0, // Will be calculated properly after
        },
      });
    }

    // Get updated order with items
    const order = await prisma.stockOrder.findUnique({
      where: { id: stockOrderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new Error('Stock order not found');
    }

    // Calculate totals based on received quantities
    let totalReceived = new Decimal(0);
    let totalCredits = new Decimal(0);

    for (const item of order.items) {
      totalReceived = totalReceived.add(
        new Decimal(item.receivedQuantity).mul(item.pricePerUnit)
      );

      // Calculate short deliveries and credits
      const shortQty = item.orderedQuantity - item.receivedQuantity;
      if (shortQty > 0) {
        const creditAmount = new Decimal(shortQty).mul(item.pricePerUnit);
        totalCredits = totalCredits.add(creditAmount);

        // Update the item with short delivery info
        await prisma.stockOrderItem.update({
          where: { id: item.id },
          data: {
            isShort: true,
            shortQuantity: shortQty,
            creditAmount,
          },
        });
      }
    }

    // Determine status based on received quantities
    let status = 'pending';
    const hasShortDeliveries = order.items.some(item => item.receivedQuantity < item.orderedQuantity && item.receivedQuantity > 0);
    const allReceived = order.items.every(item => item.receivedQuantity > 0);

    if (allReceived && !hasShortDeliveries) {
      status = 'received';
    } else if (hasShortDeliveries) {
      status = 'partial';
    }

    // Update order totals and status
    const updatedOrder = await prisma.stockOrder.update({
      where: { id: stockOrderId },
      data: {
        totalReceived,
        totalCredits,
        status,
      },
      include: {
        items: true,
      },
    });

    return updatedOrder as StockOrderWithItems;
  },

  /**
   * Fulfill a stock order - creates credits for short deliveries
   */
  async fulfillStockOrder(stockOrderId: string): Promise<{
    stockOrder: StockOrderWithItems;
    credits: Array<{
      customerId: string;
      amount: number;
      productName: string;
      shortQuantity: number;
    }>;
  }> {
    const order = await prisma.stockOrder.findUnique({
      where: { id: stockOrderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new Error('Stock order not found');
    }

    // Get short delivery items and create credits
    const shortItems = order.items.filter(item => item.isShort && item.creditAmount.gt(0));
    const credits: Array<{
      customerId: string;
      amount: number;
      productName: string;
      shortQuantity: number;
    }> = [];

    for (const item of shortItems) {
      if (item.customerId) {
        // Create credit for the specific customer
        await prisma.credit.create({
          data: {
            customerId: item.customerId,
            amount: item.creditAmount,
            reason: `Short delivery: ${item.productName} - ${item.shortQuantity} ${item.unit} short`,
            type: 'short_delivery',
          },
        });

        credits.push({
          customerId: item.customerId,
          amount: Number(item.creditAmount),
          productName: item.productName,
          shortQuantity: item.shortQuantity,
        });
      }
    }

    // Update stock order status
    const updatedOrder = await prisma.stockOrder.update({
      where: { id: stockOrderId },
      data: {
        status: 'fulfilled',
      },
      include: {
        items: true,
      },
    });

    return {
      stockOrder: updatedOrder as StockOrderWithItems,
      credits,
    };
  },

  /**
   * Get weekly collation history
   */
  async getCollationHistory(filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
  }): Promise<WeeklyCollationHistory[]> {
    const where: any = {};

    if (filters?.startDate && filters?.endDate) {
      where.weekStartDate = {
        gte: filters.startDate,
        lte: filters.endDate,
      };
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    return prisma.weeklyCollationHistory.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  /**
   * Save weekly collation to history
   */
  async saveCollationToHistory(input: {
    weekStartDate: Date;
    weekEndDate: Date;
    reportData: any;
    totalProducts: number;
    totalOrders: number;
    totalValue: number;
    stockOrderId?: string;
  }): Promise<WeeklyCollationHistory> {
    return prisma.weeklyCollationHistory.create({
      data: {
        weekStartDate: input.weekStartDate,
        weekEndDate: input.weekEndDate,
        reportData: JSON.stringify(input.reportData),
        totalProducts: input.totalProducts,
        totalOrders: input.totalOrders,
        totalValue: new Decimal(input.totalValue),
        stockOrderId: input.stockOrderId,
      },
    });
  },
};
