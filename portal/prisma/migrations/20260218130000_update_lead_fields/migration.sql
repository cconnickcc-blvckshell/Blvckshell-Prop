-- AlterTable: Update Lead model with new simplified fields
-- Note: PostgreSQL doesn't support IF NOT EXISTS for ADD COLUMN; run manually if columns exist
ALTER TABLE "Lead" ADD COLUMN "buildingAddress" TEXT;
ALTER TABLE "Lead" ADD COLUMN "frequency" TEXT;
ALTER TABLE "Lead" ADD COLUMN "callbackTime" TEXT;

-- Note: company, role, sitesCount kept for backward compatibility (not dropped)
