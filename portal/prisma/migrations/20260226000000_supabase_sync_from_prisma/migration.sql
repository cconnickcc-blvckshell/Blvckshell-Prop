-- Supabase sync: bring DB in line with current Prisma schema (Payment, TimeEntry, NotificationOutbox, new columns).
-- Safe to run idempotently; uses IF NOT EXISTS / DO blocks where possible.

-- 1) New enums (skip if already exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentRail') THEN
    CREATE TYPE "PaymentRail" AS ENUM ('STRIPE', 'SPARC', 'EFT', 'CHEQUE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SETTLED', 'FAILED', 'REFUNDED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationChannel') THEN
    CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationStatus') THEN
    CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkforceClassification') THEN
    CREATE TYPE "WorkforceClassification" AS ENUM ('EMPLOYEE', 'CONTRACTOR');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentMethodType') THEN
    CREATE TYPE "PaymentMethodType" AS ENUM ('PAYROLL', 'EFT', 'CHEQUE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TimeEntryStatus') THEN
    CREATE TYPE "TimeEntryStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'EXPORTED', 'PAID');
  END IF;
END $$;

-- 2) New columns on existing tables (ADD COLUMN IF NOT EXISTS)
ALTER TABLE "ClientOrganization" ADD COLUMN IF NOT EXISTS "requiredPaymentRail" "PaymentRail" NOT NULL DEFAULT 'STRIPE';

ALTER TABLE "WorkforceAccount" ADD COLUMN IF NOT EXISTS "classification" "WorkforceClassification" NOT NULL DEFAULT 'CONTRACTOR';
ALTER TABLE "WorkforceAccount" ADD COLUMN IF NOT EXISTS "allowedPaymentMethod" "PaymentMethodType" NOT NULL DEFAULT 'EFT';
ALTER TABLE "WorkforceAccount" ADD COLUMN IF NOT EXISTS "complianceSuspended" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "availabilityNotes" TEXT;
ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "preferredShifts" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "unavailableDates" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[];

ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION;
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION;

ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "checkedInAt" TIMESTAMP(3);
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "checkedOutAt" TIMESTAMP(3);

ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "taxJurisdiction" TEXT NOT NULL DEFAULT 'ON';
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "taxRateBps" INTEGER NOT NULL DEFAULT 1300;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "taxPolicyVersion" INTEGER NOT NULL DEFAULT 1;

-- 3) New tables (CREATE TABLE IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "provider" "PaymentRail" NOT NULL,
    "providerRef" TEXT,
    "amountCents" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "settledAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NotificationOutbox" (
    "id" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "templateKey" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "relatedEntityType" TEXT NOT NULL,
    "relatedEntityId" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "providerMessageId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "NotificationOutbox_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TimeEntry" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "workforceAccountId" TEXT NOT NULL,
    "jobId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "regularMinutes" INTEGER NOT NULL,
    "overtimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "rateCentsPerHour" INTEGER NOT NULL,
    "status" "TimeEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "payrollExportedAt" TIMESTAMP(3),
    "payrollBatchRef" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- 4) Indexes on new tables (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "Payment_invoiceId_idx" ON "Payment"("invoiceId");
CREATE INDEX IF NOT EXISTS "Payment_clientId_idx" ON "Payment"("clientId");
CREATE INDEX IF NOT EXISTS "Payment_provider_idx" ON "Payment"("provider");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");
CREATE INDEX IF NOT EXISTS "Payment_providerRef_idx" ON "Payment"("providerRef");

CREATE INDEX IF NOT EXISTS "NotificationOutbox_status_idx" ON "NotificationOutbox"("status");
CREATE INDEX IF NOT EXISTS "NotificationOutbox_relatedEntityType_relatedEntityId_idx" ON "NotificationOutbox"("relatedEntityType", "relatedEntityId");
CREATE INDEX IF NOT EXISTS "NotificationOutbox_channel_idx" ON "NotificationOutbox"("channel");
CREATE INDEX IF NOT EXISTS "NotificationOutbox_createdAt_idx" ON "NotificationOutbox"("createdAt");

CREATE INDEX IF NOT EXISTS "TimeEntry_workerId_idx" ON "TimeEntry"("workerId");
CREATE INDEX IF NOT EXISTS "TimeEntry_workforceAccountId_idx" ON "TimeEntry"("workforceAccountId");
CREATE INDEX IF NOT EXISTS "TimeEntry_date_idx" ON "TimeEntry"("date");
CREATE INDEX IF NOT EXISTS "TimeEntry_status_idx" ON "TimeEntry"("status");
CREATE INDEX IF NOT EXISTS "TimeEntry_payrollBatchRef_idx" ON "TimeEntry"("payrollBatchRef");

CREATE INDEX IF NOT EXISTS "WorkforceAccount_classification_idx" ON "WorkforceAccount"("classification");

-- 5) Foreign keys for new tables (only if tables were just created or FKs missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Payment_invoiceId_fkey'
  ) THEN
    ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey"
      FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Payment_clientId_fkey'
  ) THEN
    ALTER TABLE "Payment" ADD CONSTRAINT "Payment_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "ClientOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TimeEntry_workerId_fkey'
  ) THEN
    ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_workerId_fkey"
      FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TimeEntry_workforceAccountId_fkey'
  ) THEN
    ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_workforceAccountId_fkey"
      FOREIGN KEY ("workforceAccountId") REFERENCES "WorkforceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
