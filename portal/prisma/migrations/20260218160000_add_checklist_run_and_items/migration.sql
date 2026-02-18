-- CreateEnum
CREATE TYPE "ChecklistRunStatus" AS ENUM ('InProgress', 'Submitted', 'Approved', 'Rejected');

-- CreateTable
CREATE TABLE "ChecklistRun" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "checklistTemplateId" TEXT NOT NULL,
    "templateVersion" INTEGER NOT NULL,
    "status" "ChecklistRunStatus" NOT NULL DEFAULT 'InProgress',
    "completedByWorkerId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistRunItem" (
    "id" TEXT NOT NULL,
    "checklistRunId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "failReason" TEXT,
    "note" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedByWorkerId" TEXT,

    CONSTRAINT "ChecklistRunItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChecklistRun_jobId_idx" ON "ChecklistRun"("jobId");
CREATE INDEX "ChecklistRun_checklistTemplateId_idx" ON "ChecklistRun"("checklistTemplateId");
CREATE INDEX "ChecklistRun_completedByWorkerId_idx" ON "ChecklistRun"("completedByWorkerId");
CREATE INDEX "ChecklistRun_status_idx" ON "ChecklistRun"("status");
CREATE UNIQUE INDEX "ChecklistRunItem_checklistRunId_itemId_key" ON "ChecklistRunItem"("checklistRunId", "itemId");
CREATE INDEX "ChecklistRunItem_checklistRunId_idx" ON "ChecklistRunItem"("checklistRunId");

-- AddForeignKey
ALTER TABLE "ChecklistRun" ADD CONSTRAINT "ChecklistRun_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChecklistRun" ADD CONSTRAINT "ChecklistRun_checklistTemplateId_fkey" FOREIGN KEY ("checklistTemplateId") REFERENCES "ChecklistTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChecklistRun" ADD CONSTRAINT "ChecklistRun_completedByWorkerId_fkey" FOREIGN KEY ("completedByWorkerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChecklistRunItem" ADD CONSTRAINT "ChecklistRunItem_checklistRunId_fkey" FOREIGN KEY ("checklistRunId") REFERENCES "ChecklistRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChecklistRunItem" ADD CONSTRAINT "ChecklistRunItem_completedByWorkerId_fkey" FOREIGN KEY ("completedByWorkerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
