# Audit Envelope Specification

**Purpose:** Define the complete audit envelope — all operations that **must** be logged for compliance, dispute resolution, and security. This is non-negotiable for money movement and access control.

**Generated:** February 2026  
**Status:** P0 — Must be enforced before production scale

---

## Core Principle

**If it affects money, access, or liability, it must be audited.**

---

## 1. Money Movement (ALL must be logged)

### ✅ Currently Audited

| Operation | Entity Type | Status | Notes |
|-----------|-------------|--------|-------|
| Job status transitions | `Job` | ✅ Implemented | All transitions via `transitionJob()` |
| Invoice status changes | `Invoice` | ✅ Implemented | Draft → Sent, Sent → Paid |
| Payout batch creation | `PayoutBatch` | ✅ Implemented | Includes metadata (period, line count, total) |
| Payout batch mark paid | `PayoutBatch` | ✅ Implemented | Includes job count |

### ❌ Missing Audit Coverage

| Operation | Entity Type | Priority | Justification |
|-----------|-------------|----------|---------------|
| Invoice creation | `Invoice` | P1 | Invoice creation affects billing; should log who created and when |
| Invoice line item add/remove | `InvoiceLineItem` | P1 | Changes to invoice composition affect money |
| Billing adjustment creation | `BillingAdjustment` | P1 | Adjustments directly affect invoice totals |
| Billing adjustment status change | `BillingAdjustment` | P1 | Approval/rejection affects money |
| Contract creation/modification | `Contract` | P2 | Contracts define pricing; changes affect future billing |

---

## 2. Access Control (ALL must be logged)

### ✅ Currently Audited

| Operation | Entity Type | Status | Notes |
|-----------|-------------|--------|-------|
| Job assignment/reassignment | `Job` | ✅ Partial | Assignment changes logged via job transitions |

### ❌ Missing Audit Coverage

| Operation | Entity Type | Priority | Justification |
|-----------|-------------|----------|---------------|
| WorkforceAccount creation | `WorkforceAccount` | **P0** | Creates access to system; affects who can be assigned work |
| WorkforceAccount update | `WorkforceAccount` | **P0** | Changes to account details (contact, HST, WSIB) affect operations |
| Worker creation | `Worker` | **P0** | Grants access to worker portal; affects job assignment |
| Worker removal/deactivation | `Worker` | **P0** | Revokes access; affects job visibility |
| Site creation | `Site` | P1 | Sites define scope; creation affects operations |
| Site update | `Site` | P1 | Changes to site details (address, access instructions) affect operations |
| AccessCredential issuance | `AccessCredential` | **P0** | Grants physical access; security-critical |
| AccessCredential return | `AccessCredential` | **P0** | Revokes physical access; security-critical |
| AccessCredential loss report | `AccessCredential` | **P0** | Security incident; must be auditable |
| ComplianceDocument upload | `ComplianceDocument` | P1 | Affects workforce account eligibility |
| ComplianceDocument expiration/override | `ComplianceDocument` | **P0** | Overrides affect job assignment eligibility |

---

## 3. State Transitions (ALL must be logged)

### ✅ Currently Audited

| Entity | Transitions | Status |
|--------|-------------|--------|
| Job | All transitions | ✅ Implemented |
| WorkOrder | All transitions | ✅ Implemented |
| Invoice | Status changes | ✅ Implemented |
| PayoutBatch | Status changes | ✅ Implemented |

---

## 4. User & Authentication (ALL must be logged)

### ❌ Missing Audit Coverage

| Operation | Entity Type | Priority | Justification |
|-----------|-------------|----------|---------------|
| User creation | `User` | **P0** | Grants system access |
| User role change | `User` | **P0** | Changes permissions; security-critical |
| User deactivation | `User` | **P0** | Revokes access |
| Password reset (admin-initiated) | `User` | **P0** | Security event |
| Login failures (rate limit triggers) | `User` | P1 | Security monitoring |

---

## 5. Compliance & Risk Operations (ALL must be logged)

### ❌ Missing Audit Coverage

| Operation | Entity Type | Priority | Justification |
|-----------|-------------|----------|---------------|
| Compliance override (COI/WSIB expired) | `ComplianceDocument` | **P0** | Overrides affect job assignment; liability risk |
| Incident report creation | `IncidentReport` | P1 | Risk/liability event |
| Incident resolution | `IncidentReport` | P1 | Risk/liability event |

---

## Implementation Requirements

### Audit Log Schema

All audit logs use the existing `AuditLog` model:

```typescript
{
  actorUserId: string;              // Required: who did it
  actorWorkerId: string | null;    // Optional: worker context
  actorWorkforceAccountId: string | null; // Optional: workforce context
  entityType: string;               // Entity type (Job, Invoice, WorkforceAccount, etc.)
  entityId: string;                 // Entity ID
  fromState: string | null;         // Previous state (for transitions)
  toState: string | null;          // New state (for transitions)
  metadata: Json;                   // Additional context
  createdAt: Date;                  // Timestamp
}
```

### Metadata Standards

**For creation operations:**
```json
{
  "action": "create",
  "createdFields": { /* key fields */ }
}
```

**For updates:**
```json
{
  "action": "update",
  "changedFields": { /* what changed */ },
  "previousValues": { /* old values */ }
}
```

**For access control:**
```json
{
  "action": "issue|return|report_loss",
  "credentialType": "KEY|FOB|CODE",
  "siteId": "...",
  "reason": "..." // if applicable
}
```

**For compliance overrides:**
```json
{
  "action": "override",
  "documentType": "COI|WSIB",
  "expiresAt": "...",
  "overrideReason": "...",
  "overrideUntil": "..." // if time-bound
}
```

---

## Enforcement Checklist

### P0 (Must implement before production scale)

- [ ] WorkforceAccount creation/update audit logging
- [ ] Worker creation/removal audit logging
- [ ] AccessCredential issuance/return/loss audit logging
- [ ] ComplianceDocument override audit logging
- [ ] User creation/role change/deactivation audit logging

### P1 (Next sprint)

- [ ] Site creation/update audit logging
- [ ] Invoice creation audit logging
- [ ] Billing adjustment audit logging
- [ ] ComplianceDocument upload audit logging

### P2 (Future)

- [ ] Contract creation/modification audit logging
- [ ] Login failure rate limit audit logging

---

## Query Patterns (for compliance/forensics)

**Who created/modified this entity?**
```sql
SELECT * FROM "AuditLog" 
WHERE entityType = 'WorkforceAccount' AND entityId = '...'
ORDER BY createdAt DESC;
```

**What did this user do?**
```sql
SELECT * FROM "AuditLog"
WHERE actorUserId = '...'
ORDER BY createdAt DESC;
```

**All access credential operations for a site:**
```sql
SELECT * FROM "AuditLog"
WHERE entityType = 'AccessCredential' 
  AND metadata->>'siteId' = '...'
ORDER BY createdAt DESC;
```

**All compliance overrides:**
```sql
SELECT * FROM "AuditLog"
WHERE entityType = 'ComplianceDocument'
  AND metadata->>'action' = 'override'
ORDER BY createdAt DESC;
```

---

## Notes

- **Retention:** 7 years minimum (compliance requirement)
- **Performance:** Indexes on `actorUserId`, `entityType + entityId`, `createdAt`
- **Privacy:** Audit logs may contain PII; ensure access control on audit log viewer
- **Non-repudiation:** Audit logs are append-only; never modify or delete

---

**This document is the authoritative source for audit requirements. All code must enforce this envelope.**
