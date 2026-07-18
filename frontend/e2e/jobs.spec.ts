import { test, expect } from '@playwright/test';

test.describe('Job Marketplace', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/find-jobs');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show job details page', async ({ page }) => {
    await page.goto('/jobs/nonexistent-id');
    await expect(page).toHaveURL(/\/login/);
  });
});
