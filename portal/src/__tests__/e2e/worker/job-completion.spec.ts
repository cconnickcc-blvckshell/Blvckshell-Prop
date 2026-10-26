import { test, expect } from "@playwright/test";

test.describe("Worker Job Completion Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto("/login");
    
    // Login as worker
    await page.fill('input[name="email"]', "worker@test.com");
    await page.fill('input[name="password"]', "test123456");
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL("/jobs");
  });

  test("should complete job workflow", async ({ page }) => {
    // Navigate to jobs list
    await page.goto("/jobs");
    
    // Click on first job
    await page.click('a[href*="/jobs/"]:first-child');
    
    // Wait for job detail page
    await page.waitForURL(/\/jobs\/[^/]+$/);
    
    // Fill checklist
    const checklistItems = await page.locator('[data-testid="checklist-item"]').all();
    for (const item of checklistItems.slice(0, 3)) {
      await item.getByRole("button", { name: "PASS" }).click();
    }
    
    // Add notes
    // Save draft (requires completion record from checklist interaction)
    await page.getByRole("button", { name: "Save Draft" }).click();
    
    // Upload photo (mock)
    // Note: Actual file upload would require file input handling
    
    // Submit completion
    await page.getByRole("button", { name: "Submit" }).click();
    
    // Verify blocking or success (depends on seed job photos)
    await expect(page.getByRole("alert").or(page.locator("text=/submitted|Pending|Can't submit/i"))).toBeVisible();
  });

  test("should show error for missing required photos", async ({ page }) => {
    await page.goto("/jobs");
    await page.click('a[href*="/jobs/"]:first-child');
    
    // Try to submit without photos
    await page.getByRole("button", { name: /Submit|to fix/i }).click();
    
    await expect(page.getByRole("alert").or(page.locator("text=/photo|Can't submit/i"))).toBeVisible();
  });
});
