import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const outDir = path.resolve("docs/brand-screenshots");
fs.mkdirSync(outDir, { recursive: true });

const base = process.env.BASE_URL ?? "http://localhost:3000";

const shots = [
  { name: "mobile-320-home", url: "/", width: 320, height: 700 },
  { name: "mobile-375-home", url: "/", width: 375, height: 812 },
  { name: "mobile-390-home", url: "/", width: 390, height: 844 },
  { name: "tablet-768-home", url: "/", width: 768, height: 1024 },
  { name: "desktop-1280-home-header", url: "/", width: 1280, height: 720 },
  { name: "mobile-375-footer", url: "/", width: 375, height: 812, fullPage: true },
  { name: "desktop-1280-footer", url: "/", width: 1280, height: 900, fullPage: true },
  { name: "desktop-1280-login", url: "/login", width: 1280, height: 800 },
];

async function main() {
  const browser = await chromium.launch();
  for (const shot of shots) {
    const page = await browser.newPage({ viewport: { width: shot.width, height: shot.height } });
    await page.goto(base + shot.url, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const file = path.join(outDir, `${shot.name}.png`);
    await page.screenshot({ path: file, fullPage: !!shot.fullPage });
    console.log("wrote", file);
    await page.close();
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
