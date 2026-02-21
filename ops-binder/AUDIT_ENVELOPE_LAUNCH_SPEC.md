# Audit Envelope — Launch Spec (Locked)

**Rule:** If it affects money, access, or evidence → it is logged. No exceptions.  
**Phase 0.1 — Authoritative list for launch.**

---

## Actions That MUST Produce an Audit Log

### Job
| Action | Who | EntityType | Notes |
|--------|-----|------------|--------|
| create | ADMIN | Job | fromState=null, toState=SCHEDULED |
| assign / modify assignment | ADMIN | Job | metadata: assignedWorkerId or assignedWorkforceAccountId |
| start (if tracked) | Worker | Job | Optional; if check-in is state change |
| submit (completion) | Worker | Job | toState=COMPLETED_PENDING_APPROVAL |
| approve | ADMIN | Job | toState=APPROVED_PAYABLE |
| reject | ADMIN | Job | toState=SCHEDULED; metadata.rejectionReason required |
| cancel | ADMIN | Job | toState=CANCELLED |
| make-good (create linked job) | ADMIN | Job | metadata: makeGoodJobId, originalJobId |

### Evidence
| Action | Who | EntityType | Notes |
|--------|-----|------------|--------|
| upload | Worker | Evidence | metadata: jobId, completionId, redactionApplied |
| delete | ADMIN or system | Evidence | Must log before delete; metadata: jobId, completionId |
| redact | N/A (in-app only) | — | Upload already carries redactionApplied |

### Invoice
| Action | Who | EntityType | Notes |
|--------|-----|------------|--------|
| generate (create draft) | ADMIN | Invoice | fromState=null, toState=Draft |
| edit (line items, adjustments) | ADMIN | Invoice / InvoiceLineItem | action=update, changedFields |
| issue (mark sent) | ADMIN | Invoice | toState=Sent |
| void | ADMIN | Invoice | toState=Void |
| mark paid | ADMIN | Invoice | toState=Paid |

### Payout
| Action | Who | EntityType | Notes |
|--------|-----|------------|--------|
| calculate (create batch) | ADMIN | PayoutBatch | metadata: period, line count, total |
| approve | ADMIN | PayoutBatch | toState if applicable |
| customize (adjust lines) | ADMIN | PayoutLine | action=update |
| release | ADMIN | PayoutBatch | toState=RELEASED if in model |
| mark paid | ADMIN | PayoutBatch | toState=PAID |

### Access credentials
| Action | Who | EntityType | Notes |
|--------|-----|------------|--------|
| issue | ADMIN | AccessCredential | metadata: siteId, type, issuedToWorkerId |
| return | ADMIN | AccessCredential | status→RETURNED; metadata |
| mark lost | ADMIN | AccessCredential | status→LOST; metadata; incident link if any |

### Contract
| Action | Who | EntityType | Notes |
|--------|-----|------------|--------|
| create | ADMIN | Contract | action=create |
| pause | ADMIN | Contract | toState=Paused |
| end | ADMIN | Contract | toState=Ended |
| modify | ADMIN | Contract | action=update, changedFields |

### Site & workforce
| Action | Who | EntityType | Notes |
|--------|-----|------------|--------|
| Site create | ADMIN | Site | action=create |
| Site update | ADMIN | Site | action=update |
| WorkforceAccount create | ADMIN | WorkforceAccount | action=create |
| WorkforceAccount update | ADMIN | WorkforceAccount | action=update |
| Worker create | ADMIN | Worker | action=create |
| Worker remove/deactivate | ADMIN | Worker | action=deactivate or remove |
| User create | ADMIN | User | action=create |
| User role change / deactivate | ADMIN | User | action=update |
| ComplianceDocument upload | ADMIN | ComplianceDocument | action=create |
| ComplianceDocument override (expired COI/WSIB) | ADMIN | ComplianceDocument | action=override, overrideReason |

---

## Implementation Status

- **Job:** ✅ transitionJob() covers submit, approve, reject, cancel; create/assign via job-actions need audit where missing.
- **Invoice:** ✅ status changes; ⚠️ create + line edits need audit (P1).
- **Payout:** ✅ batch create, mark paid.
- **Evidence:** ✅ upload (can add explicit AuditLog on create); ❌ delete must log before delete.
- **AccessCredential / Contract / Site / Workforce / User / Compliance:** See AUDIT_ENVELOPE_SPEC.md; implement per P0/P1 checklist.

---

*No state or money/access/evidence action without an audit log. After launch, no new such action without updating this spec.*
