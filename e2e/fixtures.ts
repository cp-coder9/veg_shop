import { test as base, expect, type Page } from '@playwright/test';

type UserRole = 'customer' | 'admin' | 'driver' | 'packer';

const TEST_USERS: Record<UserRole, string> = {
  customer: 'john@example.com',
  admin: 'admin@vegshop.com',
  driver: 'driver@vegshop.com',
  packer: 'packer@vegshop.com',
};

async function authenticatePage(page: Page, role: UserRole) {
  const email = TEST_USERS[role];
  const response = await page.request.post('http://localhost:5174/api/auth/dev-login', {
    data: { email },
  });

  if (!response.ok()) {
    throw new Error(`Dev login failed for ${role}: ${await response.text()}`);
  }

  const { accessToken, refreshToken } = await response.json();

  await page.goto('/login');
  await page.evaluate(
    ({ accessToken, refreshToken }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    },
    { accessToken, refreshToken }
  );

  await page.reload();
}

export const test = base.extend<{
  customerPage: Page;
  adminPage: Page;
  driverPage: Page;
  packerPage: Page;
}>({
  customerPage: async ({ page }, use) => {
    await authenticatePage(page, 'customer');
    await use(page);
  },
  adminPage: async ({ page }, use) => {
    await authenticatePage(page, 'admin');
    await use(page);
  },
  driverPage: async ({ page }, use) => {
    await authenticatePage(page, 'driver');
    await use(page);
  },
  packerPage: async ({ page }, use) => {
    await authenticatePage(page, 'packer');
    await use(page);
  },
});

export { expect };
