import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('nav, aside, [class*="sidebar"]');
    this.logoutButton = page.getByRole('button', { name: /logout|sign out/i });
  }

  async waitForDashboard() {
    await this.page.waitForURL(/\/(freelancer|client)-dashboard|\/admin/, { timeout: 15000 });
  }

  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async logout() {
    await this.logoutButton.click();
    await this.page.waitForURL(/\/login/, { timeout: 10000 });
  }

  async isOnDashboard(): Promise<boolean> {
    return this.page.url().includes('dashboard');
  }

  getNavLink(label: string) {
    return this.page.getByRole('link', { name: new RegExp(label, 'i') });
  }
}
