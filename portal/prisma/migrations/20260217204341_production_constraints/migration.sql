-- Production constraints that cannot be expressed in Prisma schema
-- These prevent data corruption and enforce business rules at the database level

-- 1) Job: exactly one of assignedWorkforceAccountId OR assignedWorkerId must be set
ALTER TABLE "Job"
ADD CONSTRAINT job_assignment_oneof CHECK (
  num_nonnulls("assignedWorkforceAccountId", "assignedWorkerId") = 1
);

-- 2) SiteAssignment: exactly one of workforceAccountId OR workerId must be set
ALTER TABLE "SiteAssignment"
ADD CONSTRAINT siteassignment_assignment_oneof CHECK (
  num_nonnulls("workforceAccountId", "workerId") = 1
);

-- 3) ChecklistTemplate: only one active template per site (partial unique index)
CREATE UNIQUE INDEX checklisttemplate_one_active_per_site
ON "ChecklistTemplate" ("siteId")
WHERE "isActive" = true;

-- 4) AccessCredential: CODE type must have identifierHash; KEY/FOB must have identifier
-- If you have existing CODE rows with plain "identifier" and no "identifierHash", backfill
-- (e.g. hash existing identifier, set identifierHash, clear identifier) before adding this.
ALTER TABLE "AccessCredential"
ADD CONSTRAINT accesscredential_identifier_rule CHECK (
  ("type" = 'CODE' AND "identifierHash" IS NOT NULL)
  OR ("type" IN ('KEY', 'FOB') AND "identifier" IS NOT NULL)
);
