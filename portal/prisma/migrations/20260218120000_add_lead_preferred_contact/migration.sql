-- AlterTable (lead preferred contact method: email | phone | either)
ALTER TABLE "Lead" ADD COLUMN "preferredContact" TEXT;
