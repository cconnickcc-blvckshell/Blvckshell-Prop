-- Idempotent reconciliation: add missing columns/indexes expected by Prisma.
-- Safe to run multiple times. No destructive SQL.

-- 1) ChecklistTemplate: checklistId, unique(siteId, version), index(checklistId), partial unique (one active per site)
ALTER TABLE "ChecklistTemplate"
  ADD COLUMN IF NOT EXISTS "checklistId" text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'ChecklistTemplate_siteId_version_key'
  ) THEN
    CREATE UNIQUE INDEX "ChecklistTemplate_siteId_version_key"
      ON "ChecklistTemplate" ("siteId", "version");
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS "ChecklistTemplate_checklistId_idx"
  ON "ChecklistTemplate" ("checklistId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'checklisttemplate_one_active_per_site'
  ) THEN
    CREATE UNIQUE INDEX checklisttemplate_one_active_per_site
      ON "ChecklistTemplate" ("siteId")
      WHERE "isActive" = true;
  END IF;
END$$;

-- 2) Site: template snapshot columns
ALTER TABLE "Site"
  ADD COLUMN IF NOT EXISTS "siteTemplateId" text,
  ADD COLUMN IF NOT EXISTS "siteTemplateVersion" integer;

-- 3) Job: approval flag + template snapshot columns
ALTER TABLE "Job"
  ADD COLUMN IF NOT EXISTS "approvalFlaggedAt" timestamp(3),
  ADD COLUMN IF NOT EXISTS "jobTemplateId" text,
  ADD COLUMN IF NOT EXISTS "jobTemplateVersion" integer;

-- 4) Contract: template snapshot columns
ALTER TABLE "Contract"
  ADD COLUMN IF NOT EXISTS "contractTemplateId" text,
  ADD COLUMN IF NOT EXISTS "contractTemplateVersion" integer;

-- 5) Invoice: template snapshot columns
ALTER TABLE "Invoice"
  ADD COLUMN IF NOT EXISTS "invoiceTemplateId" text,
  ADD COLUMN IF NOT EXISTS "invoiceTemplateVersion" integer;
