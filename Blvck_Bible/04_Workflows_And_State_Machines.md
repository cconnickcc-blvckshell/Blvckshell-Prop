# Blvck Bible — Workflows and State Machines

**Purpose:** In-depth record of every workflow and state machine.  
**Source:** `portal/src/lib/state-machine.ts`, job-actions, checklist-run-actions, invoice-actions, payout-actions, bulk-actions, automation.  
**Update:** When transitions or rules change.

---

## Job State Machine

**Entity:** `Job.status` (JobStatus enum).  
**Location:** `src/lib/state-machine.ts` (ALLOWED_JOB_TRANSITIONS, canTransitionJob, transitionJob).

### Allowed Transitions

| From | To |
|------|-----|
| SCHEDULED | COMPLETED_PENDING_APPROVAL, CANCELLED |
| COMPLETED_PENDING_APPROVAL | APPROVED_PAYABLE, SCHEDULED, CANCELLED |
| APPROVED_PAYABLE | PAID |
| PAID | — (terminal) |
| CANCELLED | — (terminal) |

### Role Rules

| Transition | Allowed role(s) |
|------------|------------------|
| → COMPLETED_PENDING_APPROVAL | VENDOR_WORKER, INTERNAL_WORKER only (submit completion) |
| → APPROVED_PAYABLE, → SCHEDULED, → CANCELLED | ADMIN only (approve/reject/cancel) |
| → PAID | ADMIN only (via payout batch; job marked PAID when payout line is paid) |

### Invariants (Gold Standard)

- **Approval gate:** Job cannot transition to APPROVED_PAYABLE unless it has at least one ChecklistRun in status **Submitted**. Enforced in `transitionJob()`.
- **Terminal states:** No transition from PAID or CANCELLED.

### Usage

- **transitionJob(user, jobId, toState, metadata?):** Validates current status and role, checks submitted checklist run when toState === APPROVED_PAYABLE, then updates job and writes AuditLog.  
- **isAllowedJobTransition(from, to):** Pure check.  
- **canTransitionJob(user, from, to):** Returns { allowed, error? } for UI.

---

## ChecklistRun State Machine

**Entity:** `ChecklistRun.status` (ChecklistRunStatus: InProgress, Submitted, Approved, Rejected).  
**Location:** `src/server/actions/checklist-run-actions.ts`.

### Flow

- **InProgress:** Worker fills items (saveChecklistRunItem).  
- **Submitted:** Worker submits (submitChecklistRun). After submit, job can be approved (if job transition to APPROVED_PAYABLE).  
- **Approved / Rejected:** Set by admin when approving/rejecting job (or explicit checklist approval if implemented).  
- **Template snapshot:** At run creation, template snapshot (and optional hash) is stored on ChecklistRun for audit.

### Usage

- **createOrGetChecklistRun(jobId):** Returns existing run for job or creates one (template from site, templateSnapshot captured).  
- **saveChecklistRunItem(runId, itemId, result, ...):** Upsert item; run must be InProgress.  
- **submitChecklistRun(runId):** Sets status to Submitted; run must be InProgress and complete per validation.

---

## WorkOrder State Machine

**Entity:** `WorkOrder.status` (WorkOrderStatus).  
**Location:** `src/lib/state-machine.ts` (isAllowedWorkOrderTransition, canTransitionWorkOrder, transitionWorkOrder).

### Allowed Transitions

| From | To |
|------|-----|
| REQUESTED | APPROVED |
| APPROVED | ASSIGNED |
| ASSIGNED | COMPLETED |
| COMPLETED | INVOICED |
| INVOICED | PAID |
| PAID | — (terminal) |

(Exact mapping in state-machine.ts; see ALLOWED_WORK_ORDER_TRANSITIONS.)

### Role Rules

- Transitions are typically admin-driven (approve, assign, mark completed, attach to invoice, mark paid).  
- See `canTransitionWorkOrder` for any role restrictions.

### Usage

- **transitionWorkOrder(user, workOrderId, toState, metadata?):** Validates and updates; AuditLog as needed.  
- Bulk work order transition: `bulk-actions/work-orders.ts` (validate + execute).

---

## Invoice Status Flow

**Entity:** `Invoice.status` (Draft, Sent, Paid, Void).  
**Location:** `src/server/actions/invoice-actions.ts` (updateInvoiceStatus).

### Flow

- **Draft:** Line items and adjustments can be added/removed. Jobs can be attached/detached.  
- **Sent:** Issued to client (issuedAt, dueAt set).  
- **Paid:** Payment received.  
- **Void:** Cancelled.

### Usage

- **updateInvoiceStatus(invoiceId, status):** Validates allowed transition and updates; may enforce business rules (e.g. Sent → Paid only after payment recorded).  
- **ensureJobOnDraftInvoice:** Automation that creates a placeholder job on draft invoice if needed (see 07_Automation_And_Bulk_Operations.md).

---

## Payout Batch Flow

**Entity:** `PayoutBatch.status` (CALCULATED, APPROVED, RELEASED, PAID).  
**Entity:** `PayoutLine.status` (PENDING, APPROVED, RELEASED, PAID, VOID).  
**Location:** `src/server/actions/payout-actions.ts`.

### Flow

- **createPayoutBatch({ periodStart, periodEnd }):** Builds lines from approved jobs (and optional checklist-run-based pay); status CALCULATED. Uniqueness: one line per job (or per run) per workforce account per batch.  
- **markPayoutBatchPaid(batchId):** Moves batch to PAID and lines to PAID; jobs linked to those lines become Job.status PAID.

### Invariants

- Payout line uniqueness per (batch, workforceAccount, job or checklistRun) enforced in createPayoutBatch.  
- Jobs in APPROVED_PAYABLE can be included in a batch; after batch is PAID, those jobs move to PAID.

---

## Quote Status Flow

**Entity:** `Quote.status` (DRAFT, READY_FOR_REVIEW, SENT, WON, LOST, EXPIRED).  
**Location:** `src/server/actions/quote-actions.ts`.  
**Full workflow and invariants:** [10_Gold_Standard_Quoting.md](./10_Gold_Standard_Quoting.md).

### Flow

- **DRAFT:** Area lines and add-on lines edited (walkthrough); snapshots computed (computeAndPersistSnapshot).  
- **READY_FOR_REVIEW:** When margin/revenue floor gates pass.  
- **SENT:** transitionQuoteToSent(quoteId).  
- **WON / LOST / EXPIRED:** Manual or time-based (expiresAt).

### Invariants (Gold Standard)

- **Scope mutability:** Create/update/delete of QuoteAreaLine and QuoteAddOnLine allowed only when quote status is **DRAFT** or **READY_FOR_REVIEW**. SENT/WON/LOST/EXPIRED quotes have immutable scope. Enforced in createQuoteAreaLine, updateQuoteAreaLine, deleteQuoteAreaLine, createQuoteAddOnLine, updateQuoteAddOnLine, deleteQuoteAddOnLine.
- **Override reason:** For QuoteAreaLine, if overrideMinutes is set, overrideReason must be non-empty (server-side).
- **Add-on margin:** priceCents and marginBps computed server-side; includedInProposal cannot be true when marginBps &lt; policy.addonMinMarginBps.
- **Scope gate:** Pricing page disables "Compute snapshot" until at least one area line exists and totalMinutesPerVisit > 0. Engine returns error when monthly hours ≤ 0.
- **SENT gates:** transitionQuoteToSent requires latest snapshot and passesBaseGate, passesStressGate, passesRevenueFloor, and quote not expired.
- **Proposal from snapshot only:** Proposal (and any PDF) must use QuoteSnapshot for economics; no manual final price.

### Usage

- **Walkthrough:** getQuote, createQuoteAreaLine, updateQuoteAreaLine, deleteQuoteAreaLine, createQuoteAddOnLine, updateQuoteAddOnLine, deleteQuoteAddOnLine. Area presets (S/M/L) and finish modifiers feed computedMinutes via area-presets.ts.
- **computeAndPersistSnapshot(quoteId):** Recomputes quote snapshot (quote-engine) and persists QuoteSnapshot row.  
- **overrideBillingRate**, **overrideRevenueFloor:** Founder-only overrides; requireFounder in UI/action.

---

## Site Performance Snapshot (Finance)

**Entity:** `SitePerformanceSnapshot.status` (OPEN, CLOSED).  
**Location:** `src/server/finance/site-snapshot-engine.ts`, `src/server/actions/finance-actions.ts`.

### Flow

- **OPEN:** Snapshot computed; can be recomputed (recomputeSiteSnapshot).  
- **CLOSED:** closeSiteSnapshot(snapshotId) sets lockedAt and status; no further edits.

### Usage

- **computeSiteSnapshotAction(siteId, month):** Computes and persists snapshot (computeSiteSnapshot + persistSiteSnapshot).  
- **closeSiteSnapshot(snapshotId):** Closes the snapshot.  
- **listSiteSnapshots(siteId?, month?):** List for admin finance view.

---

## Automation Flows (Summary)

- **flagOverdueApprovals(actorUserId):** Finds jobs in COMPLETED_PENDING_APPROVAL past threshold; sets approvalFlaggedAt (or similar).  
- **ensureJobOnDraftInvoice(invoiceId):** Ensures draft invoice has at least one job/line; may create placeholder job.  
- **createMakeGoodJobIfNeeded(jobId):** If job is missed or requires make-good, creates linked makeGoodJob.  
**See:** 07_Automation_And_Bulk_Operations.md.

---

*End of Workflows and State Machines.*
