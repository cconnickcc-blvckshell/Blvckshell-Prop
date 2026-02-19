-- Add checklistId to ChecklistTemplate to identify which template it is
-- This allows multiple templates per site (stackable)

ALTER TABLE "ChecklistTemplate" ADD COLUMN "checklistId" TEXT;

-- Update existing templates if needed (optional, can be null for legacy)
-- For now, leave as null - will be set when templates are reassigned

CREATE INDEX IF NOT EXISTS "ChecklistTemplate_checklistId_idx" ON "ChecklistTemplate"("checklistId");
