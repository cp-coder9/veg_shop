import { prisma } from '../lib/prisma.js';
import { User } from '@prisma/client';
import { orderService } from './order.service.js';
import { paymentService } from './payment.service.js';
import { invoiceService } from './invoice.service.js';

export interface CreateCustomerDto {
  phone?: string;
  email?: string;
  name: string;
  address?: string;
  deliveryPreference?: 'delivery' | 'collection';
}

export interface UpdateCustomerDto {
  phone?: string;
  email?: string;
  name?: string;
  address?: string;
  deliveryPreference?: 'delivery' | 'collection';
}

export interface CustomerProfile extends User {
  orderHistory: unknown[];
  creditBalance: number;
  paymentHistory: unknown[];
  invoices: unknown[];
}

export class CustomerService {
  /**
   * Create a new customer
   */
  async createCustomer(data: CreateCustomerDto): Promise<User> {
    // Validate that at least phone or email is provided
    if (!data.phone && !data.email) {
      throw new Error('Either phone or email must be provided');
    }

    // Check if customer already exists
    if (data.phone || data.email) {
      const existingCustomer = await prisma.user.findFirst({
        where: {
          OR: [
            data.phone ? { phone: data.phone } : {},
            data.email ? { email: data.email } : {},
          ].filter(condition => Object.keys(condition).length > 0),
        },
      });

      if (existingCustomer) {
        throw new Error('Customer with this phone or email already exists');
      }
    }

    const customer = await prisma.user.create({
      data: {
        phone: data.phone || null,
        email: data.email || null,
        name: data.name,
        address: data.address || null,
        deliveryPreference: data.deliveryPreference || 'delivery',
        role: 'customer',
      },
    });

    return customer;
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(id: string, data: UpdateCustomerDto): Promise<User> {
    const existingCustomer = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      throw new Error('Customer not found');
    }

    // Check for duplicate phone or email if being updated
    if (data.phone || data.email) {
      const duplicateCustomer = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                data.phone ? { phone: data.phone } : {},
                data.email ? { email: data.email } : {},
              ].filter(condition => Object.keys(condition).length > 0),
            },
          ],
        },
      });

      if (duplicateCustomer) {
        throw new Error('Another customer with this phone or email already exists');
      }
    }

    const customer = await prisma.user.update({
      where: { id },
      data: {
        phone: data.phone !== undefined ? data.phone : undefined,
        email: data.email !== undefined ? data.email : undefined,
        name: data.name,
        address: data.address !== undefined ? data.address : undefined,
        deliveryPreference: data.deliveryPreference,
      },
    });

    return customer;
  }

  /**
   * Get a single customer by ID
   */
  async getCustomer(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Get all customers
   */
  async getCustomers(): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        role: 'customer',
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: string): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        role,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Get customer profile with order history, credit balance, and payment history
   */
  async getCustomerProfile(id: string): Promise<CustomerProfile | null> {
    const customer = await this.getCustomer(id);

    if (!customer) {
      return null;
    }

    // Get order history
    const orderHistory = await orderService.getCustomerOrders(id);

    // Get credit balance
    const creditBalance = await paymentService.getCreditBalance(id);

    // Get payment history
    const paymentHistory = await paymentService.getCustomerPayments(id);

    // Get invoices
    const invoices = await invoiceService.getCustomerInvoices(id);

    return {
      ...customer,
      orderHistory,
      creditBalance,
      paymentHistory,
      invoices,
    };
  }

  /**
   * Get customer dashboard summary data
   */
  async getCustomerDashboard(id: string): Promise<unknown> {
    const customer = await this.getCustomer(id);

    if (!customer) {
      return null;
    }

    // Get recent orders (last 5)
    const recentOrders = await prisma.order.findMany({
      where: { customerId: id },
      include: {
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Get credit balance
    const creditBalance = await paymentService.getCreditBalance(id);

    // Get outstanding invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        customerId: id,
        status: { in: ['unpaid', 'partial'] }
      },
      include: { order: true },
    });

    const outstandingAmount = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);

    // Get next delivery date (soonest pending/confirmed order)
    const nextOrder = await prisma.order.findFirst({
      where: {
        customerId: id,
        status: { in: ['pending', 'confirmed'] },
        deliveryDate: { gte: new Date() }
      },
      orderBy: { deliveryDate: 'asc' },
    });

    // Get total orders placed
    const totalOrdersCount = await prisma.order.count({
      where: { customerId: id }
    });

    // Get total spent
    const allInvoices = await prisma.invoice.findMany({
      where: { customerId: id, status: 'paid' }
    });
    const totalSpent = allInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      stats: {
        creditBalance,
        outstandingAmount,
        outstandingInvoices: invoices.length,
        totalOrders: totalOrdersCount,
        totalSpent,
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        status: order.status,
        deliveryDate: order.deliveryDate,
        createdAt: order.createdAt,
        itemCount: order.items.length,
        total: order.items.reduce((sum, item) => sum + Number(item.priceAtOrder) * item.quantity, 0),
      })),
      nextDelivery: nextOrder ? {
        orderId: nextOrder.id,
        date: nextOrder.deliveryDate,
        method: nextOrder.deliveryMethod,
      } : null,
      outstandingInvoices: invoices.map(inv => ({
        id: inv.id,
        total: Number(inv.total),
        dueDate: inv.dueDate,
        status: inv.status,
      })),
    };
  }

  /**
   * Get customer payment history
   */
  async getCustomerPayments(id: string): Promise<unknown[]> {
    const payments = await prisma.payment.findMany({
      where: { customerId: id },
      include: {
        invoice: {
          include: {
            order: {
              select: { id: true, deliveryDate: true }
            }
          }
        }
      },
      orderBy: { paymentDate: 'desc' },
    });

    return payments.map(payment => ({
      id: payment.id,
      amount: Number(payment.amount),
      method: payment.method,
      paymentDate: payment.paymentDate,
      notes: payment.notes,
      invoice: payment.invoice ? {
        id: payment.invoice.id,
        total: Number(payment.invoice.total),
        status: payment.invoice.status,
        orderId: payment.invoice.orderId,
      } : null,
    }));
  }
}

export const customerService = new CustomerService();

