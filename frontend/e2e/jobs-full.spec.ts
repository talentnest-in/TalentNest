import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth-page';
import { JobsPage } from './page-objects/jobs-page';
import { generateTestUser, generateTestJob } from './fixtures/test-data';

test.describe('Full Jobs Flow', () => {
  let authPage: AuthPage;
  let jobsPage: JobsPage;
  let clientToken: string;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    jobsPage = new JobsPage(page);
  });

  test('redirect unauthenticated to login', async ({ page }) => {
    await jobsPage.gotoFindJobs();
    await expect(page).toHaveURL(/\/login/);
  });

  test('freelancer can browse jobs', async ({ page }) => {
    const user = generateTestUser('FREELANCER');
    await authPage.register(user.name, user.email, user.password, 'FREELANCER');

    if (page.url().includes('onboarding')) {
      await page.goto('/find-jobs');
    }

    await page.waitForURL(/\/find-jobs|\/freelancer-dashboard/, { timeout: 10000 });
    await jobsPage.gotoFindJobs();
    await page.waitForLoadState('networkidle');
  });

  test('client can create a job', async ({ page }) => {
    const user = generateTestUser('CLIENT');
    await authPage.register(user.name, user.email, user.password, 'CLIENT');

    if (page.url().includes('onboarding')) {
      await page.goto('/client/jobs');
    }

    const job = generateTestJob();
    await jobsPage.createJob({
      title: job.title,
      description: job.description,
      type: job.type,
      budget: job.budget,
    });

    await expect(page.getByText(job.title).or(page.getByText(/job created|success/i))).toBeVisible({ timeout: 10000 });
  });

  test('client can view their jobs', async ({ page }) => {
    const user = generateTestUser('CLIENT');
    await authPage.register(user.name, user.email, user.password, 'CLIENT');
    await jobsPage.gotoMyJobs();
    await page.waitForLoadState('networkidle');
  });

  test('search jobs by keyword', async ({ page }) => {
    const user = generateTestUser('FREELANCER');
    await authPage.register(user.name, user.email, user.password, 'FREELANCER');
    await jobsPage.gotoFindJobs();
    await jobsPage.searchJobs('React');
    await page.waitForTimeout(1000);
  });

  test('view job details', async ({ page }) => {
    const user = generateTestUser('FREELANCER');
    await authPage.register(user.name, user.email, user.password, 'FREELANCER');
    await jobsPage.gotoFindJobs();
    await page.waitForTimeout(1000);

    const jobCards = page.locator('[class*="rounded-2xl"]');
    const count = await jobCards.count();
    if (count > 0) {
      await jobsPage.openJobDetails(0);
      await page.waitForLoadState('networkidle');
    }
  });

  test('view applications page', async ({ page }) => {
    const user = generateTestUser('FREELANCER');
    await authPage.register(user.name, user.email, user.password, 'FREELANCER');
    await jobsPage.gotoApplications();
    await page.waitForLoadState('networkidle');
  });
});
