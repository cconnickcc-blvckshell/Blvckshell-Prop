-- ChecklistTemplate: versioned history with one active per site
-- 1) Add UNIQUE(siteId, version) so we can have multiple templates per site over time (versioning).
-- 2) Keep one-active-per-site enforced by existing partial unique index (checklisttemplate_one_active_per_site).
--    That index was created in 20260217204341_production_constraints and remains unchanged.
-- Do NOT add a global UNIQUE on siteId (Prisma previously modeled it that way; DB never had it).

-- Add composite unique for versioning (allows multiple rows per site with different versions)
CREATE UNIQUE INDEX IF NOT EXISTS "ChecklistTemplate_siteId_version_key"
ON "ChecklistTemplate"("siteId", "version");

-- Ensure partial unique index exists (one active per site). Idempotent.
-- If it already exists from production_constraints, this is a no-op in PostgreSQL 15+ with IF NOT EXISTS.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'checklisttemplate_one_active_per_site'
  ) THEN
    CREATE UNIQUE INDEX checklisttemplate_one_active_per_site
    ON "ChecklistTemplate" ("siteId")
    WHERE "isActive" = true;
  END IF;
END $$;
