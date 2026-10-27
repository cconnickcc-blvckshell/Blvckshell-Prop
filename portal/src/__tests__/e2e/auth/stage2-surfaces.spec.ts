import { mkdirSync } from "fs";
import path from "path";
import { expect, test, type Page } from "@playwright/test";
import {
  closeStage0Database,
  loginRequest,
  seedStage1Surfaces,
  STAGE1_INVOICE_NUMBER,
  STAGE1_WORKER_JOB_ID,
} from "./fixtures";

const SHOTS = "/opt/cursor/artifacts/stage2";

async function expectNoHorizontalScroll(page: Page) {
  const widths = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(widths.scrollWidth).toBeLessThanOrEqual(widths.clientWidth + 1);
}

test.describe("stage 2 responsive surfaces", () => {
  test.beforeAll(async () => {
    mkdirSync(SHOTS, { recursive: true });
    await seedStage1Surfaces();
  });

  test.afterAll(async () => {
    await closeStage0Database();
  });

  test("worker checklist and photos sit side by side on a wide tablet", async ({ browser }) => {
    const api = await loginRequest("INTERNAL_WORKER", "stage2-worker-wide");
    const context = await browser.newContext({
      storageState: await api.storageState(),
      viewport: { width: 1180, height: 820 },
    });
    await api.dispose();
    const page = await context.newPage();
    await page.goto(`/jobs/${STAGE1_WORKER_JOB_ID}`);
    const checklist = page.getByRole("heading", { name: "Checklist" });
    const photos = page.getByRole("heading", { name: "Photo Evidence" });
    await expect(checklist).toBeVisible();
    await expect(photos).toBeVisible();
    const checklistBox = await checklist.boundingBox();
    const photosBox = await photos.boundingBox();
    expect(checklistBox && photosBox).toBeTruthy();
    expect(photosBox!.x).toBeGreaterThan(checklistBox!.x + 200);
    expect(Math.abs(photosBox!.y - checklistBox!.y)).toBeLessThan(80);
    await page.screenshot({ path: path.join(SHOTS, "after-worker-cockpit-1180x820.png"), fullPage: false });
    await context.close();
  });

  test("worker checklist stacks above photos on a phone", async ({ browser }) => {
    const api = await loginRequest("INTERNAL_WORKER", "stage2-worker-phone");
    const context = await browser.newContext({
      storageState: await api.storageState(),
      viewport: { width: 390, height: 844 },
    });
    await api.dispose();
    const page = await context.newPage();
    await page.goto(`/jobs/${STAGE1_WORKER_JOB_ID}`);
    const checklist = page.getByRole("heading", { name: "Checklist" });
    const photos = page.getByRole("heading", { name: "Photo Evidence" });
    const checklistBox = await checklist.boundingBox();
    const photosBox = await photos.boundingBox();
    expect(checklistBox && photosBox).toBeTruthy();
    expect(photosBox!.y).toBeGreaterThan(checklistBox!.y + 40);
    const all = page.getByRole("link", { name: "Jobs" });
    await page.goto("/jobs");
    const week = page.getByRole("button", { name: "All" });
    const weekBox = await week.boundingBox();
    expect(weekBox && weekBox.height).toBeGreaterThanOrEqual(44);
    expect(all).toBeTruthy();
    await page.screenshot({ path: path.join(SHOTS, "after-worker-jobs-390x844.png"), fullPage: false });
    await context.close();
  });

  test("schedule calendar link is a 44px target", async ({ browser }) => {
    const api = await loginRequest("INTERNAL_WORKER", "stage2-worker-schedule");
    const context = await browser.newContext({
      storageState: await api.storageState(),
      viewport: { width: 360, height: 740 },
    });
    await api.dispose();
    const page = await context.newPage();
    await page.goto("/schedule");
    const ical = page.getByRole("link", { name: "Add to calendar (iCal)" });
    const box = await ical.boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(44);
    await expectNoHorizontalScroll(page);
    await context.close();
  });

  test("admin phone lists are records, not wide tables", async ({ browser }) => {
    const api = await loginRequest("ADMIN", "stage2-admin-phone");
    const context = await browser.newContext({
      storageState: await api.storageState(),
      viewport: { width: 360, height: 740 },
    });
    await api.dispose();
    const page = await context.newPage();
    for (const pathName of ["/admin/incidents", "/admin/workorders", "/admin/payroll", "/admin/audit", "/admin/leads", "/admin/invoices"]) {
      await page.goto(pathName);
      await expectNoHorizontalScroll(page);
      await expect(page.locator("[data-record-list]")).toBeVisible();
      await expect(page.getByRole("table")).toBeHidden();
    }
    await expect(page.getByRole("link", { name: new RegExp(STAGE1_INVOICE_NUMBER) })).toBeVisible();
    await page.screenshot({ path: path.join(SHOTS, "after-admin-invoices-360x740.png"), fullPage: false });
    await context.close();
  });

  test("founder sees the job cockpit without a horizontal scroll", async ({ browser }) => {
    const api = await loginRequest("FOUNDER", "stage2-founder-job");
    const context = await browser.newContext({
      storageState: await api.storageState(),
      viewport: { width: 1180, height: 820 },
    });
    await api.dispose();
    const page = await context.newPage();
    const response = await page.goto(`/admin/jobs/${STAGE1_WORKER_JOB_ID}`);
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { name: "Stage 1 Site" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Duplicate" })).toBeVisible();
    const duplicate = await page.getByRole("link", { name: "Duplicate" }).boundingBox();
    expect(duplicate && duplicate.height).toBeGreaterThanOrEqual(44);
    await expectNoHorizontalScroll(page);
    await page.screenshot({ path: path.join(SHOTS, "after-founder-job-1180x820.png"), fullPage: false });
    await context.close();
  });

  test("vendor owner jobs page still opens", async ({ browser }) => {
    const api = await loginRequest("VENDOR_OWNER", "stage2-vendor-smoke");
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
