-- Migration 2: Quote spine (PricingPolicy, Quote, QuoteAreaLine, QuoteAddOnLine, QuoteSnapshot)

ALTER TYPE "UserRole" ADD VALUE 'FOUNDER';

CREATE TYPE "SiteLifecycleStatus" AS ENUM ('PROSPECT', 'ACTIVE', 'INACTIVE');
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'READY_FOR_REVIEW', 'SENT', 'WON', 'LOST', 'EXPIRED');
CREATE TYPE "QuoteAreaType" AS ENUM ('LOBBY', 'HALLWAYS', 'STAIRWELLS', 'ELEVATORS', 'GARBAGE', 'WASHROOMS', 'GLASS', 'OTHER');

ALTER TABLE "Site" ADD COLUMN "lifecycleStatus" "SiteLifecycleStatus" NOT NULL DEFAULT 'ACTIVE';
CREATE INDEX "Site_lifecycleStatus_idx" ON "Site"("lifecycleStatus");

CREATE TABLE "PricingPolicy" (
    "id" TEXT NOT NULL,
    "cityCode" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL,
    "anchorBillingRateCentsPerHour" INTEGER NOT NULL,
    "minimumMonthlyRevenueCents" INTEGER NOT NULL,
    "defaultTravelMinutesPerVisit" INTEGER NOT NULL,
    "defaultMonthlySupplyCostCents" INTEGER,
    "defaultWinterMinutesPerVisitDelta" INTEGER NOT NULL,
    "winterStartMonth" INTEGER NOT NULL,
    "winterEndMonth" INTEGER NOT NULL,
    "daysValid" INTEGER NOT NULL,
    "targetMarginBps" INTEGER NOT NULL,
    "stressMarginBps" INTEGER NOT NULL,
    "minStressMarginBps" INTEGER NOT NULL,
    "subPayoutCeilingCentsPerHour" INTEGER NOT NULL,
    "addonBillingRateCentsPerHour" INTEGER NOT NULL,
    "addonMinMarginBps" INTEGER NOT NULL,
    "riskRules" JSONB NOT NULL,

    CONSTRAINT "PricingPolicy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PricingPolicy_cityCode_effectiveDate_version_key" ON "PricingPolicy"("cityCode", "effectiveDate", "version");
CREATE INDEX "PricingPolicy_cityCode_effectiveDate_idx" ON "PricingPolicy"("cityCode", "effectiveDate");

CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "pricingPolicyId" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "visitsPerWeek" INTEGER NOT NULL,
    "billingRateCentsPerHour" INTEGER NOT NULL,
    "billingRateOverrideReason" TEXT,
    "expectedSubcontractorRateCentsPerHour" INTEGER,
    "payoutOverrideReason" TEXT,
    "travelMinutesPerVisit" INTEGER NOT NULL,
    "monthlySupplyCostCents" INTEGER NOT NULL,
    "winterMinutesPerVisitDelta" INTEGER NOT NULL,
    "revenueFloorOverrideReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuoteAreaLine" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "type" "QuoteAreaType" NOT NULL,
    "measurements" JSONB NOT NULL,
    "computedMinutes" INTEGER NOT NULL,
    "overrideMinutes" INTEGER,
    "overrideReason" TEXT,

    CONSTRAINT "QuoteAreaLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuoteAddOnLine" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "estimatedLaborMinutes" INTEGER NOT NULL,
    "billingRateCentsPerHour" INTEGER NOT NULL,
    "expectedPayoutCentsPerHour" INTEGER,
    "priceCents" INTEGER NOT NULL,
    "marginBps" INTEGER NOT NULL,
    "includedInProposal" BOOLEAN NOT NULL,

    CONSTRAINT "QuoteAddOnLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuoteSnapshot" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "snapshotVersion" INTEGER NOT NULL,
    "pricingPolicyCityCode" TEXT NOT NULL,
    "pricingPolicyEffectiveDate" TIMESTAMP(3) NOT NULL,
    "pricingPolicyVersion" INTEGER NOT NULL,
    "billingRateCentsPerHour" INTEGER NOT NULL,
    "riskMultiplierBps" INTEGER NOT NULL,
    "minutesPerVisitBase" INTEGER NOT NULL,
    "minutesPerVisitTravel" INTEGER NOT NULL,
    "minutesPerVisitWinterDelta" INTEGER NOT NULL,
    "minutesPerVisitTotal" INTEGER NOT NULL,
    "hoursPerVisit" DECIMAL(10,4) NOT NULL,
    "monthlyHours" DECIMAL(10,4) NOT NULL,
    "baseRevenueCents" INTEGER NOT NULL,
    "riskAdjustedRevenueCents" INTEGER NOT NULL,
    "monthlySupplyCostCents" INTEGER NOT NULL,
    "grossProfitCents" INTEGER NOT NULL,
    "grossMarginBps" INTEGER NOT NULL,
    "stressGrossMarginBps" INTEGER NOT NULL,
    "allowedPayoutCentsPerHourAtTarget" INTEGER NOT NULL,
    "allowedPayoutCentsPerHourAtStress" INTEGER NOT NULL,
    "passesBaseGate" BOOLEAN NOT NULL,
    "passesStressGate" BOOLEAN NOT NULL,
    "passesRevenueFloor" BOOLEAN NOT NULL,
    "confidenceScore" INTEGER NOT NULL,
    "confidenceBand" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Quote_siteId_idx" ON "Quote"("siteId");
CREATE INDEX "Quote_pricingPolicyId_idx" ON "Quote"("pricingPolicyId");
CREATE INDEX "Quote_status_idx" ON "Quote"("status");
CREATE INDEX "Quote_expiresAt_idx" ON "Quote"("expiresAt");

CREATE INDEX "QuoteAreaLine_quoteId_idx" ON "QuoteAreaLine"("quoteId");
CREATE INDEX "QuoteAddOnLine_quoteId_idx" ON "QuoteAddOnLine"("quoteId");
CREATE UNIQUE INDEX "QuoteSnapshot_quoteId_snapshotVersion_key" ON "QuoteSnapshot"("quoteId", "snapshotVersion");
CREATE INDEX "QuoteSnapshot_quoteId_idx" ON "QuoteSnapshot"("quoteId");

ALTER TABLE "Quote" ADD CONSTRAINT "Quote_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_pricingPolicyId_fkey" FOREIGN KEY ("pricingPolicyId") REFERENCES "PricingPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuoteAreaLine" ADD CONSTRAINT "QuoteAreaLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuoteAddOnLine" ADD CONSTRAINT "QuoteAddOnLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuoteSnapshot" ADD CONSTRAINT "QuoteSnapshot_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
