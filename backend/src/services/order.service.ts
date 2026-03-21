import { prisma } from '../lib/prisma.js';
import { appEvents } from '../lib/events.js';
import { notificationService } from './notification.service.js';
import { env } from '../config/env.js';
import { orderRepository, Order } from '../repositories/order.repository.js';
import { orderItemRepository, OrderItem as RepositoryOrderItem } from '../repositories/order-item.repository.js';
import { productRepository, Product as RepositoryProduct } from '../repositories/product.repository.js';
import { userRepository, User as RepositoryUser } from '../repositories/user.repository.js';
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
  items: (RepositoryOrderItem & { product?: RepositoryProduct })[];
  customer?: RepositoryUser;
  customerName?: string;
  totalAmount?: number;
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

export interface CreateOrderData {
  deliveryDate: Date;
  deliveryMethod: 'delivery' | 'collection';
  deliveryAddress?: string;
  specialInstructions?: string;
  deliveryFees?: number;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  coolerBagOption?: boolean;
  groupDelivery?: boolean;
  deliveryInstruction?: 'door' | 'hand_to_me' | 'inside_fridge' | 'inside_freezer';
}

export class OrderService {
  /**
   * Check if the ordering window is currently open
   * Window: Tuesday 00:00 to Friday 14:00
   */
  isOrderWindowOpen(): { isOpen: boolean; nextStatusChange: Date; message: string } {
    const now = new Date();
    const day = now.getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
    const hour = now.getHours();
    const minute = now.getMinutes();

    // Tuesday (2) to Friday (5)
    // Friday cutoff is 14:00
    let isOpen = false;
    let nextStatusChange = new Date();
    let message = '';

    if (day >= 2 && day <= 5) {
      if (day === 5 && (hour > 14 || (hour === 14 && minute > 0))) {
        isOpen = false;
      } else {
        isOpen = true;
      }
    }

    if (isOpen) {
      // Find following Friday 14:00
      nextStatusChange = new Date(now);
      const diff = (5 - day + 7) % 7;
      nextStatusChange.setDate(now.getDate() + diff);
      nextStatusChange.setHours(14, 0, 0, 0);
      message = 'Order window is open until Friday 14:00';
    } else {
      // Find following Tuesday 00:00
      nextStatusChange = new Date(now);
      const diff = (2 - day + 7) % 7;
      nextStatusChange.setDate(now.getDate() + diff);
      // If it's Tuesday but window is "closed" (meaning it hasn't reached Tue 00:00 yet? No, if day is 2 it should be open)
      // Actually if day is 5, 6, 0, 1 it's closed (except Friday before 14:00)
      if (day === 5 || day === 6 || day === 0 || day === 1) {
        nextStatusChange.setHours(0, 0, 0, 0);
        if (day === 5 || day === 6 || day === 0 || day === 1) {
          // diff will correctly point to next Tuesday
        }
      }
      message = 'Order window is closed. Opens Tuesday 00:00';
    }

    return { isOpen, nextStatusChange, message };
  }

  /**
   * Determine if an order is eligible for delivery grouping
   * (None of the products should be perishable)
   */
  async canGroupDelivery(items: { productId: string; quantity: number }[]): Promise<boolean> {
    const productIds = items.map(i => i.productId);

    if (env.USE_FIREBASE) {
      const products = await Promise.all(productIds.map(id => productRepository.findById(id)));
      return !products.some(p => p?.isPerishable);
    } else {
      const perishableCount = await prisma.product.count({
        where: {
          id: { in: productIds },
          isPerishable: true,
        },
      });
      return perishableCount === 0;
    }
  }

  /**
   * Create a new order with order items
   */
  async createOrder(customerId: string, data: CreateOrderData): Promise<OrderWithItems> {
    // Validate order window
    const window = this.isOrderWindowOpen();
    if (!window.isOpen && env.NODE_ENV === 'production') {
      throw new Error(window.message);
    }

    // Validate delivery date
    const now = new Date();
    const deliveryDate = new Date(data.deliveryDate);

    if (deliveryDate < now) {
      throw new Error('Delivery date must be in the future');
    }

    const validDeliveryDays = [1, 3, 5];
    if (!validDeliveryDays.includes(deliveryDate.getDay())) {
      throw new Error('Delivery date must be Monday (1), Wednesday (3), or Friday (5)');
    }

    if (env.USE_FIREBASE) {
      // Fetch products and customer
      const productIds = data.items.map((item: { productId: string }) => item.productId);
      const products = await Promise.all(productIds.map((id: string) => productRepository.findById(id)));

      const unavailableProducts = products
        .filter((product): product is NonNullable<typeof product> => Boolean(product && !product.isAvailable))
        .map(product => product.name);
      const missingProducts = products.map((product, index) => (product ? null : productIds[index])).filter(Boolean);

      if (unavailableProducts.length > 0) {
        throw new Error(`Products not available: ${unavailableProducts.join(', ')}`);
      }

      if (missingProducts.length > 0) {
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
      } as Order);

      // Create Order Items
      const items = await Promise.all(data.items.map((item: { productId: string; quantity: number }) => {
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
      const productIds = data.items.map((item: { productId: string }) => item.productId);
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
        },
      });

      const unavailableProducts = products.filter((p) => !p.isAvailable).map((p) => p.name);
      const missingProducts = productIds.filter((id: string) => !products.some((p) => p.id === id));

      if (unavailableProducts.length > 0) {
        throw new Error(`Products not available: ${unavailableProducts.join(', ')}`);
      }

      if (missingProducts.length > 0) {
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

      // Calculate delivery fee
      let deliveryFees = data.deliveryFees ?? 0;
      if (data.deliveryMethod === 'delivery' && data.deliveryAddress) {
        const address = data.deliveryAddress.toLowerCase();
        const matchedOption = DELIVERY_FEES.find(opt => address.includes(opt.keyword));
        if (matchedOption) {
          deliveryFees = matchedOption.fee;
        }
      }

      // Validate group delivery eligibility
      let groupDelivery = data.groupDelivery ?? false;
      if (groupDelivery) {
        const isEligible = await this.canGroupDelivery(data.items);
        if (!isEligible) {
          throw new Error('Order is not eligible for group delivery due to perishable items');
        }
      }

      // Create the order and items in a transaction
      const order = await prisma.$transaction(async (tx: any) => {
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
            groupDelivery,
            items: {
              create: data.items.map((item: { productId: string; quantity: number }) => {
                const product = products.find((p) => p.id === item.productId)!;
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

      // Send confirmation independently
      void this.sendOrderConfirmation(order.id).catch((err: unknown) => {
        console.warn('Failed to send order confirmation:', err);
      });

      return order as unknown as OrderWithItems;
    }
  }

  /**
   * Get a single order by ID with items
   */
  async getOrder(id: string): Promise<OrderWithItems | null> {
    if (env.USE_FIREBASE) {
      const order = await orderRepository.findById(id);
      if (!order) return null;
      const items = await orderItemRepository.findByOrder(id);
      const customer = await userRepository.findById(order.customerId);
      return { ...order, items, customer } as OrderWithItems;
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

      return order as OrderWithItems | null;
    }
  }

  /**
   * Get all orders for a specific customer
   */
  async getCustomerOrders(customerId: string): Promise<OrderWithItems[]> {
    if (env.USE_FIREBASE) {
      const orders = await orderRepository.findByCustomer(customerId);
      return Promise.all(orders.map(async (order: Order) => {
        const items = await orderItemRepository.findByOrder(order.id);
        const itemsWithProducts = await Promise.all(items.map(async (item: RepositoryOrderItem) => {
          const product = await productRepository.findById(item.productId);
          return { ...item, product: product || undefined };
        }));
        return { ...order, items: itemsWithProducts };
      }));
    } else {
      const orders = await prisma.order.findMany({
        where: { customerId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          deliveryDate: 'desc',
        },
      });

      return orders as unknown as OrderWithItems[];
    }
  }

  /**
   * Get the most recent non-cancelled order for a customer
   */
  async getLastWeekOrder(customerId: string): Promise<OrderWithItems | null> {
    if (env.USE_FIREBASE) {
      const orders = await orderRepository.list([
        { field: 'customerId', operator: '==', value: customerId },
        { field: 'status', operator: '!=', value: 'cancelled' },
      ]);

      if (orders.length === 0) return null;

      // Sort by delivery date descending manually as firestore-repo list might not support orderby yet
      const sorted = orders.sort((a, b) => b.deliveryDate.getTime() - a.deliveryDate.getTime());
      const lastOrder = sorted[0];

      const items = await orderItemRepository.findByOrder(lastOrder.id);
      const itemsWithProducts = await Promise.all(items.map(async (item: any) => {
        const product = await productRepository.findById(item.productId);
        return { ...item, product: product || undefined };
      }));

      return { ...lastOrder, items: itemsWithProducts };
    } else {
      const lastOrder = await prisma.order.findFirst({
        where: {
          customerId,
          status: { not: 'cancelled' }
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          deliveryDate: 'desc',
        },
      });

      return lastOrder as OrderWithItems | null;
    }
  }

  /**
   * Get all orders for a specific delivery date
   */
  async getOrdersByDeliveryDate(date: Date): Promise<OrderWithItems[]> {
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
        const itemsWithProducts = await Promise.all(items.map(async (item: any) => {
          const product = await productRepository.findById(item.productId);
          return { ...item, product: product || undefined };
        }));
        const customer = await userRepository.findById(order.customerId);
        return { ...order, items: itemsWithProducts, customer };
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
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
        },
      });

      return orders as unknown as OrderWithItems[];
    }
  }

  /**
   * Get packing list grouped by delivery area
   */
  async getPackingList(date: Date): Promise<Record<string, OrderWithItems[]>> {
    const orders = await this.getOrdersByDeliveryDate(date);

    // Group by area
    const grouped: Record<string, any[]> = {};

    orders.forEach((order) => {
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
  ): Promise<OrderWithItems> {
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
      if (!packedItems && !userId && !role && !notes && !signature && !deliveryNotes && !coolerBagStatus) {
        return prisma.order.update({
          where: { id },
          data: { status },
          include: { items: { include: { product: true } }, customer: true }
        }) as unknown as OrderWithItems;
      }

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
          include: { items: { include: { product: true } }, customer: true }
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

    return updatedOrder as unknown as OrderWithItems;
  }

  /**
   * Update order details (generic)
   */
  async updateOrder(id: string, data: Partial<Order>): Promise<OrderWithItems> {
    if (env.USE_FIREBASE) {
      return orderRepository.update(id, { ...data, updatedAt: new Date() }) as unknown as OrderWithItems;
    } else {
      const { items, ...rest } = data as any;

      const updatedOrder = await prisma.$transaction(async (tx) => {
        if (items) {
          // If items are provided, replace existing items
          await tx.orderItem.deleteMany({ where: { orderId: id } });
          await tx.orderItem.createMany({
            data: items.map((item: any) => ({
              orderId: id,
              productId: item.productId,
              quantity: item.quantity,
              priceAtOrder: item.priceAtOrder,
            }))
          });
        }

        return tx.order.update({
          where: { id },
          data: rest,
          include: { items: { include: { product: true } }, customer: true }
        });
      });

      // Emit event for real-time updates
      appEvents.emit('orderUpdated', { orderId: id, status: updatedOrder.status });

      return updatedOrder as unknown as OrderWithItems;
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

    orders.forEach((order) => {
      order.items.forEach((item) => {
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

    const items = Array.from(productMap.values()).map((item: BulkOrderItem) => {
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

    bulkOrder.items.forEach((item: BulkOrderItem) => {
      message += `• *${item.productName}*\n`;
      message += `  Base: ${item.totalQuantity}\n`;
      message += `  Buffer: ${item.bufferQuantity}\n`;
      message += `  Total: ${item.finalQuantity}\n\n`;
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
        <h2>Bulk Order Consolidation</h2>
        <p><strong>Week starting:</strong> ${bulkOrder.weekStartDate.toLocaleDateString()}</p>
        <hr style="border: none; border-top: 1px solid #eee;">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Order Qty</th>
              <th>Buffer</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
    `;

    bulkOrder.items.forEach((item: BulkOrderItem) => {
      html += `
        <tr>
          <td>${item.productName}</td>
          <td>${item.totalQuantity}</td>
          <td>${item.bufferQuantity}</td>
          <td><strong>${item.finalQuantity}</strong></td>
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
   * Format bulk order for email (Plain Text)
   */
  formatBulkOrderForEmailText(bulkOrder: BulkOrder): string {
    let text = `Bulk Order Consolidation\n`;
    text += `Week starting: ${bulkOrder.weekStartDate.toLocaleDateString()}\n`;
    text += `Generated at: ${bulkOrder.generatedAt.toLocaleString()}\n\n`;
    text += `Product | Order Qty | Buffer | Total\n`;
    text += `------------------------------------------\n`;

    bulkOrder.items.forEach((item: BulkOrderItem) => {
      text += `${item.productName.padEnd(25)} | ${item.totalQuantity.toString().padStart(9)} | ${item.bufferQuantity.toString().padStart(6)} | ${item.finalQuantity}\n`;
    });

    return text;
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
  } = {}): Promise<OrderWithItems[]> {
    const { limit, status, deliveryDate, startDate, endDate, customerId, packerId, driverId } = options;

    if (env.USE_FIREBASE) {
      const filters: { field: string; operator: string; value: any }[] = [];
      if (status) filters.push({ field: 'status', operator: '==', value: status });
      if (deliveryDate) filters.push({ field: 'deliveryDate', operator: '==', value: new Date(deliveryDate) });
      if (startDate) filters.push({ field: 'deliveryDate', operator: '>=', value: new Date(startDate) });
      if (endDate) filters.push({ field: 'deliveryDate', operator: '<=', value: new Date(endDate) });
      if (customerId) filters.push({ field: 'customerId', operator: '==', value: customerId });
      if (packerId) filters.push({ field: 'packerId', operator: '==', value: packerId });
      if (driverId) filters.push({ field: 'driverId', operator: '==', value: driverId });

      const orders = await orderRepository.list(filters as any[]);
      const topOrders = limit ? orders.slice(0, limit) : orders;

      return Promise.all(topOrders.map(async (order: Order) => {
        const items = await orderItemRepository.findByOrder(order.id);
        const customer = await userRepository.findById(order.customerId);
        const totalAmount = items.reduce((sum: number, item: RepositoryOrderItem) => sum + (item.priceAtOrder * item.quantity), order.deliveryFees || 0);
        return {
          ...order,
          items,
          customer: customer || undefined,
          customerName: customer?.name || 'Unknown',
          totalAmount,
        };
      }));
    } else {
      const where: Record<string, unknown> = {};
      if (status) where.status = status;

      if (deliveryDate) {
        where.deliveryDate = new Date(deliveryDate);
      }

      if (startDate || endDate) {
        where.deliveryDate = {
          ...(startDate ? { gte: new Date(startDate) } : {}),
          ...(endDate ? { lte: new Date(endDate) } : {}),
        };
      }

      if (customerId) where.customerId = customerId;
      if (packerId) where.packerId = packerId;
      if (driverId) where.driverId = driverId;

      const orders = await prisma.order.findMany({
        where: where as { [key: string]: any },
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

      return orders.map((order) => {
        const totalAmount = order.items.reduce((sum: number, item) => {
          return sum + (Number(item.priceAtOrder) * item.quantity);
        }, Number(order.deliveryFees || 0));

        return {
          ...order,
          customerName: order.customer.name,
          totalAmount,
          items: order.items.map(item => ({
            ...item,
            priceAtOrder: Number(item.priceAtOrder),
            product: item.product ? {
              ...item.product,
              price: Number(item.product.price)
            } : undefined
          }))
        } as unknown as OrderWithItems;
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
            product: {
              include: {
                supplier: true,
              },
            },
          },
        },
      },
    });

    const collationMap = new Map<string, CollationItem>();

    orders.forEach((order) => {
      order.items.forEach((item) => {
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
            supplierId: item.product.supplierId || 'unassigned',
            supplierName: item.product.supplier?.name || 'Unassigned',
          });
        }
      });
    });

    return Array.from(collationMap.values()).sort((a, b) =>
      a.supplierName.localeCompare(b.supplierName) ||
      a.categoryId.localeCompare(b.categoryId) ||
      a.productName.localeCompare(b.productName)
    );
  }
}

export const orderService = new OrderService();
