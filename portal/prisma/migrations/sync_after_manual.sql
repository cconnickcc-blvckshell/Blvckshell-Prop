-- Run this in Supabase SQL Editor to record the migration (sync Prisma history).
-- Prefer running from your machine instead: cd portal && npx prisma migrate resolve --applied 20260218160000_add_checklist_run_and_items

INSERT INTO "_prisma_migrations" (
  "id",
  "checksum",
  "finished_at",
  "migration_name",
  "logs",
  "rolled_back_at",
  "started_at",
  "applied_steps_count"
)
SELECT
  gen_random_uuid()::text,
  '',
  NOW(),
  '20260218160000_add_checklist_run_and_items',
  NULL,
  NULL,
  NOW(),
  1
FROM (SELECT 1) AS d
WHERE NOT EXISTS (
  SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20260218160000_add_checklist_run_and_items'
);

-- If you applied 20260218170000_evidence_item_redaction manually, uncomment and run the block below (or: npx prisma migrate resolve --applied 20260218170000_evidence_item_redaction)
/*
INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
)
SELECT gen_random_uuid()::text, '', NOW(), '20260218170000_evidence_item_redaction', NULL, NULL, NOW(), 1
FROM (SELECT 1) AS d
WHERE NOT EXISTS (
  SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20260218170000_evidence_item_redaction'
);
*/

-- If you applied 20260218180000_add_billing_invoice_contract manually, uncomment and run the block below (or: npx prisma migrate resolve --applied 20260218180000_add_billing_invoice_contract)
/*
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
SELECT gen_random_uuid()::text, '', NOW(), '20260218180000_add_billing_invoice_contract', NULL, NULL, NOW(), 1
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20260218180000_add_billing_invoice_contract');
*/

-- If you applied 20260218190000_payout_line_description_site manually, uncomment and run the block below (or: npx prisma migrate resolve --applied 20260218190000_payout_line_description_site)
/*
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
SELECT gen_random_uuid()::text, '', NOW(), '20260218190000_payout_line_description_site', NULL, NULL, NOW(), 1
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20260218190000_payout_line_description_site');
*/
