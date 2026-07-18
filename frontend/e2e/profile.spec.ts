import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth-page';
import { generateTestUser } from './fixtures/test-data';

test.describe('Profile & Onboarding', () => {
  let authPage: AuthPage;

  test.beforeEach(({ page }) => {
    authPage = new AuthPage(page);
  });

  test('freelancer onboarding redirect', async ({ page }) => {
    const user = generateTestUser('FREELANCER');
    await authPage.register(user.name, user.email, user.password, 'FREELANCER');
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 });
  });

  test('client onboarding redirect', async ({ page }) => {
    const user = generateTestUser('CLIENT');
    await authPage.register(user.name, user.email, user.password, 'CLIENT');
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 });
  });

  test('view profile page', async ({ page }) => {
    const user = generateTestUser('FREELANCER');
    await authPage.register(user.name, user.email, user.password, 'FREELANCER');
    if (page.url().includes('onboarding')) {
      await page.goto('/profile');
    }
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
  });

  test('view dashboard', async ({ page }) => {
    const user = generateTestUser('FREELANCER');
    await authPage.register(user.name, user.email, user.password, 'FREELANCER');
    if (page.url().includes('onboarding')) {
      await page.goto('/freelancer-dashboard');
    }
    await page.waitForURL(/\/freelancer-dashboard/, { timeout: 10000 });
  });

  test('notifications page loads', async ({ page }) => {
    const user = generateTestUser('FREELANCER');
    await authPage.register(user.name, user.email, user.password, 'FREELANCER');
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
  });

  test('chat page redirects unauthenticated', async ({ page }) => {
    await page.goto('/communications');
    await expect(page).toHaveURL(/\/login/);
  });
});
