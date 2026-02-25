-- CreateTable
CREATE TABLE "RateCard" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateCardEntry" (
    "id" TEXT NOT NULL,
    "rateCardId" TEXT NOT NULL,
    "areaType" "QuoteAreaType" NOT NULL,
    "size" TEXT NOT NULL,
    "sizeLabel" TEXT NOT NULL,
    "finish" TEXT NOT NULL,
    "finishLabel" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RateCardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RateCard_version_key" ON "RateCard"("version");

-- CreateIndex
CREATE INDEX "RateCard_isActive_idx" ON "RateCard"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RateCardEntry_rateCardId_areaType_size_finish_key" ON "RateCardEntry"("rateCardId", "areaType", "size", "finish");

-- CreateIndex
CREATE INDEX "RateCardEntry_rateCardId_idx" ON "RateCardEntry"("rateCardId");

-- CreateIndex
CREATE INDEX "RateCardEntry_areaType_idx" ON "RateCardEntry"("areaType");

-- AddForeignKey
ALTER TABLE "RateCardEntry" ADD CONSTRAINT "RateCardEntry_rateCardId_fkey" FOREIGN KEY ("rateCardId") REFERENCES "RateCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
