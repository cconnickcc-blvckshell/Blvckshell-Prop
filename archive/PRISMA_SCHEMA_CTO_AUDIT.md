# Prisma vs Production Database – CTO Audit Report

**Date:** 2025-02-21  
**Scope:** Line-by-line audit of Prisma usage vs Supabase (production) schema.  
**Goal:** Identify every failure point, fix applied, and residual risk.

---

## 1. Executive Summary

Production (Supabase) is missing columns and tables that exist in the Prisma schema (“Category A” / template migrations). When Prisma runs a query that selects those columns (e.g. via `include` or default `SELECT *`), the driver returns **P2022 ColumnNotFound**. This caused 500s on worker job detail, invoice PDF, admin invoice detail, and could affect other routes.

**Mitigation applied:** All reads of `Job`, `Invoice`, and `Site` that are used before the migration now use **explicit `select`** and omit the missing columns. Writes that touch missing columns are either avoided or guarded (try/catch P2022).

**Recommendation:** Run the Category A migration in production so schema and code match, then optionally relax explicit selects. Until then, the codebase is hardened to run against the current production schema.

---

## 2. Schema Mismatch (Prisma vs Supabase)

### 2.1 Columns in Prisma NOT in production

| Model   | Column(s) not in production     | Notes |
|--------|-----------------------------------|-------|
| **Job** | `approvalFlaggedAt`, `jobTemplateId`, `jobTemplateVersion` | Template / approval-flagging feature |
| **Invoice** | `invoiceTemplateId`, `invoiceTemplateVersion` | Template feature |
| **Site** | `siteTemplateId`, `siteTemplateVersion` | Template feature |

### 2.2 Tables in Prisma not in production (if migrations not run)

- `JobTemplate`, `InvoiceTemplate`, `SiteTemplate`, `ContractTemplate`, `MakeGoodRuleTemplate`
- Any other tables introduced in the same migration(s).

Production schema (Supabase) does **not** define these template tables or the above columns on Job/Invoice/Site.

### 2.3 Safe models (no mismatch)

- `AccessCredential`, `AuditLog`, `BillingAdjustment`, `ChecklistRun`, `ChecklistRunItem`, `ChecklistTemplate`
- `ClientContact`, `ClientOrganization`, `ComplianceDocument`, `Contract`, `Evidence`, `IncidentReport`
- `InvoiceLineItem`, `JobCompletion`, `Lead`, `PayoutBatch`, `PayoutLine`
- `SiteAssignment`, `User`, `WorkOrder`, `Worker`, `WorkforceAccount`

Queries that only touch these (or use explicit `select` on Job/Invoice/Site) do not hit the missing columns.

---

## 3. Error History and Root Causes

| Observed error | Route / context | Root cause |
|----------------|-----------------|------------|
| `prisma.invoice.findUnique()` – column (not available) | `/admin/invoices/[id]`, `GET /api/invoices/[id]/pdf` | `include` caused full Invoice select including `invoiceTemplateId`, `invoiceTemplateVersion`. |
| `prisma.job.findMany()` – column (not available) | `(worker)/jobs` page | `include` caused full Job select including `approvalFlaggedAt`, `jobTemplateId`, `jobTemplateVersion`. |
| `prisma.job.findUnique()` – column (not available) | `(worker)/jobs/[id]` page | (1) Page’s own `findUnique` was fixed with select; (2) **`createOrGetChecklistRun()`** still used `include` and pulled all Job (and Site) columns. |

---

## 4. Files Changed (Fixes Applied)

### 4.1 Worker and vendor job flows

| File | Change |
|------|--------|
| `src/app/(worker)/jobs/page.tsx` | `job.findMany`: replaced `include` with `select` (id, scheduledStart, status, site, completion). |
| `src/app/(worker)/jobs/[id]/page.tsx` | `job.findUnique`: replaced `include` with full explicit `select` (all Job fields except approvalFlaggedAt, jobTemplateId, jobTemplateVersion; Site without siteTemplateId/siteTemplateVersion). |
| `src/app/(worker)/vendor/jobs/page.tsx` | `job.findMany`: replaced `include` with `select`. |
| `src/app/(worker)/earnings/page.tsx` | `job.findMany`: replaced `include` with `select`. |
| `src/server/actions/checklist-run-actions.ts` | **createOrGetChecklistRun:** `job.findUnique` replaced `include` with `select` (id, assignedWorkerId, status, site.checklistTemplates, completion, checklistRuns with items). **submitChecklistRun:** `checklistRun.findUnique` replaced `include` on `job` with `select` (id, assignedWorkerId, status, site.requiredPhotoCount, completion.evidence). |

### 4.2 Invoice flows

| File | Change |
|------|--------|
| `src/server/actions/invoice-actions.ts` | **getInvoiceWithDetails:** `invoice.findUnique` uses explicit `select` (all Invoice fields except invoiceTemplateId/invoiceTemplateVersion; nested lineItems, adjustments, jobs). **getUninvoicedApprovedJobs:** `job.findMany` uses `select` (id, scheduledStart, site, completion). **addJobToInvoice:** `job.findUnique` uses `select` (id, siteId, scheduledStart, payoutAmountCents, billableAmountCents, site). |
| `src/app/api/invoices/[id]/pdf/route.ts` | `invoice.findUnique` uses explicit `select` (no template columns); adjustments select includes `reasonCode`. |

### 4.3 Client portal

| File | Change |
|------|--------|
| `src/app/(client)/client/jobs/[id]/page.tsx` | `job.findFirst`: replaced `include` with `select` (id, scheduledStart, status, site, completion with evidence). |
| `src/app/(client)/client/invoices/[id]/page.tsx` | `invoice.findFirst`: replaced `include` with `select` (invoice fields without template columns; lineItems; adjustments with reasonCode; subtotalCents, taxCents). |

### 4.4 Automation and actions

| File | Change |
|------|--------|
| `src/server/automation/flagOverdueApprovals.ts` | Removed `approvalFlaggedAt` from `where` (so query runs). `job.update({ approvalFlaggedAt })` wrapped in try/catch; on P2022 (ColumnNotFound) we skip the update and still write the audit log. |
| `src/server/actions/job-actions.ts` | **submitCompletion:** `job.findUnique` replaced `include` with `select` (id, assignedWorkerId, status, site.requiredPhotoCount, completion.evidence). |
| `src/server/actions/payout-actions.ts` | **createPayoutBatch:** `job.findMany` replaced `include` with `select` (id, scheduledStart, payoutAmountCents, assignedWorkforceAccountId, assignedWorkerId, site, assignedWorkforceAccount, assignedWorker.workforceAccount, checklistRuns). |

### 4.5 Already safe (no code change)

- **state-machine.ts:** `job.findUnique` already uses `select: { status: true }`.
- **createMakeGoodJobIfNeeded:** `job.findUnique` already uses explicit `select`; `job.create` only sets existing columns.
- **ensureJobOnDraftInvoice:** `job.findUnique` and `invoice.findFirst` already use `select`.
- **rbac (canAccessJob, canAccessInvoice):** use `select` with limited fields.
- **admin/jobs/page.tsx, admin/jobs/[id]/page.tsx, admin/payouts/page.tsx:** already use explicit `select` for Job/Site.
- **admin/jobs/new:** `site.findMany` uses explicit `select` (no siteTemplateId/siteTemplateVersion).
- **admin/clients/[id]/checklist-actions:** `site.findUnique` uses `select: { clientOrganizationId: true }`.
- **Bulk job/invoice actions:** use `select` (e.g. id, status) or `findFirst` with `select: { id }`.
- **Client dashboard:** uses `count()` only.
- **Client jobs list, invoices list, sites list:** use `select` or count.

---

## 5. Potential Issues and Residual Risk

### 5.1 flagOverdueApprovals

- **Issue:** Without `approvalFlaggedAt` in the DB we cannot filter “not already flagged,” so the same overdue jobs can be re-flagged every run (audit log only; update is skipped when column is missing).
- **Risk:** Duplicate audit entries for “ApprovalFlagged” until migration.
- **Mitigation:** Acceptable for pre-migration; after migration, idempotency is restored.

### 5.2 job.create / job.update elsewhere

- **job.create** (e.g. admin create job, make-good job): Only fields in `data` are written; we do not set `approvalFlaggedAt`, `jobTemplateId`, or `jobTemplateVersion`, so no P2022 from these creates.
- **job.update** (e.g. cancel, status transition): Call sites use `data: { status: ... }` or similar; no update in the audited code sets the missing columns except `flagOverdueApprovals`, which is now guarded.

### 5.3 Invoice / Site create and update

- Same idea: if any code path writes `invoiceTemplateId`, `invoiceTemplateVersion`, `siteTemplateId`, or `siteTemplateVersion`, it will fail in production until the migration. A quick grep shows no such writes in the current codebase; new features that set these must be gated or deployed after the migration.

### 5.4 ChecklistRun and ChecklistTemplate

- Supabase has `ChecklistRun` and `ChecklistTemplate` with the expected columns; no mismatch. Relation from Site to ChecklistTemplate is one-to-one; we only select it, so no extra columns are pulled from Site when using `site: { select: { checklistTemplates: ... } }`.

### 5.5 Contract.findMany with include site

- `invoice-actions.ts` uses `contract.findMany` with `include: { site: { select: { name: true } } }`. Contract has no template columns in production; Site is only selected with `name`, so `siteTemplateId`/`siteTemplateVersion` are not selected. No change required.

---

## 6. Checklist: All Prisma Usages of Job, Invoice, Site

| Location | Operation | Status |
|----------|-----------|--------|
| (worker)/jobs/page.tsx | job.findMany | Fixed – select |
| (worker)/jobs/[id]/page.tsx | job.findUnique | Fixed – select |
| (worker)/vendor/jobs/page.tsx | job.findMany | Fixed – select |
| (worker)/earnings/page.tsx | job.findMany | Fixed – select |
| (worker)/vendor/earnings/page.tsx | job.findMany | Already select { id, status } |
| checklist-run-actions.ts (createOrGetChecklistRun) | job.findUnique | Fixed – select |
| checklist-run-actions.ts (submitChecklistRun) | checklistRun.findUnique → job | Fixed – job select |
| checklist-run-actions.ts (saveChecklistRunItem) | checklistRun.findUnique → job | job select { id, assignedWorkerId, status } – OK |
| invoice-actions.ts (getUninvoicedApprovedJobs) | job.findMany | Fixed – select |
| invoice-actions.ts (addJobToInvoice) | job.findUnique | Fixed – select |
| invoice-actions.ts (getInvoiceWithDetails) | invoice.findUnique | Fixed – select |
| invoice-actions.ts (listInvoices, others) | invoice.findMany/Unique | Already select or minimal – OK |
| api/invoices/[id]/pdf/route.ts | invoice.findUnique | Fixed – select |
| (client)/client/jobs/page.tsx | job.findMany | Already select – OK |
| (client)/client/jobs/[id]/page.tsx | job.findFirst | Fixed – select |
| (client)/client/invoices/[id]/page.tsx | invoice.findFirst | Fixed – select |
| (client)/client/invoices/page.tsx | invoice.findMany | Already select – OK |
| (client)/client/sites/page.tsx | site.findMany | Already select – OK |
| (client)/client/page.tsx | site/job/invoice.count | OK |
| admin/jobs/page.tsx | job.findMany, site.findUnique | Already select – OK |
| admin/jobs/[id]/page.tsx | job.findUnique | Already select – OK |
| admin/jobs/new/page.tsx | site.findMany | Already select – OK |
| admin/payouts/page.tsx | job.findMany | Already select – OK |
| admin/clients/[id]/checklist-actions.ts | site.findUnique | Already select – OK |
| state-machine.ts | job.findUnique | Already select { status } – OK |
| createMakeGoodJobIfNeeded.ts | job.findUnique, job.create | select + create without new cols – OK |
| flagOverdueApprovals.ts | job.findMany, job.update | Fixed – no approvalFlaggedAt in where; update guarded |
| ensureJobOnDraftInvoice.ts | job.findUnique, invoice.findFirst | Already select – OK |
| job-actions.ts (saveDraft, submitCompletion) | job.findUnique | Fixed (submitCompletion) / already select (saveDraft) |
| payout-actions.ts | job.findMany | Fixed – select |
| bulk-actions/jobs.ts | job.findMany | Already select { id, status } – OK |
| bulk-actions/invoices.ts | invoice.findFirst | Already select { id } – OK |
| rbac.ts (canAccessJob, canAccessInvoice) | job.findUnique, invoice.findUnique | Already select – OK |

---

## 7. Recommendations for CTO

1. **Deploy current fixes** so production stays stable without the Category A migration.
2. **Run the Category A migration** in production when ready (adds Job/Invoice/Site template columns and template tables). Then Prisma and DB will match.
3. **Optional after migration:** Gradually replace some explicit `select` with `include` where it improves readability, or leave as-is for clarity and future-proofing.
4. **New features** that use `approvalFlaggedAt`, `jobTemplateId`, `jobTemplateVersion`, `invoiceTemplateId`, `invoiceTemplateVersion`, `siteTemplateId`, or `siteTemplateVersion` should be merged only after the migration, or guarded with try/catch P2022 where a “graceful degradation” is acceptable (as in flagOverdueApprovals).
5. **CI:** Consider a build or integration test that runs against a DB with the current production schema (no Category A columns) to catch any new Prisma usage that would pull missing columns.

---

**Document version:** 1.0  
**Audit performed by:** Codebase audit and fix pass (2025-02-21).
