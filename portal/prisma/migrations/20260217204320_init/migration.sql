-- CreateEnum
CREATE TYPE "WorkforceAccountType" AS ENUM ('INTERNAL', 'VENDOR');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'VENDOR_OWNER', 'VENDOR_WORKER', 'INTERNAL_WORKER');

-- CreateEnum
CREATE TYPE "ComplianceDocumentType" AS ENUM ('COI', 'WSIB', 'AGREEMENT', 'HST', 'OTHER');

-- CreateEnum
CREATE TYPE "AccessCredentialType" AS ENUM ('KEY', 'FOB', 'CODE');

-- CreateEnum
CREATE TYPE "AccessCredentialStatus" AS ENUM ('ACTIVE', 'LOST', 'RETURNED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('SCHEDULED', 'COMPLETED_PENDING_APPROVAL', 'APPROVED_PAYABLE', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('REQUESTED', 'APPROVED', 'ASSIGNED', 'COMPLETED', 'INVOICED', 'PAID');

-- CreateEnum
CREATE TYPE "IncidentReportType" AS ENUM ('SAFETY', 'PROPERTY_DAMAGE', 'BIOHAZARD', 'LOST_KEY', 'OTHER');

-- CreateEnum
CREATE TYPE "SuppliesProvidedBy" AS ENUM ('COMPANY', 'CLIENT', 'MIXED');

-- CreateEnum
CREATE TYPE "PayoutBatchStatus" AS ENUM ('CALCULATED', 'APPROVED', 'RELEASED', 'PAID');

-- CreateEnum
CREATE TYPE "PayoutLineStatus" AS ENUM ('PENDING', 'APPROVED', 'RELEASED', 'PAID', 'VOID');

-- CreateTable
CREATE TABLE "ClientOrganization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primaryContactName" TEXT NOT NULL,
    "primaryContactEmail" TEXT NOT NULL,
    "primaryContactPhone" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientContact" (
    "id" TEXT NOT NULL,
    "clientOrganizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkforceAccount" (
    "id" TEXT NOT NULL,
    "type" "WorkforceAccountType" NOT NULL,
    "displayName" TEXT NOT NULL,
    "legalName" TEXT,
    "primaryContactName" TEXT NOT NULL,
    "primaryContactEmail" TEXT NOT NULL,
    "primaryContactPhone" TEXT NOT NULL,
    "hstNumber" TEXT,
    "wsibAccountNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkforceAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "workforceAccountId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workforceAccountId" TEXT NOT NULL,
    "hasPhotoIdOnFile" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceDocument" (
    "id" TEXT NOT NULL,
    "workforceAccountId" TEXT NOT NULL,
    "type" "ComplianceDocumentType" NOT NULL,
    "storagePath" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "clientOrganizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "accessInstructions" TEXT,
    "serviceWindow" TEXT,
    "estimatedDurationMinutes" INTEGER,
    "requiredPhotoCount" INTEGER NOT NULL DEFAULT 4,
    "suppliesProvidedBy" "SuppliesProvidedBy" NOT NULL,
    "doNotEnterUnits" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteAssignment" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "workforceAccountId" TEXT,
    "workerId" TEXT,
    "roleOnSite" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessCredential" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "type" "AccessCredentialType" NOT NULL,
    "identifier" TEXT,
    "identifierHash" TEXT,
    "identifierHint" TEXT,
    "issuedToWorkerId" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),
    "status" "AccessCredentialStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,

    CONSTRAINT "AccessCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistTemplate" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3),
    "status" "JobStatus" NOT NULL DEFAULT 'SCHEDULED',
    "payoutAmountCents" INTEGER NOT NULL,
    "assignedWorkforceAccountId" TEXT,
    "assignedWorkerId" TEXT,
    "isMissed" BOOLEAN NOT NULL DEFAULT false,
    "missedReason" TEXT,
    "makeGoodJobId" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "actualDurationMinutes" INTEGER,
    "checkInMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobCompletion" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "completedByWorkerId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checklistResults" JSONB NOT NULL,
    "notes" TEXT,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "JobCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "jobCompletionId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "approvedByAdminId" TEXT,
    "priceCents" INTEGER NOT NULL,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'REQUESTED',
    "beforePhotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "afterPhotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "assignedWorkforceAccountId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "invoicedAt" TIMESTAMP(3),

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentReport" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "type" "IncidentReportType" NOT NULL,
    "description" TEXT NOT NULL,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,

    CONSTRAINT "IncidentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutBatch" (
    "id" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "PayoutBatchStatus" NOT NULL DEFAULT 'CALCULATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutLine" (
    "id" TEXT NOT NULL,
    "payoutBatchId" TEXT NOT NULL,
    "workforceAccountId" TEXT NOT NULL,
    "jobId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "status" "PayoutLineStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "PayoutLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorWorkerId" TEXT,
    "actorWorkforceAccountId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fromState" TEXT,
    "toState" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientOrganization_name_idx" ON "ClientOrganization"("name");

-- CreateIndex
CREATE INDEX "ClientContact_clientOrganizationId_idx" ON "ClientContact"("clientOrganizationId");

-- CreateIndex
CREATE INDEX "ClientContact_email_idx" ON "ClientContact"("email");

-- CreateIndex
CREATE INDEX "WorkforceAccount_type_idx" ON "WorkforceAccount"("type");

-- CreateIndex
CREATE INDEX "WorkforceAccount_isActive_idx" ON "WorkforceAccount"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_workforceAccountId_idx" ON "User"("workforceAccountId");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Worker_userId_key" ON "Worker"("userId");

-- CreateIndex
CREATE INDEX "Worker_userId_idx" ON "Worker"("userId");

-- CreateIndex
CREATE INDEX "Worker_workforceAccountId_idx" ON "Worker"("workforceAccountId");

-- CreateIndex
CREATE INDEX "Worker_isActive_idx" ON "Worker"("isActive");

-- CreateIndex
CREATE INDEX "ComplianceDocument_workforceAccountId_idx" ON "ComplianceDocument"("workforceAccountId");

-- CreateIndex
CREATE INDEX "ComplianceDocument_type_idx" ON "ComplianceDocument"("type");

-- CreateIndex
CREATE INDEX "ComplianceDocument_expiresAt_idx" ON "ComplianceDocument"("expiresAt");

-- CreateIndex
CREATE INDEX "Site_clientOrganizationId_idx" ON "Site"("clientOrganizationId");

-- CreateIndex
CREATE INDEX "Site_isActive_idx" ON "Site"("isActive");

-- CreateIndex
CREATE INDEX "SiteAssignment_siteId_idx" ON "SiteAssignment"("siteId");

-- CreateIndex
CREATE INDEX "SiteAssignment_workforceAccountId_idx" ON "SiteAssignment"("workforceAccountId");

-- CreateIndex
CREATE INDEX "SiteAssignment_workerId_idx" ON "SiteAssignment"("workerId");

-- CreateIndex
CREATE INDEX "SiteAssignment_isActive_idx" ON "SiteAssignment"("isActive");

-- CreateIndex
CREATE INDEX "AccessCredential_siteId_idx" ON "AccessCredential"("siteId");

-- CreateIndex
CREATE INDEX "AccessCredential_issuedToWorkerId_idx" ON "AccessCredential"("issuedToWorkerId");

-- CreateIndex
CREATE INDEX "AccessCredential_status_idx" ON "AccessCredential"("status");

-- CreateIndex
CREATE INDEX "ChecklistTemplate_siteId_idx" ON "ChecklistTemplate"("siteId");

-- CreateIndex
CREATE INDEX "ChecklistTemplate_isActive_idx" ON "ChecklistTemplate"("isActive");

-- CreateIndex
CREATE INDEX "Job_siteId_idx" ON "Job"("siteId");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "Job_assignedWorkforceAccountId_idx" ON "Job"("assignedWorkforceAccountId");

-- CreateIndex
CREATE INDEX "Job_assignedWorkerId_idx" ON "Job"("assignedWorkerId");

-- CreateIndex
CREATE INDEX "Job_scheduledStart_idx" ON "Job"("scheduledStart");

-- CreateIndex
CREATE INDEX "Job_isMissed_idx" ON "Job"("isMissed");

-- CreateIndex
CREATE UNIQUE INDEX "JobCompletion_jobId_key" ON "JobCompletion"("jobId");

-- CreateIndex
CREATE INDEX "JobCompletion_jobId_idx" ON "JobCompletion"("jobId");

-- CreateIndex
CREATE INDEX "JobCompletion_completedByWorkerId_idx" ON "JobCompletion"("completedByWorkerId");

-- CreateIndex
CREATE INDEX "JobCompletion_isDraft_idx" ON "JobCompletion"("isDraft");

-- CreateIndex
CREATE INDEX "Evidence_jobCompletionId_idx" ON "Evidence"("jobCompletionId");

-- CreateIndex
CREATE INDEX "Evidence_uploadedAt_idx" ON "Evidence"("uploadedAt");

-- CreateIndex
CREATE INDEX "WorkOrder_siteId_idx" ON "WorkOrder"("siteId");

-- CreateIndex
CREATE INDEX "WorkOrder_status_idx" ON "WorkOrder"("status");

-- CreateIndex
CREATE INDEX "WorkOrder_assignedWorkforceAccountId_idx" ON "WorkOrder"("assignedWorkforceAccountId");

-- CreateIndex
CREATE INDEX "IncidentReport_siteId_idx" ON "IncidentReport"("siteId");

-- CreateIndex
CREATE INDEX "IncidentReport_workerId_idx" ON "IncidentReport"("workerId");

-- CreateIndex
CREATE INDEX "IncidentReport_type_idx" ON "IncidentReport"("type");

-- CreateIndex
CREATE INDEX "IncidentReport_reportedAt_idx" ON "IncidentReport"("reportedAt");

-- CreateIndex
CREATE INDEX "PayoutBatch_status_idx" ON "PayoutBatch"("status");

-- CreateIndex
CREATE INDEX "PayoutBatch_periodStart_periodEnd_idx" ON "PayoutBatch"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "PayoutLine_payoutBatchId_idx" ON "PayoutLine"("payoutBatchId");

-- CreateIndex
CREATE INDEX "PayoutLine_workforceAccountId_idx" ON "PayoutLine"("workforceAccountId");

-- CreateIndex
CREATE INDEX "PayoutLine_jobId_idx" ON "PayoutLine"("jobId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_actorWorkforceAccountId_idx" ON "AuditLog"("actorWorkforceAccountId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "ClientContact" ADD CONSTRAINT "ClientContact_clientOrganizationId_fkey" FOREIGN KEY ("clientOrganizationId") REFERENCES "ClientOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_workforceAccountId_fkey" FOREIGN KEY ("workforceAccountId") REFERENCES "WorkforceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_workforceAccountId_fkey" FOREIGN KEY ("workforceAccountId") REFERENCES "WorkforceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceDocument" ADD CONSTRAINT "ComplianceDocument_workforceAccountId_fkey" FOREIGN KEY ("workforceAccountId") REFERENCES "WorkforceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_clientOrganizationId_fkey" FOREIGN KEY ("clientOrganizationId") REFERENCES "ClientOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteAssignment" ADD CONSTRAINT "SiteAssignment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteAssignment" ADD CONSTRAINT "SiteAssignment_workforceAccountId_fkey" FOREIGN KEY ("workforceAccountId") REFERENCES "WorkforceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteAssignment" ADD CONSTRAINT "SiteAssignment_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessCredential" ADD CONSTRAINT "AccessCredential_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessCredential" ADD CONSTRAINT "AccessCredential_issuedToWorkerId_fkey" FOREIGN KEY ("issuedToWorkerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTemplate" ADD CONSTRAINT "ChecklistTemplate_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_assignedWorkforceAccountId_fkey" FOREIGN KEY ("assignedWorkforceAccountId") REFERENCES "WorkforceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_assignedWorkerId_fkey" FOREIGN KEY ("assignedWorkerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_makeGoodJobId_fkey" FOREIGN KEY ("makeGoodJobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCompletion" ADD CONSTRAINT "JobCompletion_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCompletion" ADD CONSTRAINT "JobCompletion_completedByWorkerId_fkey" FOREIGN KEY ("completedByWorkerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_jobCompletionId_fkey" FOREIGN KEY ("jobCompletionId") REFERENCES "JobCompletion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_assignedWorkforceAccountId_fkey" FOREIGN KEY ("assignedWorkforceAccountId") REFERENCES "WorkforceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentReport" ADD CONSTRAINT "IncidentReport_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentReport" ADD CONSTRAINT "IncidentReport_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutLine" ADD CONSTRAINT "PayoutLine_payoutBatchId_fkey" FOREIGN KEY ("payoutBatchId") REFERENCES "PayoutBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutLine" ADD CONSTRAINT "PayoutLine_workforceAccountId_fkey" FOREIGN KEY ("workforceAccountId") REFERENCES "WorkforceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorWorkerId_fkey" FOREIGN KEY ("actorWorkerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorWorkforceAccountId_fkey" FOREIGN KEY ("actorWorkforceAccountId") REFERENCES "WorkforceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
