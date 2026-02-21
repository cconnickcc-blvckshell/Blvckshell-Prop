-- Add CLIENT to UserRole enum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CLIENT' BEFORE 'VENDOR_OWNER';

-- Add clientOrganizationId to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clientOrganizationId" TEXT;

-- Add foreign key and index (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_clientOrganizationId_fkey') THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_clientOrganizationId_fkey"
      FOREIGN KEY ("clientOrganizationId") REFERENCES "ClientOrganization"("id");
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "User_clientOrganizationId_idx" ON "User"("clientOrganizationId");
