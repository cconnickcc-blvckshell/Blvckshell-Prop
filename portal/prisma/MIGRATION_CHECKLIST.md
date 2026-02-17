# Production Constraints Migration Checklist

## ✅ Already Applied (from initial migrations)

The following constraints were already created by Prisma:

1. **Worker.userId UNIQUE** - ✅ Created in `20260217204320_init` (line 329)
2. **JobCompletion.jobId UNIQUE** - ✅ Created in `20260217204320_init` (line 401)
3. **Evidence CASCADE delete** - ✅ Created in `20260217204320_init` (line 521)
4. **Job assignment XOR** - ✅ Created in `20260217204341_production_constraints`
5. **SiteAssignment XOR** - ✅ Created in `20260217204341_production_constraints`
6. **ChecklistTemplate one active per site** - ✅ Created in `20260217204341_production_constraints`

---

## ⚠️ Still Needs to be Applied

Run the migration `20260217205000_production_constraints_fix` to apply:

### 1. Stricter AccessCredential Constraint

Replace the existing `accesscredential_identifier_rule` with a stricter version that:
- For CODE: requires `identifierHash` AND requires `identifier` to be NULL or empty
- For KEY/FOB: requires `identifier` AND requires `identifierHash` to be NULL

This prevents accidentally storing plaintext codes.

### 2. Performance Indexes

Add indexes for common query patterns:
- `job_assignedworker_scheduledstart_idx` - Worker "my jobs" queries
- `job_assignedaccount_scheduledstart_idx` - Vendor/PM filtering
- `auditlog_entity_idx` - AuditLog entity lookups

---

## How to Apply

### Option 1: Via Prisma Migrate (Recommended)

```bash
cd portal
npx prisma migrate deploy
```

This will apply any pending migrations including `20260217205000_production_constraints_fix`.

### Option 2: Via Supabase SQL Editor

If Prisma migrate times out, copy the contents of:
`prisma/migrations/20260217205000_production_constraints_fix/migration.sql`

And run it directly in the Supabase SQL Editor.

---

## Verification Query

After applying, verify constraints exist:

```sql
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.relname IN ('Job', 'SiteAssignment', 'ChecklistTemplate', 'Worker', 'JobCompletion', 'AccessCredential')
ORDER BY t.relname, conname;
```

Expected constraints:
- `Job`: `job_assignment_oneof`
- `SiteAssignment`: `siteassignment_assignment_oneof`
- `AccessCredential`: `accesscredential_identifier_rules_chk` (after fix migration)
- `Worker`: `Worker_userId_key` (UNIQUE)
- `JobCompletion`: `JobCompletion_jobId_key` (UNIQUE)

Verify indexes:

```sql
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('Job', 'ChecklistTemplate', 'AuditLog')
  AND indexname IN (
    'checklisttemplate_one_active_per_site',
    'job_assignedworker_scheduledstart_idx',
    'job_assignedaccount_scheduledstart_idx',
    'auditlog_entity_idx'
  );
```

---

## Summary

**Status**: 6/8 constraints applied ✅  
**Remaining**: Stricter AccessCredential constraint + 3 performance indexes

The fix migration (`20260217205000_production_constraints_fix`) contains the remaining changes.
