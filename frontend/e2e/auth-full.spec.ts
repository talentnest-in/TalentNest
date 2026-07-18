import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth-page';
import { DashboardPage } from './page-objects/dashboard-page';
import { generateTestUser } from './fixtures/test-data';

test.describe('Full Auth Flow', () => {
  let authPage: AuthPage;
  let dashboard: DashboardPage;

  test.beforeEach(({ page }) => {
    authPage = new AuthPage(page);
    dashboard = new DashboardPage(page);
  });

  test('register freelancer', async ({ page }) => {
    const user = generateTestUser('FREELANCER');
    await authPage.register(user.name, user.email, user.password, 'FREELANCER');
    await expect(page).toHaveURL(/\/onboarding|\/freelancer-dashboard/, { timeout: 10000 });
  });

  test('register client', async ({ page }) => {
    const user = generateTestUser('CLIENT');
    await authPage.register(user.name, user.email, user.password, 'CLIENT');
    await expect(page).toHaveURL(/\/onboarding|\/client-dashboard/, { timeout: 10000 });
  });

  test('login with valid credentials', async ({ page }) => {
    const user = generateTestUser('FREELANCER');
    await authPage.register(user.name, user.email, user.password, 'FREELANCER');

    await authPage.gotoLogin();
    await authPage.login(user.email, user.password);
    await expect(page).toHaveURL(/\/onboarding|\/freelancer-dashboard/, { timeout: 10000 });
  });

  test('reject invalid login', async ({ page }) => {
    await authPage.gotoLogin();
    await authPage.login('nonexistent@test.com', 'wrongpassword123');
    const failed = await authPage.expectLoginFailed();
    expect(failed).toBe(true);
  });

  test('show validation errors on empty login', async ({ page }) => {
    await authPage.gotoLogin();
    await authPage.submitButton.click();
    await authPage.expectValidationError();
  });

  test('navigate between login and signup', async ({ page }) => {
    await authPage.gotoLogin();
    await page.getByText(/sign up/i).click();
    await expect(page).toHaveURL('/signup');
    await page.getByText(/sign in/i).click();
    await expect(page).toHaveURL('/login');
  });

  test('show forgot password page', async ({ page }) => {
    await authPage.gotoLogin();
    await page.getByText(/forgot password/i).click();
    await expect(page).toHaveURL('/forgot-password');
    await expect(page.getByRole('heading', /reset|forgot/i)).toBeVisible();
  });

  test('require password with number and uppercase on signup', async ({ page }) => {
    await authPage.gotoSignup();
    await authPage.nameInput.fill('Test User');
    await authPage.emailInput.fill('test@example.com');
    await authPage.passwordInput.fill('weakpass');
    await authPage.freelancerRole.click();
    await authPage.submitButton.click();
    await expect(page.getByText(/must contain a number/i)).toBeVisible();
    await expect(page.getByText(/must contain an uppercase letter/i)).toBeVisible();
  });

  test('complete logout flow', async ({ page }) => {
    const user = generateTestUser('FREELANCER');
    await authPage.register(user.name, user.email, user.password, 'FREELANCER');
    await expect(page).toHaveURL(/\/onboarding|\/freelancer-dashboard/, { timeout: 10000 });

    if (page.url().includes('onboarding')) {
      await page.goto('/freelancer-dashboard');
    }

    await dashboard.logout();
    await expect(page).toHaveURL('/login');
  });
});
