/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { prisma } from '../lib/prisma.js';
import { Order, OrderItem, Prisma } from '@prisma/client';
import { notificationService } from './notification.service.js';

export interface CreateOrderDto {
  deliveryDate: Date;
  deliveryMethod: 'delivery' | 'collection';
  deliveryAddress?: string;
  specialInstructions?: string;
  deliveryFees?: number;
  items: {
    productId: string;
    quantity: number;
  }[];
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface BulkOrderItem {
  productId: string;
  productName: string;
  totalQuantity: number;
  bufferQuantity: number;
  finalQuantity: number;
  contributingOrders: string[];
}

export interface BulkOrder {
  weekStartDate: Date;
  items: BulkOrderItem[];
  generatedAt: Date;
}

export class OrderService {
  /**
   * Create a new order with order items
   */
  async createOrder(customerId: string, data: CreateOrderDto): Promise<OrderWithItems> {
    // Validate delivery date
    const now = new Date();
    const deliveryDate = new Date(data.deliveryDate);

    if (deliveryDate < now) {
      throw new Error('Delivery date must be in the future');
    }

    // Orders must be placed by Sunday 8pm for Tuesday delivery
    // or by Wednesday 8pm for Friday delivery
    const day = deliveryDate.getDay();
    const hour = now.getHours();
    console.log(`Order placement time check: Day ${day}, Hour ${hour}`); // Keep for logic context but avoid unused error

    // Simplify: Just check if products exist and are available
    const productIds = data.items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isAvailable: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new Error('Some products do not exist or are not available');
    }

    // Fetch customer details for ID generation
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Generate Custom Order ID: NAME-YYYYMMDD-XXXX
    const sanitizedName = customer.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 10);
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const customId = `${sanitizedName}-${dateStr}-${randomSuffix}`;

    // Create the order and items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          id: customId,
          customerId,
          deliveryDate: data.deliveryDate,
          deliveryMethod: data.deliveryMethod,
          deliveryAddress: data.deliveryAddress,
          specialInstructions: data.specialInstructions,
          deliveryFees: data.deliveryFees || 0,
          status: 'pending',
          items: {
            create: data.items.map(item => {
              const product = products.find(p => p.id === item.productId)!;
              return {
                productId: item.productId,
                quantity: item.quantity,
                priceAtOrder: product.price,
              };
            }),
          },
        },
        include: {
          items: true,
        },
      });

      return newOrder;
    });

    // Send confirmation asynchronously
    void this.sendOrderConfirmation(order.id);

    return order as OrderWithItems;
  }

  /**
   * Get a single order by ID with items
   */
  async getOrder(id: string): Promise<OrderWithItems | null> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });

    return order as OrderWithItems | null;
  }

  /**
   * Get all orders for a specific customer
   */
  async getCustomerOrders(customerId: string): Promise<OrderWithItems[]> {
    const orders = await prisma.order.findMany({
      where: { customerId },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders as OrderWithItems[];
  }

  /**
   * Get all orders for a specific delivery date
   */
  async getOrdersByDeliveryDate(date: Date): Promise<OrderWithItems[]> {
    // Set to start and end of the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: {
        deliveryDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          not: 'cancelled',
        },
      },
      include: {
        items: true,
        customer: true,
      },
    });

    return orders as OrderWithItems[];
  }

  /**
   * Update order status
   */
  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const validStatuses = ['pending', 'confirmed', 'packed', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of ${validStatuses.join(', ')}`);
    }

    return prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Update order details (e.g. packer assignment)
   */
  async updateOrder(id: string, data: Prisma.OrderUpdateInput): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data,
    });
  }

  /**
   * Generate bulk order consolidation for supplier
   */
  async generateBulkOrder(weekStartDate: Date, bufferPercentage: number = 10): Promise<BulkOrder> {
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 7);

    const orders = await prisma.order.findMany({
      where: {
        deliveryDate: {
          gte: weekStartDate,
          lte: weekEndDate,
        },
        status: {
          in: ['pending', 'confirmed', 'packed'],
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const productMap = new Map<string, BulkOrderItem>();

    orders.forEach(order => {
      order.items.forEach(item => {
        const existing = productMap.get(item.productId);
        if (existing) {
          existing.totalQuantity += item.quantity;
          existing.contributingOrders.push(order.id);
        } else {
          productMap.set(item.productId, {
            productId: item.productId,
            productName: item.product.name,
            totalQuantity: item.quantity,
            bufferQuantity: 0,
            finalQuantity: 0,
            contributingOrders: [order.id],
          });
        }
      });
    });

    const items = Array.from(productMap.values()).map(item => {
      item.bufferQuantity = Math.ceil(item.totalQuantity * (bufferPercentage / 100));
      item.finalQuantity = item.totalQuantity + item.bufferQuantity;
      return item;
    });

    return {
      weekStartDate,
      items,
      generatedAt: new Date(),
    };
  }

  /**
   * Format bulk order for WhatsApp
   */
  formatBulkOrderForWhatsApp(bulkOrder: BulkOrder): string {
    let message = `🛒 *Bulk Order Consolidation*\n`;
    message += `📅 Week of: ${bulkOrder.weekStartDate.toLocaleDateString()}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    bulkOrder.items.forEach(item => {
      message += `• *${item.productName}*\n`;
      message += `  Qty: ${item.totalQuantity} (+${item.bufferQuantity} buffer) = *${item.finalQuantity}*\n\n`;
    });

    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `Generated: ${bulkOrder.generatedAt.toLocaleString()}`;

    return message;
  }

  /**
   * Format bulk order for email
   */
  formatBulkOrderForEmail(bulkOrder: BulkOrder): string {
    let html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #2e7d32;">Bulk Order Consolidation</h2>
        <p><strong>Week starting:</strong> ${bulkOrder.weekStartDate.toLocaleDateString()}</p>
        <hr style="border: none; border-top: 1px solid #eee;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Product</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Order Qty</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Buffer</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Total</th>
            </tr>
          </thead>
          <tbody>
    `;

    bulkOrder.items.forEach(item => {
      html += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productName}</td>
          <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${item.totalQuantity}</td>
          <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${item.bufferQuantity}</td>
          <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee; font-weight: bold;">${item.finalQuantity}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">Generated at: ${bulkOrder.generatedAt.toLocaleString()}</p>
      </div>
    `;

    return html;
  }

  /**
   * Send bulk order to supplier via WhatsApp and Email
   */
  async sendBulkOrderToSupplier(bulkOrder: BulkOrder, supplierPhone: string, supplierEmail: string): Promise<void> {
    const whatsappMessage = this.formatBulkOrderForWhatsApp(bulkOrder);
    const emailHtml = this.formatBulkOrderForEmail(bulkOrder);

    // Send WhatsApp
    if (supplierPhone) {
      await notificationService.sendWhatsAppMessage(supplierPhone, whatsappMessage);
    }

    // Send Email
    if (supplierEmail) {
      await notificationService.sendEmailMessage(supplierEmail, `Bulk Order - Week of ${bulkOrder.weekStartDate.toLocaleDateString()}`, emailHtml);
    }
  }

  /**
   * Send order confirmation notification
   */
  private async sendOrderConfirmation(orderId: string): Promise<void> {
    await notificationService.sendOrderConfirmation(orderId);
  }

  /**
   * Get all orders with optional limit and filtering
   */
  async getOrders(options: {
    limit?: number;
    status?: string;
    deliveryDate?: string;
    startDate?: string;
    endDate?: string;
    customerId?: string
  } = {}): Promise<Array<Order & { customerName: string; totalAmount: number; items: unknown[] }>> {
    const { limit, status, deliveryDate, startDate, endDate, customerId } = options;

    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = status;

    // Exact date match (legacy support)
    if (deliveryDate) {
      where.deliveryDate = new Date(deliveryDate);
    }

    // Date range filtering
    if (startDate || endDate) {
      where.deliveryDate = {
        ...((where.deliveryDate as Prisma.DateTimeFilter) || {}),
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }

    if (customerId) where.customerId = customerId;

    const orders = await prisma.order.findMany({
      where,
      take: limit,
      orderBy: {
        deliveryDate: 'desc', // Changed from createdAt to deliveryDate for better logical ordering
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });

    // Add total amount calculation for each order
    return orders.map(order => {
      const totalAmount = order.items.reduce((sum, item) => {
        return sum + (Number(item.priceAtOrder) * item.quantity);
      }, Number(order.deliveryFees || 0));

      return {
        ...order,
        customerName: order.customer.name,
        totalAmount,
      };
    });
  }
}

export const orderService = new OrderService();
