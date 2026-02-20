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
      await item.locator('button:has-text("Pass")').click();
    }
    
    // Add notes
    await page.fill('textarea[name="notes"]', "Completed successfully");
    
    // Save draft
    await page.click('button:has-text("Save draft")');
    await expect(page.locator('text=Saved')).toBeVisible();
    
    // Upload photo (mock)
    // Note: Actual file upload would require file input handling
    
    // Submit completion
    await page.click('button:has-text("Submit completion")');
    
    // Verify success message
    await expect(page.locator('text=submitted')).toBeVisible();
    
    // Verify job status changed
    await expect(page.locator('text=Pending approval')).toBeVisible();
  });

  test("should show error for missing required photos", async ({ page }) => {
    await page.goto("/jobs");
    await page.click('a[href*="/jobs/"]:first-child');
    
    // Try to submit without photos
    await page.click('button:has-text("Submit completion")');
    
    // Should show error
    await expect(page.locator('text=photo')).toBeVisible();
  });
});
