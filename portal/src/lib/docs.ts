import fs from "fs";
import path from "path";

const CONTENT_ROOT = path.join(process.cwd(), "content", "docs");

function safeReadDir(dir: string): string[] {
  try {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
}

function safeReadFile(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

export function getChecklistSlugs(): { slug: string; title: string }[] {
  const dir = path.join(CONTENT_ROOT, "checklists");
  return safeReadDir(dir).map((f) => {
    const slug = f.replace(/\.md$/, "");
    const title = slug.replace(/_/g, " ").replace(/^CL \d+ /i, "").trim() || slug;
    return { slug, title };
  });
}

export function getSopSlugs(): { slug: string; title: string }[] {
  const dir = path.join(CONTENT_ROOT, "sops");
  return safeReadDir(dir).map((f) => {
    const slug = f.replace(/\.md$/, "");
    const title = slug.replace(/_/g, " ").replace(/^SOP \d+ /i, "").trim() || slug;
    return { slug, title };
  });
}

export function getChecklistContent(slug: string): string | null {
  const filePath = path.join(CONTENT_ROOT, "checklists", `${slug}.md`);
  return safeReadFile(filePath);
}

export function getSopContent(slug: string): string | null {
  const filePath = path.join(CONTENT_ROOT, "sops", `${slug}.md`);
  return safeReadFile(filePath);
}
