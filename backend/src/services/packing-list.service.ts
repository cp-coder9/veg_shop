import { prisma } from '../lib/prisma.js';
import { pdfGenerator, PackingListPDFData } from '../lib/pdf-generator.js';
import { env } from '../config/env.js';
import { orderRepository } from '../repositories/order.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { orderItemRepository } from '../repositories/order-item.repository.js';
import { productRepository } from '../repositories/product.repository.js';

export interface PackingListItem {
  productName: string;
  quantity: number;
  unit: string;
}

export interface PackingList {
  orderId: string;
  customerName: string;
  customerAddress: string | null;
  deliveryDate: Date;
  deliveryMethod: string;
  specialInstructions: string | null;
  items: PackingListItem[];
}

export type SortBy = 'route' | 'name';

export class PackingListService {
  /**
   * Generate a packing list for a single order
   */
  async generatePackingList(orderId: string): Promise<PackingList> {
    if (env.USE_FIREBASE) {
      const order = await orderRepository.findById(orderId);
      if (!order) throw new Error('Order not found');

      const customer = await userRepository.findById(order.customerId);
      if (!customer) throw new Error('Customer not found');

      const items = await orderItemRepository.findByOrder(orderId);
      const itemsWithProducts = await Promise.all(items.map(async item => {
        const product = await productRepository.findById(item.productId);
        return { ...item, product };
      }));

      return {
        orderId: order.id,
        customerName: customer.name,
        customerAddress: order.deliveryAddress || customer.address || null,
        deliveryDate: order.deliveryDate,
        deliveryMethod: order.deliveryMethod,
        specialInstructions: order.specialInstructions || null,
        items: itemsWithProducts.map(item => ({
          productName: item.product?.name || 'Unknown Product',
          quantity: item.quantity,
          unit: item.product?.unit || 'unit',
        })),
      };
    } else {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      return {
        orderId: order.id,
        customerName: order.customer.name,
        customerAddress: order.deliveryAddress || order.customer.address,
        deliveryDate: order.deliveryDate,
        deliveryMethod: order.deliveryMethod,
        specialInstructions: order.specialInstructions,
        items: order.items.map((item) => ({
          productName: item.product.name,
          quantity: item.quantity,
          unit: item.product.unit,
        })),
      };
    }
  }

  /**
   * Generate packing lists for all orders on a specific delivery date
   * Grouped by delivery date and sorted by route or customer name
   */
  async generatePackingListsByDate(
    date: Date,
    sortBy: SortBy = 'name'
  ): Promise<PackingList[]> {
    if (env.USE_FIREBASE) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const allOrders = await orderRepository.list([
        { field: 'deliveryDate', operator: '>=', value: startOfDay },
        { field: 'deliveryDate', operator: '<=', value: endOfDay },
        { field: 'status', operator: 'in', value: ['confirmed', 'packed'] }
      ]);

      const packingLists = await Promise.all(allOrders.map(async order => {
        return this.generatePackingList(order.id);
      }));

      return this.sortPackingLists(packingLists, sortBy);
    } else {
      // Normalize date to start of day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch all orders for the delivery date
      const orders = await prisma.order.findMany({
        where: {
          deliveryDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: {
            in: ['confirmed', 'packed'],
          },
        },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Convert orders to packing lists
      const packingLists: PackingList[] = orders.map((order) => ({
        orderId: order.id,
        customerName: order.customer.name,
        customerAddress: order.deliveryAddress || order.customer.address,
        deliveryDate: order.deliveryDate,
        deliveryMethod: order.deliveryMethod,
        specialInstructions: order.specialInstructions,
        items: order.items.map((item) => ({
          productName: item.product.name,
          quantity: item.quantity,
          unit: item.product.unit,
        })),
      }));

      // Sort packing lists
      return this.sortPackingLists(packingLists, sortBy);
    }
  }

  /**
   * Sort packing lists by route or customer name
   */
  private sortPackingLists(
    packingLists: PackingList[],
    sortBy: SortBy
  ): PackingList[] {
    if (sortBy === 'name') {
      return packingLists.sort((a, b) =>
        a.customerName.localeCompare(b.customerName)
      );
    }

    // For route sorting, we'll sort by address
    // In a real system, this would use actual route optimization
    return packingLists.sort((a, b) => {
      const addressA = a.customerAddress || '';
      const addressB = b.customerAddress || '';
      return addressA.localeCompare(addressB);
    });
  }

  /**
   * Generate PDF for a single packing list
   */
  async generatePackingListPDF(orderId: string): Promise<Buffer> {
    const packingList = await this.generatePackingList(orderId);

    const pdfData: PackingListPDFData = {
      orderId: packingList.orderId,
      customerName: packingList.customerName,
      customerAddress: packingList.customerAddress,
      deliveryDate: packingList.deliveryDate,
      deliveryMethod: packingList.deliveryMethod,
      specialInstructions: packingList.specialInstructions,
      items: packingList.items,
    };

    return await pdfGenerator.generatePackingListPDF(pdfData);
  }

  /**
   * Generate batch PDF for multiple packing lists
   */
  async generateBatchPackingListPDF(orderIds: string[]): Promise<Buffer> {
    const packingLists = await Promise.all(
      orderIds.map((orderId) => this.generatePackingList(orderId))
    );

    const pdfDataList: PackingListPDFData[] = packingLists.map((pl) => ({
      orderId: pl.orderId,
      customerName: pl.customerName,
      customerAddress: pl.customerAddress,
      deliveryDate: pl.deliveryDate,
      deliveryMethod: pl.deliveryMethod,
      specialInstructions: pl.specialInstructions,
      items: pl.items,
    }));

    return await pdfGenerator.generateBatchPackingListPDF(pdfDataList);
  }

  /**
   * Generate batch PDF for all orders on a specific delivery date
   */
  async generatePackingListPDFByDate(
    date: Date,
    sortBy: SortBy = 'name'
  ): Promise<Buffer> {
    const packingLists = await this.generatePackingListsByDate(date, sortBy);

    const pdfDataList: PackingListPDFData[] = packingLists.map((pl) => ({
      orderId: pl.orderId,
      customerName: pl.customerName,
      customerAddress: pl.customerAddress,
      deliveryDate: pl.deliveryDate,
      deliveryMethod: pl.deliveryMethod,
      specialInstructions: pl.specialInstructions,
      items: pl.items,
    }));

    return await pdfGenerator.generateBatchPackingListPDF(pdfDataList);
  }
}

export const packingListService = new PackingListService();
