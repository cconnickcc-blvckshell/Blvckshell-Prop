-- CreateEnum
CREATE TYPE "PaymentRail" AS ENUM ('STRIPE', 'SPARC', 'EFT', 'CHEQUE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SETTLED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "WorkforceClassification" AS ENUM ('EMPLOYEE', 'CONTRACTOR');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('PAYROLL', 'EFT', 'CHEQUE');

-- CreateEnum
CREATE TYPE "TimeEntryStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'EXPORTED', 'PAID');

-- DropForeignKey
ALTER TABLE "BillingAdjustment" DROP CONSTRAINT "BillingAdjustment_siteId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_clientOrganizationId_fkey";

-- DropIndex
DROP INDEX "auditlog_entity_idx";

-- DropIndex
DROP INDEX "checklisttemplate_one_active_per_site";

-- DropIndex
DROP INDEX "InvoiceLineItem_invoiceId_jobId_key";

-- DropIndex
DROP INDEX "job_assignedaccount_scheduledstart_idx";

-- DropIndex
DROP INDEX "job_assignedworker_scheduledstart_idx";

-- DropIndex
DROP INDEX "payoutline_one_per_job";

-- DropIndex
DROP INDEX "SitePerformanceSnapshot_one_closed_per_site_month";

-- AlterTable
ALTER TABLE "ChecklistRun" ALTER COLUMN "templateSnapshotCapturedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ClientOrganization" ADD COLUMN     "requiredPaymentRail" "PaymentRail" NOT NULL DEFAULT 'STRIPE';

-- AlterTable
ALTER TABLE "Evidence" ALTER COLUMN "redactionAttestedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "taxJurisdiction" TEXT NOT NULL DEFAULT 'ON',
ADD COLUMN     "taxPolicyVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "taxRateBps" INTEGER NOT NULL DEFAULT 1300;

-- AlterTable
ALTER TABLE "Quote" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "WorkforceAccount" ADD COLUMN     "allowedPaymentMethod" "PaymentMethodType" NOT NULL DEFAULT 'EFT',
ADD COLUMN     "classification" "WorkforceClassification" NOT NULL DEFAULT 'CONTRACTOR',
ADD COLUMN     "complianceSuspended" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Payment" (
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

-- CreateTable
CREATE TABLE "NotificationOutbox" (
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

-- CreateTable
CREATE TABLE "TimeEntry" (
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

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_clientId_idx" ON "Payment"("clientId");

-- CreateIndex
CREATE INDEX "Payment_provider_idx" ON "Payment"("provider");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_providerRef_idx" ON "Payment"("providerRef");

-- CreateIndex
CREATE INDEX "NotificationOutbox_status_idx" ON "NotificationOutbox"("status");

-- CreateIndex
CREATE INDEX "NotificationOutbox_relatedEntityType_relatedEntityId_idx" ON "NotificationOutbox"("relatedEntityType", "relatedEntityId");

-- CreateIndex
CREATE INDEX "NotificationOutbox_channel_idx" ON "NotificationOutbox"("channel");

-- CreateIndex
CREATE INDEX "NotificationOutbox_createdAt_idx" ON "NotificationOutbox"("createdAt");

-- CreateIndex
CREATE INDEX "TimeEntry_workerId_idx" ON "TimeEntry"("workerId");

-- CreateIndex
CREATE INDEX "TimeEntry_workforceAccountId_idx" ON "TimeEntry"("workforceAccountId");

-- CreateIndex
CREATE INDEX "TimeEntry_date_idx" ON "TimeEntry"("date");

-- CreateIndex
CREATE INDEX "TimeEntry_status_idx" ON "TimeEntry"("status");

-- CreateIndex
CREATE INDEX "TimeEntry_payrollBatchRef_idx" ON "TimeEntry"("payrollBatchRef");

-- CreateIndex
CREATE INDEX "WorkforceAccount_classification_idx" ON "WorkforceAccount"("classification");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clientOrganizationId_fkey" FOREIGN KEY ("clientOrganizationId") REFERENCES "ClientOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingAdjustment" ADD CONSTRAINT "BillingAdjustment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_workforceAccountId_fkey" FOREIGN KEY ("workforceAccountId") REFERENCES "WorkforceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
