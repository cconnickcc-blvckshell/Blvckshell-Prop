import { expect, test, type Browser, type BrowserContext } from "@playwright/test";
import {
  closeStage0Database,
  loginRequest,
  PRIVATE_JOB_ID,
  seedStage0Users,
  VIEWPORTS,
  type Stage0Role,
} from "./fixtures";

const ROLES: Stage0Role[] = ["ADMIN", "FOUNDER", "CLIENT", "INTERNAL_WORKER", "VENDOR_WORKER", "VENDOR_OWNER"];

const ALLOWED: Record<Stage0Role, string[]> = {
  ADMIN: ["/admin/jobs", "/account/password"],
  FOUNDER: ["/admin/jobs", "/account/password"],
  CLIENT: ["/client", "/account/password"],
  INTERNAL_WORKER: ["/jobs", "/account/password"],
  VENDOR_WORKER: ["/jobs", "/account/password"],
  VENDOR_OWNER: ["/jobs", "/vendor/jobs", "/account/password"],
};

const DENIED: Record<Stage0Role, string[]> = {
  ADMIN: ["/client", "/jobs", "/vendor/jobs"],
  FOUNDER: ["/client", "/jobs", "/vendor/jobs"],
  CLIENT: ["/admin/jobs", "/jobs", "/vendor/jobs"],
  INTERNAL_WORKER: ["/admin/jobs", "/client", "/vendor/jobs"],
  VENDOR_WORKER: ["/admin/jobs", "/client", "/vendor/jobs"],
  VENDOR_OWNER: ["/admin/jobs", "/client"],
};

type StorageState = Awaited<ReturnType<Awaited<ReturnType<typeof loginRequest>>["storageState"]>>;
const sessions = new Map<Stage0Role, StorageState>();

test.describe("role access", () => {
  test.beforeAll(async () => {
    await seedStage0Users();
    const index = process.env.TEST_PARALLEL_INDEX ?? "0";
    for (const role of ROLES) {
      const api = await loginRequest(role, `stage0-session-${index}-${role}`);
      sessions.set(role, await api.storageState());
      await api.dispose();
    }
  });

  test.afterAll(async () => {
    await closeStage0Database();
  });

  test("anonymous admin and evidence requests stay signed out", async ({ request }) => {
    const admin = await request.get("/admin/jobs", { maxRedirects: 0 });
    expect(admin.status()).toBe(303);
    const location = admin.headers().location ?? "";
    expect(location).toContain("/login");
    expect(location).toContain("callbackUrl=");
    expect(location).not.toContain("password=");

    const evidence = await request.get(`/api/jobs/${PRIVATE_JOB_ID}/evidence`, { maxRedirects: 0 });
    expect(evidence.status()).toBe(401);
  });

  for (const viewport of VIEWPORTS) {
    for (const role of ROLES) {
      test(`${role} at ${viewport.name}`, async ({ browser }) => {
        test.setTimeout(90_000);
        const state = sessions.get(role);
        expect(state).toBeTruthy();
        const context = await browser.newContext({
          storageState: state,
          viewport: { width: viewport.width, height: viewport.height },
        });
        const page = await context.newPage();

        for (const path of ALLOWED[role]) {
          const response = await page.goto(path);
          expect(response?.status(), `${role} ${path}`).toBeLessThan(400);
          const pathname = new URL(page.url()).pathname;
          expect(pathname === path || pathname.startsWith(`${path}/`), `${role} stayed on ${path} but was ${pathname}`).toBe(
            true,
          );
        }
        for (const path of DENIED[role]) {
          await page.goto(path);
          expect(new URL(page.url()).pathname, `${role} denied ${path}`).toBe("/");
        }

        if (viewport.name === "390x844") {
          const evidence = await page.request.get(`/api/jobs/${PRIVATE_JOB_ID}/evidence`);
          if (role === "ADMIN" || role === "FOUNDER") {
            expect(evidence.status()).toBe(200);
          } else {
            expect(evidence.status()).toBe(403);
          }
          if (role === "ADMIN") {
            await page.goto("/admin/jobs");
            await page.screenshot({
              path: "/opt/cursor/artifacts/stage0/after-admin-390x844.png",
              fullPage: false,
            });
          }
        }

        await context.close();
      });
    }
  }

  test("sign-out is a POST and ends the session", async ({ browser }) => {
    const context = await browser.newContext({
      storageState: sessions.get("ADMIN"),
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    await page.goto("/admin/jobs");
    const form = page.locator("form[data-auth-form='logout']").first();
    await expect(form).toHaveAttribute("method", "post");
    await expect(form).toHaveAttribute("action", "/api/auth/logout");
    await page.screenshot({ path: "/opt/cursor/artifacts/stage0/after-admin-1280x800.png" });
    await form.locator("button").click();
    await page.waitForURL((url) => url.pathname === "/");
    await page.goto("/admin/jobs");
    expect(new URL(page.url()).pathname).toBe("/login");
    await context.close();
  });

  for (const viewport of VIEWPORTS) {
    test(`no-js change-password at ${viewport.name}`, async ({ browser }) => {
      await assertChangePassword(browser, viewport);
    });
  }
});

async function assertChangePassword(browser: Browser, viewport: { name: string; width: number; height: number }) {
  const context: BrowserContext = await browser.newContext({
    storageState: sessions.get("ADMIN"),
    javaScriptEnabled: false,
    viewport: { width: viewport.width, height: viewport.height },
  });
  const page = await context.newPage();
  await page.goto("/account/password");
  await page.locator("input[name='currentPassword']").fill("Wrong-Current-1");
  await page.locator("input[name='password']").fill("NewSecret-Change-1");
  await page.locator("form[data-auth-form='change'] button[type='submit']").click();
  await page.waitForLoadState("load");
  const url = page.url().toLowerCase();
  expect(url).not.toContain("wrong-current-1");
  expect(url).not.toContain("newsecret-change-1");
  expect(url).not.toContain("password=");
  expect(url).toContain("error=incorrect");
  await context.close();
}
