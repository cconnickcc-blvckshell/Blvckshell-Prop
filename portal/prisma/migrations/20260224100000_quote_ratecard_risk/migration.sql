-- CreateEnum
CREATE TYPE "BuildingClass" AS ENUM ('POOR', 'AVERAGE', 'PREMIUM');

-- AlterTable Quote: riskFactors (Json), buildingClass (BuildingClass)
ALTER TABLE "Quote" ADD COLUMN "riskFactors" JSONB;
ALTER TABLE "Quote" ADD COLUMN "buildingClass" "BuildingClass";

-- AlterTable QuoteSnapshot: rateCardRef
ALTER TABLE "QuoteSnapshot" ADD COLUMN "rateCardRef" TEXT;
