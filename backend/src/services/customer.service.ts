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
}

export const customerService = new CustomerService();
