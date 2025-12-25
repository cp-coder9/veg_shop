import cron from 'node-cron';
import { notificationService } from './notification.service.js';
import { prisma } from '../lib/prisma.js';

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
                    const customers = await prisma.user.findMany({
                        where: { role: 'customer' },
                        select: { id: true }
                    });
                    const customerIds = customers.map(c => c.id);

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
                    const uniqueCustomerIds = [...new Set(overdueInvoices.map(inv => inv.customerId))];

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

        console.log('✅ Scheduler Service initialized');
    }
}

export const schedulerService = new SchedulerService();
