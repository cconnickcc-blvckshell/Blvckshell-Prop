-- CreateEnum
CREATE TYPE "ActivationInviteStatus" AS ENUM ('NONE', 'PENDING', 'QUEUED', 'SENT', 'FAILED');

-- AlterTable WorkerApplication
ALTER TABLE "WorkerApplication" ADD COLUMN "provisionedUserId" TEXT;
ALTER TABLE "WorkerApplication" ADD COLUMN "activationInviteStatus" "ActivationInviteStatus" NOT NULL DEFAULT 'NONE';

-- AlterTable ClientSignupRequest
ALTER TABLE "ClientSignupRequest" ADD COLUMN "provisionedUserId" TEXT;
ALTER TABLE "ClientSignupRequest" ADD COLUMN "provisionedOrganizationId" TEXT;
ALTER TABLE "ClientSignupRequest" ADD COLUMN "activationInviteStatus" "ActivationInviteStatus" NOT NULL DEFAULT 'NONE';

-- AlterTable AccountActivationToken
ALTER TABLE "AccountActivationToken" ADD COLUMN "deliveryTokenPlain" TEXT;

-- CreateIndex
CREATE INDEX "WorkerApplication_provisionedUserId_idx" ON "WorkerApplication"("provisionedUserId");
CREATE INDEX "ClientSignupRequest_provisionedUserId_idx" ON "ClientSignupRequest"("provisionedUserId");
