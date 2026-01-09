import { prisma } from '../lib/prisma.js';
import { Credit } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { yokoService } from './yoko.service.js';

export interface RecordPaymentDto {
  invoiceId: string;
  customerId: string;
  amount: number;
  method: 'cash' | 'yoco' | 'eft';
  paymentDate: Date;
  notes?: string;
  yokoToken?: string; // Optional token for real Yoko transactions
}

export interface ShortDeliveryDto {
  orderId: string;
  customerId: string;
  items: {
    productId: string;
    quantityShort: number;
  }[];
}

interface InvoiceDetails {
  id: string;
  orderId: string;
  total: number;
  status: string;
  subtotal: number;
  creditApplied: number;
}

interface CustomerDetails {
  id: string;
  name: string;
  email: string | null;
}

export interface PaymentWithDetails {
  id: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  method: string;
  paymentDate: Date;
  notes: string | null;
  invoice?: InvoiceDetails;
  customer?: CustomerDetails;
}

export interface CreditWithDetails extends Credit {
  customer?: CustomerDetails;
}

export class PaymentService {
  /**
   * Record a payment and update invoice status
   */
  async recordPayment(data: RecordPaymentDto): Promise<PaymentWithDetails> {
    // Validate invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Validate customer matches invoice
    if (invoice.customerId !== data.customerId) {
      throw new Error('Customer does not match invoice');
    }

    // Validate payment amount is positive
    if (data.amount <= 0) {
      throw new Error('Payment amount must be positive');
    }

    // Validate payment method
    const validMethods = ['cash', 'yoco', 'eft'];
    if (!validMethods.includes(data.method)) {
      throw new Error(`Invalid payment method. Must be one of: ${validMethods.join(', ')}`);
    }

    // If real Yoko payment, process with Yoko first
    let gatewayReference: string | undefined;
    if (data.method === 'yoco' && data.yokoToken) {
      const yokoResult = await yokoService.createCharge(data.yokoToken, Math.round(data.amount * 100));
      if (!yokoResult.success) {
        throw new Error(`Yoko Payment Failed: ${yokoResult.errorMessage}`);
      }
      gatewayReference = yokoResult.chargeId;
    }

    // Record payment and update invoice in a transaction
    const payment = await prisma.$transaction(async (tx) => {
      // Create payment record
      const newPayment = await tx.payment.create({
        data: {
          invoiceId: data.invoiceId,
          customerId: data.customerId,
          amount: new Decimal(data.amount),
          method: data.method,
          paymentDate: data.paymentDate,
          notes: gatewayReference ? `${data.notes || ''} (Yoko Ref: ${gatewayReference})`.trim() : data.notes,
        },
        include: {
          invoice: true,
          customer: true,
        },
      });

      // Calculate total payments for this invoice
      const allPayments = await tx.payment.findMany({
        where: { invoiceId: data.invoiceId },
      });

      const totalPaid = allPayments.reduce((sum, p) => {
        return sum + Number(p.amount);
      }, 0);

      const invoiceTotal = Number(invoice.total);

      // Determine new invoice status
      let newStatus: string;
      if (totalPaid >= invoiceTotal) {
        newStatus = 'paid';
        const overpayment = totalPaid - invoiceTotal;

        if (overpayment > 0) {
          await tx.credit.create({
            data: {
              customerId: data.customerId,
              amount: new Decimal(overpayment),
              reason: `Overpayment on invoice ${data.invoiceId}`,
              type: 'overpayment',
            },
          });
        }
      } else if (totalPaid > 0) {
        newStatus = 'partial';
      } else {
        newStatus = 'unpaid';
      }

      // Award Loyalty Points for EFT
      if (data.method === 'eft') {
        await tx.user.update({
          where: { id: data.customerId },
          data: {
            loyaltyPoints: {
              increment: 5
            }
          }
        });
      }

      // Update invoice status
      await tx.invoice.update({
        where: { id: data.invoiceId },
        data: { status: newStatus },
      });

      return newPayment;
    });

    // Convert Decimal fields to numbers for the return type
    const result: PaymentWithDetails = {
      id: payment.id,
      invoiceId: payment.invoiceId,
      customerId: payment.customerId,
      amount: Number(payment.amount),
      method: payment.method,
      paymentDate: payment.paymentDate,
      notes: payment.notes,
      invoice: payment.invoice ? {
        id: payment.invoice.id,
        orderId: payment.invoice.orderId,
        status: payment.invoice.status,
        subtotal: Number(payment.invoice.subtotal),
        creditApplied: Number(payment.invoice.creditApplied),
        total: Number(payment.invoice.total),
      } : undefined,
      customer: payment.customer ? {
        id: payment.customer.id,
        name: payment.customer.name,
        email: payment.customer.email,
      } : undefined,
    };

    return result;
  }

  /**
   * Get a single payment by ID
   */
  async getPayment(id: string): Promise<PaymentWithDetails | null> {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            order: true,
          },
        },
        customer: true,
      },
    });

    if (!payment) return null;

    // Convert Decimal fields to numbers
    const result: PaymentWithDetails = {
      id: payment.id,
      invoiceId: payment.invoiceId,
      customerId: payment.customerId,
      amount: Number(payment.amount),
      method: payment.method,
      paymentDate: payment.paymentDate,
      notes: payment.notes,
      invoice: payment.invoice ? {
        id: payment.invoice.id,
        orderId: payment.invoice.orderId,
        status: payment.invoice.status,
        subtotal: Number(payment.invoice.subtotal),
        creditApplied: Number(payment.invoice.creditApplied),
        total: Number(payment.invoice.total),
      } : undefined,
      customer: payment.customer ? {
        id: payment.customer.id,
        name: payment.customer.name,
        email: payment.customer.email,
      } : undefined,
    };

    return result;
  }

  /**
   * Get all payments for a specific customer
   */
  async getCustomerPayments(customerId: string): Promise<PaymentWithDetails[]> {
    const payments = await prisma.payment.findMany({
      where: { customerId },
      include: {
        invoice: {
          include: {
            order: true,
          },
        },
        customer: true,
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });

    // Convert Decimal fields to numbers
    return payments.map(payment => {
      const result: PaymentWithDetails = {
        id: payment.id,
        invoiceId: payment.invoiceId,
        customerId: payment.customerId,
        amount: Number(payment.amount),
        method: payment.method,
        paymentDate: payment.paymentDate,
        notes: payment.notes,
        invoice: payment.invoice ? {
          id: payment.invoice.id,
          orderId: payment.invoice.orderId,
          status: payment.invoice.status,
          subtotal: Number(payment.invoice.subtotal),
          creditApplied: Number(payment.invoice.creditApplied),
          total: Number(payment.invoice.total),
        } : undefined,
        customer: payment.customer ? {
          id: payment.customer.id,
          name: payment.customer.name,
          email: payment.customer.email,
        } : undefined,
      };
      return result;
    });
  }

  /**
   * Get all payments for a specific invoice
   */
  async getInvoicePayments(invoiceId: string): Promise<PaymentWithDetails[]> {
    const payments = await prisma.payment.findMany({
      where: { invoiceId },
      include: {
        invoice: true,
        customer: true,
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });

    // Convert Decimal fields to numbers
    return payments.map(payment => {
      const result: PaymentWithDetails = {
        id: payment.id,
        invoiceId: payment.invoiceId,
        customerId: payment.customerId,
        amount: Number(payment.amount),
        method: payment.method,
        paymentDate: payment.paymentDate,
        notes: payment.notes,
        invoice: payment.invoice ? {
          id: payment.invoice.id,
          orderId: payment.invoice.orderId,
          status: payment.invoice.status,
          subtotal: Number(payment.invoice.subtotal),
          creditApplied: Number(payment.invoice.creditApplied),
          total: Number(payment.invoice.total),
        } : undefined,
        customer: payment.customer ? {
          id: payment.customer.id,
          name: payment.customer.name,
          email: payment.customer.email,
        } : undefined,
      };
      return result;
    });
  }

  /**
   * Get customer's current credit balance
   */
  async getCreditBalance(customerId: string): Promise<number> {
    const credits = await prisma.credit.findMany({
      where: { customerId },
    });

    const balance = credits.reduce((sum, credit) => {
      return sum + Number(credit.amount);
    }, 0);

    // Never return negative balance
    return Math.max(0, balance);
  }

  /**
   * Apply credit to reduce an amount (used during invoice generation)
   * This method doesn't create credit records, just calculates how much can be applied
   */
  async calculateCreditToApply(customerId: string, amount: number): Promise<number> {
    const creditBalance = await this.getCreditBalance(customerId);
    return Math.min(creditBalance, amount);
  }

  /**
   * Get all credits for a specific customer
   */
  async getCustomerCredits(customerId: string): Promise<CreditWithDetails[]> {
    const credits = await prisma.credit.findMany({
      where: { customerId },
      include: {
        customer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return credits;
  }

  /**
   * Record short delivery and create credit for customer
   */
  async recordShortDelivery(data: ShortDeliveryDto): Promise<Credit> {
    // Validate order exists
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
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

    // Validate customer matches order
    if (order.customerId !== data.customerId) {
      throw new Error('Customer does not match order');
    }

    // Validate short delivery items exist in order
    const orderItemProductIds = order.items.map(item => item.productId);
    const invalidItems = data.items.filter(item => !orderItemProductIds.includes(item.productId));

    if (invalidItems.length > 0) {
      throw new Error('Some products are not in the order');
    }

    // Calculate credit amount based on product pricing at order time
    let totalCreditAmount = 0;
    const creditDetails: string[] = [];

    for (const shortItem of data.items) {
      const orderItem = order.items.find(item => item.productId === shortItem.productId);

      if (!orderItem) {
        throw new Error(`Product ${shortItem.productId} not found in order`);
      }

      // Validate quantity short doesn't exceed ordered quantity
      if (shortItem.quantityShort > orderItem.quantity) {
        throw new Error(`Short quantity for ${orderItem.product.name} exceeds ordered quantity`);
      }

      const creditForItem = Number(orderItem.priceAtOrder) * shortItem.quantityShort;
      totalCreditAmount += creditForItem;

      creditDetails.push(
        `${orderItem.product.name}: ${shortItem.quantityShort} x R${Number(orderItem.priceAtOrder).toFixed(2)} = R${creditForItem.toFixed(2)}`
      );
    }

    // Create credit record
    const credit = await prisma.$transaction(async (tx) => {
      // 1. Create the Short Delivery Credit (User gets money back)
      const newCredit = await tx.credit.create({
        data: {
          customerId: data.customerId,
          amount: new Decimal(totalCreditAmount),
          reason: `Short delivery on order ${data.orderId}: ${creditDetails.join('; ')}`,
          type: 'short_delivery',
        },
        include: {
          customer: true,
        },
      });

      // 2. Check if there's an existing invoice for this order
      const invoice = await tx.invoice.findUnique({
        where: { orderId: data.orderId },
        include: { payments: true }
      });

      // If invoice exists and not fully paid, we can deduct this credit immediately
      if (invoice && invoice.status !== 'paid' && invoice.status !== 'cancelled') {
        // Calculate how much to deduct (cannot be more than the credit, and technically cannot be more than remaining invoice balance, 
        // but typically short delivery implies removing that cost entirely).
        // Since we are "Correcting" the invoice, we apply the full credit amount to reduce the total due.

        const creditToApply = new Decimal(totalCreditAmount);

        // a. Create an 'Applied' Credit transaction (User spends money to pay off invoice)
        await tx.credit.create({
          data: {
            customerId: data.customerId,
            amount: creditToApply.negated(), // Negative amount
            reason: `Applied to invoice ${invoice.id} (Short Delivery Adjustment)`,
            type: 'applied',
          },
        });

        // b. Update Invoice: Increase creditApplied, Decrease Total
        const currentTotal = invoice.total;
        const newTotal = currentTotal.sub(creditToApply);
        const newCreditApplied = invoice.creditApplied.add(creditToApply);

        // Check if invoice is now Paid (Total Paid >= New Total)
        const totalPaid = invoice.payments.reduce((sum, p) => sum.add(p.amount), new Decimal(0));
        let newStatus = invoice.status;

        if (totalPaid.gte(newTotal)) {
          newStatus = 'paid';
          // If they overpaid relative to the new total, that is handled by payments logic, 
          // but here we just mark paid.
        } else if (newTotal.eq(0)) {
          newStatus = 'paid';
        }

        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            total: newTotal,
            creditApplied: newCreditApplied,
            status: newStatus,
            pdfUrl: null, // Force regeneration
          },
        });
      }

      return newCredit;
    });

    return credit;
  }
}

export const paymentService = new PaymentService();
