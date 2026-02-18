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

/** Extract first H1 line from markdown for display title */
function extractTitle(content: string | null, slug: string, type: "checklist" | "sop"): string {
  if (content) {
    const match = content.match(/^#\s+(.+)$/m);
    if (match) return match[1].trim();
  }
  const cleaned = slug.replace(/_/g, " ").replace(/^(CL|SOP)\s*\d+\s*/i, "").replace(/\s*Checklist\s*$/i, "").trim();
  return cleaned || slug;
}

export type DocMeta = { slug: string; title: string; sortKey: number };

export function getChecklistSlugs(): DocMeta[] {
  const dir = path.join(CONTENT_ROOT, "checklists");
  const files = safeReadDir(dir);
  const items: DocMeta[] = files.map((f) => {
    const slug = f.replace(/\.md$/, "");
    const numMatch = slug.match(/CL_0?(\d+)/i);
    const sortKey = numMatch ? parseInt(numMatch[1], 10) : 999;
    const content = safeReadFile(path.join(dir, f));
    const title = extractTitle(content, slug, "checklist");
    return { slug, title, sortKey };
  });
  items.sort((a, b) => a.sortKey - b.sortKey);
  return items;
}

export function getSopSlugs(): DocMeta[] {
  const dir = path.join(CONTENT_ROOT, "sops");
  const files = safeReadDir(dir);
  const items: DocMeta[] = files.map((f) => {
    const slug = f.replace(/\.md$/, "");
    const numMatch = slug.match(/SOP_0?(\d+)/i);
    const sortKey = numMatch ? parseInt(numMatch[1], 10) : 999;
    const content = safeReadFile(path.join(dir, f));
    const title = extractTitle(content, slug, "sop");
    return { slug, title, sortKey };
  });
  items.sort((a, b) => a.sortKey - b.sortKey);
  return items;
}

export function getChecklistContent(slug: string): string | null {
  const filePath = path.join(CONTENT_ROOT, "checklists", `${slug}.md`);
  return safeReadFile(filePath);
}

export function getSopContent(slug: string): string | null {
  const filePath = path.join(CONTENT_ROOT, "sops", `${slug}.md`);
  return safeReadFile(filePath);
}
