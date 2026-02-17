# Audit Log Requirements

**Document Version:** 1.0  
**Date:** February 16, 2026  
**Purpose:** Define audit log structure and requirements for BLVCKSHELL Facilities Services portal. Every state transition and critical action must be logged.

---

## Purpose

The audit log provides:
- **Compliance:** Proof of who did what, when
- **Dispute resolution:** Historical record of state changes
- **Security:** Detection of unauthorized actions
- **Operational insight:** Understanding of system usage patterns

---

## Audit Log Schema

### Required Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Unique identifier |
| `actorUserId` | string | Yes | User who performed the action |
| `actorWorkerId` | string \| null | No | Worker who performed the action (if applicable) |
| `actorWorkforceAccountId` | string \| null | No | WorkforceAccount (if applicable) |
| `entityType` | enum | Yes | Type of entity acted upon: `Job`, `WorkOrder`, `Invoice`, `Payout`, `WorkforceAccount`, `User`, `Site`, `ComplianceDocument`, etc. |
| `entityId` | string | Yes | ID of the entity |
| `fromState` | string \| null | No | Previous state (for state transitions) |
| `toState` | string \| null | No | New state (for state transitions) |
| `metadata` | JSON | No | Additional context (rejection reason, override reason, etc.) |
| `createdAt` | timestamp | Yes | When the action occurred |

---

## What Must Be Logged

### State Transitions

**Every state transition must be logged:**
- Job: SCHEDULED → COMPLETED_PENDING_APPROVAL
- Job: COMPLETED_PENDING_APPROVAL → APPROVED_PAYABLE
- Job: COMPLETED_PENDING_APPROVAL → SCHEDULED (rejection)
- Job: SCHEDULED → CANCELLED
- Job: COMPLETED_PENDING_APPROVAL → CANCELLED
- Job: APPROVED_PAYABLE → PAID
- WorkOrder: All transitions (REQUESTED → APPROVED → ASSIGNED → COMPLETED → INVOICED → PAID)
- Payout: All transitions (CALCULATED → APPROVED → RELEASED → PAID)

### Critical Actions

**The following actions must also be logged:**
- Compliance override (ADMIN overrides expired COI/WSIB blocking)
- Password reset (admin-initiated)
- WorkforceAccount creation/update/deletion
- Worker addition/removal
- Site creation/update/deletion
- Compliance document upload/expiration
- Access credential issuance/return/loss

### Not Logged (Too Verbose)

- Page views
- List queries (unless sensitive)
- Read-only operations (unless accessing sensitive data)

---

## Metadata Examples

### Job Rejection

```json
{
  "rejectionReason": "Missing required photos for garbage room",
  "rejectedAt": "2026-02-16T10:30:00Z"
}
```

### Compliance Override

```json
{
  "overrideReason": "COI renewal in progress; expected within 48 hours",
  "overrideAt": "2026-02-16T14:00:00Z",
  "complianceDocumentType": "COI",
  "expiresAt": "2026-02-14T00:00:00Z"
}
```

### Payout Batch

```json
{
  "payoutBatchId": "batch-123",
  "periodStart": "2026-02-01",
  "periodEnd": "2026-02-15",
  "totalAmountCents": 150000,
  "jobCount": 12
}
```

### Password Reset

```json
{
  "targetUserId": "user-456",
  "targetUserEmail": "worker@example.com",
  "resetMethod": "admin_set_temp_password"
}
```

---

## Audit Log Retention

**Retention policy:**
- **Minimum:** 7 years (compliance requirement)
- **Storage:** Supabase Postgres (indexed for queries)
- **Purge:** Manual process documented in DATA_RETENTION.md

**Indexes required:**
- `actorUserId` (for user activity queries)
- `entityType` + `entityId` (for entity history)
- `createdAt` (for time-based queries)
- `fromState` + `toState` (for state transition analysis)

---

## Query Patterns

**Common queries:**
1. **Entity history:** All audit logs for a specific Job/WorkOrder/etc.
2. **User activity:** All actions by a specific user
3. **State transitions:** All transitions from/to a specific state
4. **Compliance overrides:** All compliance overrides by admin
5. **Time range:** All actions in a date range

**Example query (Prisma):**
```typescript
await prisma.auditLog.findMany({
  where: {
    entityType: 'Job',
    entityId: jobId,
  },
  orderBy: { createdAt: 'asc' },
});
```

---

## Security Considerations

**Access control:**
- Only ADMIN can view audit logs
- Audit logs are append-only (never updated or deleted except via purge process)
- Audit logs should not contain sensitive data (passwords, full access codes) — use references only

**Performance:**
- Indexes on frequently queried fields
- Consider partitioning by date for very large tables (future optimization)

---

## Portal Implementation Requirements

**Must implement:**
1. `AuditLog` Prisma model matching this schema
2. Audit log write function called on every state transition
3. Audit log write function called on every critical action
4. Admin-only audit log viewer (future: `/admin/audit` page)
5. Indexes on `actorUserId`, `entityType`, `entityId`, `createdAt`

**See `02_State_Machines_Jobs_WorkOrders_Invoices_Payouts.md` for state transition logging requirements.**

---

**This document defines the audit log structure. Portal implementation must match this schema exactly.**
