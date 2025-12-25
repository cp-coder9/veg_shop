import { beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma.js';

beforeAll(async () => {
  // Setup test database if needed
});

afterAll(async () => {
  // Cleanup and disconnect
  await prisma.$disconnect();
});
