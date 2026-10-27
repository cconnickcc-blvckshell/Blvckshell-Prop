-- Shorter proposal sections and editable default tasks per area.
-- Placeholder copy only. Customized section text is kept when it is not a placeholder.

INSERT INTO "ProposalSection" ("key", "title", "body", "sortOrder", "updatedAt") VALUES
('cover_letter', 'Cover letter', '[Cover letter — edit in Settings]', 10, CURRENT_TIMESTAMP),
('our_team', 'Our team', '[Our team text — edit in Settings]', 20, CURRENT_TIMESTAMP),
('pricing', 'Pricing', '[Pricing note — edit in Settings]', 30, CURRENT_TIMESTAMP),
('special_services', 'Special services', '[Special services text — edit in Settings]', 50, CURRENT_TIMESTAMP),
('safety', 'Safety', '[Safety text — edit in Settings]', 70, CURRENT_TIMESTAMP),
('equipment', 'Equipment and supplies', '[Equipment and supplies text — edit in Settings]', 80, CURRENT_TIMESTAMP),
('invoicing', 'Invoicing and payment terms', '[Invoicing text — edit in Settings]', 90, CURRENT_TIMESTAMP),
('term', 'Term and termination', '[Term and termination text — edit in Settings]', 100, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

UPDATE "ProposalSection" AS dest
SET "body" = src."body", "updatedAt" = CURRENT_TIMESTAMP
FROM "ProposalSection" AS src
WHERE dest."key" = 'cover_letter'
  AND src."key" = 'introduction'
  AND src."body" <> '[Introduction text — edit in Settings]';

UPDATE "ProposalSection" AS dest
SET "body" = src."body", "updatedAt" = CURRENT_TIMESTAMP
FROM "ProposalSection" AS src
WHERE dest."key" = 'our_team'
  AND src."key" = 'about'
  AND src."body" <> '[About us text — edit in Settings]';

UPDATE "ProposalSection" AS dest
SET "body" = src."body", "updatedAt" = CURRENT_TIMESTAMP
FROM "ProposalSection" AS src
WHERE dest."key" = 'invoicing'
  AND src."key" = 'terms'
  AND src."body" <> '[Terms text — edit in Settings]';

UPDATE "ProposalSection" AS dest
SET "body" = src."body", "updatedAt" = CURRENT_TIMESTAMP
FROM "ProposalSection" AS src
WHERE dest."key" = 'special_services'
  AND src."key" = 'excluded'
  AND src."body" <> '[Excluded text — edit in Settings]';

UPDATE "ProposalSection"
SET "title" = 'Included at no additional cost', "sortOrder" = 40, "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'included';

UPDATE "ProposalSection"
SET "title" = 'Quality assurance', "sortOrder" = 60, "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'quality';

UPDATE "ProposalSection"
SET "title" = 'Agreement', "sortOrder" = 110, "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'acceptance';

UPDATE "QuoteSectionOverride" AS dest
SET "sectionKey" = 'cover_letter'
WHERE dest."sectionKey" = 'introduction'
  AND NOT EXISTS (
    SELECT 1 FROM "QuoteSectionOverride" AS other
    WHERE other."quoteId" = dest."quoteId" AND other."sectionKey" = 'cover_letter'
  );

UPDATE "QuoteSectionOverride" AS dest
SET "sectionKey" = 'our_team'
WHERE dest."sectionKey" = 'about'
  AND NOT EXISTS (
    SELECT 1 FROM "QuoteSectionOverride" AS other
    WHERE other."quoteId" = dest."quoteId" AND other."sectionKey" = 'our_team'
  );

UPDATE "QuoteSectionOverride" AS dest
SET "sectionKey" = 'invoicing'
WHERE dest."sectionKey" = 'terms'
  AND NOT EXISTS (
    SELECT 1 FROM "QuoteSectionOverride" AS other
    WHERE other."quoteId" = dest."quoteId" AND other."sectionKey" = 'invoicing'
  );

UPDATE "QuoteSectionOverride" AS dest
SET "sectionKey" = 'special_services'
WHERE dest."sectionKey" = 'excluded'
  AND NOT EXISTS (
    SELECT 1 FROM "QuoteSectionOverride" AS other
    WHERE other."quoteId" = dest."quoteId" AND other."sectionKey" = 'special_services'
  );

DELETE FROM "QuoteSectionOverride"
WHERE "sectionKey" NOT IN (
  'cover_letter', 'our_team', 'pricing', 'included', 'special_services',
  'quality', 'safety', 'equipment', 'invoicing', 'term', 'acceptance'
);

DELETE FROM "ProposalSection"
WHERE "key" NOT IN (
  'cover_letter', 'our_team', 'pricing', 'included', 'special_services',
  'quality', 'safety', 'equipment', 'invoicing', 'term', 'acceptance'
);

CREATE TABLE "ProposalAreaTask" (
    "id" TEXT NOT NULL,
    "areaType" "QuoteAreaType" NOT NULL,
    "description" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProposalAreaTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProposalAreaTask_areaType_idx" ON "ProposalAreaTask"("areaType");

CREATE TABLE "QuoteAreaTaskOverride" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "areaType" "QuoteAreaType" NOT NULL,
    "description" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteAreaTaskOverride_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuoteAreaTaskOverride_quoteId_areaType_idx" ON "QuoteAreaTaskOverride"("quoteId", "areaType");

ALTER TABLE "QuoteAreaTaskOverride" ADD CONSTRAINT "QuoteAreaTaskOverride_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "ProposalAreaTask" ("id", "areaType", "description", "frequency", "sortOrder", "updatedAt") VALUES
(gen_random_uuid()::text, 'LOBBY', '[Lobby task 1 — edit in Settings]', 'Each visit', 10, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'LOBBY', '[Lobby task 2 — edit in Settings]', 'Weekly', 20, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'HALLWAYS', '[Hallway task 1 — edit in Settings]', 'Each visit', 10, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'HALLWAYS', '[Hallway task 2 — edit in Settings]', 'Weekly', 20, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'STAIRWELLS', '[Stairwell task 1 — edit in Settings]', 'Each visit', 10, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'STAIRWELLS', '[Stairwell task 2 — edit in Settings]', 'Weekly', 20, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'ELEVATORS', '[Elevator task 1 — edit in Settings]', 'Each visit', 10, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'ELEVATORS', '[Elevator task 2 — edit in Settings]', 'Weekly', 20, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'GARBAGE', '[Garbage room task 1 — edit in Settings]', 'Each visit', 10, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'GARBAGE', '[Garbage room task 2 — edit in Settings]', 'Weekly', 20, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'WASHROOMS', '[Washroom task 1 — edit in Settings]', 'Each visit', 10, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'WASHROOMS', '[Washroom task 2 — edit in Settings]', 'Weekly', 20, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'GLASS', '[Glass task 1 — edit in Settings]', 'Each visit', 10, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'GLASS', '[Glass task 2 — edit in Settings]', 'Weekly', 20, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'OTHER', '[Area task 1 — edit in Settings]', 'Each visit', 10, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'OTHER', '[Area task 2 — edit in Settings]', 'Weekly', 20, CURRENT_TIMESTAMP);
