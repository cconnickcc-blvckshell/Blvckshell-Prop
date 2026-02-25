-- CreateTable
CREATE TABLE "RecurringSchedule" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "assignedWorkerId" TEXT,
    "assignedWorkforceAccountId" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "estimatedDurationMinutes" INTEGER NOT NULL DEFAULT 60,
    "payoutAmountCents" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastGeneratedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringSchedule_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Site" ADD COLUMN "qualityScore" INTEGER;
ALTER TABLE "Site" ADD COLUMN "qualityTrend" TEXT;

-- CreateIndex
CREATE INDEX "RecurringSchedule_siteId_idx" ON "RecurringSchedule"("siteId");
CREATE INDEX "RecurringSchedule_assignedWorkerId_idx" ON "RecurringSchedule"("assignedWorkerId");
CREATE INDEX "RecurringSchedule_isActive_idx" ON "RecurringSchedule"("isActive");
CREATE INDEX "RecurringSchedule_dayOfWeek_idx" ON "RecurringSchedule"("dayOfWeek");

-- AddForeignKey
ALTER TABLE "RecurringSchedule" ADD CONSTRAINT "RecurringSchedule_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecurringSchedule" ADD CONSTRAINT "RecurringSchedule_assignedWorkerId_fkey" FOREIGN KEY ("assignedWorkerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
