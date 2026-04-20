import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function populatePackerApp() {
  console.log('🚀 Starting Packer App data population...');
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Update some products to the new packing types
    const products = await prisma.product.findMany({ take: 10 });
    console.log(`Updating ${products.length} products...`);
    
    const packingTypes = ['ambient', 'cold', 'frozen', 'loose'];
    
    for (let i = 0; i < products.length; i++) {
        await prisma.product.update({
            where: { id: products[i].id },
            data: { 
                packingType: packingTypes[i % packingTypes.length],
                isAvailable: true
            }
        });
    }

    // 2. Find or create orders for today and set to 'confirmed'
    // Let's take any existing pending/confirmed orders and move them to today
    const orders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
    });

    console.log(`Setting ${orders.length} orders to 'confirmed' status for today...`);

    for (const order of orders) {
        await prisma.order.update({
            where: { id: order.id },
            data: {
                status: 'confirmed',
                deliveryDate: today
            }
        });
    }

    console.log('✅ Success! The Packer App should now show orders with various packing types.');

  } catch (error) {
    console.error('❌ Error populating packer app:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populatePackerApp();
