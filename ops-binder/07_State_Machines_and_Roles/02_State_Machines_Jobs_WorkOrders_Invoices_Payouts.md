# State Machines: Jobs, Work Orders, Invoices, Payouts

**Document Version:** 1.0  
**Date:** February 16, 2026  
**Purpose:** Define state machines and allowed transitions for Job, WorkOrder, Invoice, and Payout entities. This is the authoritative source for portal implementation.

---

## Job State Machine

### States

| State | Description |
|-------|-------------|
| **SCHEDULED** | Job created and assigned; not yet completed |
| **COMPLETED_PENDING_APPROVAL** | Worker submitted completion; awaiting admin review |
| **APPROVED_PAYABLE** | Admin approved completion; ready for payout |
| **PAID** | Included in payout batch and marked paid |
| **CANCELLED** | Job cancelled by admin |

### Allowed Transitions

| From State | To State | Who Can Do It | Requirements |
|------------|----------|---------------|--------------|
| SCHEDULED | COMPLETED_PENDING_APPROVAL | **Worker** (VENDOR_WORKER or INTERNAL_WORKER) | All checklist items answered; ≥ requiredPhotoCount photos; within photo cap (20); job assigned to this worker |
| COMPLETED_PENDING_APPROVAL | APPROVED_PAYABLE | **ADMIN** | Admin reviews completion and approves |
| COMPLETED_PENDING_APPROVAL | SCHEDULED | **ADMIN** | Admin rejects completion; rejection reason stored; worker can resubmit |
| SCHEDULED | CANCELLED | **ADMIN** | Admin cancels job |
| COMPLETED_PENDING_APPROVAL | CANCELLED | **ADMIN** | Admin cancels job (even if completion submitted) |
| APPROVED_PAYABLE | PAID | **ADMIN** | Via payout batch; job included in batch and marked paid |

### Invalid Transitions (Rejected)

- Any transition not listed above
- Worker attempting to approve/reject/cancel
- Admin attempting to submit completion
- Transitioning from PAID or CANCELLED to any other state (terminal states)

### Missed Visit Handling

- Mark job `isMissed = true`; set `missedReason`
- Create make-good job linked via `makeGoodJobId`
- Original job remains in SCHEDULED or can be CANCELLED
- Make-good job follows normal Job state machine

---

## WorkOrder State Machine

### States

| State | Description |
|-------|-------------|
| **REQUESTED** | Work order requested (by client or internal) |
| **APPROVED** | Admin approved work order |
| **ASSIGNED** | Work order assigned to workforce/worker |
| **COMPLETED** | Work completed |
| **INVOICED** | Invoice issued to client |
| **PAID** | Client paid invoice |

### Allowed Transitions

| From State | To State | Who Can Do It | Requirements |
|------------|----------|---------------|--------------|
| REQUESTED | APPROVED | **ADMIN** | Admin reviews and approves |
| APPROVED | ASSIGNED | **ADMIN** | Admin assigns to WorkforceAccount or Worker |
| ASSIGNED | COMPLETED | **Worker** or **ADMIN** | Work completed; photos/documentation |
| COMPLETED | INVOICED | **ADMIN** | Admin creates invoice |
| INVOICED | PAID | **ADMIN** | Client payment recorded |

**Note:** WorkOrder transitions are simpler than Job; no approval/rejection cycle.

---

## Invoice State Machine (Future)

### States

- **DRAFT** — Invoice being prepared
- **ISSUED** — Sent to client
- **PAID** — Payment received
- **OVERDUE** — Past due date

**Note:** Invoice state machine is documented for future use. Not implemented in Phase 1 portal.

---

## Payout State Machine

### States

| State | Description |
|-------|-------------|
| **CALCULATED** | Payout batch created with approved jobs |
| **APPROVED** | Payout batch approved for release |
| **RELEASED** | Funds released to WorkforceAccount |
| **PAID** | Payment confirmed |

### Allowed Transitions

| From State | To State | Who Can Do It | Requirements |
|------------|----------|---------------|--------------|
| CALCULATED | APPROVED | **ADMIN** | Admin reviews batch |
| APPROVED | RELEASED | **ADMIN** | Admin releases funds |
| RELEASED | PAID | **ADMIN** | Payment confirmed |

**Note:** Payouts go to `WorkforceAccount`, not individual workers. Worker reference optional for reporting.

---

## State Transition Enforcement

**Portal implementation must:**
1. **Reject invalid transitions** — Return clear error message
2. **Log all transitions** — Write to `AuditLog` with actor IDs, fromState, toState, metadata
3. **Enforce role permissions** — Check role before allowing transition
4. **Validate prerequisites** — Check requirements (checklist, photos, etc.) before transition

**Example error:** "Invalid transition: Cannot move Job from PAID to SCHEDULED. PAID is a terminal state."

---

## Audit Log Requirements

Every state transition must write an `AuditLog` entry:

```typescript
{
  actorUserId: string,              // User who triggered transition
  actorWorkerId: string | null,    // Worker (if applicable)
  actorWorkforceAccountId: string | null, // WorkforceAccount (if applicable)
  entityType: 'Job' | 'WorkOrder' | 'Invoice' | 'Payout',
  entityId: string,                // ID of entity
  fromState: string,                // Previous state
  toState: string,                  // New state
  metadata: {                       // Additional context
    rejectionReason?: string,       // If rejected
    overrideReason?: string,        // If compliance override
    payoutBatchId?: string,         // If paid via batch
    // ... other context
  },
  createdAt: Date
}
```

---

**This document is the authoritative source for portal state machine implementation. See `03_Audit_Log_Requirements.md` for detailed audit log specifications.**
