import { prisma } from '../lib/prisma.js';

export interface SalesReport {
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  totalOrders: number;
  productsSold: {
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }[];
}

export interface PaymentStatusReport {
  totalOutstanding: number;
  customers: {
    customerId: string;
    customerName: string;
    outstandingBalance: number;
    lastPaymentDate: Date | null;
  }[];
}

export interface ProductPopularityReport {
  startDate: Date;
  endDate: Date;
  products: {
    productId: string;
    productName: string;
    orderCount: number;
    totalQuantity: number;
    revenue: number;
  }[];
}

export interface CustomerActivityReport {
  startDate: Date;
  endDate: Date;
  customers: {
    customerId: string;
    customerName: string;
    orderCount: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate: Date | null;
  }[];
}

export class ReportService {
  /**
   * Generate sales report for a date range
   * Requirement 12.1: Generate weekly sales reports showing total revenue and products sold
   */
  async generateSalesReport(startDate: Date, endDate: Date): Promise<SalesReport> {
    // Get all orders within date range (excluding cancelled)
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
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
        invoice: true,
      },
    });

    // Calculate total revenue from invoices
    const totalRevenue = orders.reduce((sum, order) => {
      if (order.invoice) {
        return sum + Number(order.invoice.total);
      }
      return sum;
    }, 0);

    // Aggregate products sold
    const productMap = new Map<string, {
      productId: string;
      productName: string;
      quantitySold: number;
      revenue: number;
    }>();

    orders.forEach(order => {
      order.items.forEach(item => {
        const existing = productMap.get(item.productId);
        const itemRevenue = Number(item.priceAtOrder) * item.quantity;

        if (existing) {
          existing.quantitySold += item.quantity;
          existing.revenue += itemRevenue;
        } else {
          productMap.set(item.productId, {
            productId: item.productId,
            productName: item.product.name,
            quantitySold: item.quantity,
            revenue: itemRevenue,
          });
        }
      });
    });

    // Convert to array and sort by revenue (descending)
    const productsSold = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue);

    return {
      startDate,
      endDate,
      totalRevenue,
      totalOrders: orders.length,
      productsSold,
    };
  }

  /**
   * Generate payment status report showing outstanding balances
   * Requirement 12.2: Generate payment status reports showing outstanding balances by customer
   */
  async generatePaymentStatusReport(): Promise<PaymentStatusReport> {
    // Get all unpaid and partially paid invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        status: {
          in: ['unpaid', 'partial'],
        },
      },
      include: {
        customer: true,
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
    });

    // Group by customer and calculate outstanding balance
    const customerMap = new Map<string, {
      customerId: string;
      customerName: string;
      outstandingBalance: number;
      lastPaymentDate: Date | null;
    }>();

    invoices.forEach(invoice => {
      const totalPaid = invoice.payments.reduce((sum, payment) => {
        return sum + Number(payment.amount);
      }, 0);

      const outstanding = Number(invoice.total) - totalPaid;
      const lastPayment = invoice.payments.length > 0 ? invoice.payments[0].paymentDate : null;

      const existing = customerMap.get(invoice.customerId);

      if (existing) {
        existing.outstandingBalance += outstanding;
        // Keep the most recent payment date
        if (lastPayment && (!existing.lastPaymentDate || lastPayment > existing.lastPaymentDate)) {
          existing.lastPaymentDate = lastPayment;
        }
      } else {
        customerMap.set(invoice.customerId, {
          customerId: invoice.customerId,
          customerName: invoice.customer.name,
          outstandingBalance: outstanding,
          lastPaymentDate: lastPayment,
        });
      }
    });

    // Convert to array and sort by outstanding balance (descending)
    const customers = Array.from(customerMap.values()).sort(
      (a, b) => b.outstandingBalance - a.outstandingBalance
    );

    const totalOutstanding = customers.reduce((sum, customer) => {
      return sum + customer.outstandingBalance;
    }, 0);

    return {
      totalOutstanding,
      customers,
    };
  }

  /**
   * Generate product popularity report for a date range
   * Requirement 12.3: Generate product popularity reports showing most and least ordered items
   */
  async generateProductPopularityReport(
    startDate: Date,
    endDate: Date
  ): Promise<ProductPopularityReport> {
    // Get all order items within date range (excluding cancelled orders)
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            not: 'cancelled',
          },
        },
      },
      include: {
        product: true,
        order: true,
      },
    });

    // Aggregate by product
    const productMap = new Map<string, {
      productId: string;
      productName: string;
      orderCount: number;
      totalQuantity: number;
      revenue: number;
    }>();

    // Track unique orders per product
    const productOrdersMap = new Map<string, Set<string>>();

    orderItems.forEach(item => {
      const existing = productMap.get(item.productId);
      const itemRevenue = Number(item.priceAtOrder) * item.quantity;

      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.revenue += itemRevenue;
      } else {
        productMap.set(item.productId, {
          productId: item.productId,
          productName: item.product.name,
          orderCount: 0, // Will be calculated from unique orders
          totalQuantity: item.quantity,
          revenue: itemRevenue,
        });
      }

      // Track unique orders for this product
      if (!productOrdersMap.has(item.productId)) {
        productOrdersMap.set(item.productId, new Set());
      }
      productOrdersMap.get(item.productId)!.add(item.order.id);
    });

    // Update order counts with unique order counts
    productMap.forEach((product, productId) => {
      product.orderCount = productOrdersMap.get(productId)?.size || 0;
    });

    // Convert to array and sort by total quantity (descending)
    const products = Array.from(productMap.values()).sort(
      (a, b) => b.totalQuantity - a.totalQuantity
    );

    return {
      startDate,
      endDate,
      products,
    };
  }

  /**
   * Generate customer activity report for a date range
   * Requirement 12.4: Generate customer activity reports showing order frequency and average order value
   */
  async generateCustomerActivityReport(
    startDate: Date,
    endDate: Date
  ): Promise<CustomerActivityReport> {
    // Get all orders within date range (excluding cancelled)
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: 'cancelled',
        },
      },
      include: {
        customer: true,
        invoice: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by customer
    const customerMap = new Map<string, {
      customerId: string;
      customerName: string;
      orderCount: number;
      totalSpent: number;
      averageOrderValue: number;
      lastOrderDate: Date | null;
    }>();

    orders.forEach(order => {
      const orderTotal = order.invoice ? Number(order.invoice.total) : 0;
      const existing = customerMap.get(order.customerId);

      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += orderTotal;
        // Keep the most recent order date (orders are sorted desc)
        if (!existing.lastOrderDate || order.createdAt > existing.lastOrderDate) {
          existing.lastOrderDate = order.createdAt;
        }
      } else {
        customerMap.set(order.customerId, {
          customerId: order.customerId,
          customerName: order.customer.name,
          orderCount: 1,
          totalSpent: orderTotal,
          averageOrderValue: 0, // Will be calculated below
          lastOrderDate: order.createdAt,
        });
      }
    });

    // Calculate average order values
    customerMap.forEach(customer => {
      customer.averageOrderValue = customer.orderCount > 0
        ? customer.totalSpent / customer.orderCount
        : 0;
    });

    // Convert to array and sort by total spent (descending)
    const customers = Array.from(customerMap.values()).sort(
      (a, b) => b.totalSpent - a.totalSpent
    );

    return {
      startDate,
      endDate,
      customers,
    };
  }

  /**
   * Get high-level dashboard metrics for admin
   */
  async getDashboardMetrics(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    unpaidInvoices: number;
    activeCustomers: number;
  }> {
    const [
      totalOrders,
      pendingOrders,
      activeCustomers,
      allInvoices,
    ] = await Promise.all([
      prisma.order.count({ where: { status: { not: 'cancelled' } } }),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.user.count({ where: { role: 'customer' } }),
      prisma.invoice.findMany({
        select: {
          total: true,
          status: true,
        },
      }),
    ]);

    const totalRevenue = allInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const unpaidInvoices = allInvoices.filter(inv => inv.status === 'unpaid' || inv.status === 'partial').length;

    return {
      totalOrders,
      pendingOrders,
      totalRevenue,
      unpaidInvoices,
      activeCustomers,
    };
  }
}

export const reportService = new ReportService();
