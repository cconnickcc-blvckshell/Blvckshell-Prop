# Implementation Plan: Interactive Checklists + Billing Spine

This plan breaks down **CURSOR_DIRECTIVE_CHECKLIST_BILLING.md** into ordered phases. Each phase delivers working, deployable increments.

**Status:** Phases 1, 2, 4, 5, 6, 7 complete. Phase 3 (camera + redaction), Phase 8 (TimeEntry + payroll CSV), Phase 9 (mobile polish) pending. See **CTO_STATUS_REPORT_CHECKLIST_BILLING.md** for full CTO report.

---

## Current state (before this plan)

* **ChecklistTemplate**: exists; `items` JSON; one active per site.
* **JobCompletion**: one per job; `checklistResults` JSON; **Evidence** table (no redaction metadata).
* **Job**: has `payoutAmountCents`, no `pricingModel`, `billableStatus`, `invoiceId`.
* **PayoutBatch / PayoutLine**: exist; no Invoice/Contract/Adjustment.
* **Worker UI**: Job list → Job detail with interactive PASS/FAIL/NA + photo upload (no in-app camera, no redaction).
* **Docs**: Static view/print checklists in admin.

---

## Phase 1: Checklist run model + item-level persistence

**Goal:** Replace “single JSON blob” completion with an auditable run + items. No UI change yet; backend only.

1. **Schema**
   * Add **ChecklistRun**: `id`, `jobId`, `checklistTemplateId`, `version` (snapshot), `status` (InProgress | Submitted | Approved | Rejected), `completedByWorkerId`, `submittedAt`, `approvedAt`, `approvedById`, `createdAt`, `updatedAt`.
   * Add **ChecklistRunItem**: `id`, `checklistRunId`, `itemId`, `result` (PASS | FAIL | NA), `failReason?`, `note?`, `completedAt`, `completedByWorkerId`.
   * Extend **ChecklistTemplate** (or add **ChecklistTemplateItem** table): per-item `photoRequired` (boolean), `failConditionText` (optional). Prefer extending JSON schema first to avoid migration churn; add table later if needed.
   * Keep **JobCompletion** for backward compatibility: either deprecate after migration or keep as a cache of “current completion” derived from ChecklistRun.

2. **API / server actions**
   * Create ChecklistRun when job is opened for completion (or when worker first starts checklist).
   * Autosave: upsert ChecklistRunItem by `checklistRunId` + `itemId`.
   * Submit run: validate (all required items set, min photos if applicable); set status = Submitted; optionally create JobCompletion from run for existing code paths.

3. **Migration**
   * Backfill: for existing JobCompletions, create a ChecklistRun + ChecklistRunItems from `checklistResults` (and link Evidence to run if schema allows).

**Exit criteria:** Worker completion still works; data is written to ChecklistRun + ChecklistRunItem; admins can query by run.

**Implemented (Phase 1):** ChecklistRun + ChecklistRunItem schema; `createOrGetChecklistRun`, `saveChecklistRunItem`, `submitChecklistRun` actions; job detail page creates/gets run and passes runId + runItems to client; JobDetailClient autosaves each item to run and submits via `submitChecklistRun`. Migration: `20260218160000_add_checklist_run_and_items`. Run `npx prisma migrate deploy` when DB is available. Optional backfill: for existing JobCompletions, create a ChecklistRun + ChecklistRunItems from `checklistResults` (one-time script).

---

## Phase 2: Photo-at-item + minimum count + Evidence metadata

**Goal:** Item-level and run-level photo requirements; evidence linked to run/item; redaction metadata.

1. **Schema**
   * **Evidence** (or new **EvidencePhoto**): add `checklistRunId?`, `itemId?`, `redactionApplied` (boolean), `redactionType?` (face | person | manual), `capturedByUserId`, `capturedAt`. Keep `jobCompletionId` for backward compatibility or migrate to run.
   * Template items (JSON or ChecklistTemplateItem): `photoRequired`, `photoPointLabel`.

2. **Validation**
   * On submit: (1) required items completed, (2) for items with `photoRequired`, at least one evidence linked to that item, (3) total evidence count ≥ template’s minimum (e.g. 4 for Lobby).
   * Block submit and show “what’s blocking” (e.g. “LOB-001 requires a photo”, “Minimum 4 photos required”).

3. **UI**
   * In checklist item row: if item has `photoRequired`, show “Add photo” and evidence thumbnail(s); block PASS until photo attached (or allow PASS with warning—directive says “before PASS is allowed”).
   * Run-level evidence gallery; show count vs minimum.

**Exit criteria:** Worker must attach photos per item where required; run cannot be submitted until rules pass; evidence has run/item and redaction metadata fields.

---

## Phase 3: In-app camera + client-side redaction pipeline

**Goal:** Capture in portal via getUserMedia; detect people; redact in browser; upload only redacted blob; never send unredacted original.

1. **Client module**
   * Camera: getUserMedia → capture frame to canvas.
   * Detection: MediaPipe or equivalent (face/person) in-browser.
   * Redaction: canvas blur/blackout over detections.
   * Upload: redacted blob only (multipart or base64); metadata `redactionApplied`, `redactionType`, optional `modelConfidence`.
   * If no detection or detection fails: block upload; “Retake” or “Manual redact” (manual = user draws region to redact).

2. **Server**
   * Accept only redacted image; store in Supabase Storage; create Evidence record with `redactionApplied=true` and metadata.
   * Never accept unredacted originals.

3. **UX**
   * “Take photo” opens in-app camera; after capture, show preview with redaction; confirm → upload.

**Exit criteria:** No unredacted photos stored; evidence records have redaction metadata; worker can complete photo-required items in-app.

---

## Phase 4: Client/Site job history + Definition of Done

**Goal:** History views; Definition of Done enforced and visible.

1. **Screens**
   * **Client profile → Sites → Job history**: list jobs (and runs) for site; filter by date, status, worker; open run → items, notes, fail reasons, evidence gallery, timestamps, who completed/approved.
   * **Definition of Done**: in template (or config), store DoD rules; on submit, validate (e.g. all required PASS, min photos, no unresolved fails without note). Show “Blocking submit” panel with checklist of unmet conditions.

2. **Data**
   * Job already has Site → Client; ChecklistRun has Job; so run → job → site → client is already there. Add indexes/views for “uninvoiced approved jobs by client/site/period” (Phase 5).

**Exit criteria:** Admin can view full job history per client/site; workers see why submit is blocked; DoD is enforced.

---

## Phase 5: Invoice + Contract + Adjustment schema and draft

**Goal:** Data model and draft invoice generation (no PDF yet).

1. **Schema**
   * **Contract**: `id`, `clientId`, `siteId`, `billingCadence` (Monthly), `monthlyBaseAmountCents`, `netTermsDays`, `effectiveStart`, `effectiveEnd?`, `status` (Active | Paused | Ended).
   * **Invoice**: `id`, `clientId`, `invoiceNumber`, `periodStart`, `periodEnd`, `status` (Draft | Sent | Paid | Void), `issuedAt`, `dueAt`, `notes`, `subtotalCents`, `taxCents`, `totalCents`, `createdById`, `createdAt`.
   * **InvoiceLineItem**: `id`, `invoiceId`, `jobId?`, `checklistRunId?`, `contractId?`, `description`, `qty`, `unitPriceCents`, `amountCents`, `siteId`, snapshot fields if needed.
   * **BillingAdjustment**: `id`, `invoiceId?`, `siteId?`, `jobId?`, `type` (Charge | Discount | Credit), `amountCents`, `reasonCode`, `notes`, `createdById`, `createdAt`, `status` (Proposed | Approved | Applied | Voided), `evidencePhotoIds` (array or relation).
   * **Job** (add): `pricingModel` (IncludedInContract | Fixed | Hourly | PerChecklist | PerVisit), `billableAmountCents?`, `billableStatus` (Pending | Approved | Invoiced | Void), `invoiceId?`, `approvedAt?`, `approvedById?`.

2. **Queries**
   * Uninvoiced approved jobs for client + period (and optionally site).
   * Build draft invoice: monthly base (from Contract) + selected jobs (line items) + approved adjustments; compute subtotal/tax/total.

3. **API / actions**
   * Create draft invoice (client + period); add/remove jobs; add adjustments; lock line items when invoice moves to Sent (snapshot amounts).

**Exit criteria:** Admin can generate a draft invoice for a client/period; line items reference jobs/contracts; totals are deterministic.

---

## Phase 6: Payout model alignment + pay statement data

**Goal:** Payout batches and line items reference jobs/runs; pay statement data ready for PDF.

1. **Schema**
   * **PayoutLine**: ensure `jobId` and/or `checklistRunId`; add `amountCents`, `description`, `siteId` if missing; `payableStatus` (Pending | Approved | Paid).
   * **Payout** (or equivalent): per-worker per batch; `workerId`, `subtotalCents`, `taxCents`, `totalCents`.
   * Rule: a job/run appears in at most one payout line.

2. **Queries**
   * Unpaid approved jobs by worker + period; aggregate for payout batch; create PayoutLineItems.

3. **PDF (MVP)**
   * Pay statement PDF for subcontractor: list of jobs/runs, amounts, period, totals.

**Exit criteria:** Payout batch includes line items from jobs/runs; pay statement PDF can be generated.

---

## Phase 7: Invoice PDF + locking

**Goal:** Invoice PDF download; lock jobs when invoice is Sent/Paid.

1. **PDF generation**
   * Server-side invoice PDF: header (BLVCKSHELL, client, period), line items table (description, qty, unit price, amount), adjustments, subtotal, tax, total, due date, payment terms.

2. **Locking**
   * When invoice status → Sent or Paid: set each related job’s `billableStatus = Invoiced`, `invoiceId = id`; line items are immutable (already stored as snapshots).

3. **UI**
   * Invoice detail: view line items, status, “Download PDF”; optional “Mark as Sent” / “Mark as Paid”.

**Exit criteria:** Admin can download invoice PDF; invoiced jobs are locked and excluded from future drafts.

---

## Phase 8: TimeEntry + payroll export (employees)

**Goal:** Hourly employees; payroll export CSV.

1. **Schema**
   * **TimeEntry**: `id`, `workerId`, `jobId?`, `clockInAt`, `clockOutAt`, `breakMinutes`, `approvedById?`, `approvedAt`, `source` (clock_in | job_closeout).

2. **Logic**
   * On job closeout: optional “Duration (minutes)” → create TimeEntry with start/end derived from job scheduled times + duration.

3. **Export**
   * Pay period report by employee: total hours, optional overtime; CSV for payroll provider.

**Exit criteria:** TimeEntry records exist; admin can export payroll CSV for a period.

---

## Phase 9: Mobile UX polish + autosave

**Goal:** Premium mobile experience; no lost work.

1. **UX**
   * Big tap targets; one-handed flow; progress % and “blocking submit” panel; dark theme consistent with admin.
   * Autosave: every item change and photo upload persists immediately (already partially there; ensure run items and evidence are saved on blur/change).
   * “Today’s Jobs” → “Open Checklist” → items + photos → Submit.

2. **Polish**
   * Evidence gallery preview; item-level photo thumbnails; loading and error states.

**Exit criteria:** Checklist run is smooth on mobile; progress and blocking reasons are clear; autosave is reliable.

---

## Dependency order

```
Phase 1 (Run + RunItem) 
  → Phase 2 (Photos at item + validation) 
  → Phase 3 (Camera + redaction) 
  → Phase 4 (History + DoD)
  → Phase 5 (Invoice/Contract/Adjustment schema + draft)
  → Phase 6 (Payout alignment + pay statement PDF)
  → Phase 7 (Invoice PDF + locking)
  → Phase 8 (TimeEntry + payroll CSV)
  → Phase 9 (Mobile polish + autosave)
```

---

## Reference

* Full requirements: **CURSOR_DIRECTIVE_CHECKLIST_BILLING.md**
* Checklist structure: **portal/content/docs/checklists/CL_01_Lobby_Checklist.md** and **ops-binder/06_Checklists_Library/checklist-manifest.json**
* Current schema: **portal/prisma/schema.prisma**
