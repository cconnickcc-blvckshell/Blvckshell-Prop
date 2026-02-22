-- Migration 3: Finance snapshot tables + Job quality fields

-- Job: reclean and quality fields
ALTER TABLE "Job" ADD COLUMN "isReclean" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Job" ADD COLUMN "recleanOfJobId" TEXT;
ALTER TABLE "Job" ADD COLUMN "recleanReason" TEXT;
ALTER TABLE "Job" ADD COLUMN "qualityRejectedAt" TIMESTAMP(3);

CREATE INDEX "Job_isReclean_idx" ON "Job"("isReclean");
CREATE INDEX "Job_qualityRejectedAt_idx" ON "Job"("qualityRejectedAt");
CREATE INDEX "Job_recleanOfJobId_idx" ON "Job"("recleanOfJobId");

ALTER TABLE "Job" ADD CONSTRAINT "Job_recleanOfJobId_fkey" FOREIGN KEY ("recleanOfJobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- SiteSupplyAllocation
CREATE TABLE "SiteSupplyAllocation" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "note" TEXT,
    "createdByUserId" TEXT NOT NULL,

    CONSTRAINT "SiteSupplyAllocation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SiteSupplyAllocation_siteId_idx" ON "SiteSupplyAllocation"("siteId");
CREATE INDEX "SiteSupplyAllocation_siteId_month_idx" ON "SiteSupplyAllocation"("siteId", "month");

ALTER TABLE "SiteSupplyAllocation" ADD CONSTRAINT "SiteSupplyAllocation_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SiteSupplyAllocation" ADD CONSTRAINT "SiteSupplyAllocation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- SnapshotStatus enum and SitePerformanceSnapshot
CREATE TYPE "SnapshotStatus" AS ENUM ('OPEN', 'CLOSED');

CREATE TABLE "SitePerformanceSnapshot" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "SnapshotStatus" NOT NULL DEFAULT 'OPEN',
    "baseRevenueCents" INTEGER NOT NULL,
    "addOnRevenueCents" INTEGER NOT NULL,
    "creditsCents" INTEGER NOT NULL,
    "netRevenueCents" INTEGER NOT NULL,
    "payoutCogsCents" INTEGER NOT NULL,
    "supplyCogsCents" INTEGER NOT NULL,
    "totalCogsCents" INTEGER NOT NULL,
    "grossProfitCents" INTEGER NOT NULL,
    "grossMarginBps" INTEGER NOT NULL,
    "payoutRatioBps" INTEGER NOT NULL,
    "addOnPayoutCogsCents" INTEGER NOT NULL,
    "addOnGrossMarginBps" INTEGER NOT NULL,
    "recleanCount" INTEGER NOT NULL,
    "rejectedChecklistCount" INTEGER NOT NULL,
    "arOutstandingCents" INTEGER NOT NULL,
    "ar_0_30_cents" INTEGER NOT NULL,
    "ar_31_60_cents" INTEGER NOT NULL,
    "ar_61_90_cents" INTEGER NOT NULL,
    "ar_90_plus_cents" INTEGER NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "computedByUserId" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3),

    CONSTRAINT "SitePerformanceSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SitePerformanceSnapshot_siteId_month_version_key" ON "SitePerformanceSnapshot"("siteId", "month", "version");
CREATE INDEX "SitePerformanceSnapshot_siteId_idx" ON "SitePerformanceSnapshot"("siteId");
CREATE INDEX "SitePerformanceSnapshot_siteId_month_idx" ON "SitePerformanceSnapshot"("siteId", "month");
CREATE INDEX "SitePerformanceSnapshot_status_idx" ON "SitePerformanceSnapshot"("status");

-- Partial unique index: only one CLOSED snapshot per site per month
CREATE UNIQUE INDEX "SitePerformanceSnapshot_one_closed_per_site_month" ON "SitePerformanceSnapshot"("siteId", "month") WHERE "status" = 'CLOSED';

ALTER TABLE "SitePerformanceSnapshot" ADD CONSTRAINT "SitePerformanceSnapshot_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SitePerformanceSnapshot" ADD CONSTRAINT "SitePerformanceSnapshot_computedByUserId_fkey" FOREIGN KEY ("computedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
