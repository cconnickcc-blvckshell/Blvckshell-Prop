# Prisma schema vs Supabase — gap summary

**Purpose:** List differences between current Prisma schema and the Supabase SQL you have, and how to sync.

---

## Summary

| Category | Count |
|----------|--------|
| **New tables** (missing in Supabase) | 3 |
| **New enums** (missing in Supabase) | 7 |
| **New columns on existing tables** | 15+ |
| **Index/constraint changes** | Several (drops + re-adds in existing migrations) |

Supabase is **behind** the current Prisma schema (post–workforce and worker-portal merges). Running the **sync migration** below will bring Supabase in line.

---

## 1. New tables (in Prisma, not in your Supabase SQL)

| Table | Purpose |
|-------|---------|
| **Payment** | Stripe/payment tracking per invoice (provider, providerRef, amountCents, status, settledAt, etc.) |
| **NotificationOutbox** | Durable notification queue (channel, templateKey, recipient, payload, status) |
| **TimeEntry** | Payroll time (workerId, workforceAccountId, jobId, date, regularMinutes, overtimeMinutes, rateCentsPerHour, status) |

---

## 2. New enums (in Prisma, not in Supabase)

- `PaymentRail` — STRIPE, SPARC, EFT, CHEQUE  
- `PaymentStatus` — PENDING, SETTLED, FAILED, REFUNDED  
- `NotificationChannel` — EMAIL, SMS  
- `NotificationStatus` — PENDING, SENT, FAILED  
- `WorkforceClassification` — EMPLOYEE, CONTRACTOR  
- `PaymentMethodType` — PAYROLL, EFT, CHEQUE  
- `TimeEntryStatus` — DRAFT, SUBMITTED, APPROVED, EXPORTED, PAID  

---

## 3. New columns on existing tables

| Table | Column | Type | Notes |
|-------|--------|------|--------|
| **ClientOrganization** | requiredPaymentRail | PaymentRail | DEFAULT 'STRIPE' |
| **WorkforceAccount** | classification | WorkforceClassification | DEFAULT 'CONTRACTOR' |
| **WorkforceAccount** | allowedPaymentMethod | PaymentMethodType | DEFAULT 'EFT' |
| **WorkforceAccount** | complianceSuspended | boolean | DEFAULT false |
| **Worker** | availabilityNotes | text | nullable |
| **Worker** | preferredShifts | text[] | DEFAULT '{}' |
| **Worker** | unavailableDates | timestamp(3)[] | DEFAULT '{}' |
| **Site** | lat | double precision | nullable |
| **Site** | lng | double precision | nullable |
| **Job** | checkedInAt | timestamp(3) | nullable |
| **Job** | checkedOutAt | timestamp(3) | nullable |
| **Invoice** | taxJurisdiction | text | DEFAULT 'ON' |
| **Invoice** | taxRateBps | integer | DEFAULT 1300 |
| **Invoice** | taxPolicyVersion | integer | DEFAULT 1 |

---

## 4. Optional / timestamp precision

- **ChecklistRun.templateSnapshotCapturedAt** — Prisma uses `DateTime` (TIMESTAMP(3)); your Supabase may use `timestamp with time zone` without precision. Functionally fine; only matters if you want exact match.
- **Evidence.redactionAttestedAt** — Same; Prisma TIMESTAMP(3).
- **Quote.updatedAt** — Prisma can drop default; migration may alter.

---

## 5. Optional: unique constraint on User.email

Prisma has `User.email` as `@unique`. Your Supabase SQL does not show a unique constraint on `User.email`. If you want to enforce it:

```sql
-- Only run if you have no duplicate emails
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
```

---

## 6. How to sync Supabase

**Option A — Use Prisma Migrate (recommended if Supabase has `_prisma_migrations`)**

1. Point `schema.prisma` datasource `url` at your Supabase Postgres connection string.
2. Run:
   ```bash
   cd portal && npx prisma migrate deploy
   ```
   This applies all pending migrations in order. If Supabase was created from an older branch, only migrations **after** the last applied one will run. If Supabase was created manually from the SQL you pasted, **do not** use `migrate deploy` as-is (migration history won’t match); use Option B.

**Option B — Run the standalone sync migration (no Prisma history)**

Use the migration file created at:

`portal/prisma/migrations/20260226000000_supabase_sync_from_prisma/migration.sql`

Run that SQL once against your Supabase database (e.g. Supabase SQL Editor, or `psql`). It uses `IF NOT EXISTS` / `DO $$` so it’s safe to run even if some objects already exist (e.g. from a partial apply).

**After syncing**

1. Regenerate Prisma client: `npx prisma generate` (optional; only if you use Prisma against this DB).
2. Optionally introspect Supabase to confirm: `npx prisma db pull` (then diff schema if you want).
3. Mark the migration as applied if you use Prisma Migrate and ran the SQL manually:
   ```sql
   INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, applied_steps_count)
   VALUES ('<uuid>', '<checksum>', now(), '20260226000000_supabase_sync_from_prisma', NULL, 1);
   ```
   (Generate a UUID and use the checksum from the migration file if needed.)

---

*See `portal/prisma/migrations/20260226000000_supabase_sync_from_prisma/migration.sql` for the actual SQL.*
