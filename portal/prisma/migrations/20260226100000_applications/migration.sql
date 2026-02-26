-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('SUBCONTRACTOR', 'INDIVIDUAL');

-- CreateTable
CREATE TABLE "WorkerApplication" (
    "id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL DEFAULT 'ON',
    "applicationType" "ApplicationType" NOT NULL,
    "companyName" TEXT,
    "hasVehicle" BOOLEAN NOT NULL DEFAULT false,
    "availableDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "availableShift" TEXT,
    "experienceYears" INTEGER,
    "experienceSummary" TEXT,
    "references" JSONB,
    "hasCOI" BOOLEAN NOT NULL DEFAULT false,
    "hasWSIB" BOOLEAN NOT NULL DEFAULT false,
    "hasDriversLicense" BOOLEAN NOT NULL DEFAULT false,
    "resumePath" TEXT,
    "coiDocPath" TEXT,
    "wsibDocPath" TEXT,
    "agreedToTerms" BOOLEAN NOT NULL DEFAULT false,
    "agreedToTermsAt" TIMESTAMP(3),
    "agreedToBackgroundCheck" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "adminNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientSignupRequest" (
    "id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "buildingCount" INTEGER,
    "buildingType" TEXT,
    "city" TEXT,
    "message" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientSignupRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkerApplication_status_idx" ON "WorkerApplication"("status");
CREATE INDEX "WorkerApplication_email_idx" ON "WorkerApplication"("email");
CREATE INDEX "WorkerApplication_createdAt_idx" ON "WorkerApplication"("createdAt");
CREATE INDEX "ClientSignupRequest_status_idx" ON "ClientSignupRequest"("status");
CREATE INDEX "ClientSignupRequest_contactEmail_idx" ON "ClientSignupRequest"("contactEmail");
