import { afterAll, beforeAll, vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'mysql://test_user:test_password@127.0.0.1:3306/veg_shop_test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-secret-key-test-secret-key-32chars';
process.env.JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
process.env.JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
process.env.USE_FIREBASE = process.env.USE_FIREBASE || 'false';

beforeAll(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-10-01T00:00:00.000Z'));
});

afterAll(async () => {
  vi.useRealTimers();
});
