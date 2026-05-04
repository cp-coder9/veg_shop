import axios from 'axios';
import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';
import { env } from '../config/env.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { invoiceRepository } from '../repositories/invoice.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { orderItemRepository } from '../repositories/order-item.repository.js';
import { productRepository } from '../repositories/product.repository.js';

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || '';
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN || '';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || '';

interface OverdueInvoice {
  id: string;
  total: number | string | Decimal;
  dueDate: Date;
  customerId: string;
  customer: {
    name: string;
    phone: string | null;
    email: string | null;
  };
  order: {
    id: string;
    items: OrderItemWithProduct[];
  };
}

interface OrderItemWithProduct {
  product: {
    name: string;
    unit: string;
  };
  quantity: number;
  priceAtOrder: number | string | Decimal;
}

interface OrderWithDetails {
  id: string;
  customerId: string;
  deliveryDate: Date;
  deliveryMethod: string;
  deliveryAddress: string | null;
  specialInstructions: string | null;
  customer: {
    name: string;
    phone: string | null;
    email: string | null;
  };
  items: OrderItemWithProduct[];
}




export class NotificationService {
  /**
   * Create a notification record in the database
   */
  async createNotification(
    customerId: string,
    type: 'order_confirmation' | 'payment_reminder' | 'product_list' | 'order_status' | 'other',
    method: 'whatsapp' | 'email',
    content: string
  ): Promise<any> {
    if (env.USE_FIREBASE) {
      return await notificationRepository.create({
        customerId,
        type,
        method,
        content,
        status: 'pending',
        sentAt: null,
        createdAt: new Date(),
      } as any);
    } else {
      return await prisma.notification.create({
        data: {
          customerId,
          type,
          method,
          content,
          status: 'pending',
        },
      });
    }
  }

  /**
   * Update notification status
   */
  async updateNotificationStatus(
    notificationId: string,
    status: 'pending' | 'sent' | 'failed',
    sentAt?: Date
  ): Promise<void> {
    if (env.USE_FIREBASE) {
      await notificationRepository.update(notificationId, {
        status,
        sentAt: sentAt || (status === 'sent' ? new Date() : null),
      } as any);
    } else {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status,
          sentAt: sentAt || (status === 'sent' ? new Date() : null),
        },
      });
    }
  }

  /**
   * Get all notifications (admin history)
   */
  async getAllNotifications(): Promise<any[]> {
    if (env.USE_FIREBASE) {
      return await notificationRepository.list([], { field: 'createdAt', direction: 'desc' });
    } else {
      return await prisma.notification.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 100, // Limit to last 100 to prevent overload
      });
    }
  }

  /**
   * Get pending notifications for processing
   */
  async getPendingNotifications(): Promise<any[]> {
    if (env.USE_FIREBASE) {
      return await notificationRepository.findPending();
    } else {
      return await prisma.notification.findMany({
        where: {
          status: 'pending',
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    }
  }

  /**
   * Process notification queue - send all pending notifications
   */
  async processNotificationQueue(): Promise<void> {
    const pendingNotifications = await this.getPendingNotifications();

    for (const notification of pendingNotifications) {
      try {
        let customer: any;
        if (env.USE_FIREBASE) {
          customer = await userRepository.findById(notification.customerId);
        } else {
          customer = await prisma.user.findUnique({
            where: { id: notification.customerId },
          });
        }

        if (!customer) {
          await this.updateNotificationStatus(notification.id, 'failed');
          continue;
        }

        if (notification.method === 'whatsapp' && customer.phone) {
          await this.sendWhatsAppMessage(customer.phone, notification.content);
        } else if (notification.method === 'email' && customer.email) {
          await this.sendEmailMessage(customer.email, this.getEmailSubject(notification.type), notification.content);
        } else {
          await this.updateNotificationStatus(notification.id, 'failed');
          continue;
        }

        await this.updateNotificationStatus(notification.id, 'sent', new Date());
      } catch (error) {
        console.error(`Failed to send notification ${notification.id}:`, error);
        await this.updateNotificationStatus(notification.id, 'failed');
      }
    }
  }

  /**
   * Get email subject based on notification type
   */
  private getEmailSubject(type: string): string {
    switch (type) {
      case 'order_confirmation':
        return 'Order Confirmation';
      case 'payment_reminder':
        return 'Payment Reminder';
      case 'product_list':
        return 'Weekly Product List';
      default:
        return 'Notification';
    }
  }

  /**
   * Send WhatsApp message with retry logic
   */
  async sendWhatsAppMessage(phone: string, message: string, retries = 3): Promise<void> {
    if (!WHATSAPP_API_URL || !WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      console.warn('[DEV MODE] WhatsApp API not configured, skipping message send');
      console.log(`[DEV MODE] Would send WhatsApp to ${phone}: ${message}`);
      return;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await axios.post(
          `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: {
              body: message,
            },
          },
          {
            headers: {
              'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );
        return; // Success
      } catch (error) {
        lastError = error as Error;
        console.error(`Failed to send WhatsApp message (attempt ${attempt}/${retries}):`, error);

        if (attempt < retries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw new Error(`Failed to send WhatsApp message after ${retries} attempts: ${lastError?.message}`);
  }

  /**
   * Send WhatsApp poll message
   */
  async sendWhatsAppPoll(
    phone: string,
    question: string,
    options: string[],
    multipleSelection = true,
    retries = 3
  ): Promise<void> {
    if (!WHATSAPP_API_URL || !WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      console.warn('[DEV MODE] WhatsApp API not configured, skipping poll send');
      console.log(`[DEV MODE] Would send WhatsApp Poll to ${phone}: Q: ${question}, Options: ${options.join(', ')}`);
      return;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await axios.post(
          `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: phone,
            type: 'interactive',
            interactive: {
              type: 'poll',
              poll: {
                question: question,
                options: options.map((opt, index) => ({
                  id: `opt_${index}`,
                  text: opt.substring(0, 100), // WhatsApp limit is 100 chars for options
                })),
                multiple_selection: multipleSelection,
              },
            },
          },
          {
            headers: {
              'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );
        return; // Success
      } catch (error) {
        lastError = error as Error;
        console.error(`Failed to send WhatsApp poll (attempt ${attempt}/${retries}):`, error);

        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw new Error(`Failed to send WhatsApp poll after ${retries} attempts: ${lastError?.message}`);
  }

  /**
   * Send email message using SMTP
   */
  async sendEmailMessage(email: string, subject: string, htmlContent: string, retries = 3): Promise<void> {
    const smtpHost = env.SMTP_HOST;
    const smtpPort = env.SMTP_PORT;
    const smtpUser = env.SMTP_USER;
    const smtpPass = env.SMTP_PASS;
    const fromEmail = env.SMTP_FROM_EMAIL;
    const fromName = env.SMTP_FROM_NAME;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn('[DEV MODE] SMTP not configured correctly, skipping email send');
      console.log(`[DEV MODE] Would send email to ${email} with subject: ${subject}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: env.SMTP_SECURE, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await transporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: email,
          subject: subject,
          html: htmlContent,
        });
        return; // Success
      } catch (error) {
        lastError = error as Error;
        console.error(`Failed to send email (attempt ${attempt}/${retries}):`, error);

        if (attempt < retries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw new Error(`Failed to send email via SMTP after ${retries} attempts: ${lastError?.message}`);
  }

  /**
   * Send verification code via WhatsApp
   */
  async sendWhatsAppVerificationCode(phone: string, code: string): Promise<void> {
    const message = `Your verification code is: ${code}\n\nThis code will expire in 10 minutes.`;
    await this.sendWhatsAppMessage(phone, message);
  }

  /**
   * Send verification code via Email
   */
  async sendEmailVerificationCode(email: string, code: string): Promise<void> {
    const subject = 'Your Verification Code';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verification Code</h2>
        <p>Your verification code is:</p>
        <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${code}</h1>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `;
    await this.sendEmailMessage(email, subject, htmlContent);
  }

  /**
   * Send verification code via appropriate method based on contact type
   */
  async sendVerificationCode(contact: string, code: string): Promise<void> {
    const isEmail = contact.includes('@');

    // In development, return the verification code in the auth response and do not
    // depend on external SMTP/WhatsApp credentials being valid.
    if (env.NODE_ENV === 'development') {
      console.log(`[DEV MODE] Verification code for ${contact}: ${code}`);
      return;
    }

    // In development mode without API credentials, just log the code
    if (!SENDGRID_API_KEY && !WHATSAPP_API_URL) {
      console.log(`[DEV MODE] Verification code for ${contact}: ${code}`);
      return;
    }

    if (isEmail) {
      await this.sendEmailVerificationCode(contact, code);
    } else {
      await this.sendWhatsAppVerificationCode(contact, code);
    }
  }

  /**
   * Identify invoices with outstanding balances past due date
   */
  async getOverdueInvoices(): Promise<any[]> {
    if (env.USE_FIREBASE) {
      const today = new Date();
      const overdue = await invoiceRepository.list([
        { field: 'status', operator: 'in', value: ['unpaid', 'partial'] },
        { field: 'dueDate', operator: '<', value: today }
      ]);

      return Promise.all(overdue.map(async invoice => {
        const customer = await userRepository.findById(invoice.customerId);
        const order = await orderRepository.findById(invoice.orderId);
        const orderItems = await orderItemRepository.findByOrder(invoice.orderId);
        const itemsWithProducts = await Promise.all(orderItems.map(async item => {
          const product = await productRepository.findById(item.productId);
          return { ...item, product };
        }));

        return {
          ...invoice,
          customer,
          order: { ...order, items: itemsWithProducts }
        };
      }));
    } else {
      const today = new Date();

      const invoices = await prisma.invoice.findMany({
        where: {
          status: {
            in: ['unpaid', 'partial'],
          },
          dueDate: {
            lt: today,
          },
        },
        include: {
          customer: true,
          order: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      return invoices;
    }
  }

  /**
   * Send payment reminder to a specific customer
   */
  async sendPaymentReminder(customerId: string): Promise<void> {
    let customer: any;
    let overdueInvoices: any[];

    if (env.USE_FIREBASE) {
      customer = await userRepository.findById(customerId);
      if (!customer) throw new Error('Customer not found');

      const allOverdue = await this.getOverdueInvoices();
      overdueInvoices = allOverdue.filter(inv => inv.customerId === customerId);
    } else {
      customer = await prisma.user.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Get all overdue invoices for this customer
      overdueInvoices = (await prisma.invoice.findMany({
        where: {
          customerId,
          status: {
            in: ['unpaid', 'partial'],
          },
          dueDate: {
            lt: new Date(),
          },
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
      })) as OverdueInvoice[];
    }

    if (overdueInvoices.length === 0) {
      return; // No overdue invoices
    }

    const totalOutstanding = overdueInvoices.reduce(
      (sum: number, invoice: any) => sum + Number(invoice.total),
      0
    );

    // Generate reminder message
    const whatsappMessage = this.generatePaymentReminderWhatsApp(
      customer.name,
      overdueInvoices,
      totalOutstanding
    );

    const emailContent = this.generatePaymentReminderEmail(
      customer.name,
      overdueInvoices,
      totalOutstanding
    );

    // Send via preferred method or both
    if (customer.phone) {
      const notification = await this.createNotification(
        customerId,
        'payment_reminder',
        'whatsapp',
        whatsappMessage
      );

      try {
        await this.sendWhatsAppMessage(customer.phone, whatsappMessage);
        await this.updateNotificationStatus(notification.id, 'sent', new Date());
      } catch (error) {
        await this.updateNotificationStatus(notification.id, 'failed');
        throw error;
      }
    }

    if (customer.email) {
      const notification = await this.createNotification(
        customerId,
        'payment_reminder',
        'email',
        emailContent
      );

      try {
        await this.sendEmailMessage(customer.email, 'Payment Reminder', emailContent);
        await this.updateNotificationStatus(notification.id, 'sent', new Date());
      } catch (error) {
        await this.updateNotificationStatus(notification.id, 'failed');
        throw error;
      }
    }
  }

  /**
   * Generate WhatsApp payment reminder message
   */
  private generatePaymentReminderWhatsApp(
    customerName: string,
    invoices: OverdueInvoice[],
    totalOutstanding: number
  ): string {
    let message = `Hi ${customerName},\n\n`;
    message += `This is a friendly reminder that you have outstanding invoices:\n\n`;

    invoices.forEach((invoice) => {
      const dueDate = new Date(invoice.dueDate).toLocaleDateString();
      message += `• Invoice #${invoice.id.substring(0, 8)} - R${Number(invoice.total).toFixed(2)} (Due: ${dueDate})\n`;
    });

    message += `\nTotal Outstanding: R${totalOutstanding.toFixed(2)}\n\n`;
    message += `Please arrange payment at your earliest convenience. If you have any questions, feel free to reach out.\n\n`;
    message += `Thank you!`;

    return message;
  }

  /**
   * Generate email payment reminder content
   */
  private generatePaymentReminderEmail(
    customerName: string,
    invoices: OverdueInvoice[],
    totalOutstanding: number
  ): string {
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Payment Reminder</h2>
        <p>Hi ${customerName},</p>
        <p>This is a friendly reminder that you have outstanding invoices:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Invoice</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Amount</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Due Date</th>
            </tr>
          </thead>
          <tbody>
    `;

    invoices.forEach((invoice) => {
      const dueDate = new Date(invoice.dueDate).toLocaleDateString();
      html += `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">#${invoice.id.substring(0, 8)}</td>
          <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">R${Number(invoice.total).toFixed(2)}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${dueDate}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
          <tfoot>
            <tr style="background-color: #f5f5f5; font-weight: bold;">
              <td style="padding: 10px; border: 1px solid #ddd;">Total Outstanding</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">R${totalOutstanding.toFixed(2)}</td>
              <td style="padding: 10px; border: 1px solid #ddd;"></td>
            </tr>
          </tfoot>
        </table>
        <p>Please arrange payment at your earliest convenience. If you have any questions, feel free to reach out.</p>
        <p>Thank you!</p>
      </div>
    `;

    return html;
  }

  /**
   * Send order confirmation to customer
   */
  async sendOrderConfirmation(orderId: string): Promise<void> {
    let order: any;
    if (env.USE_FIREBASE) {
      const fbOrder = await orderRepository.findById(orderId);
      if (!fbOrder) throw new Error('Order not found');
      const customer = await userRepository.findById(fbOrder.customerId);
      const items = await orderItemRepository.findByOrder(orderId);
      const itemsWithProducts = await Promise.all(items.map(async item => {
        const product = await productRepository.findById(item.productId);
        return { ...item, product };
      }));
      order = { ...fbOrder, customer, items: itemsWithProducts };
    } else {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      }) as OrderWithDetails | null;
    }

    if (!order) {
      throw new Error('Order not found');
    }

    const deliveryDate = new Date(order.deliveryDate).toLocaleDateString();
    const totalAmount = order.items.reduce(
      (sum: number, item: any) => sum + Number(item.priceAtOrder) * item.quantity,
      0
    );

    // Generate WhatsApp message
    const whatsappMessage = this.generateOrderConfirmationWhatsApp(
      order.customer.name,
      order,
      deliveryDate,
      totalAmount
    );

    // Generate email content
    const emailContent = this.generateOrderConfirmationEmail(
      order.customer.name,
      order,
      deliveryDate,
      totalAmount
    );

    // Send via preferred method or both
    if (order.customer.phone) {
      const notification = await this.createNotification(
        order.customerId,
        'order_confirmation',
        'whatsapp',
        whatsappMessage
      );

      try {
        await this.sendWhatsAppMessage(order.customer.phone, whatsappMessage);
        await this.updateNotificationStatus(notification.id, 'sent', new Date());
      } catch (error) {
        console.error('Failed to send WhatsApp order confirmation:', error);
        await this.updateNotificationStatus(notification.id, 'failed');
      }
    }

    if (order.customer.email) {
      const notification = await this.createNotification(
        order.customerId,
        'order_confirmation',
        'email',
        emailContent
      );

      try {
        await this.sendEmailMessage(order.customer.email, 'Order Confirmation', emailContent);
        await this.updateNotificationStatus(notification.id, 'sent', new Date());
      } catch (error) {
        console.error('Failed to send email order confirmation:', error);
        await this.updateNotificationStatus(notification.id, 'failed');
      }
    }
  }

  /**
   * Send order status update to customer
   */
  async sendOrderStatusUpdate(orderId: string, status: string): Promise<void> {
    let order: any;
    if (env.USE_FIREBASE) {
      const fbOrder = await orderRepository.findById(orderId);
      if (fbOrder) {
        const customer = await userRepository.findById(fbOrder.customerId);
        order = { ...fbOrder, customer };
      }
    } else {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          items: {
            include: {
              product: true
            }
          }
        },
      });
    }

    if (!order) return;

    const customer = order.customer;
    const statusMessage = this.getStatusMessage(status, order);

    if (customer.phone) {
      await this.sendWhatsAppMessage(customer.phone, statusMessage);
      // Optional: Log notification to DB
      await this.createNotification(customer.id, 'order_status', 'whatsapp', statusMessage);
    }

    if (customer.email) {
      const subject = `Order Update: ${status.charAt(0).toUpperCase() + status.slice(1)}`;
      await this.sendEmailMessage(customer.email, subject, `<p>${statusMessage.replace(/\n/g, '<br>')}</p>`);
      // Optional: Log notification to DB
      await this.createNotification(customer.id, 'order_status', 'email', statusMessage);
    }
  }

  private getStatusMessage(status: string, order: any): string {
    const orderId = order.id;
    const deliveryMethod = order.deliveryMethod;
    const method = deliveryMethod === 'delivery' ? 'delivery' : 'collection';
    const items = order.items || [];

    switch (status) {
      case 'packed':
        let message = `📦 Order #${orderId.substring(0, 8)} has been packed and is ready for ${method}!\n\n`;
        message += `Total Items: ${items.length}\n`;

        // Mention short-packed items if any
        const shortPacked = items.filter((i: any) => i.quantity === 0);
        if (shortPacked.length > 0) {
          message += `⚠️ Note: ${shortPacked.length} item(s) were out of stock and have been credited to your account.\n`;
        }

        return message;
      case 'out_for_delivery':
        return `🚚 Order #${orderId.substring(0, 8)} is out for delivery! See you soon.`;
      case 'delivered':
        return `✅ Order #${orderId.substring(0, 8)} has been delivered. Enjoy your fresh produce!`;
      case 'cancelled':
        return `❌ Order #${orderId.substring(0, 8)} has been cancelled. Please contact us if this is a mistake.`;
      default:
        return `ℹ️ Order #${orderId.substring(0, 8)} status updated to: ${status}`;
    }
  }

  /**
   * Generate WhatsApp order confirmation message
   */
  private generateOrderConfirmationWhatsApp(
    customerName: string,
    order: OrderWithDetails,
    deliveryDate: string,
    totalAmount: number
  ): string {
    let message = `Hi ${customerName},\n\n`;
    message += `Thank you for your order! Your order has been confirmed.\n\n`;
    message += `Order Details:\n`;
    message += `Order #: ${order.id.substring(0, 8)}\n`;
    message += `Delivery Date: ${deliveryDate}\n`;
    message += `Delivery Method: ${order.deliveryMethod === 'delivery' ? 'Delivery' : 'Collection'}\n\n`;

    message += `Items:\n`;
    order.items.forEach((item) => {
      message += `• ${item.product.name} - ${item.quantity} ${item.product.unit} @ R${Number(item.priceAtOrder).toFixed(2)}\n`;
    });

    message += `\nTotal: R${totalAmount.toFixed(2)}\n\n`;

    if (order.specialInstructions) {
      message += `Special Instructions: ${order.specialInstructions}\n\n`;
    }

    message += `We'll notify you when your order is ready for ${order.deliveryMethod === 'delivery' ? 'delivery' : 'collection'}.\n\n`;
    message += `Thank you for your business!`;

    return message;
  }

  /**
   * Generate email order confirmation content
   */
  private generateOrderConfirmationEmail(
    customerName: string,
    order: OrderWithDetails,
    deliveryDate: string,
    totalAmount: number
  ): string {
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4CAF50;">Order Confirmation</h2>
        <p>Hi ${customerName},</p>
        <p>Thank you for your order! Your order has been confirmed.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h3 style="margin-top: 0;">Order Details</h3>
          <p><strong>Order #:</strong> ${order.id.substring(0, 8)}</p>
          <p><strong>Delivery Date:</strong> ${deliveryDate}</p>
          <p><strong>Delivery Method:</strong> ${order.deliveryMethod === 'delivery' ? 'Delivery' : 'Collection'}</p>
          ${order.deliveryAddress ? `<p><strong>Delivery Address:</strong> ${order.deliveryAddress}</p>` : ''}
        </div>

        <h3>Items Ordered</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Product</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Quantity</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Price</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
    `;

    order.items.forEach((item) => {
      const subtotal = Number(item.priceAtOrder) * item.quantity;
      html += `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">${item.product.name}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${item.quantity} ${item.product.unit}</td>
          <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">R${Number(item.priceAtOrder).toFixed(2)}</td>
          <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">R${subtotal.toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
          <tfoot>
            <tr style="background-color: #f5f5f5; font-weight: bold;">
              <td colspan="3" style="padding: 10px; text-align: right; border: 1px solid #ddd;">Total</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">R${totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
    `;

    if (order.specialInstructions) {
      html += `
        <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
          <p style="margin: 0;"><strong>Special Instructions:</strong></p>
          <p style="margin: 5px 0 0 0;">${order.specialInstructions}</p>
        </div>
      `;
    }

    html += `
        <p>We'll notify you when your order is ready for ${order.deliveryMethod === 'delivery' ? 'delivery' : 'collection'}.</p>
        <p>Thank you for your business!</p>
      </div>
    `;

    return html;
  }

  /**
   * Send product list to customers
   */
  async sendProductList(customerIds: string[]): Promise<void> {
    // Send product list link to customers
    const shopUrl = `${env.CORS_ORIGIN}/shop`;
    const productListWhatsApp = `Hi! Our fresh harvest list for this week is now available! 🥬🥕\n\nView the full list and place your order here:\n${shopUrl}\n\nOrdering window: Tuesday 08:00 to Friday 14:00.`;
    const productListEmail = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2e7d32;">Our Fresh Harvest is Ready!</h2>
        <p>Hi there,</p>
        <p>Our fresh harvest list for this week is now available. We have some amazing organic produce waiting for you!</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${shopUrl}" style="background-color: #2e7d32; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">View Fresh List & Order</a>
        </div>
        <p><strong>Ordering window:</strong> Tuesday 08:00 to Friday 14:00.</p>
        <p>Thank you for supporting organic farming!</p>
      </div>
    `;

    for (const customerId of customerIds) {
      const customer = await prisma.user.findUnique({
        where: { id: customerId },
      });

      if (!customer) continue;

      if (customer.phone) {
        const notification = await this.createNotification(
          customerId,
          'product_list',
          'whatsapp',
          productListWhatsApp
        );

        try {
          await this.sendWhatsAppMessage(customer.phone, productListWhatsApp);
          await this.updateNotificationStatus(notification.id, 'sent', new Date());
        } catch (error) {
          console.error(`Failed to send WhatsApp product list to ${customer.name}:`, error);
          await this.updateNotificationStatus(notification.id, 'failed');
        }
      }

      if (customer.email) {
        const notification = await this.createNotification(
          customerId,
          'product_list',
          'email',
          productListEmail
        );

        try {
          await this.sendEmailMessage(customer.email, 'Weekly Product List', productListEmail);
          await this.updateNotificationStatus(notification.id, 'sent', new Date());
        } catch (error) {
          console.error(`Failed to send email product list to ${customer.name}:`, error);
          await this.updateNotificationStatus(notification.id, 'failed');
        }
      }
    }
  }

  /**
   * Send Manual Payment Link
   */
  async sendPaymentLink(
    invoiceId: string,
    link: string,
    amount: number,
    method: 'whatsapp' | 'email'
  ): Promise<void> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true }
    });

    if (!invoice || !invoice.customer) {
      throw new Error('Invoice or customer not found');
    }

    const { customer } = invoice;
    const formattedAmount = Number(amount).toFixed(2);

    if (method === 'whatsapp' && customer.phone) {
      const message = `Hi ${customer.name},\n\nPlease find your payment link for Invoice #${invoice.id.substring(0, 8)} (R${formattedAmount}):\n${link}\n\nThank you for your business!`;

      const notification = await this.createNotification(
        customer.id,
        'other', // Changed from 'payment_reminder'
        'whatsapp',
        message
      );

      try {
        await this.sendWhatsAppMessage(customer.phone, message);
        await this.updateNotificationStatus(notification.id, 'sent', new Date());
      } catch (error) {
        await this.updateNotificationStatus(notification.id, 'failed');
        throw error;
      }
    } else if (method === 'email' && customer.email) {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Payment Link</h2>
          <p>Hi ${customer.name},</p>
          <p>Please find your payment link for Invoice #${invoice.id.substring(0, 8)} (R${formattedAmount}):</p>
          <div style="margin: 30px 0;">
            <a href="${link}" style="background-color: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Pay R${formattedAmount} Now</a>
          </div>
          <p>Thank you for your business!</p>
        </div>
      `;

      const notification = await this.createNotification(
        customer.id,
        'other', // Changed from 'payment_reminder'
        'email',
        htmlContent
      );

      try {
        await this.sendEmailMessage(customer.email, `Payment Link for Invoice #${invoice.id.substring(0, 8)}`, htmlContent);
        await this.updateNotificationStatus(notification.id, 'sent', new Date());
      } catch (error) {
        await this.updateNotificationStatus(notification.id, 'failed');
        throw error;
      }
    } else {
      throw new Error(`Customer does not have a ${method} contact set up.`);
    }
  }

  /**
   * Send seasonal items poll to customers
   */
  async sendSeasonalItemsPoll(customerIds: string[]): Promise<void> {
    const seasonalProducts = await prisma.product.findMany({
      where: {
        isSeasonal: true,
        isAvailable: true,
      },
      take: 12, // WhatsApp poll limit
    });

    if (seasonalProducts.length === 0) return;

    const question = 'Which of these seasonal items would you like to add to your order this week?';
    const options = seasonalProducts.map((p: any) => `${p.name} (R${Number(p.price).toFixed(2)})`);

    for (const customerId of customerIds) {
      const customer = await prisma.user.findUnique({
        where: { id: customerId },
      });

      if (!customer || !customer.phone) continue;

      try {
        await this.sendWhatsAppPoll(customer.phone, question, options);

        await this.createNotification(
          customerId,
          'product_list', // Using product_list type for poll for now
          'whatsapp',
          `Seasonal Poll: ${question}`
        );
      } catch (error) {
        console.error(`Failed to send seasonal poll to ${customer.name}:`, error);
      }
    }
  }

  /**
   * Send notification for missing/short items in an order
   */
  async sendMissingItemsNotification(orderId: string, missingItems: { productName: string; quantity: number; unit: string }[]): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order || !order.customer) {
      console.error(`Order ${orderId} not found for missing items notification`);
      return;
    }

    const customer = order.customer;
    const message = this.generateMissingItemsWhatsApp(customer.name, order.id, missingItems);

    if (customer.phone) {
      const notification = await this.createNotification(
        customer.id,
        'other',
        'whatsapp',
        message
      );

      try {
        await this.sendWhatsAppMessage(customer.phone, message);
        await this.updateNotificationStatus(notification.id, 'sent', new Date());
      } catch (error) {
        console.error(`Failed to send missing items notification to ${customer.id}:`, error);
        await this.updateNotificationStatus(notification.id, 'failed');
      }
    }
  }

  private generateMissingItemsWhatsApp(customerName: string, orderId: string, items: { productName: string; quantity: number; unit: string }[]): string {
    let message = `Hi ${customerName},\n\n`;
    message += `Regarding your order #${orderId.substring(0, 8)}:\n`;
    message += `Unfortunately, the following items are short/out of stock and have been removed from your invoice:\n\n`;

    items.forEach((item: any) => {
      message += `• ${item.productName} (${item.quantity} ${item.unit})\n`;
    });

    message += `\nYour account has been credited for these items. We apologize for the inconvenience!\n`;
    return message;
  }

  /**
   * Send reminder for incomplete/pending order
   */
  async sendOrderReminder(orderId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order || !order.customer) return;

    const message = `Hi ${order.customer.name},\n\nWe noticed your order #${order.id.substring(0, 8)} is still pending. Is there anything we can help you with to complete it?\n\nPlease let us know if you need assistance!`;

    if (order.customer.phone) {
      const notification = await this.createNotification(
        order.customerId,
        'other',
        'whatsapp',
        message
      );

      try {
        await this.sendWhatsAppMessage(order.customer.phone, message);
        await this.updateNotificationStatus(notification.id, 'sent', new Date());
      } catch (error) {
        console.error(`Failed to send order reminder to ${order.customer.id}`, error);
      }
    }
  }
  /**
   * Send a general notification to an admin
   */
  async sendAdminNotification(adminId: string, title: string, content: string): Promise<void> {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin) return;

    const message = `*${title}*\n\n${content}`;

    if (admin.phone) {
      const notification = await this.createNotification(
        admin.id,
        'other',
        'whatsapp',
        message
      );

      try {
        await this.sendWhatsAppMessage(admin.phone, message);
        await this.updateNotificationStatus(notification.id, 'sent', new Date());
      } catch (error) {
        console.error(`Failed to send admin notification to ${admin.id}:`, error);
        await this.updateNotificationStatus(notification.id, 'failed');
      }
    }
  }
}

export const notificationService = new NotificationService();
