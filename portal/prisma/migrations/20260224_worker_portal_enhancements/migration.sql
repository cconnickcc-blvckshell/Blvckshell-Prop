-- AlterTable Worker: add availability fields
ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "availabilityNotes" TEXT;
ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "preferredShifts" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "unavailableDates" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[];

-- AlterTable Job: add check-in/out timestamps
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "checkedInAt" TIMESTAMP(3);
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "checkedOutAt" TIMESTAMP(3);

-- AlterTable Site: add lat/lng
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION;
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION;
