import { mkdirSync } from "fs";
import path from "path";
import { expect, test } from "@playwright/test";

const SHOTS = "/opt/cursor/artifacts/stage3";

function overlaps(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

test.describe("stage 3 brand", () => {
  test.beforeAll(() => {
    mkdirSync(SHOTS, { recursive: true });
  });

  test("login stays a post form on the brand", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    const form = page.locator("form[data-auth-form=login]");
    await expect(form).toHaveAttribute("method", "post");
    await expect(form).toHaveAttribute("action", "/api/auth/login");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(font.toLowerCase()).toContain("lato");
    await page.screenshot({ path: path.join(SHOTS, "after-login-390x844.png"), fullPage: false });
  });

  test("tablet marketing header can open the menu", async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto("/");
    const menu = page.getByRole("button", { name: "Open menu" });
    await expect(menu).toBeVisible();
    await menu.click();
    await expect(page.getByRole("link", { name: "Services" })).toBeVisible();
    await page.screenshot({ path: path.join(SHOTS, "after-marketing-header-820x1180.png"), fullPage: false });
  });

  test("cookie bar does not cover the hero buttons", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => localStorage.removeItem("cookie-consent"));
    await page.goto("/");
    const hero = page.getByRole("link", { name: "Request a Site Evaluation" });
    const accept = page.getByRole("button", { name: "Accept" });
    await expect(hero).toBeVisible();
    await expect(accept).toBeVisible();
    const heroBox = await hero.boundingBox();
    const acceptBox = await accept.boundingBox();
    expect(heroBox && acceptBox).toBeTruthy();
    expect(overlaps(heroBox!, acceptBox!)).toBe(false);
    await page.screenshot({ path: path.join(SHOTS, "after-home-cookie-390x844.png"), fullPage: false });
  });
});
