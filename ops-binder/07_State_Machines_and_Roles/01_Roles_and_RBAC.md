# Roles and RBAC

**Document Version:** 1.0  
**Date:** February 16, 2026  
**Purpose:** Define roles and role-based access control for BLVCKSHELL Facilities Services operations portal.

---

## Portal Roles

The portal uses four roles:

| Role | Description | Portal Mapping |
|------|-------------|----------------|
| **ADMIN** | Full system access; manages workforce, jobs, approvals, payouts | ADMIN |
| **VENDOR_OWNER** | Manages workers in own WorkforceAccount; views vendor-assigned jobs; no pricing, no approvals | VENDOR_OWNER |
| **VENDOR_WORKER** | Views only assigned jobs; submits completion proof; views earnings (read-only) | VENDOR_WORKER |
| **INTERNAL_WORKER** | Views only assigned jobs; submits completion proof; views earnings (read-only) | INTERNAL_WORKER |

**Note:** In operations binder documents, "SUBCONTRACTOR" refers to vendor workers/owners. "OPS_MANAGER" is an optional future role that maps to ADMIN or a future ADMIN subset.

---

## Role Permissions Matrix

### ADMIN

**Full access:**
- Create, read, update, delete WorkforceAccount
- Add/remove workers from any WorkforceAccount
- Upload/view compliance documents (COI, WSIB)
- Override compliance gating (with audit log)
- Create, edit, assign, cancel jobs
- Approve or reject job completions
- Create payout batches and mark jobs paid
- Create/edit work orders
- View/resolve incidents
- Reset user passwords (audit logged)
- View audit logs

**Cannot:**
- Submit job completions (workers only)
- Access pricing information for other organizations

### VENDOR_OWNER

**Can:**
- View own WorkforceAccount details
- Add/remove workers from own WorkforceAccount
- View jobs assigned to own WorkforceAccount (not individual workers)
- View team members and their job assignments
- Upload compliance documents for own WorkforceAccount

**Cannot:**
- View pricing information
- Approve/reject job completions
- Create/edit jobs
- Create payout batches
- Reassign jobs (only ADMIN can assign/reassign)
- Access other WorkforceAccounts
- View audit logs

### VENDOR_WORKER / INTERNAL_WORKER

**Can:**
- View jobs where `assignedWorkerId` = their worker id
- Submit job completions (checklist + photos)
- Save draft completions
- View own earnings (read-only)
- View own profile

**Cannot:**
- View jobs assigned to other workers
- View jobs assigned only to WorkforceAccount (without assignedWorkerId)
- Approve/reject completions
- Create/edit jobs
- View pricing information
- Access admin functions
- View audit logs

---

## Job Visibility Rules

**Critical rule (Phase 1):**
- When a job has **only** `assignedWorkforceAccountId` (no `assignedWorkerId`), the job is **not** shown in any worker's `/jobs` list.
- Admin must set `assignedWorkerId` (assign to a specific worker) for the job to appear in that worker's list.
- This prevents two workers from the same account both showing up.

**Future consideration:** Optional "claim" flow (e.g. `claimedByWorkerId`) can be added later with audit logging.

---

## Access Control Enforcement

**Server-side only:**
- All RBAC checks happen server-side (API routes, server actions, route handlers)
- Never trust client-side role checks
- Every data access checks ownership/assignment or admin status

**IDOR prevention:**
- Workers can only access jobs where `assignedWorkerId` matches their worker id
- Vendor owners can only access data for their own `WorkforceAccount`
- Admin can access all data
- All checks enforced before returning data

---

## Audit Logging

All role-based actions are logged in `AuditLog`:
- `actorUserId` — User who performed the action
- `actorWorkerId` — Worker who performed the action (if applicable)
- `actorWorkforceAccountId` — WorkforceAccount (if applicable)
- `entityType`, `entityId` — What was acted upon
- `fromState`, `toState` — State transitions
- `metadata` — Additional context (e.g., rejection reason, override reason)

---

**This document aligns with portal implementation. See `02_State_Machines_Jobs_WorkOrders_Invoices_Payouts.md` for state transition rules per role.**
