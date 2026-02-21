-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('Draft', 'Active', 'Archived');

-- CreateTable SiteTemplate
CREATE TABLE "SiteTemplate" (
    "id" TEXT NOT NULL,
    "logicalId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "TemplateStatus" NOT NULL DEFAULT 'Draft',
    "body" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable JobTemplate
CREATE TABLE "JobTemplate" (
    "id" TEXT NOT NULL,
    "logicalId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "TemplateStatus" NOT NULL DEFAULT 'Draft',
    "body" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable ContractTemplate
CREATE TABLE "ContractTemplate" (
    "id" TEXT NOT NULL,
    "logicalId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "TemplateStatus" NOT NULL DEFAULT 'Draft',
    "body" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable InvoiceTemplate
CREATE TABLE "InvoiceTemplate" (
    "id" TEXT NOT NULL,
    "logicalId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "TemplateStatus" NOT NULL DEFAULT 'Draft',
    "body" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable MakeGoodRuleTemplate
CREATE TABLE "MakeGoodRuleTemplate" (
    "id" TEXT NOT NULL,
    "logicalId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "TemplateStatus" NOT NULL DEFAULT 'Draft',
    "body" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MakeGoodRuleTemplate_pkey" PRIMARY KEY ("id")
);

-- Site: snapshot fields + FK
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "siteTemplateId" TEXT;
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "siteTemplateVersion" INTEGER;
ALTER TABLE "Site" ADD CONSTRAINT "Site_siteTemplateId_fkey" FOREIGN KEY ("siteTemplateId") REFERENCES "SiteTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Site_siteTemplateId_idx" ON "Site"("siteTemplateId");

-- Job: snapshot fields + approvalFlaggedAt + FK
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "approvalFlaggedAt" TIMESTAMP(3);
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "jobTemplateId" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "jobTemplateVersion" INTEGER;
ALTER TABLE "Job" ADD CONSTRAINT "Job_jobTemplateId_fkey" FOREIGN KEY ("jobTemplateId") REFERENCES "JobTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Job_jobTemplateId_idx" ON "Job"("jobTemplateId");

-- Contract: snapshot fields + FK
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "contractTemplateId" TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "contractTemplateVersion" INTEGER;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_contractTemplateId_fkey" FOREIGN KEY ("contractTemplateId") REFERENCES "ContractTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Contract_contractTemplateId_idx" ON "Contract"("contractTemplateId");

-- Invoice: snapshot fields + FK
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "invoiceTemplateId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "invoiceTemplateVersion" INTEGER;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_invoiceTemplateId_fkey" FOREIGN KEY ("invoiceTemplateId") REFERENCES "InvoiceTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Invoice_invoiceTemplateId_idx" ON "Invoice"("invoiceTemplateId");

-- Unique constraints and indexes for templates
CREATE UNIQUE INDEX IF NOT EXISTS "SiteTemplate_logicalId_version_key" ON "SiteTemplate"("logicalId", "version");
CREATE INDEX IF NOT EXISTS "SiteTemplate_logicalId_idx" ON "SiteTemplate"("logicalId");
CREATE INDEX IF NOT EXISTS "SiteTemplate_status_idx" ON "SiteTemplate"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "JobTemplate_logicalId_version_key" ON "JobTemplate"("logicalId", "version");
CREATE INDEX IF NOT EXISTS "JobTemplate_logicalId_idx" ON "JobTemplate"("logicalId");
CREATE INDEX IF NOT EXISTS "JobTemplate_status_idx" ON "JobTemplate"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "ContractTemplate_logicalId_version_key" ON "ContractTemplate"("logicalId", "version");
CREATE INDEX IF NOT EXISTS "ContractTemplate_logicalId_idx" ON "ContractTemplate"("logicalId");
CREATE INDEX IF NOT EXISTS "ContractTemplate_status_idx" ON "ContractTemplate"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "InvoiceTemplate_logicalId_version_key" ON "InvoiceTemplate"("logicalId", "version");
CREATE INDEX IF NOT EXISTS "InvoiceTemplate_logicalId_idx" ON "InvoiceTemplate"("logicalId");
CREATE INDEX IF NOT EXISTS "InvoiceTemplate_status_idx" ON "InvoiceTemplate"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "MakeGoodRuleTemplate_logicalId_version_key" ON "MakeGoodRuleTemplate"("logicalId", "version");
CREATE INDEX IF NOT EXISTS "MakeGoodRuleTemplate_logicalId_idx" ON "MakeGoodRuleTemplate"("logicalId");
CREATE INDEX IF NOT EXISTS "MakeGoodRuleTemplate_status_idx" ON "MakeGoodRuleTemplate"("status");

-- FKs from templates to User
ALTER TABLE "SiteTemplate" ADD CONSTRAINT "SiteTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "JobTemplate" ADD CONSTRAINT "JobTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ContractTemplate" ADD CONSTRAINT "ContractTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InvoiceTemplate" ADD CONSTRAINT "InvoiceTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MakeGoodRuleTemplate" ADD CONSTRAINT "MakeGoodRuleTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
