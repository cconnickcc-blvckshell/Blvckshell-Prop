/**
 * Evidence retention job: Delete evidence older than 90 days (D3)
 * Run via cron or scheduled task
 * 
 * Usage:
 *   npx tsx scripts/evidence-retention.ts
 * 
 * Or schedule via cron:
 *   0 2 * * * cd /path/to/portal && npx tsx scripts/evidence-retention.ts
 */

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  const RETENTION_DAYS = 90;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

  console.log(`[${new Date().toISOString()}] Starting evidence retention cleanup`);
  console.log(`Cutoff date: ${cutoffDate.toISOString()} (${RETENTION_DAYS} days ago)`);

  // Find evidence older than retention period
  // D3: Skip if disputeFlag === true (when implemented)
  const oldEvidence = await prisma.evidence.findMany({
    where: {
      uploadedAt: {
        lt: cutoffDate,
      },
      // TODO: Add disputeFlag check when schema includes it
      // disputeFlag: { not: true },
    },
    select: {
      id: true,
      storagePath: true,
      uploadedAt: true,
      jobCompletionId: true,
    },
  });

  console.log(`Found ${oldEvidence.length} evidence items to delete`);

  let deleted = 0;
  let errors = 0;

  for (const evidence of oldEvidence) {
    try {
      // Delete from Supabase Storage
      const pathParts = evidence.storagePath.split("/");
      const bucket = pathParts[0]; // e.g., "evidence"
      const filePath = pathParts.slice(1).join("/");

      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (storageError) {
        console.error(`Failed to delete storage for ${evidence.id}:`, storageError);
        errors++;
        continue;
      }

      // Delete from database
      await prisma.evidence.delete({
        where: { id: evidence.id },
      });

      deleted++;
      console.log(`Deleted evidence ${evidence.id} (${evidence.storagePath})`);
    } catch (error) {
      console.error(`Error deleting evidence ${evidence.id}:`, error);
      errors++;
    }
  }

  console.log(`[${new Date().toISOString()}] Cleanup complete: ${deleted} deleted, ${errors} errors`);
}

main()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
