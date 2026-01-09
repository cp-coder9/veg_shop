import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking for users...');

    const emails = [
        'admin@vegshop.com',
        'john@example.com',
        'packer@vegshop.com',
        'driver@vegshop.com'
    ];

    for (const email of emails) {
        const user = await prisma.user.findUnique({
            where: { email }
        });
        console.log(`User ${email}: ${user ? 'FOUND (' + user.id + ')' : 'NOT FOUND'}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
