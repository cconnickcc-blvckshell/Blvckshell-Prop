# CTO Gold Standard Audit — Code-Level Confirmation

**Production-readiness interrogation. No summaries. No assumptions.**

---

## 1️⃣ Database Invariants (Prisma + DB Layer)

### A. One Active Checklist Template Per Site

| Question | Answer |
|----------|--------|
| Partial unique index on `(siteId)` WHERE `isActive = true`? | **Yes.** |
| Migration name | `20260217204341_production_constraints` (initial); re-created idempotently in `20260221130000_fix_checklist_template_versioning` and `20260221140000_reconcile_supabase_schema`. |
| Enforced at DB level? | **ENFORCED AT DB.** |

**Code references:**

- **Prisma schema:** No partial index in schema (Prisma does not model partial indexes). `ChecklistTemplate` has `@@unique([siteId, version])` and `@@index([isActive])` — `portal/prisma/schema.prisma` lines 218–221.
- **DB migration (partial unique):**  
  `portal/prisma/migrations/20260217204341_production_constraints/migration.sql` lines 16–19:
  ```sql
  CREATE UNIQUE INDEX checklisttemplate_one_active_per_site
  ON "ChecklistTemplate" ("siteId")
  WHERE "isActive" = true;
  ```
- **Rollback:** Dropping the index would allow multiple active templates per site; no automatic rollback migration. Re-enforcement requires re-running equivalent SQL.

---

### B. One JobCompletion Per Job

| Question | Answer |
|----------|--------|
| Unique constraint on `JobCompletion.jobId`? | **Yes.** |
| What prevents duplicate completions? | **DB unique constraint.** |

**Code references:**

- **Prisma schema:** `portal/prisma/schema.prisma` line 405: `jobId String @unique`
- **Migration:** Unique constraint created in init migration (`20260217204320_init`) for `JobCompletion.jobId`.
- **Enforcement:** **ENFORCED AT DB.** Prisma `JobCompletion` upsert uses `where: { jobId }` (e.g. `portal/src/server/actions/checklist-run-actions.ts` lines 110–119); duplicate insert would violate unique and throw.
- **Rollback:** Removing the unique would allow multiple completions per job; application logic assumes one completion per job.

---

### C. One PayoutLine Per Job

| Question | Answer |
|----------|--------|
| Is `PayoutLine.jobId` unique? | **No.** Schema has `jobId String?` with `@@index([jobId])` only — `portal/prisma/schema.prisma` lines 497, 508. |
| Can the same job be in multiple payout batches? | **Yes, at DB level.** Application logic prevents it; DB does not. |

**Code references:**

- **Prisma schema:** `portal/prisma/schema.prisma` lines 493–509: `PayoutLine` has no `@@unique` on `jobId`.
- **App-level prevention:** `portal/src/server/actions/payout-actions.ts` lines 23–30: before creating a batch, jobs that already have a `PayoutLine` are excluded:
  ```ts
  const existingLineJobIds = await prisma.payoutLine.findMany({
    where: { jobId: { not: null } },
    select: { jobId: true },
  });
  const paidJobIds = new Set(existingLineJobIds.map((l) => l.jobId).filter(...));
  // ...
  id: { notIn: paidJobIds.size > 0 ? Array.from(paidJobIds) : undefined },
  ```
- **Conclusion:** **APP-LEVEL ONLY.** A direct INSERT into `PayoutLine` with the same `jobId` in another batch is not prevented by the DB. **Structural flaw for liability-bearing use.**

**Rollback:** N/A. Fix would be to add a unique constraint on `PayoutLine(jobId)` where `jobId IS NOT NULL` (partial unique), or a trigger. No such migration exists.

---

### D. Invoice Cannot Be Issued With Zero Line Items

| Question | Answer |
|----------|--------|
| Enforced in Prisma? | **No.** No constraint on `Invoice` or `InvoiceLineItem` count. |
| DB trigger? | **No.** |
| Server action? | **No.** |

**Code references:**

- **Server action:** `portal/src/server/actions/invoice-actions.ts` function `updateInvoiceStatus` (lines 417–467). It checks current status (Draft → Sent, Sent → Paid) but **does not** check `lineItems.length**. No `findUnique` with `include: { lineItems: true }` and no guard on count.
- **UI:** `portal/src/app/admin/invoices/[id]/InvoiceStatusActions.tsx`: "Mark as Sent" is shown for any Draft (lines 42–51). It does **not** receive or check `lineItems.length`. The parent page (`portal/src/app/admin/invoices/[id]/page.tsx`) does not disable the button when `invoice.lineItems.length === 0`.
- **Conclusion:** **NOT ENFORCED.** An admin can call `updateInvoiceStatus(invoiceId, "Sent")` (e.g. via custom request or future UI) and issue an invoice with zero line items. **APP-LEVEL ONLY** would require adding a check in `updateInvoiceStatus` and/or a DB constraint. **Currently: NOT SAFE FOR PILOT** for this invariant.

---

### E. Job Approval Requires Submitted ChecklistRun

| Question | Answer |
|----------|--------|
| Where is the invariant enforced? | **Nowhere in the state machine or approval path.** |
| Can admin transition job to Approved without a submitted ChecklistRun? | **Yes.** |
| Checked in `state-machine.ts`? | **No.** |

**Code references:**

- **State machine:** `portal/src/lib/state-machine.ts`:
  - `canTransitionJob` (lines 27–79): allows transition to `APPROVED_PAYABLE` only if `user.role === "ADMIN"`. No check for ChecklistRun or submission status.
  - `transitionJob` (lines 84–137): loads job status only (lines 90–94); no load of `checklistRuns` or `JobCompletion`. No validation that a run exists with status Submitted.
- **Conclusion:** **APP-LEVEL ONLY** and **NOT ENFORCED.** Admin can approve a job that has no checklist run or only in-progress runs. **NOT SAFE FOR PILOT** for auditability / escalation integrity.

---

## 2️⃣ Vendor Subordination Hard Audit

| Question | Code reference | Enforced? |
|----------|----------------|-----------|
| Can VENDOR_OWNER create jobs? | **No.** Job creation: `portal/src/app/admin/jobs/actions.ts` — `createJob` calls `requireAdmin()` at line 8. Admin jobs page and form are under `admin/` layout which uses `requireAdmin()`. | **YES — requireAdmin in action and layout.** |
| Can VENDOR_OWNER reassign workers across sites? | No dedicated “reassign” action found. Job creation sets `assignedWorkerId` once. Changing assignment would require an admin-only update to `Job`. No update-job action found that allows reassignment; admin would use edit flow if added. Guards: only admin can create jobs; worker list/detail gated by `canAccessJob` (VENDOR_OWNER only for jobs assigned to their workforce account). | **YES — no reassign action; job create is admin-only.** |
| Can vendors modify contracts? | Contract create/update would be in admin or server actions. Client detail and site/contract management: `portal/src/app/admin/clients/[id]/page.tsx` uses `requireAdmin()` (line 9). No contract actions in scope that are callable by vendor. | **YES — admin-only layout and no vendor contract actions.** |
| Can vendors influence invoice contents? | `createDraftInvoice`, `addJobToInvoice`, `addBillingAdjustment`, `updateInvoiceStatus`, `addContractBaseToInvoice` all call `requireAdmin()` — `portal/src/server/actions/invoice-actions.ts` (e.g. lines 15, 97, 232, 273, 300, 389, 421). Invoice list/detail are under `admin/` layout. | **YES — requireAdmin on all invoice mutation actions.** |
| Can vendors trigger payout creation? | `createPayoutBatch`, `markPayoutBatchPaid` call `requireAdmin()` — `portal/src/server/actions/payout-actions.ts` lines 16, 147. Payouts page is under admin. | **YES — requireAdmin.** |

**Summary:** Vendor subordination is enforced at the server action and layout level (requireAdmin / requireWorker). No DB-level role checks; reliance is on guards. **SAFE FOR PILOT** from a vendor-subordination perspective.

---

## 3️⃣ Checklist Immutability

| Question | Answer |
|----------|--------|
| When a ChecklistRun is created, does it snapshot template version, item definitions, required/photoRequired? | **Partially. Version is stored; item definitions are not.** |
| Does it reference live template? | **Yes. Item list and validation use live template.** |
| If template edits affect in-progress jobs? | **Yes. Unacceptable for strict immutability.** |

**Code references:**

- **ChecklistRun schema:** `portal/prisma/schema.prisma` lines 224–246. Stores `checklistTemplateId`, `templateVersion` (lines 227–228). Does **not** store a snapshot of `items` (labels, required, photoRequired).
- **ChecklistRunItem:** Lines 339–354. Stores `checklistRunId`, `itemId`, `result`, `failReason`, `note`. Does not store label, required, or photoRequired; those come from the template.
- **Run creation:** `portal/src/server/actions/checklist-run-actions.ts` `createOrGetChecklistRun` (lines 98–123). Creates `ChecklistRun` with `checklistTemplateId` and `templateVersion`. Does **not** create `ChecklistRunItem` rows at creation time; items are created on first `saveChecklistRunItem` by itemId. The list of itemIds/labels for the UI is derived from **live** template (lines 59–69: `template.items` from current template).
- **Submit validation:** `submitChecklistRun` (lines 204–294). Lines 210, 230: reads `run.checklistTemplate.items` (live template) to get `requiredItemIds` and `photoRequiredItemIds`. So if the template is edited after the run is created, validation and required-set change. **Template edits affect in-progress jobs.**

**Conclusion:** Run stores template **version** and **template id** but not a frozen copy of item definitions. Content is **not** frozen at run creation. **NOT SAFE FOR PILOT** if “template edits must not affect in-progress jobs” is a hard requirement. Remediation: snapshot template `items` JSON (or equivalent) on the run or in a run-scoped structure at run creation and use that for validation and display.

---

## 4️⃣ Evidence Integrity

| Question | Answer |
|----------|--------|
| Storage path deterministic and non-guessable? | **Non-guessable.** Path includes `crypto.randomUUID()` and timestamp. |
| Signed URLs used? | **No.** Server downloads from Storage with service role and returns buffer. |
| Evidence access always gated by `canAccessJob`? | **Yes.** |
| Can a client access evidence belonging to another org? | **No.** |

**Code references:**

- **Path generation:** `portal/src/lib/storage.ts` lines 45–54. `generateEvidencePath(jobId, completionId, filename)` produces `evidence/{jobId}/{completionId}/{timestamp}-{uuid}.{ext}`. `uuid = crypto.randomUUID()`. Not guessable.
- **Serving:** `portal/src/app/api/evidence/[id]/route.ts`:
  - Lines 11–15: get current user; 401 if none.
  - Lines 17–26: load Evidence by `params.id`, include `jobCompletion.job`. 404 if not found.
  - Lines 32–36: `hasAccess = await canAccessJob(user, evidence.jobCompletion.jobId)`. Then `if (!hasAccess && user.role !== "ADMIN")` return 403. For CLIENT, `canAccessJob` (rbac.ts 116–117) returns true only if `job.site.clientOrganizationId === user.clientOrganizationId`. So another org’s job → hasAccess false → 403.
  - Lines 38–48: download from Storage by `evidence.storagePath` (server-side, service role); return buffer with Content-Type.
- **Conclusion:** **ENFORCED AT APP** (no DB-level evidence ACL). Access is correctly gated by job and org. **SAFE FOR PILOT** for evidence isolation.

---

## 5️⃣ Payout Determinism

| Question | Answer |
|----------|--------|
| How is job pay amount determined? | Set at job creation: `payoutAmountCents` from form (e.g. `portal/src/app/admin/jobs/actions.ts` line 19–20, 28). |
| Recalculated or snapshot? | **Snapshot.** Batch creation reads `job.payoutAmountCents` and writes to `PayoutLine.amountCents`. |
| Do payout lines store amount at batch creation? | **Yes.** `portal/src/server/actions/payout-actions.ts` lines 74–88: for each job, `amountCents: job.payoutAmountCents` is stored on the line. |
| What prevents retroactive pay changes? | **Application logic only.** Job.payoutAmountCents is mutable (no immutable snapshot table). If an admin later updates Job.payoutAmountCents, existing PayoutLines are not updated (they already store the old amount). New batches would see the new amount. So **already-created payout lines** are stable; **future batches** use current job amount. No DB trigger or constraint prevents changing Job.payoutAmountCents after approval. |

**Code references:**

- Job create: `portal/src/app/admin/jobs/actions.ts` — `payoutAmountCents: cents` (line 28).
- Batch creation: `portal/src/server/actions/payout-actions.ts` lines 31–55 (jobs query includes `payoutAmountCents`), lines 74–88 (lines.push({ ..., amountCents: job.payoutAmountCents })), lines 102–110 (create PayoutLine with amountCents).

**Conclusion:** Payout **calculation** is deterministic and snapshot at batch creation. **Risk:** Job.payoutAmountCents can be changed later (no read-only or audit column); mitigation is policy and no exposed “edit job payout” after approval. **SAFE FOR PILOT** with that understanding; for gold standard, consider immutable payout snapshot or audit column.

---

## 6️⃣ Migration Discipline

| Question | Answer |
|----------|--------|
| No usage of `prisma db push` in any script? | **Confirmed.** No `db push` in `portal/package.json` or in `.github/workflows/migrate.yml`. Grep: no `db push` in repo scripts. |
| CI blocks deploy if `db:verify` fails? | **Yes.** `db:verify` runs as a step after migrate deploy; it uses `prisma migrate diff --exit-code`. Non-zero exit (e.g. 2 when diff non-empty) fails the step and fails the job. |
| Unmanaged SQL outside migrations? | **Yes — documented scripts only.** |

**Code references:**

- **Workflow:** `.github/workflows/migrate.yml` lines 76–83: step "Verify Prisma schema matches DB (no drift)" runs `npm run db:verify`. No `continue-on-error`. So if `db:verify` exits non-zero, the job fails.
- **db:verify script:** `portal/package.json` line 16: `"db:verify": "prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code"`.
- **Raw SQL:**  
  - `portal/prisma/raw_production_constraints.sql` — reference SQL for production constraints (not run by CI).  
  - `portal/prisma/scripts/dedupe-checklist-templates.sql` and `dedupe-checklist-templates.ts` — one-off de-duplication scripts.  
  These are not migrations and are explicitly outside the migration path.

**Conclusion:** **ENFORCED.** No `db push` in scripts; CI runs migrate deploy then db:verify and fails on drift. **SAFE FOR PILOT.**

---

## 7️⃣ Operational Hardening for First Pilot Building

| Item | Answer |
|------|--------|
| Maximum concurrent jobs tested | Not explicitly documented. k6 peak-load targets **500 VUs** (virtual users) and holds 5m at 500; mix of worker completion, admin review, public contact, worker view jobs, admin invoice. Not “concurrent jobs” but concurrent requests. |
| k6 peak-load thresholds | `portal/src/__tests__/load/peak-load.js` lines 7–20: 1m ramp to 200, 2m to 400, 3m to 500, 5m hold at 500, 2m to 0. Thresholds: p95 < 2000ms, p99 < 5000ms, failure rate < 1%, errors < 1%, http_reqs rate > 200/s. |
| Evidence upload size limits | `portal/src/lib/storage.ts` line 34: `MAX_PHOTO_SIZE = 10 * 1024 * 1024` (10MB). Enforced in `upload-actions.ts` via `isValidFileSize`. |
| Supabase storage quota risk | Not coded. Quota is account-level; no in-app quota check or alert. Risk: many/large evidence uploads can hit project quota. |
| Known race conditions | No documented race. Possible races: (1) Two admins creating payout batches for same period simultaneously — both could read same “unpaid” jobs and create overlapping lines (mitigated by app excluding jobs already on any PayoutLine, but no unique constraint on PayoutLine.jobId). (2) Double submit of checklist run — state machine and run status prevent duplicate transition; one run per job completion flow. |

**Conclusion:** **SAFE FOR PILOT** with known limits (no per-tenant quota handling; duplicate payout line possible at DB level as in §1C).

---

## 8️⃣ Redaction Enforcement Risk

| Question | Answer |
|----------|--------|
| Is redaction technically verified server-side? | **No.** Only a boolean flag is checked. |
| Or only flag-based? | **Flag-based only.** |
| Can a malicious user bypass redaction requirement? | **Yes.** They can send a request with `redactionApplied: "true"` and an unredacted image; server accepts it. |

**Code references:**

- **API route:** `portal/src/app/api/evidence/upload/route.ts` lines 13, 21–25: `redactionApplied = formData.get("redactionApplied") === "true"`; if `!redactionApplied` return 400. No image analysis.
- **Server action:** `portal/src/server/actions/upload-actions.ts` lines 29–34: `if (input.redactionApplied !== true)` return error. No pixel or ML check.
- **Evidence record:** `portal/prisma/schema.prisma` Evidence model has `redactionApplied Boolean`, `redactionType String?` — stored but not verified.

**Conclusion:** **APP-LEVEL ONLY. FLAG-BASED. NOT VERIFIED.** A malicious user can upload an unredacted image with `redactionApplied: true`. **NOT SAFE FOR PILOT** for liability-bearing use without explicit policy and legal acceptance that redaction is user-declared and not technically enforced.

---

# Deliverable Summary

| Section | DB vs app | Pilot verdict |
|---------|-----------|----------------|
| 1A One active template per site | ENFORCED AT DB | SAFE FOR PILOT |
| 1B One JobCompletion per job | ENFORCED AT DB | SAFE FOR PILOT |
| 1C One PayoutLine per job | APP-LEVEL ONLY (structural flaw) | NOT SAFE FOR PILOT (unless accepted as risk) |
| 1D Invoice not issued with zero line items | NOT ENFORCED | NOT SAFE FOR PILOT |
| 1E Approval requires submitted run | NOT ENFORCED | NOT SAFE FOR PILOT |
| 2 Vendor subordination | APP-LEVEL (guards) | SAFE FOR PILOT |
| 3 Checklist immutability | Live template used; not frozen | NOT SAFE FOR PILOT (if immutability required) |
| 4 Evidence integrity | APP-LEVEL (canAccessJob) | SAFE FOR PILOT |
| 5 Payout determinism | Snapshot at batch; job amount mutable | SAFE FOR PILOT (with policy) |
| 6 Migration discipline | No db push; CI db:verify | SAFE FOR PILOT |
| 7 Operational hardening | Limits and k6 as above | SAFE FOR PILOT (with quota awareness) |
| 8 Redaction | Flag-only; bypass possible | NOT SAFE FOR PILOT (without policy/legal) |

---

**End of audit. No summaries. No marketing tone. No assumptions.**
