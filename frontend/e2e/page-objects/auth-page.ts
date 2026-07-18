import { Page, Locator } from '@playwright/test';

export class AuthPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly nameInput: Locator;
  readonly freelancerRole: Locator;
  readonly clientRole: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email address/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.submitButton = page.getByRole('button', { name: /log in|create account|sign up/i });
    this.nameInput = page.getByLabel(/full name/i);
    this.freelancerRole = page.getByText(/i'm a freelancer/i);
    this.clientRole = page.getByText(/i'm hiring talent/i);
  }

  async gotoLogin() {
    await this.page.goto('/login');
    await this.page.waitForSelector('h1, h2');
  }

  async gotoSignup() {
    await this.page.goto('/signup');
    await this.page.waitForSelector('h1, h2');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async register(name: string, email: string, password: string, role: 'FREELANCER' | 'CLIENT') {
    await this.gotoSignup();
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    if (role === 'FREELANCER') {
      await this.freelancerRole.click();
    } else {
      await this.clientRole.click();
    }
    await this.submitButton.click();
  }

  async expectValidationError() {
    await this.page.waitForSelector('.text-error', { timeout: 5000 });
  }

  async expectLoginFailed() {
    await this.page.waitForTimeout(2000);
    const errorText = this.page.getByText(/invalid|failed|error|not found/i);
    return errorText.isVisible();
  }

  getErrorMessage() {
    return this.page.locator('.text-error, [role="alert"], .bg-error\\/10');
  }
}
