import { test, expect } from "@playwright/test";

test.describe("Admin Invoice Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@test.com");
    await page.fill('input[name="password"]', "test123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("/admin/jobs");
  });

  test("should create and manage invoice", async ({ page }) => {
    // Navigate to invoices
    await page.click('a[href="/admin/invoices"]');
    await page.waitForURL("/admin/invoices");

    // Create new invoice
    await page.click('a[href="/admin/invoices/new"]');
    await page.waitForURL("/admin/invoices/new");

    // Fill invoice form
    await page.selectOption('select[name="clientOrganizationId"]', { index: 1 });
    await page.fill('input[name="periodStart"]', "2026-01-01");
    await page.fill('input[name="periodEnd"]', "2026-01-31");
    await page.click('button:has-text("Create draft")');

    // Wait for invoice detail page
    await page.waitForURL(/\/admin\/invoices\/[^/]+$/);

    // Verify invoice created
    await expect(page.locator('text=Draft')).toBeVisible();

    // Add job to invoice
    await page.click('button:has-text("Add job")');
    await page.selectOption('select[name="jobId"]', { index: 1 });
    await page.click('button:has-text("Add")');

    // Verify job added
    await expect(page.locator('text=Job')).toBeVisible();

    // Mark invoice as sent
    await page.click('button:has-text("Mark as sent")');
    await expect(page.locator('text=Sent')).toBeVisible();

    // Generate PDF
    await page.click('a:has-text("Download PDF")');
    // PDF download should start
  });
});
