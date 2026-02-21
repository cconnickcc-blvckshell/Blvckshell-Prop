# Schema Reconciliation Plan — Prisma ↔ Supabase

**Lead:** Engineering  
**Status:** Implemented (migrations + schema + code aligned)  
**Do not use `prisma db push` against production. Use migrations only.**

---

## 1. What changed

### 1.1 ChecklistTemplate (Phase 1 — critical)

- **Problem:** Prisma modeled one template per site (`Site.checklistTemplates` singular, `ChecklistTemplate.siteId` globally unique). The DB already allowed multiple templates per site and enforced “one active per site” via a **partial unique index** (`checklisttemplate_one_active_per_site`).
- **Fix:**
  - **DB:** New migration `20260221130000_fix_checklist_template_versioning`:
    - Adds `UNIQUE(siteId, version)` on `ChecklistTemplate` for versioned history.
    - Ensures partial unique index exists for “one active per site” (idempotent).
  - **Prisma:** `Site.checklistTemplates` is now `ChecklistTemplate[]`. `ChecklistTemplate.siteId` is no longer globally unique; added `@@unique([siteId, version])`. Optional `checklistId` added to match existing column from `add_checklist_id_to_template`.
- **Code:** All usages updated to treat `checklistTemplates` as an array and to resolve the active template (e.g. `.find(t => t.isActive)` or `[0]` when query already filters by `isActive: true`).

### 1.2 Category A — template tables and snapshot columns (Phase 2)

- **Existing migration** `20260221120000_category_a_templates_and_snapshots` (unchanged) adds:
  - Enum: `TemplateStatus` (Draft, Active, Archived).
  - Tables: `SiteTemplate`, `JobTemplate`, `ContractTemplate`, `InvoiceTemplate`, `MakeGoodRuleTemplate` (id, logicalId, version, status, body, createdById, createdAt, updatedAt; unique(logicalId, version); FKs to User).
  - Snapshot columns and FKs:
    - Site: `siteTemplateId`, `siteTemplateVersion` → SiteTemplate (ON DELETE SET NULL).
    - Job: `approvalFlaggedAt`, `jobTemplateId`, `jobTemplateVersion` → JobTemplate (ON DELETE SET NULL).
    - Contract: `contractTemplateId`, `contractTemplateVersion` → ContractTemplate (ON DELETE SET NULL).
    - Invoice: `invoiceTemplateId`, `invoiceTemplateVersion` → InvoiceTemplate (ON DELETE SET NULL).

Supabase (production) was missing all of the above; applying pending migrations brings it in line with Prisma.

### 1.3 Baseline / drift (Phase 0)

- **Status:** `prisma migrate status` showed 13 migrations in repo; only the first two were applied on the target DB (Supabase). No “migrations applied outside Prisma” drift; production is simply **behind**.
- **Resolution:** Apply all pending migrations in order with `prisma migrate deploy` (using `DIRECT_URL`). No manual baseline reset required.

---

## 2. Launch-safe definition of done

You are **truly aligned** when all of the following are true:

| Check | How to verify |
|-------|----------------|
| **All migrations applied** | `npx prisma migrate status` shows no pending migrations; no drift. |
| **Schema matches DB (no drift)** | Run `npm run db:verify` (exits 0 when Prisma schema and DB match). In CI this runs automatically after deploy (uses pooler). Locally you may get P1001 if `DIRECT_URL` points at the direct host; run in CI or temporarily unset `DIRECT_URL` so the diff uses the pooler. |
| **DB pull succeeds** | `npx prisma db pull` runs without error; schema matches. |
| **Template tables exist in Supabase** | `SiteTemplate`, `JobTemplate`, `ContractTemplate`, `InvoiceTemplate`, `MakeGoodRuleTemplate` are present (e.g. in Supabase Table Editor or `\dt` in psql). |
| **Snapshot + flag columns exist** | `Job.approvalFlaggedAt`; `Site.siteTemplateId` / `siteTemplateVersion`; `Job.jobTemplateId` / `jobTemplateVersion`; `Contract.contractTemplateId` / `contractTemplateVersion`; `Invoice.invoiceTemplateId` / `invoiceTemplateVersion`. |
| **App works without select band-aids** | Admin/job (and other) pages load without P2022. You can use normal `include` on Job/Invoice/Site if you want; the explicit `select` workarounds are no longer *required* (they can stay as a defensive choice). |

Until these are true, production is not launch-safe for the full schema.

---

## 3. Why

- **Single source of truth:** Prisma schema is the source of truth; the DB is updated only via migrations.
- **No P2022 at runtime:** Once migrations are applied, Prisma no longer selects missing columns. Existing code that uses explicit `select` on Job/Invoice/Site remains safe for future schema evolution.
- **Versioned checklists:** Multiple templates per site (by version) with “one active per site” enforced in the DB.

---

## 4. How to deploy safely

### 3.1 Prerequisites

- `DIRECT_URL` in env points at the **direct** Postgres connection (not pooler) for running migrations.
- Backup production DB before first deploy of these migrations.
- No `prisma db push` against production.

### 3.2 Local (development)

```bash
cd portal
npx prisma migrate dev
npx prisma generate
```

Use this to create new migrations and keep schema in sync. Do not use against production.

### 3.3 Production (Supabase)

```bash
cd portal
# Ensure .env or env has DIRECT_URL for Supabase direct connection
npx prisma migrate deploy
npx prisma generate
```

Apply in order: all pending migrations, including `20260221120000_category_a_templates_and_snapshots` and `20260221130000_fix_checklist_template_versioning`.

### 3.4 Resolve failed migrations (Lead table/columns already exist)

If you hit **P3018** because the DB already has the table or columns (e.g. Lead was created or altered outside migrations), mark the failing migration as applied and rerun deploy. Repeat for each failed migration until deploy succeeds.

**Example — Lead table exists:**
```bash
cd portal
npx prisma migrate resolve --applied 20260217210000_add_lead
npx prisma migrate deploy
```

**If next migration fails (e.g. column "preferredContact" already exists):**
```bash
npx prisma migrate resolve --applied 20260218120000_add_lead_preferred_contact
npx prisma migrate deploy
```

**If 20260218130000_update_lead_fields fails (buildingAddress / frequency / callbackTime already exist):**
```bash
npx prisma migrate resolve --applied 20260218130000_update_lead_fields
npx prisma migrate deploy
```

**If 20260218170000_evidence_item_redaction fails (constraint Evidence_checklistRunId_fkey already exists):**
```bash
npx prisma migrate resolve --applied 20260218170000_evidence_item_redaction
npx prisma migrate deploy
```

**Generic:** For any P3018 where the DB already has the table/column/constraint, run `npx prisma migrate resolve --applied <migration_folder_name>` then `npx prisma migrate deploy` again. Repeat until deploy succeeds.

Optional: confirm in Supabase SQL before resolving:
```sql
SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Lead' ORDER BY ordinal_position;
```

### 3.5 Validate after deploy

```bash
npx prisma migrate status
# Expect: "Database schema is up to date."

npm run db:verify
# Exits 0 if Prisma schema and DB match (no drift). Exits 2 if there is drift (fix schema or migrations).
# Locally: if you get P1001 (direct host unreachable), the diff is using DIRECT_URL. Run in CI (where DIRECT_URL is ""), or temporarily unset DIRECT_URL and use pooler only.

npx prisma db pull
# Then diff prisma/schema.prisma with the pulled schema (or re-pull and overwrite to confirm no drift).
```

Run the app and hit routes that use Job, Invoice, Site, and ChecklistTemplate; confirm no P2022 or relation errors.

---

## 5. Migration order (as applied by `migrate deploy`)

1. `20260217204320_init`
2. `20260217204341_production_constraints` (includes partial unique index on ChecklistTemplate)
3. `20260217205000_production_constraints_fix`
4. `20260217210000_add_lead`
5. … (lead updates, evidence, billing/invoice/contract, payout line, checklist id, client portal)
6. `20260221120000_category_a_templates_and_snapshots`
7. `20260221130000_fix_checklist_template_versioning`

---

## 6. Rollback / reversibility

- **Category A:** Reversing would require a new migration that drops template tables and snapshot columns (and FKs). Not provided here; add only if rollback is required.
- **ChecklistTemplate versioning:** Reversing would require dropping `ChecklistTemplate_siteId_version_key` and optionally restoring a global unique on `siteId` (not recommended; would conflict with “one active per site” partial index). Prefer forward-only.

---

## 7. Enums (Phase 3)

- Prisma enum names and values are aligned with the migrations and existing DB enums (e.g. `ChecklistRunStatus`, `InvoiceStatus`, `JobStatus`, `TemplateStatus`). Postgres enums are case-sensitive; do not change casing without a migration that safely migrates enum values.

---

## 8. Prisma query policy (Phase 4)

See `docs/PRISMA_QUERY_POLICY.md` (or same content in repo): use explicit `select` on Job, Invoice, and Site where schema may evolve; avoid broad `include` on these models without listing relations so that new columns do not cause runtime P2022.

---

## 9. Execution plan (Phase 5)

### Local (dev)

```bash
cd portal
npx prisma migrate dev
npx prisma generate
```

### Production (Supabase)

```bash
cd portal
# Set DIRECT_URL to Supabase direct Postgres URL (not pooler)
npx prisma migrate deploy
npx prisma generate
```

### Validate (no drift)

```bash
npx prisma migrate status
# Expected: "Database schema is up to date." (all migrations applied)

npm run db:verify
# Exits 0 when schema and DB match (in CI; locally use pooler only or run in CI)

npx prisma db pull
# Optional: compare or overwrite schema to confirm pull matches schema.prisma
```

### Proof steps

1. **`prisma migrate status`** — No pending migrations after deploy; no “drift” warning.
2. **`npm run db:verify`** — Exits 0 (Prisma schema and DB match). Run in CI after deploy, or locally with pooler only (DIRECT_URL unset) to avoid P1001.
3. **`prisma db pull`** — Succeeds; schema matches (or can be diffed).
4. **Runtime** — No query selects missing columns: all Job/Invoice/Site reads use explicit `select` or are covered by the audit in `PRISMA_SCHEMA_CTO_AUDIT.md`.

---

**Document version:** 1.0  
**Last updated:** 2025-02-21
