-- CreateEnum
CREATE TYPE "BillingCadence" AS ENUM ('Monthly');
CREATE TYPE "ContractStatus" AS ENUM ('Active', 'Paused', 'Ended');
CREATE TYPE "InvoiceStatus" AS ENUM ('Draft', 'Sent', 'Paid', 'Void');
CREATE TYPE "BillingAdjustmentType" AS ENUM ('Charge', 'Discount', 'Credit');
CREATE TYPE "BillingAdjustmentStatus" AS ENUM ('Proposed', 'Approved', 'Applied', 'Voided');
CREATE TYPE "JobPricingModel" AS ENUM ('IncludedInContract', 'Fixed', 'Hourly', 'PerChecklist', 'PerVisit');
CREATE TYPE "BillableStatus" AS ENUM ('Pending', 'Approved', 'Invoiced', 'Void');

-- AlterTable Job: Phase 5 billing fields
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "pricingModel" "JobPricingModel" DEFAULT 'Fixed';
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "billableAmountCents" INTEGER;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "billableStatus" "BillableStatus" DEFAULT 'Pending';
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "invoiceId" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "approvedById" TEXT;

-- CreateTable Contract
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "clientOrganizationId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "billingCadence" "BillingCadence" NOT NULL DEFAULT 'Monthly',
    "monthlyBaseAmountCents" INTEGER NOT NULL,
    "netTermsDays" INTEGER NOT NULL DEFAULT 30,
    "effectiveStart" TIMESTAMP(3) NOT NULL,
    "effectiveEnd" TIMESTAMP(3),
    "status" "ContractStatus" NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable Invoice
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'Draft',
    "issuedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "notes" TEXT,
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable InvoiceLineItem
CREATE TABLE "InvoiceLineItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "jobId" TEXT,
    "checklistRunId" TEXT,
    "contractId" TEXT,
    "description" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "unitPriceCents" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "siteId" TEXT NOT NULL,

    CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable BillingAdjustment
CREATE TABLE "BillingAdjustment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT,
    "siteId" TEXT,
    "jobId" TEXT,
    "type" "BillingAdjustmentType" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "reasonCode" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "BillingAdjustmentStatus" NOT NULL DEFAULT 'Proposed',
    "evidencePhotoIds" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "BillingAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE INDEX "Contract_clientOrganizationId_idx" ON "Contract"("clientOrganizationId");
CREATE INDEX "Contract_siteId_idx" ON "Contract"("siteId");
CREATE INDEX "Contract_status_idx" ON "Contract"("status");
CREATE INDEX "Invoice_clientId_idx" ON "Invoice"("clientId");
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX "Invoice_periodStart_periodEnd_idx" ON "Invoice"("periodStart", "periodEnd");
CREATE INDEX "InvoiceLineItem_invoiceId_idx" ON "InvoiceLineItem"("invoiceId");
CREATE INDEX "InvoiceLineItem_jobId_idx" ON "InvoiceLineItem"("jobId");
CREATE INDEX "InvoiceLineItem_siteId_idx" ON "InvoiceLineItem"("siteId");
CREATE INDEX "BillingAdjustment_invoiceId_idx" ON "BillingAdjustment"("invoiceId");
CREATE INDEX "BillingAdjustment_siteId_idx" ON "BillingAdjustment"("siteId");
CREATE INDEX "BillingAdjustment_jobId_idx" ON "BillingAdjustment"("jobId");
CREATE INDEX "BillingAdjustment_status_idx" ON "BillingAdjustment"("status");
CREATE INDEX "Job_invoiceId_idx" ON "Job"("invoiceId");
CREATE INDEX "Job_billableStatus_idx" ON "Job"("billableStatus");

-- AddForeignKey Contract
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_clientOrganizationId_fkey" FOREIGN KEY ("clientOrganizationId") REFERENCES "ClientOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey Invoice
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey InvoiceLineItem
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey BillingAdjustment
ALTER TABLE "BillingAdjustment" ADD CONSTRAINT "BillingAdjustment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillingAdjustment" ADD CONSTRAINT "BillingAdjustment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillingAdjustment" ADD CONSTRAINT "BillingAdjustment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey Job
ALTER TABLE "Job" ADD CONSTRAINT "Job_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Job" ADD CONSTRAINT "Job_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
