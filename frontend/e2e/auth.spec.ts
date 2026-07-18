import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
  });

  test('should show signup page', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();
    await expect(page.getByText(/i'm a freelancer/i)).toBeVisible();
    await expect(page.getByText(/i'm hiring talent/i)).toBeVisible();
    await expect(page.getByLabel('Full name')).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('should show validation errors on empty login', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /log in/i }).click();
    await expect(page.getByText('Enter a valid email address')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should navigate between login and signup', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL('/signup');

    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/login');
  });

  test('should show forgot password link', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /forgot password/i }).click();
    await expect(page).toHaveURL('/forgot-password');
  });

  test('should reject invalid login credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('nonexistent@test.com');
    await page.getByLabel('Password').fill('wrongpassword123');
    await page.getByRole('button', { name: /log in/i }).click();

    await expect(page.getByText(/invalid|not found|failed/i).or(page.getByText(/try again/i))).toBeVisible({ timeout: 10000 });
  });

  test('should show password strength indicators on signup', async ({ page }) => {
    await page.goto('/signup');
    const passwordInput = page.getByLabel('Password');

    await passwordInput.fill('Ab');
    await expect(page.getByText('At least 8 characters')).toBeVisible();
    await expect(page.getByText('Contains a number')).toBeVisible();

    await passwordInput.fill('Abcdef1');
    await expect(page.getByText('At least 8 characters')).toBeVisible();

    await passwordInput.fill('Abcdef1X');
    await expect(page.getByText('At least 8 characters'));
    await expect(page.getByText('Contains a number'));
    await expect(page.getByText('Contains an uppercase letter'));
  });

  test('should require role selection on signup', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Full name').fill('Test User');
    await page.getByLabel('Email address').fill('test@example.com');
    await page.getByLabel('Password').fill('Testpass123');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText(/select an account type/i)).toBeVisible();
  });

  test('should require password with number and uppercase', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Full name').fill('Test User');
    await page.getByLabel('Email address').fill('test@example.com');
    await page.getByLabel('Password').fill('weakpass');
    await page.getByText(/i'm a freelancer/i).click();
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText(/must contain a number/i)).toBeVisible();
    await expect(page.getByText(/must contain an uppercase letter/i)).toBeVisible();
  });
});
