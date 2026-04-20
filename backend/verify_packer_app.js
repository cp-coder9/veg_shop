import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verify() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const orders = await prisma.order.findMany({
    where: { deliveryDate: today, status: 'confirmed' },
    include: { items: { include: { product: true } } }
  });

  console.log(`CONFIRMED_ORDERS_COUNT:${orders.length}`);
  orders.forEach(o => {
    console.log(`ORDER:${o.id} STATUS:${o.status}`);
    o.items.forEach(i => console.log(`  ITEM:${i.product.name} TYPE:${i.product.packingType}`));
  });
  
  await prisma.$disconnect();
}

verify();
