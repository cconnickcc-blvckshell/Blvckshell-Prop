/**
 * One-off: de-duplicate ChecklistTemplate so siteId can be unique.
 * Keeps the template with the earliest createdAt per siteId; deletes the rest.
 * Run from repo root: cd portal && npx tsx prisma/scripts/dedupe-checklist-templates.ts
 */
import path from "path";
import dotenv from "dotenv";

// Load root .env so DATABASE_URL / DIRECT_URL are set (same as prisma.config.ts)
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config();

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.checklistTemplate.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, siteId: true },
  });

  const seen = new Set<string>();
  const toDelete: string[] = [];
  for (const t of templates) {
    if (seen.has(t.siteId)) {
      toDelete.push(t.id);
    } else {
      seen.add(t.siteId);
    }
  }

  if (toDelete.length === 0) {
    console.log("No duplicate ChecklistTemplates found.");
    return;
  }

  const result = await prisma.checklistTemplate.deleteMany({
    where: { id: { in: toDelete } },
  });
  console.log(`Deleted ${result.count} duplicate ChecklistTemplate(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
