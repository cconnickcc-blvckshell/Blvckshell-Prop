-- Scale-Safe Hardening: Job approved money facts, InvoiceLineItem placeholder + unique job per invoice.
-- PayoutLine one-per-job and ChecklistTemplate one-active-per-site already exist in prior migrations.
-- SiteAssignment XOR already exists (production_constraints).

-- 1) Job: approved money facts (nullable for backfill)
ALTER TABLE "Job" ADD COLUMN "approvedBillableCents" INTEGER;
ALTER TABLE "Job" ADD COLUMN "approvedPayoutCents" INTEGER;
ALTER TABLE "Job" ADD COLUMN "approvedPolicyVersion" INTEGER;

-- 2) InvoiceLineItem: placeholder flag (block Sent if any true)
ALTER TABLE "InvoiceLineItem" ADD COLUMN "isSystemPlaceholder" BOOLEAN NOT NULL DEFAULT false;

-- 3) InvoiceLineItem: same job cannot appear twice on same invoice (partial unique)
-- Guard: fail migration if duplicates exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "InvoiceLineItem"
    WHERE "jobId" IS NOT NULL
    GROUP BY "invoiceId", "jobId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate job on same invoice exists. Resolve before applying unique index.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "InvoiceLineItem_invoiceId_jobId_key"
ON "InvoiceLineItem" ("invoiceId", "jobId")
WHERE "jobId" IS NOT NULL;
