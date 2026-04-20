import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
  try {
    const products = await prisma.product.findMany();
    console.log(`Checking ${products.length} products...`);
    
    const validTypes = ['ambient', 'cold', 'frozen', 'loose'];
    let fixedCount = 0;
    
    for (const product of products) {
        if (!validTypes.includes(product.packingType)) {
            await prisma.product.update({
                where: { id: product.id },
                data: { packingType: 'ambient' }
            });
            fixedCount++;
        }
    }
    
    console.log(`✅ Fixed ${fixedCount} products to 'ambient'.`);
  } catch (error) {
    console.error('❌ Error fixing products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
