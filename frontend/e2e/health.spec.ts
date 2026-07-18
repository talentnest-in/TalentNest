import { test, expect } from '@playwright/test';

test.describe('Application Health', () => {
  test('should load the app shell', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have proper page title', async ({ page }) => {
    await page.goto('/login');
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
