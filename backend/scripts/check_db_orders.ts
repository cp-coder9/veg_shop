
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('Checking orders in database...');
    const orders = await prisma.order.findMany({
        include: {
            items: true,
            invoice: true
        }
    });

    console.log(`Found ${orders.length} orders.`);
    orders.forEach(o => {
        console.log(`Order: ${o.id}`);
        console.log(`  CreatedAt: ${o.createdAt} (${typeof o.createdAt})`);
        console.log(`  Status: ${o.status}`);
        console.log(`  Items: ${o.items.length}`);
        console.log(`  Invoice: ${o.invoice ? o.invoice.id : 'NONE'}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
