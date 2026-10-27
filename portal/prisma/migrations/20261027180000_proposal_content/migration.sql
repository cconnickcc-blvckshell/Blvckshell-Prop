-- Proposal reference, quote payment terms, and editable proposal section text.
-- Existing quote rows keep their other fields. Narrative bodies are placeholders only.

ALTER TABLE "Quote" ADD COLUMN "proposalReference" TEXT;
ALTER TABLE "Quote" ADD COLUMN "paymentTerms" "PaymentTerms" NOT NULL DEFAULT 'NET_30';
ALTER TABLE "Quote" ADD COLUMN "paymentTermsDays" INTEGER NOT NULL DEFAULT 30;

CREATE UNIQUE INDEX "Quote_proposalReference_key" ON "Quote"("proposalReference");

CREATE TABLE "ProposalSection" (
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProposalSection_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "QuoteSectionOverride" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteSectionOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuoteSectionOverride_quoteId_sectionKey_key" ON "QuoteSectionOverride"("quoteId", "sectionKey");
CREATE INDEX "QuoteSectionOverride_quoteId_idx" ON "QuoteSectionOverride"("quoteId");

ALTER TABLE "QuoteSectionOverride" ADD CONSTRAINT "QuoteSectionOverride_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "ProposalSection" ("key", "title", "body", "sortOrder", "updatedAt") VALUES
('introduction', 'Introduction', '[Introduction text — edit in Settings]', 10, CURRENT_TIMESTAMP),
('about', 'About us', '[About us text — edit in Settings]', 20, CURRENT_TIMESTAMP),
('quality', 'Quality assurance', '[Quality assurance text — edit in Settings]', 30, CURRENT_TIMESTAMP),
('included', 'Included', '[Included text — edit in Settings]', 40, CURRENT_TIMESTAMP),
('excluded', 'Excluded', '[Excluded text — edit in Settings]', 50, CURRENT_TIMESTAMP),
('turnover', 'Unit turnovers', '[Unit turnover text — edit in Settings]', 60, CURRENT_TIMESTAMP),
('post_construction', 'Post-construction', '[Post-construction text — edit in Settings]', 70, CURRENT_TIMESTAMP),
('assumptions', 'Assumptions', '[Assumptions text — edit in Settings]', 80, CURRENT_TIMESTAMP),
('change_control', 'Change control', '[Change control text — edit in Settings]', 90, CURRENT_TIMESTAMP),
('terms', 'Terms', '[Terms text — edit in Settings]', 100, CURRENT_TIMESTAMP),
('acceptance', 'Acceptance', '[Acceptance text — edit in Settings]', 110, CURRENT_TIMESTAMP);
