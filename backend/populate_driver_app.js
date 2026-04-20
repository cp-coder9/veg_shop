import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function populateDriverApp() {
  console.log('🚀 Starting Driver App data population...');
  
  try {
    // 1. Find the Driver User
    const driver = await prisma.user.findUnique({
      where: { email: 'driver@vegshop.com' }
    });
    
    if (!driver) {
      console.error('❌ Driver user not found. Please seed the database first.');
      return;
    }
    console.log(`✅ Found driver: ${driver.name} (ID: ${driver.id})`);

    // 2. Get today's date at midnight UTC
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`📅 Setting delivery date to: ${today.toISOString()}`);

    // 3. Find some orders to update (non-cancelled ones)
    const orders = await prisma.order.findMany({
      where: { status: { not: 'cancelled' } },
      take: 5
    });

    if (orders.length === 0) {
      console.log('⚠️ No orders found in database to update.');
      return;
    }

    console.log(`📦 Updating ${orders.length} orders...`);

    // 4. Update orders
    for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        const newStatus = i % 2 === 0 ? 'packed' : 'out_for_delivery';
        const assignedDriverId = newStatus === 'out_for_delivery' ? driver.id : null;

        await prisma.order.update({
            where: { id: order.id },
            data: {
                deliveryDate: today,
                status: newStatus,
                driver: assignedDriverId ? { connect: { id: assignedDriverId } } : { disconnect: true }
            }
        });
        console.log(`   - Order ${order.id}: Updated to ${newStatus} (Assigned: ${assignedDriverId ? 'YES' : 'POOL'})`);
    }

    console.log('✨ Driver App population complete! You should now see these in the Driver Dashboard.');

  } catch (error) {
    console.error('❌ Error updating orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateDriverApp();
