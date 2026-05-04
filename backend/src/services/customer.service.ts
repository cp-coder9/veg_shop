import { prisma } from '../lib/prisma.js';
import { orderService } from './order.service.js';
import { paymentService } from './payment.service.js';
import { invoiceService } from './invoice.service.js';
import { env } from '../config/env.js';
import { userRepository, User } from '../repositories/user.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { orderItemRepository } from '../repositories/order-item.repository.js';
import { invoiceRepository } from '../repositories/invoice.repository.js';

export interface CreateCustomerDto {
  phone?: string;
  whatsappNumber?: string;
  whatsappVerified?: boolean;
  email?: string;
  name: string;
  address?: string;
  streetName?: string;
  area?: string;
  province?: string;
  postalCode?: string;
  countryCode?: string;
  deliveryPreference?: 'delivery' | 'collection';
}

export interface UpdateCustomerDto {
  phone?: string;
  whatsappNumber?: string;
  whatsappVerified?: boolean;
  email?: string;
  name?: string;
  address?: string;
  streetName?: string;
  area?: string;
  province?: string;
  postalCode?: string;
  countryCode?: string;
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
  async createCustomer(data: CreateCustomerDto): Promise<any> {
    // Validate that at least phone or email is provided
    if (!data.phone && !data.email) {
      throw new Error('Either phone or email must be provided');
    }

    if (env.USE_FIREBASE) {
      // Check if customer already exists
      const existingEmail = data.email ? await userRepository.findByEmail(data.email) : null;
      const existingPhone = data.phone ? await userRepository.findOne('phone', data.phone) : null;

      if (existingEmail || existingPhone) {
        throw new Error('Customer with this phone or email already exists');
      }

      return userRepository.create({
        ...data,
        role: 'customer',
        status: 'active',
        loyaltyPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
    } else {
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
        whatsappNumber: data.whatsappNumber || data.phone || null,
        whatsappVerified: data.whatsappVerified || false,
        email: data.email || null,
        name: data.name,
        address: data.address || null,
        streetName: data.streetName || null,
        area: data.area || null,
        province: data.province || null,
        postalCode: data.postalCode || null,
        countryCode: data.countryCode || 'ZA',
        deliveryPreference: data.deliveryPreference || 'delivery',
        role: 'customer',
      },
    });

    return customer;
  }
}

  /**
   * Update an existing customer
   */
  async updateCustomer(id: string, data: UpdateCustomerDto): Promise<any> {
    if (env.USE_FIREBASE) {
      const existingCustomer = await userRepository.findById(id);
      if (!existingCustomer) throw new Error('Customer not found');

      return userRepository.update(id, { ...data, updatedAt: new Date() });
    } else {
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
        whatsappNumber: data.whatsappNumber !== undefined ? data.whatsappNumber : undefined,
        whatsappVerified: data.whatsappVerified !== undefined ? data.whatsappVerified : undefined,
        email: data.email !== undefined ? data.email : undefined,
        name: data.name,
        address: data.address !== undefined ? data.address : undefined,
        streetName: data.streetName !== undefined ? data.streetName : undefined,
        area: data.area !== undefined ? data.area : undefined,
        province: data.province !== undefined ? data.province : undefined,
        postalCode: data.postalCode !== undefined ? data.postalCode : undefined,
        countryCode: data.countryCode !== undefined ? data.countryCode : undefined,
        deliveryPreference: data.deliveryPreference,
      },
    });

    return customer;
  }
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
  async getCustomers(): Promise<any[]> {
    if (env.USE_FIREBASE) {
      return userRepository.list([{ field: 'role', operator: '==', value: 'customer' }]);
    } else {
      return prisma.user.findMany({
        where: {
          role: 'customer',
        },
        orderBy: {
          name: 'asc',
        },
      });
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: string): Promise<any[]> {
    if (env.USE_FIREBASE) {
      return userRepository.list([{ field: 'role', operator: '==', value: role }]);
    } else {
      return prisma.user.findMany({
        where: {
          role,
        },
        orderBy: {
          name: 'asc',
        },
      });
    }
  }

  /**
   * Get customer profile with order history, credit balance, and payment history
   */
  async getCustomerProfile(id: string): Promise<any | null> {
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
  async getCustomerDashboard(id: string): Promise<any> {
    const customer = await this.getCustomer(id);

    if (!customer) {
      return null;
    }

    if (env.USE_FIREBASE) {
      // Get recent orders (last 5)
      const orders = await orderRepository.list([{ field: 'customerId', operator: '==', value: id }]);
      const recentOrders = orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);

      const ordersWithItems = await Promise.all(recentOrders.map(async order => {
        const items = await orderItemRepository.findByOrder(order.id);
        return { ...order, items };
      }));

      // Get credit balance
      const creditBalance = await paymentService.getCreditBalance(id);

      // Get outstanding invoices
      const invoices = await invoiceRepository.list([
        { field: 'customerId', operator: '==', value: id },
        { field: 'status', operator: 'in', value: ['unpaid', 'partial'] }
      ]);

      const outstandingAmount = invoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);

      // Get next delivery date
      const nextOrder = orders
        .filter((o: any) => ['pending', 'confirmed'].includes(o.status) && o.deliveryDate >= new Date())
        .sort((a, b) => a.deliveryDate.getTime() - b.deliveryDate.getTime())[0];

      return {
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
        stats: {
          creditBalance,
          loyaltyPoints: customer.loyaltyPoints,
          outstandingAmount,
          outstandingInvoices: invoices.length,
          totalOrders: orders.length,
          totalSpent: 0, // Simplified for now
        },
        recentOrders: ordersWithItems.map((order: any) => ({
          id: order.id,
          status: order.status,
          deliveryDate: order.deliveryDate,
          createdAt: order.createdAt,
          itemCount: order.items.length,
          total: order.items.reduce((sum: number, item: any) => sum + (item.priceAtOrder * item.quantity), 0),
        })),
        nextDelivery: nextOrder ? {
          orderId: nextOrder.id,
          date: nextOrder.deliveryDate,
          method: nextOrder.deliveryMethod,
        } : null,
        outstandingInvoices: invoices.map(inv => ({
          id: inv.id,
          total: inv.total,
          dueDate: inv.dueDate,
          status: inv.status,
        })),
      };
    } else {
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
        include: {
          order: true,
          payments: true
        },
      });

      const outstandingAmount = invoices.reduce((sum: number, inv: any) => {
        const paidAmount = inv.payments.reduce((pSum: number, p: any) => pSum + Number(p.amount), 0);
        return sum + (Number(inv.total) - paidAmount);
      }, 0);

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
      const totalSpent = allInvoices.reduce((sum: number, inv: any) => sum + Number(inv.total), 0);

      return {
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
        stats: {
          creditBalance,
          loyaltyPoints: customer.loyaltyPoints,
          outstandingAmount,
          outstandingInvoices: invoices.length,
          totalOrders: totalOrdersCount,
          totalSpent,
        },
        recentOrders: recentOrders.map((order: any) => ({
          id: order.id,
          status: order.status,
          deliveryDate: order.deliveryDate,
          createdAt: order.createdAt,
          itemCount: order.items.length,
          total: order.items.reduce((sum: number, item: any) => sum + Number(item.priceAtOrder) * item.quantity, 0),
        })),
        nextDelivery: nextOrder ? {
          orderId: nextOrder.id,
          date: nextOrder.deliveryDate,
          method: nextOrder.deliveryMethod,
        } : null,
        outstandingInvoices: invoices.map((inv: any) => ({
          id: inv.id,
          total: Number(inv.total),
          dueDate: inv.dueDate,
          status: inv.status,
        })),
      };
    }
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

    return payments.map((payment: any) => ({
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
  /**
   * Create a new staff member (admin only)
   */
  async createStaff(data: { name: string; email: string; phone?: string; role: 'packer' | 'driver'; password?: string }): Promise<any> {
    if (env.USE_FIREBASE) {
      const existingUser = await userRepository.findByEmailOrPhone(data.email || data.phone || '');
      if (existingUser) throw new Error('User with this email or phone already exists');

      const password = data.password || 'vegshop123';
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);

      return userRepository.create({
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        password: hashedPassword,
        deliveryPreference: 'collection',
        status: 'active',
        loyaltyPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
    } else {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: data.email },
            ...(data.phone ? [{ phone: data.phone }] : [])
          ]
        }
      });

      if (existingUser) {
        throw new Error('User with this email or phone already exists');
      }

      // Default password if not provided
      const password = data.password || 'vegshop123';
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);

      return prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role,
          password: hashedPassword,
          deliveryPreference: 'collection', // Default for staff
        },
      });
    }
  }

  /**
   * Update staff member
   */
  async updateStaff(id: string, data: { name?: string; email?: string; phone?: string; role?: 'packer' | 'driver'; status?: 'active' | 'inactive'; password?: string }): Promise<any> {
    if (env.USE_FIREBASE) {
      const updateData: any = { ...data, updatedAt: new Date() };
      if (data.password) {
        const bcrypt = await import('bcryptjs');
        updateData.password = await bcrypt.hash(data.password, 10);
      }
      return userRepository.update(id, updateData);
    } else {
      const updateData: Record<string, unknown> = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.role !== undefined) updateData.role = data.role;
      if (data.status !== undefined) updateData.status = data.status;

      if (data.password) {
        const bcrypt = await import('bcryptjs');
        updateData.password = await bcrypt.hash(data.password, 10);
      }

      return prisma.user.update({
        where: { id },
        data: updateData as any,
      });
    }
  }

  /**
   * Delete staff member
   */
  async deleteStaff(id: string): Promise<any> {
    if (env.USE_FIREBASE) {
      return userRepository.delete(id);
    } else {
      return prisma.user.delete({
        where: { id },
      });
    }
  }
}

export const customerService = new CustomerService();
