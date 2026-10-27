import fs from "fs";
import { expect, test, type Page } from "@playwright/test";
import { BASE_URL, FIXTURE_PASSWORD, VIEWPORTS, roleEmail } from "./fixtures";

const ARTIFACTS = "/opt/cursor/artifacts/stage0";
const PASSWORD = "NotARealPassword-1";
const PRE_PASSWORD = "PreHydrationSecret-1";
const RESET_TOKEN = "abcdefghijklmnopqrstuvwxyz012345";

function assertNoSecret(url: string, secret: string) {
  const lower = url.toLowerCase();
  expect(lower).not.toContain(secret.toLowerCase());
  expect(lower).not.toContain("password=");
  expect(lower).not.toContain("currentpassword=");
  expect(url.startsWith(BASE_URL)).toBe(true);
}

async function noteUrl(name: string, url: string) {
  await fs.promises.mkdir(ARTIFACTS, { recursive: true });
  await fs.promises.writeFile(`${ARTIFACTS}/url-${name}.txt`, `${url}\n`);
}

async function submitNoJs(page: Page, path: string, fields: Record<string, string>, button: string) {
  await page.goto(path);
  for (const [name, value] of Object.entries(fields)) {
    await page.locator(`input[name="${name}"]`).fill(value);
  }
  await page.locator(button).click();
  await page.waitForLoadState("load");
}

test.describe("credential transport", () => {
  test.beforeAll(async () => {
    await fs.promises.mkdir(ARTIFACTS, { recursive: true });
    const { seedStage0Users } = await import("./fixtures");
    await seedStage0Users();
  });

  test.afterAll(async () => {
    const { closeStage0Database } = await import("./fixtures");
    await closeStage0Database();
  });

  for (const viewport of VIEWPORTS) {
    test(`login form posts at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/login");
      const form = page.locator("form[data-auth-form='login']");
      await expect(form).toHaveAttribute("method", "post");
      await expect(form).toHaveAttribute("action", "/api/auth/login");
      await expect(page.locator("#email")).toHaveAttribute("name", "email");
      await expect(page.locator("#password")).toHaveAttribute("name", "password");
      if (viewport.name === "390x844") {
        await page.screenshot({ path: `${ARTIFACTS}/after-login-390x844.png` });
      }
      if (viewport.name === "1180x820") {
        await page.screenshot({ path: `${ARTIFACTS}/after-login-1180x820.png` });
      }
    });

    test(`no-js login keeps the password out of the URL at ${viewport.name}`, async ({ browser }) => {
      const context = await browser.newContext({
        javaScriptEnabled: false,
        viewport: { width: viewport.width, height: viewport.height },
        extraHTTPHeaders: { "x-real-ip": `stage0-nojs-login-${viewport.name}` },
      });
      const page = await context.newPage();
      await submitNoJs(
        page,
        "/login",
        { email: "nobody@example.com", password: PASSWORD },
        "button[type='submit']",
      );
      assertNoSecret(page.url(), PASSWORD);
      expect(page.url()).not.toContain("nobody@");
      expect(page.url()).toContain("error=CredentialsSignin");
      await expect(page.getByText("Invalid email or password")).toBeVisible();
      if (viewport.name === "390x844") {
        await page.screenshot({ path: `${ARTIFACTS}/after-login-error-390x844.png` });
      }
      await noteUrl(`nojs-login-${viewport.name}`, page.url());
      await context.close();
    });

    test(`pre-hydration login posts at ${viewport.name}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        extraHTTPHeaders: { "x-real-ip": `stage0-pre-login-${viewport.name}` },
      });
      const page = await context.newPage();
      await page.addInitScript((secret) => {
        window.addEventListener("DOMContentLoaded", () => {
          if (location.search.includes("error=")) return;
          const form = document.querySelector("form[data-auth-form='login']") as HTMLFormElement | null;
          if (!form || form.dataset.submitted === "1") return;
          form.dataset.submitted = "1";
          const email = form.querySelector("input[name='email']") as HTMLInputElement | null;
          const password = form.querySelector("input[name='password']") as HTMLInputElement | null;
          if (!email || !password) return;
          email.value = "prehydration@example.com";
          password.value = secret;
          form.submit();
        });
      }, PRE_PASSWORD);
      await page.goto("/login");
      await page.waitForURL(/error=/, { timeout: 20000 });
      assertNoSecret(page.url(), PRE_PASSWORD);
      expect(page.url()).not.toContain("prehydration@");
      await noteUrl(`pre-login-${viewport.name}`, page.url());
      await context.close();
    });

    test(`no-js forgot-password does not put the email in the URL at ${viewport.name}`, async ({ browser }) => {
      const context = await browser.newContext({
        javaScriptEnabled: false,
        viewport: { width: viewport.width, height: viewport.height },
        extraHTTPHeaders: { "x-real-ip": `stage0-nojs-forgot-${viewport.name}` },
      });
      const page = await context.newPage();
      await submitNoJs(
        page,
        "/forgot-password",
        { email: "forgot-secret@example.com" },
        "form[data-auth-form='forgot'] button[type='submit']",
      );
      assertNoSecret(page.url(), "forgot-secret@example.com");
      expect(page.url()).toContain("/forgot-password");
      if (viewport.name === "390x844") {
        await page.screenshot({ path: `${ARTIFACTS}/after-forgot-390x844.png` });
      }
      await noteUrl(`nojs-forgot-${viewport.name}`, page.url());
      await context.close();
    });

    test(`no-js reset-password does not put the new password in the URL at ${viewport.name}`, async ({ browser }) => {
      const context = await browser.newContext({
        javaScriptEnabled: false,
        viewport: { width: viewport.width, height: viewport.height },
        extraHTTPHeaders: { "x-real-ip": `stage0-nojs-reset-${viewport.name}` },
      });
      const page = await context.newPage();
      await submitNoJs(
        page,
        `/reset-password?token=${RESET_TOKEN}`,
        { password: "NewSecret-Reset-1", confirm: "OtherSecret-Reset-1" },
        "form[data-auth-form='reset'] button[type='submit']",
      );
      assertNoSecret(page.url(), "NewSecret-Reset-1");
      assertNoSecret(page.url(), "OtherSecret-Reset-1");
      expect(page.url()).toContain("error=mismatch");
      expect(page.url()).toContain(`token=${RESET_TOKEN}`);
      if (viewport.name === "390x844") {
        await page.screenshot({ path: `${ARTIFACTS}/after-reset-390x844.png` });
      }
      await noteUrl(`nojs-reset-${viewport.name}`, page.url());
      await context.close();
    });
  }

  test("desktop login keeps the same form at 1280", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");
    await expect(page.locator("form[data-auth-form='login']")).toHaveAttribute("method", "post");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await page.screenshot({ path: `${ARTIFACTS}/after-login-1280x800.png` });
  });

  test("GET login and GET auth routes do not echo credentials", async ({ request }) => {
    const login = await request.get("/login?email=a@b.co&password=QuerySecret-1", { maxRedirects: 5 });
    expect(login.url()).not.toContain("QuerySecret-1");
    expect(login.url()).not.toContain("password=");
    expect(login.url()).not.toContain("a@b.co");

    const api = await request.get("/api/auth/login?email=a@b.co&password=QuerySecret-1", { maxRedirects: 0 });
    const location = api.headers().location ?? "";
    expect(api.status()).toBe(303);
    expect(location).not.toContain("QuerySecret-1");
    expect(location.toLowerCase()).not.toContain("password=");
    expect(location).not.toContain("a@b.co");
  });

  test("callbackUrl cannot leave the site", async ({ request }) => {
    const response = await request.post("/api/auth/login", {
      form: {
        email: roleEmail("ADMIN"),
        password: FIXTURE_PASSWORD,
        callbackUrl: "https://evil.example/phish",
      },
      headers: { "x-real-ip": "stage0-open-redirect" },
      maxRedirects: 0,
    });
    const location = response.headers().location ?? "";
    expect(response.status()).toBe(303);
    expect(location).not.toContain("evil.example");
    expect(location).not.toContain(FIXTURE_PASSWORD);
    expect(location).toContain("/portal");
  });

  test("protocol-relative callbackUrl is rejected", async ({ request }) => {
    const response = await request.post("/api/auth/login", {
      form: {
        email: "nobody@example.com",
        password: PASSWORD,
        callbackUrl: "//evil.example",
      },
      headers: { "x-real-ip": "stage0-protocol-relative" },
      maxRedirects: 0,
    });
    const location = response.headers().location ?? "";
    expect(location).not.toContain("evil.example");
    expect(location).not.toContain(PASSWORD);
  });

  test("cross-site login post is refused", async ({ request }) => {
    const response = await request.post("/api/auth/login", {
      form: { email: "a@b.co", password: PASSWORD, callbackUrl: "/portal" },
      headers: {
        origin: "https://evil.example",
        "sec-fetch-site": "cross-site",
        "x-real-ip": "stage0-cross-site",
      },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(303);
    expect(response.headers().location ?? "").not.toContain(PASSWORD);
    expect(response.headers().location ?? "").toContain("error=method");
  });
});
