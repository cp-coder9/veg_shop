import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { pdfGenerator, InvoicePDFData } from '../lib/pdf-generator.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import { invoiceRepository, Invoice } from '../repositories/invoice.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { orderItemRepository } from '../repositories/order-item.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { creditRepository } from '../repositories/credit.repository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface OrderItem {
  product: {
    name: string;
    unit: string;
  };
  quantity: number;
  priceAtOrder: number | string | Decimal;
}

interface OrderWithItems {
  items: OrderItem[];
}

interface CustomerInfo {
  name: string;
  address: string | null;
}

interface PaymentInfo {
  id: string;
  amount: number | string | Decimal;
}

export interface InvoiceWithDetails extends Invoice {
  order?: OrderWithItems;
  customer?: CustomerInfo;
  payments?: PaymentInfo[];
}

export class InvoiceService {
  /**
   * Get a single invoice by ID with optional includes
   */
  async getInvoiceWithPayments(
    id: string,
    options?: { includePayments?: boolean; includeCustomer?: boolean }
  ): Promise<any | null> {
    if (env.USE_FIREBASE) {
      const invoice = await invoiceRepository.findById(id);
      if (!invoice) return null;

      const order = await orderRepository.findById(invoice.orderId);
      const items = order ? await orderItemRepository.findByOrder(order.id) : [];
      const customer = await userRepository.findById(invoice.customerId);

      // Note: payments not yet implemented in Firestore
      return {
        ...invoice,
        order: order ? { ...order, items } : undefined,
        customer,
        payments: []
      };
    } else {
      const { includePayments = true, includeCustomer = true } = options || {};

      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          order: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
          customer: includeCustomer,
          payments: includePayments,
        },
      });

      return invoice;
    }
  }

  /**
   * Generate an invoice from an order
   */
  async generateInvoice(orderId: string): Promise<any> {
    if (env.USE_FIREBASE) {
      // Check if invoice already exists
      const existingInvoice = await invoiceRepository.findByOrder(orderId);
      if (existingInvoice) throw new Error('Invoice already exists for this order');

      const order = await orderRepository.findById(orderId);
      if (!order) throw new Error('Order not found');

      const items = await orderItemRepository.findByOrder(orderId);
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.priceAtOrder * item.quantity), 0);

      const creditBalance = await this.getCustomerCreditBalance(order.customerId);
      const creditToApply = Math.min(creditBalance, subtotal);
      const total = subtotal - creditToApply;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const invoice = await invoiceRepository.create({
        orderId,
        customerId: order.customerId,
        subtotal,
        creditApplied: creditToApply,
        total,
        status: total === 0 ? 'paid' : 'unpaid',
        dueDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      if (creditToApply > 0) {
        await creditRepository.create({
          customerId: order.customerId,
          amount: -creditToApply,
          reason: `Applied to invoice ${invoice.id}`,
          type: 'applied',
          createdAt: new Date(),
        });
      }

      return { ...invoice, order: { ...order, items } };
    } else {
      // Check if invoice already exists for this order
      const existingInvoice = await prisma.invoice.findUnique({
        where: { orderId },
      });

      if (existingInvoice) {
        throw new Error('Invoice already exists for this order');
      }

      // Get the order with items
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Calculate subtotal from order items
      const subtotal = order.items.reduce((sum: number, item: any) => {
        return sum + Number(item.priceAtOrder) * item.quantity;
      }, 0);

      // Get customer's current credit balance
      const creditBalance = await this.getCustomerCreditBalance(order.customerId);

      // Calculate credit to apply (cannot exceed subtotal)
      const creditToApply = Math.min(creditBalance, subtotal);

      // Calculate final total
      const total = subtotal - creditToApply;

      // Set due date (14 days from creation)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      // Create invoice in a transaction
      const invoice = await prisma.$transaction(async (tx: any) => {
        // Create the invoice
        const newInvoice = await tx.invoice.create({
          data: {
            orderId,
            customerId: order.customerId,
            subtotal: new Decimal(subtotal),
            creditApplied: new Decimal(creditToApply),
            total: new Decimal(total),
            status: total === 0 ? 'paid' : 'unpaid',
            dueDate,
          },
          include: {
            order: {
              include: {
                items: {
                  include: {
                    product: true,
                  },
                },
              },
            },
            customer: true,
            payments: true,
          },
        });

        // If credit was applied, deduct it from customer's credit balance
        if (creditToApply > 0) {
          await tx.credit.create({
            data: {
              customerId: order.customerId,
              amount: new Decimal(-creditToApply),
              reason: `Applied to invoice ${newInvoice.id}`,
              type: 'applied',
            },
          });
        }

        return newInvoice;
      });

      return invoice;
    }
  }

  /**
   * Generate invoices for multiple orders
   */
  async generateBulkInvoices(orderIds: string[]): Promise<{
    successCount: number;
    failedCount: number;
    errors: { orderId: string; error: string }[];
  }> {
    const results = {
      successCount: 0,
      failedCount: 0,
      errors: [] as { orderId: string; error: string }[],
    };

    for (const orderId of orderIds) {
      try {
        await this.generateInvoice(orderId);
        results.successCount++;
      } catch (error) {
        results.failedCount++;
        results.errors.push({
          orderId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Get a single invoice by ID
   * @deprecated Use getInvoiceWithPayments for more control over includes
   */
  async getInvoice(id: string): Promise<InvoiceWithDetails | null> {
    return this.getInvoiceWithPayments(id, {
      includePayments: true,
      includeCustomer: true,
    });
  }

  /**
   * Get all invoices with optional filtering
   */
  async getAllInvoices(filters?: {
    customerId?: string;
    customerName?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<any[]> {
    if (env.USE_FIREBASE) {
      const fsFilters: any[] = [];
      if (filters?.customerId) fsFilters.push({ field: 'customerId', operator: '==', value: filters.customerId });
      if (filters?.status) fsFilters.push({ field: 'status', operator: '==', value: filters.status });
      if (filters?.startDate) fsFilters.push({ field: 'createdAt', operator: '>=', value: filters.startDate });
      if (filters?.endDate) fsFilters.push({ field: 'createdAt', operator: '<=', value: filters.endDate });

      const invoices = await invoiceRepository.list(fsFilters);

      return Promise.all(invoices.map(async invoice => {
        const order = await orderRepository.findById(invoice.orderId);
        const items = order ? await orderItemRepository.findByOrder(order.id) : [];
        const customer = await userRepository.findById(invoice.customerId);
        return {
          ...invoice,
          order: order ? { ...order, items } : undefined,
          customer,
          payments: []
        };
      }));
    } else {
      const where: Prisma.InvoiceWhereInput = {};

      if (filters?.customerId) {
        where.customerId = filters.customerId;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          (where.createdAt as Prisma.DateTimeFilter).gte = filters.startDate;
        }
        if (filters.endDate) {
          (where.createdAt as Prisma.DateTimeFilter).lte = filters.endDate;
        }
      }

      // Customer name filtering (case-insensitive partial match)
      if (filters?.customerName) {
        const customerFilter: { name: { contains: string; mode: string } } = {
          name: {
            contains: filters.customerName,
            mode: 'insensitive',
          },
        };
        where.customer = customerFilter as Prisma.UserWhereInput;
      }

      const invoices = await prisma.invoice.findMany({
        where,
        include: {
          order: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
          customer: true,
          payments: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return invoices;
    }
  }

  /**
   * Get all invoices for a specific customer
   */
  async getCustomerInvoices(customerId: string): Promise<InvoiceWithDetails[]> {
    return this.getAllInvoices({ customerId });
  }

  /**
   * Get customer's current credit balance
   */
  async getCustomerCreditBalance(customerId: string): Promise<number> {
    if (env.USE_FIREBASE) {
      const credits = await creditRepository.findByCustomer(customerId);
      const balance = credits.reduce((sum: number, credit: any) => sum + credit.amount, 0);
      return Math.max(0, balance);
    } else {
      const credits = await prisma.credit.findMany({
        where: { customerId },
      });

      const balance = credits.reduce((sum: number, credit: any) => {
        return sum + Number(credit.amount);
      }, 0);

      return Math.max(0, balance); // Never return negative balance
    }
  }

  /**
   * Generate PDF for an invoice
   */
  async generateInvoicePDF(invoiceId: string): Promise<Buffer> {
    const invoice = await this.getInvoice(invoiceId);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (!invoice.order || !invoice.customer) {
      throw new Error('Invoice data incomplete');
    }

    // Prepare data for PDF generation
    const pdfData: InvoicePDFData = {
      invoiceId: invoice.id,
      invoiceDate: invoice.createdAt,
      dueDate: invoice.dueDate,
      customerName: invoice.customer.name,
      customerAddress: invoice.customer.address,
      items: invoice.order.items.map((item) => ({
        productName: item.product.name,
        quantity: item.quantity,
        unit: item.product.unit,
        pricePerUnit: Number(item.priceAtOrder),
        total: Number(item.priceAtOrder) * item.quantity,
      })),
      subtotal: Number(invoice.subtotal),
      creditApplied: Number(invoice.creditApplied),
      total: Number(invoice.total),
      status: invoice.status,
    };

    // Generate PDF
    const pdfBuffer = await pdfGenerator.generateInvoicePDF(pdfData);

    // Save PDF to file storage
    const pdfUrl = await this.savePDFToStorage(invoiceId, pdfBuffer);

    // Update invoice with PDF URL
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { pdfUrl },
    });

    return pdfBuffer;
  }

  /**
   * Save PDF to file storage and return URL
   */
  private async savePDFToStorage(invoiceId: string, pdfBuffer: Buffer): Promise<string> {
    // Create storage directory if it doesn't exist
    const storageDir = path.join(__dirname, '../../storage/invoices');
    await fs.mkdir(storageDir, { recursive: true });

    // Save PDF file
    const filename = `invoice-${invoiceId}.pdf`;
    const filepath = path.join(storageDir, filename);
    await fs.writeFile(filepath, pdfBuffer);

    // Return relative URL (in production, this would be a cloud storage URL)
    return `/storage/invoices/${filename}`;
  }

  /**
   * Get PDF buffer for an invoice
   */
  async getInvoicePDFBuffer(invoiceId: string): Promise<Buffer> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // If PDF already exists, read from storage
    if (invoice.pdfUrl) {
      const filepath = path.join(__dirname, '../..', invoice.pdfUrl);
      try {
        return await fs.readFile(filepath);
      } catch (error) {
        // If file doesn't exist, regenerate
        console.warn('PDF file not found, regenerating...');
      }
    }

    // Generate new PDF
    return await this.generateInvoicePDF(invoiceId);
  }

  /**
   * Calculate invoice statistics for admin dashboard
   */
  async calculateInvoiceStats(filters?: {
    customerId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    outstanding: { count: number; amount: number };
    overdue: { count: number; amount: number };
    paid: { count: number; amount: number };
    partial: { count: number; amount: number };
    averageValue: number;
    totalRevenue: number;
  }> {
    const where: Prisma.InvoiceWhereInput = {};

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        (where.createdAt as Prisma.DateTimeFilter).gte = filters.startDate;
      }
      if (filters.endDate) {
        (where.createdAt as Prisma.DateTimeFilter).lte = filters.endDate;
      }
    }

    // Get all invoices matching filters
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        payments: true,
      },
    });

    const now = new Date();

    // Initialize stats
    const stats = {
      outstanding: { count: 0, amount: 0 },
      overdue: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      partial: { count: 0, amount: 0 },
      averageValue: 0,
      totalRevenue: 0,
    };

    // Calculate stats
    for (const invoice of invoices) {
      const total = Number(invoice.total);
      const totalPaid = invoice.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      const remaining = total - totalPaid;

      // Count by status
      if (invoice.status === 'paid') {
        stats.paid.count++;
        stats.paid.amount += total;
      } else if (invoice.status === 'partial') {
        stats.partial.count++;
        stats.partial.amount += remaining;
      } else if (invoice.status === 'unpaid') {
        stats.outstanding.count++;
        stats.outstanding.amount += remaining;

        // Check if overdue
        if (invoice.dueDate < now) {
          stats.overdue.count++;
          stats.overdue.amount += remaining;
        }
      }

      stats.totalRevenue += total;
    }

    // Calculate average invoice value
    stats.averageValue = invoices.length > 0 ? stats.totalRevenue / invoices.length : 0;

    return stats;
  }
}

export const invoiceService = new InvoiceService();
