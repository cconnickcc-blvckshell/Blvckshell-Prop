# Blvck Bible — Exception Cockpit (Admin)

**Purpose:** Single-admin visibility into everything that needs attention. One page or section that makes 100+ contracts viable.  
**Source:** Scale-Safe Hardening Blueprint; single-admin optimized.  
**Update:** When new exception types or blocking reasons are added.

---

## Goal

One place for the admin to see:

- Jobs pending approval too long
- Rejected checklist runs
- Evidence upload failures / missing required photos
- Jobs stuck in Scheduled
- Invoices in draft with placeholders (hard block)
- Payout batches ready but blocked (and why)

No new roles or manager RBAC; **visibility** only.

---

## Exact Queries

Use these (or equivalent Prisma) in the Exception Cockpit. All queries assume current user is admin/founder.

### 1. Jobs pending approval > 24h

**Intent:** Jobs in `COMPLETED_PENDING_APPROVAL` for more than 24 hours.

```ts
// Prisma
const overdue = await prisma.job.findMany({
  where: {
    status: "COMPLETED_PENDING_APPROVAL",
    updatedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  },
  include: { site: true, assignee: true },
  orderBy: { updatedAt: "asc" },
});
```

**UI block:** Table: Job id, Site, Assignee, Completed at (updatedAt). Link to job detail. Count badge.

---

### 2. Checklist runs rejected

**Intent:** ChecklistRun where status = Rejected.

```ts
const rejected = await prisma.checklistRun.findMany({
  where: { status: "Rejected" },
  include: { job: { include: { site: true } }, template: true },
  orderBy: { updatedAt: "desc" },
});
```

**UI block:** List: Run id, Job, Site, Template, Rejected at. Link to run/job. Count badge.

---

### 3. Evidence upload failures / missing required photos

**Intent:** Jobs in COMPLETED_PENDING_APPROVAL (or submitted runs) where required evidence is missing. Definition of “required” is product-specific (e.g. at least one photo per run, or per item). If you track upload failures in AuditLog or a table, query that; otherwise derive from Job + ChecklistRun + Evidence counts.

```ts
// Example: jobs with submitted runs but no evidence for that run
const jobsWithRuns = await prisma.job.findMany({
  where: { status: "COMPLETED_PENDING_APPROVAL" },
  include: {
    checklistRuns: { where: { status: "Submitted" } },
    jobCompletions: { include: { evidence: true } },
  },
});
// Filter where some run has no evidence linked (by run id or completion)
// Implementation depends on Evidence ↔ ChecklistRun linkage (itemId/checklistRunId).
```

**UI block:** List of jobs (or runs) with “Missing required photo” / “Evidence cap reached”. Link to job/upload. Count badge.

---

### 4. Jobs stuck in Scheduled too long

**Intent:** Jobs in `SCHEDULED` with scheduled date (or createdAt) older than threshold (e.g. 7 days).

```ts
const stuck = await prisma.job.findMany({
  where: {
    status: "SCHEDULED",
    scheduledDate: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  },
  include: { site: true, assignee: true },
  orderBy: { scheduledDate: "asc" },
});
```

**UI block:** Table: Job, Site, Assignee, Scheduled date. Link to job. Count badge.

---

### 5. Invoices draft with placeholders (hard block)

**Intent:** Invoices in Draft that have at least one line with `isSystemPlaceholder = true`. These cannot be sent until placeholders are removed.

```ts
const withPlaceholders = await prisma.invoice.findMany({
  where: {
    status: "Draft",
    lineItems: { some: { isSystemPlaceholder: true } },
  },
  include: { clientOrganization: true, lineItems: true },
});
```

**UI block:** List: Invoice id, Client, “Contains placeholder lines — remove or replace to send.” Link to invoice. Count badge.

---

### 6. Payout batches ready but blocked (and why)

**Intent:** Payout batches in CALCULATED or APPROVED that are “blocked” (e.g. waiting for approval, or jobs missing approvedPayoutCents). If “blocked” is a status or a flag, query it. Otherwise: list batches not yet RELEASED/PAID and show reason (e.g. “Pending approval”, “N jobs missing approved amounts”).

```ts
const blocked = await prisma.payoutBatch.findMany({
  where: { status: { in: ["CALCULATED", "APPROVED"] } },
  include: {
    lines: true,
    workforceAccount: true,
  },
});
// Optionally: jobs in APPROVED_PAYABLE with approvedPayoutCents null (data integrity)
const jobsMissingApproved = await prisma.job.findMany({
  where: {
    status: "APPROVED_PAYABLE",
    approvedPayoutCents: null,
  },
});
```

**UI block:** List: Batch id, Workforce account, Status, “Blocked: …” (reason). Link to batch. Separate line if there are jobs with APPROVED_PAYABLE but null approvedPayoutCents (data fix needed).

---

## UI Structure (Minimal)

- **Location:** Admin layout — e.g. `/admin/exceptions` or a dedicated “Exception Cockpit” section on dashboard.
- **Sections:** One card or table per query above. Each has:
  - Title (e.g. “Jobs pending approval > 24h”).
  - Count.
  - List/table with key fields and link to entity.
- **Refresh:** Page load; optional “Refresh” button. No new workflows; read-only visibility.

---

## Compliance expiring (if modeled)

If you have compliance documents (e.g. COI, WSIB) with expiry dates:

```ts
const expiring = await prisma.complianceDocument.findMany({
  where: {
    expiresAt: {
      lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // next 30 days
      gte: new Date(),
    },
  },
  include: { workforceAccount: true },
});
```

**UI block:** List: Document, Workforce account, Expires at. Link to workforce/compliance.

---

## Worker-facing blocking reasons

When a worker submits a checklist or evidence, show **explicit** reasons when blocked:

- “Missing photo for item X”
- “Checklist item Y unanswered”
- “Evidence cap reached”
- “Redaction attestation required”

Surfaced in the same submit flow (validation errors). Reduces churn and admin time.

---

*End of Exception Cockpit spec. See 11_Hard_Invariants for the laws these exceptions relate to.*
