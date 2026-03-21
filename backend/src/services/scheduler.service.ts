import cron from 'node-cron';
import { notificationService } from './notification.service.js';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { weeklyAvailabilityService } from './weekly-availability.service.js';

export class SchedulerService {
    /**
     * Initialize all scheduled tasks
     */
    init(): void {
        console.log('⏰ Initializing Scheduler Service...');

        // 1. Tuesday Product List Broadcast (Every Tuesday at 08:00)
        // 0 8 * * 2
        cron.schedule('0 8 * * 2', (): void => {
            void (async (): Promise<void> => {
                console.log('📅 Running Tuesday Product List Broadcast...');
                try {
                    let customerIds: string[] = [];
                    if (env.USE_FIREBASE) {
                        const customers = await userRepository.list([{ field: 'role', operator: '==', value: 'customer' }]);
                        customerIds = customers.map((c: any) => c.id);
                    } else {
                        const customers = await prisma.user.findMany({
                            where: { role: 'customer' },
                            select: { id: true }
                        });
                        customerIds = customers.map((c: { id: string }) => c.id);
                    }

                    if (customerIds.length > 0) {
                        await notificationService.sendProductList(customerIds);
                        await notificationService.sendSeasonalItemsPoll(customerIds);
                        console.log(`✅ Product list and seasonal poll sent to ${customerIds.length} customers`);
                    }
                } catch (error) {
                    console.error('❌ Failed to run Tuesday broadcast:', error);
                }
            })();
        });

        // 2. Weekly Payment Reminders (Every Monday at 09:00)
        // 0 9 * * 1
        cron.schedule('0 9 * * 1', (): void => {
            void (async (): Promise<void> => {
                console.log('📅 Running Weekly Payment Reminders...');
                try {
                    const overdueInvoices = await notificationService.getOverdueInvoices();
                    const uniqueCustomerIds = [...new Set(overdueInvoices.map((inv: any) => inv.customerId))];

                    for (const customerId of uniqueCustomerIds) {
                        try {
                            await notificationService.sendPaymentReminder(customerId);
                        } catch (error) {
                            console.error(`❌ Failed to send reminder to customer ${customerId}:`, error);
                        }
                    }
                    console.log(`✅ Payment reminders processed for ${uniqueCustomerIds.length} customers`);
                } catch (error) {
                    console.error('❌ Failed to process weekly payment reminders:', error);
                }
            })();
        });

        // 3. Incomplete Order Reminders (Daily at 10:00)
        // 0 10 * * *
        cron.schedule('0 10 * * *', (): void => {
            void (async (): Promise<void> => {
                console.log('📅 Running Incomplete Order Reminders...');
                try {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);

                    const dayBeforeYesterday = new Date();
                    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);

                    let pendingOrders: any[] = [];
                    if (env.USE_FIREBASE) {
                        pendingOrders = await orderRepository.list([
                            { field: 'status', operator: '==', value: 'pending' },
                            { field: 'createdAt', operator: '<', value: yesterday },
                            { field: 'createdAt', operator: '>', value: dayBeforeYesterday }
                        ]);
                    } else {
                        // Find pending orders created between 24h and 48h ago
                        pendingOrders = await prisma.order.findMany({
                            where: {
                                status: 'pending',
                                createdAt: {
                                    lt: yesterday,
                                    gt: dayBeforeYesterday,
                                },
                            },
                        });
                    }

                    for (const order of pendingOrders as any[]) {
                        try {
                            await notificationService.sendOrderReminder(order.id);
                        } catch (error) {
                            console.error(`❌ Failed to send reminder for order ${order.id}:`, error);
                        }
                    }
                    console.log(`✅ Sent reminders for ${pendingOrders.length} incomplete orders`);
                } catch (error) {
                    console.error('❌ Failed to process incomplete order reminders:', error);
                }
            })();
        });

        // 4. Weekly Availability Prep (Every Sunday at 20:00)
        // 0 20 * * 0
        cron.schedule('0 20 * * 0', (): void => {
            void (async (): Promise<void> => {
                console.log('📅 Running Weekly Availability Prep...');
                try {
                    // Calculate next Monday
                    const nextMonday = new Date();
                    nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7));
                    nextMonday.setHours(0, 0, 0, 0);

                    // Auto-generate availability records for the week
                    await weeklyAvailabilityService.getWeekAvailability(nextMonday);

                    // Send notification to admins
                    const admins = await prisma.user.findMany({ where: { role: 'admin' } });
                    for (const admin of admins) {
                        try {
                            await notificationService.sendAdminNotification(
                                admin.id,
                                'Availability List Ready',
                                `The availability list for week of ${nextMonday.toLocaleDateString()} has been generated. Please review and confirm it before Monday morning.`
                            );
                        } catch (e) {
                            console.error(`Failed to notify admin ${admin.id}:`, e);
                        }
                    }
                    console.log(`✅ Weekly availability prepped for ${nextMonday.toDateString()}`);
                } catch (error) {
                    console.error('❌ Failed to prep weekly availability:', error);
                }
            })();
        });

        console.log('✅ Scheduler Service initialized');
    }
}

export const schedulerService = new SchedulerService();
