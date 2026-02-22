-- Gold Standard: Prevent double payout at DB level.
-- One PayoutLine per Job (where jobId IS NOT NULL).

-- 1) Guard: If duplicates exist, migration must FAIL loudly (do not auto-delete).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "PayoutLine"
    WHERE "jobId" IS NOT NULL
    GROUP BY "jobId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate payout lines exist for a jobId. Resolve before applying unique index.';
  END IF;
END $$;

-- 2) Enforce: one payout line per job (only where jobId is present)
CREATE UNIQUE INDEX IF NOT EXISTS payoutline_one_per_job
ON "PayoutLine" ("jobId")
WHERE "jobId" IS NOT NULL;
