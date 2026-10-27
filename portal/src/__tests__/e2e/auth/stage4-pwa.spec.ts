import { expect, test } from "@playwright/test";

test.describe("stage 4 pwa", () => {
  test("manifest is standalone and starts at the portal", async ({ request }) => {
    const response = await request.get("/site.webmanifest");
    expect(response.status()).toBe(200);
    const manifest = await response.json();
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/portal");
    expect(manifest.theme_color).toBe("#090909");
    expect(manifest.background_color).toBe("#090909");
  });

  test("viewport fits the screen and there is no submission worker", async ({ page, request }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    const content = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(content).toContain("viewport-fit=cover");
    const worker = await request.get("/sw.js");
    expect(worker.status()).toBeGreaterThanOrEqual(400);
  });
});
