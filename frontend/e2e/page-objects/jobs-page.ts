import { Page, Locator } from '@playwright/test';

export class JobsPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly jobCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder(/search/i);
    this.jobCards = page.locator('[class*="rounded-2xl"]');
  }

  async gotoFindJobs() {
    await this.page.goto('/find-jobs');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoMyJobs() {
    await this.page.goto('/client/jobs');
    await this.page.waitForLoadState('networkidle');
  }

  async searchJobs(query: string) {
    if (await this.searchInput.isVisible()) {
      await this.searchInput.fill(query);
      await this.page.waitForTimeout(500);
    }
  }

  async openJobDetails(index: number = 0) {
    const viewLinks = this.page.getByText(/view details/i);
    await viewLinks.nth(index).click();
    await this.page.waitForLoadState('networkidle');
  }

  getJobTitle() {
    return this.page.locator('h1, h2, h3').first();
  }

  async clickApply() {
    const applyBtn = this.page.getByRole('button', { name: /apply/i });
    if (await applyBtn.isVisible()) {
      await applyBtn.click();
    }
  }

  async clickSave() {
    const saveBtn = this.page.locator('[data-testid="save-button"], button[aria-label="save"]');
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
    }
  }

  async createJob(data: { title: string; description: string; type?: string; budget?: number }) {
    await this.page.goto('/jobs/new');
    await this.page.waitForLoadState('networkidle');
    await this.page.getByLabel(/title/i).fill(data.title);
    await this.page.getByLabel(/description/i).fill(data.description);
    if (data.type) {
      await this.page.getByLabel(/type/i).selectOption(data.type);
    }
    if (data.budget) {
      await this.page.getByLabel(/budget/i).fill(String(data.budget));
    }
    await this.page.getByRole('button', { name: /create|save|post/i }).click();
    await this.page.waitForTimeout(2000);
  }

  async editJob(data: { title?: string; description?: string }) {
    const editBtn = this.page.getByRole('button', { name: /edit/i });
    if (await editBtn.isVisible()) {
      await editBtn.click();
    }
    if (data.title) {
      await this.page.getByLabel(/title/i).fill(data.title);
    }
    if (data.description) {
      await this.page.getByLabel(/description/i).fill(data.description);
    }
    await this.page.getByRole('button', { name: /save|update/i }).click();
    await this.page.waitForTimeout(2000);
  }

  async deleteJob() {
    const deleteBtn = this.page.getByRole('button', { name: /delete/i });
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      const confirmBtn = this.page.getByRole('button', { name: /confirm|delete|yes/i });
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
    }
  }

  async gotoApplications() {
    await this.page.goto('/applications');
    await this.page.waitForLoadState('networkidle');
  }
}
