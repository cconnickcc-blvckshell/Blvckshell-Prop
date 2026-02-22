-- Gold Standard: Checklist immutability — snapshot template items onto ChecklistRun.

ALTER TABLE "ChecklistRun"
  ADD COLUMN IF NOT EXISTS "templateSnapshot" JSONB,
  ADD COLUMN IF NOT EXISTS "templateSnapshotHash" TEXT,
  ADD COLUMN IF NOT EXISTS "templateSnapshotCapturedAt" TIMESTAMPTZ;

-- Backfill existing runs using their referenced template (best-effort).
UPDATE "ChecklistRun" r
SET
  "templateSnapshot" = t."items",
  "templateSnapshotCapturedAt" = COALESCE(r."templateSnapshotCapturedAt", r."createdAt")
FROM "ChecklistTemplate" t
WHERE r."templateSnapshot" IS NULL
  AND r."checklistTemplateId" = t."id";
