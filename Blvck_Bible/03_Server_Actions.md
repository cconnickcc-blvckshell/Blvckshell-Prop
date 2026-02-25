# Blvck Bible — Server Actions

**Purpose:** In-depth record of every server action (exported async functions used by server components or form actions).  
**Locations:** `portal/src/server/actions/*.ts`, `portal/src/app/admin/**/actions.ts` (form handlers).  
**Update:** When adding or changing server actions.

---

## Convention

- Server actions run on the server and have access to `headers()` / `cookies()` for session; they **must** call the appropriate guard (e.g. requireAdmin) when mutating or returning sensitive data.
- Actions that change state should write **AuditLog** where applicable (e.g. job transition, invoice status change).
- Idempotency and uniqueness rules (e.g. payout line per job per batch) are enforced inside the action.

---

## Quote Actions

**File:** `src/server/actions/quote-actions.ts`

| Action | Purpose | Guard / access |
|--------|---------|-----------------|
| listQuotes(filters?) | List quotes, optional status filter | Admin (caller should use requireAdmin in page) |
| getPricingPolicies() | List pricing policies for quote builder | Admin |
| getSitesForQuote() | List sites available for quoting | Admin |
| createQuote(siteId, pricingPolicyId) | Create new quote for site with policy | Admin |
| getQuote(quoteId) | Get quote with area lines, add-ons, snapshots | Admin |
| createQuoteAreaLine(quoteId, type, measurements, ...) | Add area line; type = QuoteAreaType | Admin |
| updateQuoteAreaLine(quoteLineId, ...) | Update area line | Admin |
| deleteQuoteAreaLine(quoteLineId) | Remove area line | Admin |
| createQuoteAddOnLine(quoteId, name, estimatedLaborMinutes, ...) | Add add-on line | Admin |
| updateQuoteAddOnLine(lineId, ...) | Update add-on line | Admin |
| deleteQuoteAddOnLine(lineId) | Remove add-on line | Admin |
| computeAndPersistSnapshot(quoteId) | Recompute quote snapshot and persist QuoteSnapshot | Admin |
| transitionQuoteToSent(quoteId) | Set quote status to SENT | Admin |
| overrideBillingRate(quoteId, centsPerHour, reason) | Override billing rate (founder-only in UI) | Founder |
| overrideRevenueFloor(quoteId, reason) | Override revenue floor (founder-only) | Founder |
| getQuoteForProposal(quoteId) | Get quote data for proposal view/export | Admin |

---

## Invoice Actions

**File:** `src/server/actions/invoice-actions.ts`

| Action | Purpose | Guard / access |
|--------|---------|-----------------|
| getUninvoicedApprovedJobs(clientId?, siteId?) | Jobs in APPROVED_PAYABLE not on any invoice | Admin |
| createDraftInvoiceInternal(clientId, periodStart, periodEnd) | Create draft invoice (internal; no guard inside) | Caller must guard |
| createDraftInvoice(clientId, periodStart, periodEnd) | Create draft invoice; public entry point | Admin |
| getInvoiceWithDetails(invoiceId) | Invoice with line items, jobs, adjustments | Admin or client (canAccessInvoice) |
| addJobToInvoiceInternal(invoiceId, jobId) | Add job to invoice as line (internal) | Caller must guard |
| addJobToInvoice(invoiceId, jobId) | Add job to invoice | Admin |
| removeJobFromInvoice(invoiceId, jobId) | Remove job line from invoice | Admin |
| addBillingAdjustment(invoiceId?, siteId, jobId?, type, category, amountCents, ...) | Create billing adjustment | Admin |
| addContractBaseToInvoice(invoiceId) | Add contract base line to invoice | Admin |
| listInvoices(clientId?) | List invoices, optional client filter | Admin or client (filter by org) |
| updateInvoiceStatus(invoiceId, status) | Draft → Sent → Paid, Void | Admin |

---

## Job Actions

**File:** `src/server/actions/job-actions.ts`

| Action | Purpose | Guard / access |
|--------|---------|-----------------|
| saveDraft(input) | Create or update job (draft); schedule, site, payout, assignment | Admin |
| submitCompletion(input) | Worker submits completion (checklistResults, notes); creates JobCompletion; transitions job to COMPLETED_PENDING_APPROVAL | Worker (canAccessJob) |
| approveCompletion(jobId) | Admin approves; transition to APPROVED_PAYABLE | Admin |
| rejectCompletion(jobId, reason) | Admin rejects; transition back to SCHEDULED | Admin |

**Note:** Job cancel is via API POST `/api/admin/jobs/[id]/cancel` or equivalent; transition to CANCELLED via state-machine.transitionJob.

---

## Checklist Run Actions

**File:** `src/server/actions/checklist-run-actions.ts`

| Action | Purpose | Guard / access |
|--------|---------|-----------------|
| createOrGetChecklistRun(jobId) | Get existing run for job or create new (captures template snapshot) | Worker (canAccessJob) or Admin |
| saveChecklistRunItem(runId, itemId, result, failReason?, note?, completedAt?, completedByWorkerId?) | Upsert item; run must be InProgress | Worker/Admin (run belongs to job; job access) |
| submitChecklistRun(runId) | Set run status to Submitted | Worker/Admin (run belongs to job) |

---

## Payout Actions

**File:** `src/server/actions/payout-actions.ts`

| Action | Purpose | Guard / access |
|--------|---------|-----------------|
| createPayoutBatch({ periodStart, periodEnd }) | Build batch from approved jobs (and optional checklist-run pay); enforce one line per job (or run) per workforce per batch | Admin |
| markPayoutBatchPaid(batchId) | Set batch and lines to PAID; set linked jobs to Job.status PAID | Admin |

---

## Upload Actions

**File:** `src/server/actions/upload-actions.ts`

| Action | Purpose | Guard / access |
|--------|---------|-----------------|
| uploadEvidence({ jobId, completionId, file, itemId?, checklistRunId?, redactionApplied, redactionType? }) | Validate file type/size; upload to evidence bucket; create Evidence record | Caller must ensure user can access job/completion (worker who completed or admin) |

---

## Finance Actions

**File:** `src/server/actions/finance-actions.ts`

| Action | Purpose | Guard / access |
|--------|---------|-----------------|
| getSitesForFinance() | List sites for finance snapshot UI | Admin |
| computeSiteSnapshotAction(siteId, month) | Compute and persist site performance snapshot | Admin (Founder for recompute) |
| closeSiteSnapshot(snapshotId) | Set snapshot status to CLOSED, lockedAt | Admin |
| recomputeSiteSnapshot(siteId, month) | Recompute and overwrite snapshot (OPEN only) | Founder |
| listSiteSnapshots(siteId?, month?) | List snapshots with optional filters | Admin |

---

## Bulk Actions

**File:** `src/server/actions/bulk-actions.ts`

| Action | Purpose | Guard / access |
|--------|---------|-----------------|
| previewBulkJobAction(jobIds, action) | Preview which jobs would be affected (e.g. cancel, approve) | Admin |
| executeBulkJobActionAction(jobIds, action) | Execute bulk job action (delegates to bulk-actions/jobs) | Admin |
| previewBulkGenerateDrafts(clientId, periodStart, periodEnd) | Preview draft invoices to be created | Admin |
| executeBulkGenerateDraftsAction(...) | Create draft invoices in bulk (bulk-actions/invoices) | Admin |
| previewBulkResolveIncidents(incidentIds) | Preview incidents to resolve | Admin |
| executeBulkResolveIncidentsAction(incidentIds) | Resolve incidents (bulk-actions/incidents) | Admin |
| previewBulkWorkOrderTransition(workOrderIds, toStatus) | Preview work order transitions | Admin |
| executeBulkWorkOrderTransitionAction(workOrderIds, toStatus) | Transition work orders in bulk (bulk-actions/work-orders) | Admin |
| runFlagOverdueApprovals() | Run automation: flag overdue job approvals | Admin (e.g. cron or manual trigger) |

**Bulk implementation modules:**  
- `src/server/bulk-actions/jobs.ts`: validateBulkJobAction, executeBulkJobAction  
- `src/server/bulk-actions/invoices.ts`: validateBulkGenerateDrafts, executeBulkGenerateDrafts  
- `src/server/bulk-actions/incidents.ts`: validateBulkResolveIncidents, executeBulkResolveIncidents  
- `src/server/bulk-actions/work-orders.ts`: validateBulkWorkOrderTransition, executeBulkWorkOrderTransition  
- `src/server/bulk-actions/index.ts`: generateBulkOperationId  

---

## Payment Actions

**File:** `src/server/actions/payment-actions.ts`

Provider-agnostic payment ledger. Blvckshell is the system of record; payment providers (Stripe, SparcPay, EFT, cheque) are settlement rails only.

| Action | Purpose | Guard / access |
|--------|---------|-----------------|
| recordPayment({ invoiceId, provider, amountCents, providerRef?, metadata? }) | Create a PENDING payment record against an invoice | Admin |
| settlePayment(paymentId, providerRef?) | Mark payment SETTLED; auto-transitions invoice to Paid if fully settled | Admin |
| failPayment(paymentId, reason) | Mark payment FAILED with reason | Admin |
| listPaymentsForInvoice(invoiceId) | List all payments for an invoice | Admin |

**Key behavior:**  
- `recordPayment`: Cannot record against Draft invoice (must be Sent first).  
- `settlePayment`: If sum of SETTLED payments >= invoice.totalCents, auto-transitions invoice to Paid and updates linked jobs.  
- All mutations write AuditLog with fromState/toState.

---

## Notification Actions

**File:** `src/server/actions/notification-actions.ts`

Durable outbox for email/SMS notifications. Write intent in server actions, process async via background worker.

| Action | Purpose | Guard / access |
|--------|---------|-----------------|
| queueNotification({ channel, templateKey, recipient, payload, relatedEntityType, relatedEntityId }) | Create PENDING notification in outbox | None (internal use) |
| markNotificationSent(notificationId, providerMessageId) | Mark notification SENT (called by background worker) | None (internal use) |
| markNotificationFailed(notificationId, error) | Mark notification FAILED (called by background worker) | None (internal use) |
| getPendingNotifications(limit?) | Get pending notifications for processing | None (internal use) |
| getFailedNotifications(limit?) | Get failed notifications for retry | None (internal use) |
| retryNotification(notificationId) | Reset failed notification to PENDING | None (internal use) |

**Integration:** `/api/notifications/process` cron endpoint calls `getPendingNotifications` and dispatches to SendGrid/Twilio.

---

## Time Entry Actions

**File:** `src/server/actions/timeentry-actions.ts`

Payroll time tracking for employees (not contractors). Contractors are paid via AP/payout.

| Action | Purpose | Guard / access |
|--------|---------|-----------------|
| createTimeEntry({ workerId, jobId?, date, regularMinutes, overtimeMinutes?, rateCentsPerHour, notes? }) | Create time entry (employees only) | Admin |
| approveTimeEntries(entryIds) | Approve submitted entries for payroll export | Admin |
| exportPayrollBatch({ periodStart, periodEnd, batchRef }) | Export approved entries, mark as EXPORTED, return CSV-ready data | Admin |
| listTimeEntries(filters?) | List entries with optional filters (workerId, status, period) | Admin |

**Key behavior:**  
- `createTimeEntry`: Rejects if worker's workforceAccount.classification !== "EMPLOYEE".  
- `exportPayrollBatch`: Marks entries as EXPORTED with payrollBatchRef; writes AuditLog.  
- Entry states: DRAFT → SUBMITTED → APPROVED → EXPORTED → PAID.

---

## Worker Actions

**File:** `src/server/actions/worker-actions.ts`

Worker check-in/check-out for job time tracking.

| Action | Purpose | Guard / access |
|--------|---------|-----------------|
| checkIn(jobId) | Worker checks in to job; sets checkedInAt, startedAt | Worker (requireWorker, own job) |
| checkOut(jobId) | Worker checks out of job; sets checkedOutAt, endedAt, actualDurationMinutes | Worker (requireWorker, own job) |

**Key behavior:**  
- `checkIn`: Requires job status SCHEDULED, not already checked in, assigned to current worker.  
- `checkOut`: Requires checked in, calculates duration in minutes.

---

## Form Actions (App Router)

| File | Action | Purpose |
|------|--------|---------|
| src/app/admin/clients/actions.ts | createClient(formData) | Create client org from form |
| src/app/admin/clients/actions.ts | createSite(formData) | Create site under client |
| src/app/admin/clients/[id]/checklist-actions.ts | assignChecklistTemplate(formData) | Assign checklist template to site |
| src/app/admin/clients/[id]/checklist-actions.ts | removeChecklistTemplate(formData) | Remove checklist template from site |
| src/app/admin/workforce/actions.ts | createWorkforceAccount(formData) | Create workforce account |
| src/app/admin/jobs/actions.ts | createJob(formData) | Create job from form (delegates to job-actions.saveDraft or similar) |

These typically parse FormData, validate, then call server actions or prisma; guard with requireAdmin where appropriate.

---

*End of Server Actions.*
