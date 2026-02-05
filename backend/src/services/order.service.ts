import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';
import { appEvents } from '../lib/events.js';
import { notificationService } from './notification.service.js';
import { env } from '../config/env.js';
import { orderRepository, Order } from '../repositories/order.repository.js';
import { orderItemRepository } from '../repositories/order-item.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { invoiceRepository } from '../repositories/invoice.repository.js';

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
  coolerBagOption?: boolean;
}

const DELIVERY_FEES = [
  { keyword: 'paarl', fee: 35 },
  { keyword: 'val de vie', fee: 35 },
  { keyword: 'wellington', fee: 50 },
  { keyword: 'pearl valley', fee: 50 },
];

export interface OrderWithItems extends Order {
  items: any[];
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

export interface CollationItem {
  productId: string;
  productName: string;
  totalQuantity: number;
  unit: string;
  orderCount: number;
  categoryId: string;
}

export class OrderService {
  /**
   * Create a new order with order items
   */
  async createOrder(customerId: string, data: CreateOrderDto): Promise<any> {
    // Validate delivery date
    const now = new Date();
    const deliveryDate = new Date(data.deliveryDate);

    if (deliveryDate < now) {
      throw new Error('Delivery date must be in the future');
    }

    if (env.USE_FIREBASE) {
      // Fetch products and customer
      const productIds = data.items.map(item => item.productId);
      const products = await Promise.all(productIds.map(id => productRepository.findById(id)));

      if (products.some(p => !p || !p.isAvailable)) {
        throw new Error('Some products do not exist or are not available');
      }

      const customer = await userRepository.findById(customerId);
      if (!customer) throw new Error('Customer not found');

      // ID Generation
      const sanitizedName = customer.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 10);
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const customId = `${sanitizedName}-${dateStr}-${randomSuffix}`;

      // Calculate delivery fee
      let deliveryFees = data.deliveryFees ?? 0;
      if (data.deliveryMethod === 'delivery' && data.deliveryAddress) {
        const address = data.deliveryAddress.toLowerCase();
        const matchedOption = DELIVERY_FEES.find(opt => address.includes(opt.keyword));
        if (matchedOption) deliveryFees = matchedOption.fee;
      }

      // Create Order
      const order = await orderRepository.create({
        id: customId,
        customerId,
        deliveryDate: data.deliveryDate,
        deliveryMethod: data.deliveryMethod,
        deliveryAddress: data.deliveryAddress || null,
        specialInstructions: data.specialInstructions || null,
        deliveryFees,
        status: 'pending',
        coolerBagOption: data.coolerBagOption ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Create Order Items
      const items = await Promise.all(data.items.map(item => {
        const product = products.find(p => p?.id === item.productId)!;
        return orderItemRepository.create({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtOrder: product.price,
        });
      }));

      return { ...order, items };
    } else {
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
      const order = await prisma.$transaction(async (tx: any) => {
        // Calculate delivery fee if not provided or to override
        let deliveryFees = data.deliveryFees ?? 0;
        if (data.deliveryMethod === 'delivery' && data.deliveryAddress) {
          const address = data.deliveryAddress.toLowerCase();
          const matchedOption = DELIVERY_FEES.find(opt => address.includes(opt.keyword));
          if (matchedOption) {
            deliveryFees = matchedOption.fee;
          }
        }

        const newOrder = await tx.order.create({
          data: {
            id: customId,
            customerId,
            deliveryDate: data.deliveryDate,
            deliveryMethod: data.deliveryMethod,
            deliveryAddress: data.deliveryAddress,
            specialInstructions: data.specialInstructions,
            deliveryFees: deliveryFees,
            status: 'pending',
            coolerBagOption: data.coolerBagOption ?? false,
            items: {
              create: data.items.map((item: { productId: string; quantity: number }) => {
                const product = products.find((p: any) => p.id === item.productId)!;
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

      return order;
    }
  }

  /**
   * Get a single order by ID with items
   */
  async getOrder(id: string): Promise<any | null> {
    if (env.USE_FIREBASE) {
      const order = await orderRepository.findById(id);
      if (!order) return null;
      const items = await orderItemRepository.findByOrder(id);
      const customer = await userRepository.findById(order.customerId);
      return { ...order, items, customer };
    } else {
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

      return order;
    }
  }

  /**
   * Get all orders for a specific customer
   */
  async getCustomerOrders(customerId: string): Promise<any[]> {
    if (env.USE_FIREBASE) {
      const orders = await orderRepository.findByCustomer(customerId);
      return Promise.all(orders.map(async (order: any) => {
        const items = await orderItemRepository.findByOrder(order.id);
        return { ...order, items };
      }));
    } else {
      const orders = await prisma.order.findMany({
        where: { customerId },
        include: {
          items: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return orders;
    }
  }

  /**
   * Get all orders for a specific delivery date
   */
  async getOrdersByDeliveryDate(date: Date): Promise<any[]> {
    if (env.USE_FIREBASE) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const orders = await orderRepository.list([
        { field: 'deliveryDate', operator: '>=', value: startOfDay },
        { field: 'deliveryDate', operator: '<=', value: endOfDay },
      ]);

      const filteredOrders = orders.filter(o => o.status !== 'cancelled');

      return Promise.all(filteredOrders.map(async (order: any) => {
        const items = await orderItemRepository.findByOrder(order.id);
        const customer = await userRepository.findById(order.customerId);
        return { ...order, items, customer };
      }));
    } else {
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

      return orders;
    }
  }

  /**
   * Get packing list grouped by delivery area
   */
  async getPackingList(date: Date): Promise<Record<string, any[]>> {
    const orders = await this.getOrdersByDeliveryDate(date);

    // Group by area
    const grouped: Record<string, any[]> = {};

    orders.forEach((order: any) => {
      const address = order.deliveryAddress || 'Unknown Area';
      const parts = address.split(',').map((p: string) => p.trim());

      let area = 'General';
      if (parts.length > 1) {
        area = parts[parts.length - 2] || parts[parts.length - 1];
      } else if (parts.length === 1 && parts[0]) {
        area = parts[0];
      }

      if (!grouped[area]) {
        grouped[area] = [];
      }
      grouped[area].push(order);
    });

    // Sort orders within each area by address
    Object.keys(grouped).forEach(area => {
      grouped[area].sort((a, b) => (a.deliveryAddress || '').localeCompare(b.deliveryAddress || ''));
    });

    return grouped;
  }

  /**
   * Update order status with support for short-packing adjustments
   */
  async updateOrderStatus(
    id: string,
    status: string,
    userId?: string,
    role?: string,
    packedItems?: Record<string, number>,
    notes?: string,
    signature?: string,
    deliveryNotes?: string,
    coolerBagStatus?: string
  ): Promise<any> {
    const validStatuses = ['pending', 'confirmed', 'packed', 'delivered', 'cancelled', 'out_for_delivery'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of ${validStatuses.join(', ')}`);
    }

    let updatedOrder: any;

    if (env.USE_FIREBASE) {
      const order = await orderRepository.findById(id);
      if (!order) throw new Error(`Order ${id} not found`);

      const updateData: any = { status, updatedAt: new Date() };
      if (role === 'packer' && status === 'packed') {
        if (userId) updateData.packerId = userId;
        if (notes) updateData.packerNotes = notes;
        if (signature) updateData.packerSignature = signature;
      }
      if (role === 'driver') {
        if (deliveryNotes) updateData.deliveryNotes = deliveryNotes;
        if (coolerBagStatus) updateData.coolerBagStatus = coolerBagStatus;
      }

      if (packedItems) {
        const items = await orderItemRepository.findByOrder(id);
        const invoice = await invoiceRepository.findByOrder(id);
        let newOrderTotal = 0;

        for (const item of items) {
          const packedQty = packedItems[item.id];
          if (packedQty !== undefined && packedQty < item.quantity) {
            await orderItemRepository.update(item.id, { quantity: packedQty });
            newOrderTotal += packedQty * item.priceAtOrder;
          } else {
            newOrderTotal += item.quantity * item.priceAtOrder;
          }
        }

        const deliveryFees = order.deliveryFees || 0;
        newOrderTotal += deliveryFees;

        if (invoice) {
          await invoiceRepository.update(invoice.id, {
            total: newOrderTotal,
            subtotal: newOrderTotal - deliveryFees,
            updatedAt: new Date(),
          });
        }
      }

      updatedOrder = await orderRepository.update(id, updateData);
    } else {
      updatedOrder = await prisma.$transaction(async (tx: any) => {
        // Fetch the order with items and product details
        const order = await tx.order.findUnique({
          where: { id },
          include: { items: { include: { product: true } }, invoice: true, customer: true },
        });

        if (!order) {
          throw new Error(`Order ${id} not found`);
        }

        const updateData: Record<string, unknown> = { status };

        // Packer specific logic
        if (role === 'packer' && status === 'packed') {
          if (userId) updateData.packerId = userId;
          if (notes) updateData.packerNotes = notes;
          if (signature) updateData.packerSignature = signature;
        }

        // Driver specific logic
        if (role === 'driver') {
          if (deliveryNotes) updateData.deliveryNotes = deliveryNotes;
          if (coolerBagStatus) updateData.coolerBagStatus = coolerBagStatus;
        }

        // If specific packed quantities were provided, reconcile them
        if (packedItems) {
          let totalRefundAmount = 0;
          let newOrderTotal = 0;

          for (const item of order.items) {
            const packedQty = packedItems[item.id];

            if (packedQty !== undefined) {
              if (packedQty < item.quantity) {
                const diff = Number(item.quantity) - packedQty;
                const refund = diff * Number(item.priceAtOrder);
                totalRefundAmount += refund;

                await tx.orderItem.update({
                  where: { id: item.id },
                  data: { quantity: packedQty },
                });

                newOrderTotal += packedQty * Number(item.priceAtOrder);
              } else {
                newOrderTotal += Number(item.quantity) * Number(item.priceAtOrder);
              }
            } else {
              newOrderTotal += Number(item.quantity) * Number(item.priceAtOrder);
            }
          }

          const deliveryFees = Number(order.deliveryFees || 0);
          newOrderTotal += deliveryFees;

          if (totalRefundAmount > 0) {
            await tx.credit.create({
              data: {
                customerId: order.customerId,
                amount: totalRefundAmount,
                reason: `Short-packed order #${order.id.slice(-6)}`,
                type: 'short_delivery',
              },
            });

            // Update Invoice if it exists
            if (order.invoice) {
              await tx.invoice.update({
                where: { id: order.invoice.id },
                data: {
                  total: newOrderTotal,
                  subtotal: newOrderTotal - deliveryFees
                },
              });
            }
          }
        }

        return await tx.order.update({
          where: { id },
          data: updateData,
        });
      });
    }

    // Send notification
    try {
      if (['packed', 'delivered', 'out_for_delivery', 'cancelled'].includes(status)) {
        await notificationService.sendOrderStatusUpdate(id, status);
      }
    } catch (error) {
      console.error(`Failed to send status notification for order ${id}:`, error);
    }

    // Emit event for real-time updates
    appEvents.emit('orderUpdated', { orderId: id, status });

    return updatedOrder;
  }

  /**
   * Update order details (generic)
   */
  async updateOrder(id: string, data: any): Promise<any> {
    if (env.USE_FIREBASE) {
      return orderRepository.update(id, { ...data, updatedAt: new Date() });
    } else {
      return prisma.order.update({
        where: { id },
        data,
      });
    }
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

    orders.forEach((order: any) => {
      order.items.forEach((item: any) => {
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

    const items = Array.from(productMap.values()).map((item: any) => {
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

    bulkOrder.items.forEach((item: any) => {
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

    bulkOrder.items.forEach((item: any) => {
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

    if (supplierPhone) {
      await notificationService.sendWhatsAppMessage(supplierPhone, whatsappMessage);
    }

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
    customerId?: string;
    packerId?: string;
    driverId?: string;
  } = {}): Promise<any[]> {
    const { limit, status, deliveryDate, startDate, endDate, customerId, packerId, driverId } = options;

    if (env.USE_FIREBASE) {
      const filters: any[] = [];
      if (status) filters.push({ field: 'status', operator: '==', value: status });
      if (deliveryDate) filters.push({ field: 'deliveryDate', operator: '==', value: new Date(deliveryDate) });
      if (startDate) filters.push({ field: 'deliveryDate', operator: '>=', value: new Date(startDate) });
      if (endDate) filters.push({ field: 'deliveryDate', operator: '<=', value: new Date(endDate) });
      if (customerId) filters.push({ field: 'customerId', operator: '==', value: customerId });
      if (packerId) filters.push({ field: 'packerId', operator: '==', value: packerId });
      if (driverId) filters.push({ field: 'driverId', operator: '==', value: driverId });

      const orders = await orderRepository.list(filters);
      const topOrders = limit ? orders.slice(0, limit) : orders;

      return Promise.all(topOrders.map(async (order: any) => {
        const items = await orderItemRepository.findByOrder(order.id);
        const customer = await userRepository.findById(order.customerId);
        const totalAmount = items.reduce((sum: number, item: any) => sum + (item.priceAtOrder * item.quantity), order.deliveryFees || 0);
        return {
          ...order,
          items,
          customer,
          customerName: customer?.name || 'Unknown',
          totalAmount,
        };
      }));
    } else {
      const where: Prisma.OrderWhereInput = {};
      if (status) where.status = status;

      if (deliveryDate) {
        where.deliveryDate = new Date(deliveryDate);
      }

      if (startDate || endDate) {
        where.deliveryDate = {
          ...((where.deliveryDate as Prisma.DateTimeFilter) || {}),
          ...(startDate ? { gte: new Date(startDate) } : {}),
          ...(endDate ? { lte: new Date(endDate) } : {}),
        };
      }

      if (customerId) where.customerId = customerId;
      if (packerId) where.packerId = packerId;
      if (driverId) where.driverId = driverId;

      const orders = await prisma.order.findMany({
        where,
        take: limit,
        orderBy: {
          deliveryDate: 'desc',
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

      return orders.map((order: any) => {
        const totalAmount = order.items.reduce((sum: number, item: any) => {
          return sum + (Number(item.priceAtOrder) * item.quantity);
        }, Number(order.deliveryFees || 0));

        return {
          ...order,
          customerName: (order as any).customer.name,
          totalAmount,
        };
      });
    }
  }

  /**
   * Get collation report for procurement
   */
  async getCollationReport(startDate: Date, endDate: Date): Promise<CollationItem[]> {
    const orders = await prisma.order.findMany({
      where: {
        deliveryDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: 'cancelled',
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

    const collationMap = new Map<string, CollationItem>();

    orders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        const existing = collationMap.get(item.productId);
        if (existing) {
          existing.totalQuantity += item.quantity;
          existing.orderCount += 1;
        } else {
          collationMap.set(item.productId, {
            productId: item.productId,
            productName: item.product.name,
            totalQuantity: item.quantity,
            unit: item.product.unit,
            orderCount: 1,
            categoryId: item.product.category,
          });
        }
      });
    });

    return Array.from(collationMap.values()).sort((a, b) =>
      a.categoryId.localeCompare(b.categoryId) || a.productName.localeCompare(b.productName)
    );
  }
}

export const orderService = new OrderService();
