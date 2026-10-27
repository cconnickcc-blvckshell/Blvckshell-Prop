import fs from "fs";
import path from "path";
import type { PdfDoc } from "@/lib/pdf/types";

const FILES = {
  Lato: "Lato-Regular.ttf",
  "Lato-Bold": "Lato-Bold.ttf",
  "Lato-Black": "Lato-Black.ttf",
  "Lato-Italic": "Lato-Italic.ttf",
} as const;

let cache: Record<string, Buffer> | null = null;

function loadFonts(): Record<string, Buffer> {
  if (cache) return cache;
  const dir = path.join(process.cwd(), "assets", "fonts");
  const loaded: Record<string, Buffer> = {};
  for (const [name, file] of Object.entries(FILES)) {
    loaded[name] = fs.readFileSync(path.join(dir, file));
  }
  cache = loaded;
  return loaded;
}

export function registerBrandFonts(doc: PdfDoc): void {
  const fonts = loadFonts();
  for (const [name, buf] of Object.entries(fonts)) {
    doc.registerFont(name, buf);
  }
}
