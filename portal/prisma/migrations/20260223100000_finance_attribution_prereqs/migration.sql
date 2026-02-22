-- Migration 1: Tagging + attribution prerequisites (Quote/Finance spine)
-- Enums and columns for per-site revenue/credit attribution.

CREATE TYPE "RevenueCategory" AS ENUM ('BASE_RECURRING', 'ADD_ON', 'OTHER');
CREATE TYPE "AdjustmentCategory" AS ENUM ('CREDIT', 'CHARGE');

-- InvoiceLineItem: revenue category (default BASE_RECURRING for backfill)
ALTER TABLE "InvoiceLineItem" ADD COLUMN "revenueCategory" "RevenueCategory" NOT NULL DEFAULT 'BASE_RECURRING';
CREATE INDEX "InvoiceLineItem_revenueCategory_idx" ON "InvoiceLineItem"("revenueCategory");

-- BillingAdjustment: adjustment category + required site attribution
ALTER TABLE "BillingAdjustment" ADD COLUMN "adjustmentCategory" "AdjustmentCategory";
ALTER TABLE "BillingAdjustment" ADD COLUMN "revenueCategory" "RevenueCategory";

-- Backfill adjustmentCategory from type: Credit -> CREDIT, else CHARGE
UPDATE "BillingAdjustment"
SET "adjustmentCategory" = CASE WHEN "type" = 'Credit' THEN 'CREDIT'::"AdjustmentCategory" ELSE 'CHARGE'::"AdjustmentCategory" END
WHERE "adjustmentCategory" IS NULL;

ALTER TABLE "BillingAdjustment" ALTER COLUMN "adjustmentCategory" SET NOT NULL;

-- Backfill siteId from invoice's first line item where siteId is null
UPDATE "BillingAdjustment" ba
SET "siteId" = (
  SELECT ili."siteId"
  FROM "InvoiceLineItem" ili
  WHERE ili."invoiceId" = ba."invoiceId"
  LIMIT 1
)
WHERE ba."siteId" IS NULL AND ba."invoiceId" IS NOT NULL;

-- Any remaining nulls: attribute to first site so migration can complete (review in admin)
UPDATE "BillingAdjustment"
SET "siteId" = (SELECT "id" FROM "Site" LIMIT 1)
WHERE "siteId" IS NULL
  AND EXISTS (SELECT 1 FROM "Site" LIMIT 1);

-- If no sites exist and adjustments still have null siteId, remove those rows (no global adjustments)
DELETE FROM "BillingAdjustment" WHERE "siteId" IS NULL;

ALTER TABLE "BillingAdjustment" ALTER COLUMN "siteId" SET NOT NULL;
