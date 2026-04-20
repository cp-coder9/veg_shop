import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkOrders() {
  try {
    const count = await prisma.order.count();
    console.log(`ORDER_COUNT:${count}`);
    if (count > 0) {
      const orders = await prisma.order.findMany({
        take: 5,
        select: { id: true, status: true, deliveryDate: true }
      });
      console.log('SAMPLES:', JSON.stringify(orders));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();
