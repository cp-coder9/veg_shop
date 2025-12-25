import axios from 'axios';
import { prisma } from '../lib/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';

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

interface ProductInfo {
  id: string;
  name: string;
  price: number | string | Decimal;
  unit: string;
  category: string;
  isSeasonal: boolean;
}

interface Notification {
  id: string;
  customerId: string;
  type: string;
  method: string;
  content: string;
  status: string;
  sentAt: Date | null;
  createdAt: Date;
}

export class NotificationService {
  /**
   * Create a notification record in the database
   */
  async createNotification(
    customerId: string,
    type: 'order_confirmation' | 'payment_reminder' | 'product_list',
    method: 'whatsapp' | 'email',
    content: string
  ): Promise<Notification> {
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

  /**
   * Update notification status
   */
  async updateNotificationStatus(
    notificationId: string,
    status: 'pending' | 'sent' | 'failed',
    sentAt?: Date
  ): Promise<void> {
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status,
        sentAt: sentAt || (status === 'sent' ? new Date() : null),
      },
    });
  }

  /**
   * Get pending notifications for processing
   */
  async getPendingNotifications(): Promise<Notification[]> {
    return await prisma.notification.findMany({
      where: {
        status: 'pending',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Process notification queue - send all pending notifications
   */
  async processNotificationQueue(): Promise<void> {
    const pendingNotifications = await this.getPendingNotifications();

    for (const notification of pendingNotifications) {
      try {
        const customer = await prisma.user.findUnique({
          where: { id: notification.customerId },
        });

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
   * Send email message with retry logic
   */
  async sendEmailMessage(email: string, subject: string, htmlContent: string, retries = 3): Promise<void> {
    if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
      console.warn('[DEV MODE] SendGrid API not configured, skipping email send');
      console.log(`[DEV MODE] Would send email to ${email} with subject: ${subject}`);
      return;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await axios.post(
          'https://api.sendgrid.com/v3/mail/send',
          {
            personalizations: [
              {
                to: [{ email }],
                subject,
              },
            ],
            from: {
              email: SENDGRID_FROM_EMAIL,
            },
            content: [
              {
                type: 'text/html',
                value: htmlContent,
              },
            ],
          },
          {
            headers: {
              'Authorization': `Bearer ${SENDGRID_API_KEY}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );
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

    throw new Error(`Failed to send email after ${retries} attempts: ${lastError?.message}`);
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
  async getOverdueInvoices(): Promise<OverdueInvoice[]> {
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

    return invoices as OverdueInvoice[];
  }

  /**
   * Send payment reminder to a specific customer
   */
  async sendPaymentReminder(customerId: string): Promise<void> {
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Get all overdue invoices for this customer
    const overdueInvoices = (await prisma.invoice.findMany({
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

    if (overdueInvoices.length === 0) {
      return; // No overdue invoices
    }

    const totalOutstanding = overdueInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.total),
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
    }) as OrderWithDetails | null;

    if (!order) {
      throw new Error('Order not found');
    }

    const deliveryDate = new Date(order.deliveryDate).toLocaleDateString();
    const totalAmount = order.items.reduce(
      (sum, item) => sum + Number(item.priceAtOrder) * item.quantity,
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
    const products = (await prisma.product.findMany({
      where: {
        isAvailable: true,
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    })) as unknown as ProductInfo[];

    const productListWhatsApp = this.generateProductListWhatsApp(products);
    const productListEmail = this.generateProductListEmail(products);

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
   * Generate WhatsApp product list
   */
  private generateProductListWhatsApp(products: ProductInfo[]): string {
    let message = `🌱 *Weekly Product List* 🌱\n\n`;

    const categories = [
      { key: 'vegetables', name: '🥕 Vegetables' },
      { key: 'fruits', name: '🍎 Fruits' },
      { key: 'dairy_eggs', name: '🥛 Dairy & Eggs' },
      { key: 'bread_bakery', name: '🍞 Bread & Bakery' },
      { key: 'pantry', name: '🥫 Pantry Items' },
      { key: 'meat_protein', name: '🥩 Meat & Protein' },
    ];

    categories.forEach((category) => {
      const categoryProducts = products.filter((p) => p.category === category.key);
      if (categoryProducts.length > 0) {
        message += `*${category.name}*\n`;
        categoryProducts.forEach((product) => {
          const seasonal = product.isSeasonal ? ' 🌟' : '';
          message += `• ${product.name} - R${Number(product.price).toFixed(2)}/${product.unit}${seasonal}\n`;
        });
        message += `\n`;
      }
    });

    message += `🌟 = Seasonal item\n\n`;
    message += `Place your order by Friday for next week's delivery!`;

    return message;
  }

  /**
   * Generate email product list
   */
  private generateProductListEmail(products: ProductInfo[]): string {
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4CAF50;">🌱 Weekly Product List 🌱</h2>
        <p>Here are this week's available products:</p>
    `;

    const categories = [
      { key: 'vegetables', name: '🥕 Vegetables' },
      { key: 'fruits', name: '🍎 Fruits' },
      { key: 'dairy_eggs', name: '🥛 Dairy & Eggs' },
      { key: 'bread_bakery', name: '🍞 Bread & Bakery' },
      { key: 'pantry', name: '🥫 Pantry Items' },
      { key: 'meat_protein', name: '🥩 Meat & Protein' },
    ];

    categories.forEach((category) => {
      const categoryProducts = products.filter((p) => p.category === category.key);
      if (categoryProducts.length > 0) {
        html += `
          <h3 style="color: #333; margin-top: 20px;">${category.name}</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Product</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Price</th>
              </tr>
            </thead>
            <tbody>
        `;

        categoryProducts.forEach((product) => {
          const seasonal = product.isSeasonal ? ' <span style="color: #ffc107;">🌟</span>' : '';
          html += `
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">${product.name}${seasonal}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">R${Number(product.price).toFixed(2)}/${product.unit}</td>
            </tr>
          `;
        });

        html += `
            </tbody>
          </table>
        `;
      }
    });

    html += `
        <p style="margin-top: 20px;"><span style="color: #ffc107;">🌟</span> = Seasonal item</p>
        <p style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; border-left: 4px solid #4CAF50;">
          <strong>Place your order by Friday for next week's delivery!</strong>
        </p>
      </div>
    `;

    return html;
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
    const options = seasonalProducts.map(p => `${p.name} (R${Number(p.price).toFixed(2)})`);

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
}

export const notificationService = new NotificationService();
