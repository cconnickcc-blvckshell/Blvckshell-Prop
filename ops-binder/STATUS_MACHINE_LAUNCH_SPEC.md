# Status Machine — Launch Spec (Locked)

**Phase 0.3 — No state changes without updating this spec.**  
**Source of truth for Job (and WorkOrder) transitions.**

---

## Job state machine

### Allowed transitions (frozen)

| From | To | Who | Side effects |
|------|-----|-----|--------------|
| SCHEDULED | COMPLETED_PENDING_APPROVAL | Worker only | AuditLog: Job, toState=COMPLETED_PENDING_APPROVAL |
| SCHEDULED | CANCELLED | Admin only | AuditLog: Job, toState=CANCELLED |
| COMPLETED_PENDING_APPROVAL | APPROVED_PAYABLE | Admin only | AuditLog: Job, toState=APPROVED_PAYABLE |
| COMPLETED_PENDING_APPROVAL | SCHEDULED | Admin only (reject) | AuditLog: Job, toState=SCHEDULED; metadata.rejectionReason |
| COMPLETED_PENDING_APPROVAL | CANCELLED | Admin only | AuditLog: Job, toState=CANCELLED |
| APPROVED_PAYABLE | PAID | Admin only (via payout) | AuditLog: Job, toState=PAID |
| PAID | — | Terminal | None |
| CANCELLED | — | Terminal | None |

### Code reference

- **Defined in:** `portal/src/lib/state-machine.ts`
- **Constant:** `ALLOWED_JOB_TRANSITIONS`
- **Validation:** `isAllowedJobTransition(from, to)`; `canTransitionJob(user, from, to)` (role check)
- **Execution:** `transitionJob(user, jobId, toState, metadata)` — updates job and writes AuditLog in one transaction

### Who can perform

- **Worker (VENDOR_WORKER, INTERNAL_WORKER):** SCHEDULED → COMPLETED_PENDING_APPROVAL only
- **Admin (ADMIN):** All other transitions (approve, reject, cancel, and PAID via payout batch)

---

## WorkOrder state machine (reference)

- **States:** REQUESTED → APPROVED → ASSIGNED → COMPLETED → INVOICED → PAID
- **Defined in:** same `state-machine.ts`; `isAllowedWorkOrderTransition`, `transitionWorkOrder`
- **Rule:** Same as Job — no transition without spec and audit.

---

## Process rule

After launch:

1. No new Job or WorkOrder state without updating this spec.
2. No new transition without updating `state-machine.ts` and tests.
3. Every transition continues to write AuditLog in the same transaction as the state update.

---

*Implementation: portal/src/lib/state-machine.ts*
