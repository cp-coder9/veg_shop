import { prisma } from '../lib/prisma.js';
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
  product?: {
    name: string;
    unit: string;
  };
  quantity: number;
  priceAtOrder: number | string | Decimal;
}

interface OrderWithItems {
  items: OrderItem[];
  deliveryFees?: number | string | Decimal;
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
      const itemsTotal = items.reduce((sum: number, item: any) => sum + (item.priceAtOrder * item.quantity), 0);
      const deliveryFee = Number(order.deliveryFees || 0);
      const subtotalWithDelivery = itemsTotal + deliveryFee;

      const creditBalance = await this.getCustomerCreditBalance(order.customerId);
      const creditToApply = Math.min(creditBalance, subtotalWithDelivery);
      const total = subtotalWithDelivery - creditToApply;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const invoice = await invoiceRepository.create({
        orderId,
        customerId: order.customerId,
        subtotal: itemsTotal,
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
      const itemsTotal = order.items.reduce((sum: number, item: any) => {
        const packMultiplier = (item.product as any)?.packQuantity || 1;
        return sum + Number(item.priceAtOrder) * item.quantity * packMultiplier;
      }, 0);

      const deliveryFee = Number(order.deliveryFees || 0);

      // Fetch any pending poll items for this customer
      const pendingPollItems = await prisma.pollItem.findMany({
        where: { customerId: order.customerId, status: 'pending' },
        include: { product: true },
      });
      const pollItemsTotal = pendingPollItems.reduce(
        (sum: number, pi: any) => sum + Number(pi.price) * pi.quantity, 0
      );

      const subtotalWithDelivery = itemsTotal + deliveryFee + pollItemsTotal;

      // Get customer's current credit balance
      const creditBalance = await this.getCustomerCreditBalance(order.customerId);

      // Calculate credit to apply (cannot exceed the whole bill)
      const creditToApply = Math.min(creditBalance, subtotalWithDelivery);

      // Calculate final total
      const total = subtotalWithDelivery - creditToApply;

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
            subtotal: new Decimal(itemsTotal + pollItemsTotal),
            creditApplied: new Decimal(creditToApply),
            total: new Decimal(total),
            status: total === 0 ? 'paid' : 'unpaid',
            type: 'proforma',
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

        // Mark poll items as invoiced and link them to this invoice
        if (pendingPollItems.length > 0) {
          await tx.pollItem.updateMany({
            where: { id: { in: pendingPollItems.map((pi: any) => pi.id) } },
            data: { status: 'invoiced', invoiceId: newInvoice.id },
          });
        }

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
   * Generate a standalone invoice from pending poll items (when customer doesn't order online)
   */
  async generatePollItemsInvoice(customerId: string): Promise<any> {
    const pendingPollItems = await prisma.pollItem.findMany({
      where: { customerId, status: 'pending' },
      include: { product: true },
    });

    if (pendingPollItems.length === 0) {
      throw new Error('No pending poll items for this customer');
    }

    const customer = await prisma.user.findUnique({ where: { id: customerId } });
    if (!customer) throw new Error('Customer not found');

    const pollItemsTotal = pendingPollItems.reduce(
      (sum: number, pi: any) => sum + Number(pi.price) * pi.quantity, 0
    );

    const creditBalance = await this.getCustomerCreditBalance(customerId);
    const creditToApply = Math.min(creditBalance, pollItemsTotal);
    const total = pollItemsTotal - creditToApply;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    // Poll item invoices don't have a linked order – we use a null orderId workaround
    // by creating a placeholder order for now, or we store directly.
    // Strategy: create the invoice with a placeholder sentinel orderId that references
    // a dummy order. Instead, we'll create a minimal invoice record referencing null orderId.
    // Since orderId is required/unique on Invoice, we create a placeholder order.
    const placeholderOrder = await prisma.order.create({
      data: {
        customerId,
        deliveryDate: new Date(),
        deliveryMethod: 'collection',
        status: 'confirmed',
        notes: 'Poll items order (WhatsApp)',
      } as any,
    });

    const invoice = await prisma.$transaction(async (tx: any) => {
      const newInvoice = await tx.invoice.create({
        data: {
          orderId: placeholderOrder.id,
          customerId,
          subtotal: new Decimal(pollItemsTotal),
          creditApplied: new Decimal(creditToApply),
          total: new Decimal(total),
          status: total === 0 ? 'paid' : 'unpaid',
          type: 'proforma',
          dueDate,
        },
        include: {
          customer: true,
          payments: true,
        },
      });

      // Mark poll items invoiced
      await tx.pollItem.updateMany({
        where: { id: { in: pendingPollItems.map((pi: any) => pi.id) } },
        data: { status: 'invoiced', invoiceId: newInvoice.id },
      });

      if (creditToApply > 0) {
        await tx.credit.create({
          data: {
            customerId,
            amount: new Decimal(-creditToApply),
            reason: `Applied to poll items invoice ${newInvoice.id}`,
            type: 'applied',
          },
        });
      }

      return newInvoice;
    });

    return { invoice, pollItems: pendingPollItems };
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
   * Finalise an invoice (moving from proforma to final)
   */
  async finaliseInvoice(invoiceId: string, adminId: string): Promise<any> {
    if (env.USE_FIREBASE) {
      return invoiceRepository.update(invoiceId, {
        type: 'final',
        finalisedAt: new Date(),
        finalisedBy: adminId,
        updatedAt: new Date(),
      } as any);
    } else {
      return prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          type: 'final',
          finalisedAt: new Date(),
          finalisedBy: adminId,
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
        },
      });
    }
  }

  async bulkFinaliseInvoices(invoiceIds: string[], adminId: string): Promise<any[]> {
    return Promise.all(invoiceIds.map(id => this.finaliseInvoice(id, adminId)));
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
      const where: Record<string, unknown> = {};

      if (filters?.customerId) {
        where.customerId = filters.customerId;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.startDate || filters?.endDate) {
        const createdAtFilter: Record<string, Date> = {};
        if (filters.startDate) {
          createdAtFilter.gte = filters.startDate;
        }
        if (filters.endDate) {
          createdAtFilter.lte = filters.endDate;
        }
        where.createdAt = createdAtFilter;
      }

      // Customer name filtering (case-insensitive partial match)
      if (filters?.customerName) {
        const customerFilter: { name: { contains: string; mode: string } } = {
          name: {
            contains: filters.customerName,
            mode: 'insensitive',
          },
        };
        where.customer = customerFilter;
      }

      const invoices = await prisma.invoice.findMany({
        where: where as any,
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
    if (env.USE_FIREBASE) {
      const invoices = await invoiceRepository.findByCustomer(customerId);

      return Promise.all(invoices.map(async (invoice): Promise<InvoiceWithDetails> => {
        const order = await orderRepository.findById(invoice.orderId);
        const items = order ? await orderItemRepository.findByOrder(order.id) : [];
        return {
          ...invoice,
          order: order ? { ...order, items } : undefined,
          payments: [],
        };
      }));
    }

    const invoices = await prisma.invoice.findMany({
      where: { customerId },
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
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return invoices;
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
  async generateInvoicePDF(invoiceId: string, options?: { isProforma?: boolean }): Promise<Buffer> {
    const invoice = await this.getInvoice(invoiceId);

    if (!invoice) {
      // If invoice doesn't exist, check if it's a proforma request for an order
      if (options?.isProforma) {
        return this.generateProforma(invoiceId);
      }
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
      items: invoice.order.items.map((item: any) => {
        const packMultiplier = item.product?.packQuantity || 1;
        return {
          productName: item.product?.name ?? 'Unknown product',
          quantity: item.quantity,
          unit: item.product?.unit ?? '',
          pricePerUnit: Number(item.priceAtOrder),
          total: Number(item.priceAtOrder) * item.quantity * packMultiplier,
          packQuantity: item.product?.packQuantity,
        };
      }),
      subtotal: Number(invoice.subtotal),
      deliveryFee: Number(invoice.order?.deliveryFees || 0),
      creditApplied: Number(invoice.creditApplied),
      total: Number(invoice.total),
      status: invoice.status,
      isProforma: options?.isProforma,
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
   * Generate a proforma invoice PDF for an order without creating an invoice record
   */
  async generateProforma(orderId: string): Promise<Buffer> {
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

    if (!order) throw new Error('Order not found');

    const itemsTotal = order.items.reduce((sum, item) => {
      const packMultiplier = (item.product as any)?.packQuantity || 1;
      return sum + Number(item.priceAtOrder) * item.quantity * packMultiplier;
    }, 0);
    const deliveryFee = Number(order.deliveryFees || 0);
    const subtotalWithDelivery = itemsTotal + deliveryFee;

    const creditBalance = await this.getCustomerCreditBalance(order.customerId);
    const creditToApply = Math.min(creditBalance, subtotalWithDelivery);
    const total = subtotalWithDelivery - creditToApply;

    const pdfData: InvoicePDFData = {
      invoiceId: `PRO-${order.id.substring(0, 8)}`,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      customerName: order.customer.name,
      customerAddress: order.deliveryAddress,
      items: order.items.map((item) => ({
        productName: item.product.name,
        quantity: item.quantity,
        unit: item.product.unit,
        pricePerUnit: Number(item.priceAtOrder),
        total: Number(item.priceAtOrder) * item.quantity,
      })),
      subtotal: itemsTotal,
      deliveryFee,
      creditApplied: creditToApply,
      total,
      status: 'proforma',
      isProforma: true,
    };

    return await pdfGenerator.generateInvoicePDF(pdfData);
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
    const where: Record<string, unknown> = {};

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.startDate || filters?.endDate) {
      const createdAtFilter: Record<string, Date> = {};
      if (filters.startDate) {
        createdAtFilter.gte = filters.startDate;
      }
      if (filters.endDate) {
        createdAtFilter.lte = filters.endDate;
      }
      where.createdAt = createdAtFilter;
    }

    // Get all invoices matching filters
    const invoices = await prisma.invoice.findMany({
      where: where as any,
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
