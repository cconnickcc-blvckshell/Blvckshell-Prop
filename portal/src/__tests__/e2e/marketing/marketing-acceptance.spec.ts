import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

fs.mkdirSync(path.join(process.cwd(), "docs", "phase5-screenshots"), { recursive: true });

const MARKETING_ROUTES = [
  "/",
  "/services",
  "/our-approach",
  "/90-day-validation",
  "/introductory-offers",
  "/about",
  "/contact",
  "/work-with-us",
  "/compliance",
  "/privacy",
  "/condo-cleaning",
  "/commercial-cleaning",
  "/rental-unit-turnovers",
  "/deep-cleaning-building-resets",
  "/post-construction-final-cleaning",
  "/facilities-support",
];

const VIEWPORTS = [
  { label: "desktop-1440", width: 1440, height: 900 },
  { label: "tablet-768", width: 768, height: 1024 },
  { label: "mobile-390", width: 390, height: 844 },
  { label: "mobile-320", width: 320, height: 568 },
];

const screenshotDir = path.join(process.cwd(), "docs", "phase5-screenshots");

for (const vp of VIEWPORTS) {
  test.describe(`Marketing @ ${vp.label}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const route of MARKETING_ROUTES) {
      test(`loads ${route}`, async ({ page }) => {
        const res = await page.goto(route, { waitUntil: "networkidle" });
        expect(res?.ok()).toBeTruthy();
        await expect(page.getByRole("banner")).toBeVisible();
        await expect(page.getByRole("contentinfo")).toBeVisible();

        const slug = route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-");
        if (vp.label === "desktop-1440" || vp.label === "mobile-390") {
          await page.screenshot({
            path: path.join(screenshotDir, `${vp.label}__${slug}.png`),
            fullPage: true,
          });
        }
      });
    }

    test("mobile menu opens on small viewports", async ({ page }) => {
      test.skip(vp.width >= 768, "Desktop/tablet use horizontal nav");
      await page.goto("/");
      const menuButton = page.getByRole("button", { name: /open menu/i });
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await expect(page.getByRole("navigation").first()).toBeVisible();
      }
    });
  });
}

test.describe("Redirects", () => {
  test("/pilots redirects to introductory offers", async ({ page }) => {
    await page.goto("/pilots");
    await expect(page).toHaveURL(/introductory-offers/);
  });

  test("/light-maintenance redirects to facilities-support", async ({ page }) => {
    await page.goto("/light-maintenance");
    await expect(page).toHaveURL(/facilities-support/);
  });
});

test.describe("Contact form (no live sales data)", () => {
  test("honeypot lead accepts silently", async ({ request }) => {
    const res = await request.post("/api/lead", {
      data: {
        name: "Phase5 Bot",
        email: "phase5-bot@example.invalid",
        website: "https://spam.example",
        sourcePage: "/contact",
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test("invalid lead returns 400", async ({ request }) => {
    const res = await request.post("/api/lead", {
      data: { name: "", email: "not-an-email" },
    });
    expect(res.status()).toBe(400);
  });
});
