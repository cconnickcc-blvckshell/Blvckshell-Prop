/**
 * Copies supplied transparent masters into public/ and generates favicon/PWA sizes.
 * Run from portal/: node scripts/prepare-brand-assets.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const portalRoot = path.resolve(__dirname, "..");

const cursorAssets =
  "C:/Users/AZA Custom Builds/.cursor/projects/c-Projects-Blvckshell-Facilities/assets";

const masters = {
  primary: `${cursorAssets}/c__Users_AZA_Custom_Builds_AppData_Roaming_Cursor_User_workspaceStorage_a1cd36f8f6e9e391be3e49c2dac46270_images_logo-666fedd9-ea77-4cd1-a0ee-c6df2ed4970c.png`,
  header: `${cursorAssets}/c__Users_AZA_Custom_Builds_AppData_Roaming_Cursor_User_workspaceStorage_a1cd36f8f6e9e391be3e49c2dac46270_images_header-97885ab7-f0b8-4496-b1e2-c360b16bae56.png`,
  crest: `${cursorAssets}/c__Users_AZA_Custom_Builds_AppData_Roaming_Cursor_User_workspaceStorage_a1cd36f8f6e9e391be3e49c2dac46270_images_favicon-67e28153-8f9e-4285-b11a-1718a4941e28.png`,
};

const brandDir = path.join(portalRoot, "public", "brand");
const iconsDir = path.join(portalRoot, "public", "icons");

function assertFile(p) {
  if (!fs.existsSync(p)) throw new Error(`Missing master asset: ${p}`);
}

async function assertAlpha(p, label) {
  const meta = await sharp(p).metadata();
  if (!meta.hasAlpha) {
    console.warn(`WARN: ${label} may lack alpha channel (hasAlpha=${meta.hasAlpha})`);
  } else {
    const { data, info } = await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) transparent++;
    }
    const ratio = transparent / (info.width * info.height);
    console.log(`${label}: ${info.width}x${info.height}, transparent pixels ~${(ratio * 100).toFixed(1)}%`);
  }
}

async function copyMaster(src, destName) {
  const dest = path.join(brandDir, destName);
  await sharp(src).png({ compressionLevel: 9 }).toFile(dest);
  return dest;
}

async function resizeCrest(src, size, dest) {
  await sharp(src)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(dest);
}

async function main() {
  for (const p of Object.values(masters)) assertFile(p);
  fs.mkdirSync(brandDir, { recursive: true });
  fs.mkdirSync(iconsDir, { recursive: true });

  await copyMaster(masters.primary, "primary-logo-transparent.png");
  await copyMaster(masters.header, "header-logo-transparent.png");
  await copyMaster(masters.crest, "crest-transparent.png");

  const crest = masters.crest;
  const sizes = [
    [16, "favicon-16x16.png"],
    [32, "favicon-32x32.png"],
    [48, "favicon-48x48.png"],
    [180, "apple-touch-icon-180x180.png"],
    [192, "pwa-icon-192x192.png"],
    [512, "pwa-icon-512x512.png"],
  ];
  for (const [size, name] of sizes) {
    await resizeCrest(crest, size, path.join(iconsDir, name));
  }

  await sharp(crest)
    .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(portalRoot, "public", "favicon.png"));

  for (const [key, p] of Object.entries(masters)) {
    await assertAlpha(p, key);
  }
  console.log("Brand assets prepared in public/brand and public/icons");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
