-- Payment terms on contracts and invoices, plus a daily sequence for new invoice numbers.
-- Existing invoice numbers and due dates are left as they are.

CREATE TYPE "PaymentTerms" AS ENUM ('NET_30', 'DUE_ON_COMPLETION');

ALTER TABLE "Contract" ADD COLUMN "paymentTerms" "PaymentTerms" NOT NULL DEFAULT 'NET_30';

ALTER TABLE "Invoice" ADD COLUMN "paymentTerms" "PaymentTerms" NOT NULL DEFAULT 'NET_30';
ALTER TABLE "Invoice" ADD COLUMN "paymentTermsDays" INTEGER NOT NULL DEFAULT 30;

CREATE TABLE "DocumentDailySequence" (
    "scope" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "next" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DocumentDailySequence_pkey" PRIMARY KEY ("scope", "day")
);
