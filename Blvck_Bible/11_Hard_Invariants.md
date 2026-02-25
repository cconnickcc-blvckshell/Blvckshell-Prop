# Blvck Bible — Hard Invariants

**Purpose:** Authoritative record of scale-safe financial and operational invariants. These are **laws** the system must never violate.  
**Source:** Scale-Safe Hardening Blueprint; aligns to BLVCK BIBLE 00–09.  
**Update:** When adding new money or authority flows; never relax an invariant without explicit CTO decision.

---

## North Star

At scale, systems fail from:

- **Money drift** — invoice ≠ payout ≠ snapshot.
- **Duplicate artifacts** — double payouts, double invoice lines.
- **Weak invariants** — logic-only uniqueness.
- **Unsafe automation** — placeholder billables.
- **Evidence ambiguity** — misfiled photos.

The goal: **deterministic, auditable, refusal-biased operations** with minimal extra workflow.

---

## LAW 1: Money Facts (Single Source of Truth)

When a job is approved, its economics become **immutable facts**.

**Definition**

- “Approved job economics” are frozen at the moment Job transitions to `APPROVED_PAYABLE`.
- Invoice lines and payout lines **copy** from these frozen fields.
- Site snapshots read **facts** from invoices/payouts, not recompute job economics.

**Implementation**

- On transition to `APPROVED_PAYABLE`, set: `approvedAt`, `approvedById`, `approvedBillableCents`, `approvedPayoutCents`, `approvedPolicyVersion`.
- After approval, these fields **cannot** be changed (enforced in job update actions and state machine).
- Invoice line `amountCents` = `Job.approvedBillableCents`. Payout line `amountCents` = `Job.approvedPayoutCents`.

**Why**

Eliminates penny drift, rounding drift, and reconciliation drift at 100+ contracts.

---

## LAW 2: Database Enforces Uniqueness for Money + Authority

Anything that can cost money or cause dispute must be protected by **DB constraints**, not action logic alone.

**Implementation**

- **InvoiceLineItem:** One job per invoice. Partial unique index `(invoiceId, jobId)` WHERE `jobId IS NOT NULL`.
- **PayoutLine:** One payout per job ever. Unique on `jobId` (where jobId not null) or equivalent constraint.
- **ChecklistTemplate:** One active template per site. Partial unique `(siteId)` WHERE `isActive = true`.
- **SiteAssignment:** Exactly one principal. XOR CHECK: `(workerId IS NULL) <> (workforceAccountId IS NULL)`.

**Why**

Retries, double-clicks, and future automation cannot create duplicates. The database refuses.

---

## LAW 3: Refusal Bias

The system must **refuse** transitions that create ambiguous outcomes.

**Rules**

- Cannot send invoices containing placeholders (any line with `isSystemPlaceholder = true`).
- Cannot create payout lines that duplicate jobs (DB uniqueness + idempotent batch creation).
- Cannot approve job without required evidence/checklist gates (submitted checklist run; billable/payout amounts set).
- Cannot alter approved economics after approval (block updates to approved fields when status is `APPROVED_PAYABLE` or `PAID`).

**Implementation**

- Invoice status transition to Sent: reject if any line has `isSystemPlaceholder === true`.
- Job approval: require at least one submitted ChecklistRun; require `billableAmountCents` or `payoutAmountCents` set before writing approved facts.
- Job update actions: assert job not in `APPROVED_PAYABLE` or `PAID` before allowing changes to payout/billable/approved fields.

---

## LAW 4: Evidence Integrity

Evidence must be provably tied to the correct job/run/item. No ambiguity.

**Rules**

- If `checklistRunId` is set, the run must belong to the same job as the evidence’s job completion (`jobCompletion.jobId === checklistRun.jobId`). Enforced at upload.
- Item-level evidence: `itemId` set and item belongs to the same run. Run-level evidence (if supported): defined explicitly (e.g. `isRunLevel` flag) and enforced.

**Implementation**

- In `uploadEvidence` (or evidence API): when `checklistRunId` is provided, load run and completion; reject with clear error if `checklistRun.jobId !== jobCompletion.jobId`.

---

## Operational Determinism

- **Invoice totals** = sum of line items + adjustments (explicit formula; no recomputation from job economics).
- **Payout batch totals** = sum of payout lines (from approved facts).
- **Site snapshot** uses invoice + payout facts for closed periods; OPEN snapshots may recompute; CLOSED snapshots require Founder override + reason + AuditLog to change.

---

## Snapshot Immutability

- **OPEN** snapshots: may be recomputed.
- **CLOSED** snapshots: cannot be recomputed without Founder override.
- Founder override requires: `overrideReason`, AuditLog event, and (optional) previous snapshot hash capture.

---

## LAW 5: Compliance Enforcement

Workforce accounts must be compliant to receive job assignments and payouts.

**Definition**

- A "compliant" workforce account has:
  - `isActive = true`
  - `complianceSuspended = false`
  - For VENDOR type: valid (non-expired) COI and WSIB documents on file

**Implementation**

- **`compliance.ts` guard:** `checkWorkforceCompliance(accountId)` and `canAssignJob()` return BLOCKING issues if non-compliant.
- **Job assignment:** `canAssignJob()` must pass before assigning a job to a worker/account.
- **Payout creation:** `createPayoutBatch()` should exclude or flag non-compliant accounts.
- **Payout finalization:** `checkPayoutFinalizePreconditions()` blocks finalization if any line has compliance-suspended accounts.

**Compliance flags**

| Flag | Location | Effect |
|------|----------|--------|
| `isActive = false` | WorkforceAccount | Blocks all job assignment and payouts |
| `complianceSuspended = true` | WorkforceAccount | Blocks all job assignment and payouts |
| Missing/expired COI | ComplianceDocument | BLOCKING for VENDOR accounts |
| Missing/expired WSIB | ComplianceDocument | BLOCKING for VENDOR accounts |
| Missing HST number | WorkforceAccount | WARNING only (not blocking) |

**Why**

Ensures Blvckshell does not assign work to or pay contractors who are not properly insured, which would create legal/liability exposure.

---

## Acceptance Criteria (Must Pass)

**Data integrity**

- Cannot create duplicate payout lines for same job.
- Cannot create duplicate job line on same invoice.
- Cannot have two active checklist templates per site.
- Cannot have ambiguous SiteAssignment (both or neither of workerId / workforceAccountId).
- Cannot approve job without frozen facts (approvedAt, approvedBillableCents, approvedPayoutCents).
- Cannot modify frozen facts after approval.
- Cannot send invoice if any placeholder line exists.
- Cannot assign job to compliance-suspended workforce account.
- Cannot finalize payout batch containing compliance-suspended accounts.

**Auditability**

- AuditLog entries for: job approvals (economics frozen), invoice status changes, payout batch approved/released/paid, snapshot recompute/override, any override action.

---

*End of Hard Invariants. See 12_Exception_Cockpit for admin visibility into exceptions.*
