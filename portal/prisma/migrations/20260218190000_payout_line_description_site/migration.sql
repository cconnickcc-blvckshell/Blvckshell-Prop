-- AlterTable PayoutLine: Phase 6 - description, siteId, checklistRunId for pay statement data
ALTER TABLE "PayoutLine" ADD COLUMN IF NOT EXISTS "checklistRunId" TEXT;
ALTER TABLE "PayoutLine" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "PayoutLine" ADD COLUMN IF NOT EXISTS "siteId" TEXT;

CREATE INDEX IF NOT EXISTS "PayoutLine_checklistRunId_idx" ON "PayoutLine"("checklistRunId");
