-- AlterTable Evidence: add item-level + redaction metadata
ALTER TABLE "Evidence" ADD COLUMN IF NOT EXISTS "checklistRunId" TEXT;
ALTER TABLE "Evidence" ADD COLUMN IF NOT EXISTS "itemId" TEXT;
ALTER TABLE "Evidence" ADD COLUMN IF NOT EXISTS "redactionApplied" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Evidence" ADD COLUMN IF NOT EXISTS "redactionType" TEXT;
ALTER TABLE "Evidence" ADD COLUMN IF NOT EXISTS "capturedByUserId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Evidence_checklistRunId_idx" ON "Evidence"("checklistRunId");
CREATE INDEX IF NOT EXISTS "Evidence_itemId_idx" ON "Evidence"("itemId");

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_checklistRunId_fkey" FOREIGN KEY ("checklistRunId") REFERENCES "ChecklistRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
