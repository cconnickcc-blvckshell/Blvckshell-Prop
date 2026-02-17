-- Fix AccessCredential constraint to be stricter (prevent plaintext codes)
-- Add missing performance indexes

-- 1) Replace AccessCredential constraint with stricter version
ALTER TABLE "AccessCredential"
DROP CONSTRAINT IF EXISTS accesscredential_identifier_rule;

ALTER TABLE "AccessCredential"
ADD CONSTRAINT accesscredential_identifier_rules_chk CHECK (
  (
    "type" = 'CODE'::"AccessCredentialType"
    AND "identifierHash" IS NOT NULL
    AND ("identifier" IS NULL OR "identifier" = '')
  )
  OR
  (
    "type" <> 'CODE'::"AccessCredentialType"
    AND "identifier" IS NOT NULL
    AND "identifierHash" IS NULL
  )
);

-- 2) Performance indexes for common query patterns

-- Job queries by worker + scheduled date (worker "my jobs" list)
CREATE INDEX IF NOT EXISTS job_assignedworker_scheduledstart_idx
ON "Job" ("assignedWorkerId", "scheduledStart")
WHERE "assignedWorkerId" IS NOT NULL;

-- Job queries by workforceAccount + scheduled date (vendor/PM filtering)
CREATE INDEX IF NOT EXISTS job_assignedaccount_scheduledstart_idx
ON "Job" ("assignedWorkforceAccountId", "scheduledStart")
WHERE "assignedWorkforceAccountId" IS NOT NULL;

-- AuditLog entity lookup (composite index for efficient queries)
CREATE INDEX IF NOT EXISTS auditlog_entity_idx
ON "AuditLog" ("entityType", "entityId", "createdAt");
