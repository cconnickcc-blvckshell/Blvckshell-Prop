import { mkdirSync } from "fs";
import path from "path";
import { expect, test, type Page } from "@playwright/test";
import {
  closeStage0Database,
  loginRequest,
  seedStage1Surfaces,
  STAGE1_INVOICE_NUMBER,
  STAGE1_WORKER_JOB_ID,
  VIEWPORTS,
  type Stage0Role,
} from "./fixtures";

const SHOTS = "/opt/cursor/artifacts/stage1";

async function expectNoHorizontalScroll(page: Page) {
  const widths = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(widths.scrollWidth).toBeLessThanOrEqual(widths.clientWidth + 1);
}

test.describe("stage 1 operational surfaces", () => {
  test.beforeAll(async () => {
    mkdirSync(SHOTS, { recursive: true });
    await seedStage1Surfaces();
  });

  test.afterAll(async () => {
    await closeStage0Database();
  });

  for (const viewport of VIEWPORTS) {
    test(`client records fit ${viewport.name}`, async ({ browser }) => {
      const api = await loginRequest("CLIENT", `stage1-client-${viewport.name}`);
      const context = await browser.newContext({
        storageState: await api.storageState(),
        viewport: { width: viewport.width, height: viewport.height },
      });
      await api.dispose();
      const page = await context.newPage();
      const wide = viewport.width >= 1024;

      await page.goto("/client/jobs");
      await expect(page.getByRole("heading", { name: "Job history" })).toBeVisible();
      await expectNoHorizontalScroll(page);
      if (wide) {
        await expect(page.getByRole("navigation", { name: "Client" })).toBeHidden();
        await expect(page.getByRole("link", { name: "Job history" })).toBeVisible();
        await expect(page.getByRole("table")).toBeVisible();
      } else {
        await expect(page.getByRole("navigation", { name: "Client" })).toBeVisible();
        const card = page.getByRole("link", { name: /Stage 1 Site/ }).first();
        await expect(card).toBeVisible();
        const box = await card.boundingBox();
        expect(box && box.height).toBeGreaterThanOrEqual(44);
        await expect(page.getByRole("table")).toBeHidden();
      }
      if (viewport.name === "390x844" || viewport.name === "1180x820") {
        await page.screenshot({ path: path.join(SHOTS, `after-client-jobs-${viewport.name}.png`), fullPage: false });
      }

      await page.goto("/client/invoices");
      await expectNoHorizontalScroll(page);
      if (wide) {
        await expect(page.getByRole("table")).toBeVisible();
      } else {
        const invoice = page.getByRole("link", { name: new RegExp(STAGE1_INVOICE_NUMBER) });
        await expect(invoice).toBeVisible();
        const box = await invoice.boundingBox();
        expect(box && box.height).toBeGreaterThanOrEqual(44);
      }
      if (viewport.name === "360x740") {
        await page.screenshot({ path: path.join(SHOTS, "after-client-invoices-360x740.png"), fullPage: false });
      }
      await context.close();
    });

    test(`admin menu reaches Audit at ${viewport.name}`, async ({ browser }) => {
      const api = await loginRequest("ADMIN", `stage1-admin-${viewport.name}`);
      const context = await browser.newContext({
        storageState: await api.storageState(),
        viewport: { width: viewport.width, height: viewport.height },
      });
      await api.dispose();
      const page = await context.newPage();
      await page.goto("/admin/jobs");

      if (viewport.width < 768) {
        const toggle = page.getByRole("button", { name: "Toggle menu" });
        const toggleBox = await toggle.boundingBox();
        expect(toggleBox).toBeTruthy();
        expect(toggleBox!.x).toBeGreaterThanOrEqual(0);
        expect(toggleBox!.x + toggleBox!.width).toBeLessThanOrEqual(viewport.width + 1);
        await toggle.click();
        const menu = page.locator("[data-admin-menu]");
        await expect(menu).toBeVisible();
        const audit = menu.getByRole("link", { name: "Audit" });
        await audit.scrollIntoViewIfNeeded();
        const auditBox = await audit.boundingBox();
        expect(auditBox).toBeTruthy();
        expect(auditBox!.y).toBeGreaterThanOrEqual(0);
        expect(auditBox!.y + auditBox!.height).toBeLessThanOrEqual(viewport.height + 1);
        const logout = menu.getByRole("button", { name: "Log out" });
        await logout.scrollIntoViewIfNeeded();
        const logoutBox = await logout.boundingBox();
        expect(logoutBox).toBeTruthy();
        expect(logoutBox!.y + logoutBox!.height).toBeLessThanOrEqual(viewport.height + 1);
        expect(logoutBox!.height).toBeGreaterThanOrEqual(44);
        if (viewport.name === "360x740") {
          await page.screenshot({ path: path.join(SHOTS, "after-admin-menu-360x740.png"), fullPage: false });
        }
      } else {
        await page.getByRole("button", { name: "More" }).click();
        const menu = page.locator("[data-admin-more]");
        const audit = menu.getByRole("menuitem", { name: "Audit" });
        await audit.evaluate((el) => el.scrollIntoView({ block: "nearest" }));
        await expect(audit).toBeVisible();
        const auditBox = await audit.boundingBox();
        expect(auditBox).toBeTruthy();
        expect(auditBox!.y + auditBox!.height).toBeLessThanOrEqual(viewport.height + 1);
        if (viewport.name === "1180x820") {
          await page.screenshot({ path: path.join(SHOTS, "after-admin-more-1180x820.png"), fullPage: false });
        }
      }
      await context.close();
    });

    test(`founder menu reaches Docs at ${viewport.name}`, async ({ browser }) => {
      const api = await loginRequest("FOUNDER", `stage1-founder-${viewport.name}`);
      const context = await browser.newContext({
        storageState: await api.storageState(),
        viewport: { width: viewport.width, height: viewport.height },
      });
      await api.dispose();
      const page = await context.newPage();
      await page.goto("/admin");
      if (viewport.width < 768) {
        await page.getByRole("button", { name: "Toggle menu" }).click();
        const docs = page.locator("[data-admin-menu]").getByRole("link", { name: "Docs" });
        await docs.scrollIntoViewIfNeeded();
        const box = await docs.boundingBox();
        expect(box).toBeTruthy();
        expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
      } else {
        await page.getByRole("button", { name: "More" }).click();
        const docs = page.locator("[data-admin-more]").getByRole("menuitem", { name: "Docs" });
        await docs.evaluate((el) => el.scrollIntoView({ block: "nearest" }));
        await expect(docs).toBeVisible();
      }
      await context.close();
    });

    test(`worker submit bar clears the tab bar at ${viewport.name}`, async ({ browser }) => {
      const api = await loginRequest("INTERNAL_WORKER", `stage1-worker-${viewport.name}`);
      const context = await browser.newContext({
        storageState: await api.storageState(),
        viewport: { width: viewport.width, height: viewport.height },
      });
      await api.dispose();
      const page = await context.newPage();
      const response = await page.goto(`/jobs/${STAGE1_WORKER_JOB_ID}`);
      expect(response?.status()).toBeLessThan(400);
      await expect(page.getByRole("heading", { name: "Stage 1 Site" })).toBeVisible();

      const bar = page.locator("[data-worker-action-bar]");
      const barBox = await bar.boundingBox();
      expect(barBox).toBeTruthy();
      const tabTop = viewport.height - 64;
      expect(barBox!.y).toBeGreaterThanOrEqual(0);
      expect(barBox!.y + barBox!.height).toBeLessThanOrEqual(tabTop + 1);
      expect(barBox!.height).toBeGreaterThanOrEqual(44);

      const phone = page.getByRole("link", { name: "Contact admin" });
      const phoneBox = await phone.boundingBox();
      expect(phoneBox).toBeTruthy();
      expect(phoneBox!.height).toBeGreaterThanOrEqual(44);
      expect(phoneBox!.y + phoneBox!.height).toBeLessThanOrEqual(barBox!.y);

      const save = bar.getByRole("button", { name: "Save Draft" });
      const saveBox = await save.boundingBox();
      expect(saveBox && saveBox.height).toBeGreaterThanOrEqual(44);

      if (viewport.name === "390x844" || viewport.name === "820x1180") {
        await page.screenshot({ path: path.join(SHOTS, `after-worker-job-${viewport.name}.png`), fullPage: false });
      }
      await context.close();
    });
  }

  test("vendor owner still opens the vendor jobs page", async ({ browser }) => {
    const role: Stage0Role = "VENDOR_OWNER";
    const api = await loginRequest(role, "stage1-vendor-owner-smoke");
    const context = await browser.newContext({
      storageState: await api.storageState(),
      viewport: { width: 390, height: 844 },
    });
    await api.dispose();
    const page = await context.newPage();
    const response = await page.goto("/vendor/jobs");
    expect(response?.status()).toBeLessThan(400);
    expect(new URL(page.url()).pathname).toBe("/vendor/jobs");
    await context.close();
  });
});
