import { test, expect, devices } from '@playwright/test';
import { AuthPage } from './page-objects/auth-page';
import { generateTestUser } from './fixtures/test-data';

test.describe('Mobile Layout', () => {
  test.use({ ...devices['iPhone 13'] });

  test('login page renders on mobile', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await expect(auth.emailInput).toBeVisible();
    await expect(auth.submitButton).toBeVisible();
  });

  test('signup page renders on mobile', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoSignup();
    await expect(auth.nameInput).toBeVisible();
    await expect(auth.freelancerRole).toBeVisible();
  });

  test('dashboard navigation on mobile', async ({ page }) => {
    const user = generateTestUser('FREELANCER');
    const auth = new AuthPage(page);
    await auth.register(user.name, user.email, user.password, 'FREELANCER');
    if (page.url().includes('onboarding')) {
      await page.goto('/freelancer-dashboard');
    }
    await page.waitForLoadState('networkidle');
    const menuButton = page.locator('button[class*="hamburger"], [aria-label="menu"], button:has(svg.lucide-menu)');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('find jobs on mobile', async ({ page }) => {
    const user = generateTestUser('FREELANCER');
    const auth = new AuthPage(page);
    await auth.register(user.name, user.email, user.password, 'FREELANCER');
    await page.goto('/find-jobs');
    await page.waitForLoadState('networkidle');
  });
});
