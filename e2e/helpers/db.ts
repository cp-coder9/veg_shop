// Import from the backend's generated Prisma client to ensure compatibility
// with the workspace layout where the client is generated in backend/node_modules.
import { PrismaClient } from '../../backend/node_modules/.prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./backend/prisma/dev.db',
    },
  },
});

export async function cleanupOrders() {
  await prisma.$transaction([
    prisma.payment.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.credit.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.verificationCode.deleteMany(),
    prisma.auditLog.deleteMany(),
  ]);
}

export { prisma };
