
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('Seeding admin user...');
    const user = await prisma.user.upsert({
        where: { email: 'admin@vegshop.com' },
        update: {
            role: 'admin',
            name: 'Admin User'
        },
        create: {
            email: 'admin@vegshop.com',
            name: 'Admin User',
            role: 'admin',
            phone: '+27000000000', // Dummy phone
            address: 'Admin HQ'
        }
    });
    console.log('Admin user seeded:', user);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
