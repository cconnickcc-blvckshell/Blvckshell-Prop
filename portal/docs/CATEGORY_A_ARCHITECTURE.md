# Category A: Safe & Required Efficiency — Architecture Plan

## Principles (non-negotiable)
- Every action affecting money, access, evidence, assignments, status, contracts, or invoices MUST produce an audit log entry.
- Bulk actions: per-entity audit fan-out only; no single "bulk" audit row. Use `bulkOperationId` (cuid) in each entity's audit metadata for correlation.
- Templates: versioned, immutable once referenced. Instances store `templateId` + `templateVersion`.
- Automation: triggers states only; never bypasses approval or evidence. Idempotent; explainable "why" in metadata.

---

## A1 — Bulk & Assisted Admin

**Model:** No new table. `bulkOperationId` (cuid) generated per request; stored only in AuditLog.metadata for each affected entity. Keeps schema minimal; full traceability via audit query by metadata.bulkOperationId.

**Services:**
- `bulk-actions/jobs`: validate(jobIds, action, options) → { valid, invalid: [{id, code, message}] }; execute(jobIds, action, actor, bulkOperationId) → { bulkOperationId, succeeded, failed }. Uses existing transitionJob/transitionWorkOrder; each call writes one AuditLog with metadata.bulkOperationId.
- `bulk-actions/invoices`: bulkGenerateDrafts(clientId, periodStart, periodEnd) → one draft per (client, period) if none; audit per created invoice.
- `bulk-actions/incidents`: bulkMarkResolved(incidentIds, resolutionNotes) → per-incident update + per-incident audit (entityType IncidentReport, fromState/toState or action in metadata).
- `bulk-actions/work-orders`: bulkTransition(workOrderIds, toStatus) → per-WO transition + audit via existing transitionWorkOrder.

**Invariants:** Validate server-side on preview and again on execute. Partial failure: succeed where valid, return failed[]. RBAC: requireAdmin() on all entry points.

---

## A2 — Templates (versioned, immutable)

**Models (new):**
- SiteTemplate: id, version, status (Draft|Active|Archived), createdById, body Json (requiredPhotoCount, suppliesProvidedBy, doNotEnterUnits, serviceWindow, estimatedDurationMinutes), createdAt, updatedAt. Unique (id, version) — use single table with version as int; "active" = latest version where status=Active.
- JobTemplate: id, version, status, createdById, body Json (pricingModel, estimatedDurationMinutes, defaultChecklistTemplateId?, defaultPayoutAmountCents?), createdAt, updatedAt.
- ContractTemplate: id, version, status, createdById, body Json (billingCadence, netTermsDays, monthlyBaseAmountCents, clausesMarkdown?), createdAt, updatedAt.
- InvoiceTemplate: id, version, status, createdById, body Json (lineItemDefaults, layoutMetadata), createdAt, updatedAt.
- MakeGoodRuleTemplate: id, version, status, createdById, body Json (scheduleOffsetDays, requiredReasonText?), createdAt, updatedAt.

**Snapshot:** Site, Job, Contract, Invoice record templateId + templateVersion at creation (add optional columns where needed). ChecklistRun already has templateVersion; ChecklistTemplate is per-site (keep as-is). Editing template = create new version (copy body, increment version, set old to Archived when activating new).

**Deletion:** Templates cannot be deleted if referenced; only status=Archived.

---

## A3 — State-triggered automation

**Invoice draft auto-creation:** On transitionJob(..., APPROVED_PAYABLE), after transaction: ensure job is on a Draft invoice for same client and period (call addJobToInvoice or createDraftInvoice + addJobToInvoice). Idempotent: if job.invoiceId already set, skip. Audit: existing Job transition audit + new AuditLog entityType Invoice, entityId=invoiceId, metadata { action: "JobAddedByAutomation", jobId, reason: "APPROVED_PAYABLE" }.

**Make-good auto-creation:** When job is set isMissed=true (or status→CANCELLED with isMissed): create linked Job (makeGoodJobId), SCHEDULED, same site; audit both (Job created, Job updated). Idempotent: if makeGoodJobId already set, skip. Use system actor: create a dedicated User "system@blvckshell.com" with role ADMIN for automation, or store actorUserId as the admin who marked missed; spec says "system actor OR dedicated actor" — use the admin who triggered the transition for audit.

**Reminders:** Lightweight: add optional `approvalFlaggedAt` DateTime? on Job. Cron or on admin dashboard load: for jobs in COMPLETED_PENDING_APPROVAL older than N days, set approvalFlaggedAt. No state change; just a flag. Audit when flag is set: AuditLog entityType Job, metadata { action: "ApprovalFlagged", reason: "Overdue" }.

---

## File tree (new/changed)

- `src/server/bulk-actions/` — validate/execute for jobs, invoices, incidents, work orders.
- `src/server/actions/bulk-actions.ts` — server actions (preview + execute) calling bulk-actions.
- `src/server/automation/` — invoice-after-approval, make-good-on-missed, approval-reminder.
- `prisma/schema.prisma` — template models; Job/Site/Contract optional templateId+templateVersion; Job.approvalFlaggedAt.
- `src/app/admin/jobs/page.tsx` (or bulk panel component) — bulk job actions UI.
- `src/app/admin/invoices/page.tsx` — bulk generate drafts UI.
- `src/app/admin/incidents/page.tsx` — bulk resolve UI.
- `src/app/admin/workorders/page.tsx` — bulk transition UI.
- Tests: `__tests__/unit/bulk-actions/*`, `__tests__/unit/automation/*`.

---

## File tree changes (concrete)

```
portal/
  docs/
    CATEGORY_A_ARCHITECTURE.md          (this file)
  prisma/
    schema.prisma                        (+ template models; Job.approvalFlaggedAt; optional template refs on Site/Contract)
    migrations/                         (new migration for Category A)
  src/
    server/
      bulk-actions/
        index.ts                         (bulkOperationId, types)
        jobs.ts                          (validateBulkJobAction, executeBulkJobAction)
        invoices.ts                      (validateBulkGenerateDrafts, executeBulkGenerateDrafts)
        incidents.ts                     (validateBulkResolveIncidents, executeBulkResolveIncidents)
        work-orders.ts                   (validateBulkWorkOrderTransition, executeBulkWorkOrderTransition)
      actions/
        bulk-actions.ts                  (server actions: preview + execute for each entity type)
      automation/
        invoice-after-approval.ts        (ensureJobOnDraftInvoice)
        make-good-on-missed.ts           (createMakeGoodJobIfNeeded)
        approval-reminder.ts             (flagOverdueApprovals)
    app/
      admin/
        jobs/
          page.tsx                       (+ BulkJobActionsPanel)
        invoices/
          page.tsx                       (+ BulkGenerateDraftsPanel)
        incidents/
          page.tsx                       (+ BulkResolveIncidentsPanel)
        workorders/
          page.tsx                       (+ BulkWorkOrderPanel)
      components/
        admin/
          BulkJobActionsPanel.tsx
          BulkGenerateDraftsPanel.tsx
          BulkResolveIncidentsPanel.tsx
          BulkWorkOrderPanel.tsx
    lib/
      state-machine.ts                   (optional: call automation after transitionJob APPROVED_PAYABLE / CANCELLED with isMissed)
  __tests__/
    unit/
      bulk-actions/
        jobs.test.ts
        invoices.test.ts
        incidents.test.ts
        work-orders.test.ts
      automation/
        invoice-after-approval.test.ts
        make-good.test.ts
```

---

## PR plan (step-by-step)

**PR1 — Bulk backend (no UI)**  
- Add `src/server/bulk-actions/index.ts` (types, generateBulkOperationId).  
- Add `src/server/bulk-actions/jobs.ts`: validate (state checks via state-machine), execute (loop transitionJob + audit with bulkOperationId).  
- Add `src/server/bulk-actions/invoices.ts`: validate period + client, execute createDraftInvoice (with audit per invoice).  
- Add `src/server/bulk-actions/incidents.ts`: validate unresolved only, execute update + audit per incident.  
- Add `src/server/bulk-actions/work-orders.ts`: validate transition allowed, execute transitionWorkOrder + audit per WO.  
- Add `src/server/actions/bulk-actions.ts`: requireAdmin; preview (validate only); execute (call execute, return { bulkOperationId, succeeded, failed }).  
- Tests: validation rejects bad states; execute produces per-entity audit with bulkOperationId; partial failure; non-admin rejected.

**PR2 — Bulk UI**  
- BulkJobActionsPanel: select jobs (COMPLETED_PENDING_APPROVAL or SCHEDULED), choose approve/reject/cancel, shared reason for reject/cancel, preview table, confirm, run execute, show results + bulkOperationId.  
- BulkGenerateDraftsPanel: client + period range, preview (list of drafts to create), confirm, execute, results.  
- BulkResolveIncidentsPanel: select unresolved incidents, resolutionNotes, preview, confirm, execute, results.  
- BulkWorkOrderPanel: select WOs, target status, preview, confirm, execute, results.  
- Manual: run each flow in browser; check audit log for per-entity entries and bulkOperationId in metadata.

**PR3 — Template models**  
- Prisma: SiteTemplate, JobTemplate, ContractTemplate, InvoiceTemplate, MakeGoodRuleTemplate (id, version, status enum, createdById, body Json, timestamps). Unique constraint (id, version) or single id with version in table.  
- Migration.  
- Tests: create version, create instance with templateId+version, archive template, ensure instance unchanged.

**PR4 — Snapshot semantics**  
- Add optional templateId/templateVersion to Site, Job, Contract where applicable.  
- When creating Site/Job/Contract from template, set and store.  
- ChecklistRun already has templateVersion; ensure Job or run stores template reference (already has checklistTemplateId on run).  
- Tests: instance shows correct template version.

**PR5 — Automation**  
- invoice-after-approval: after transitionJob(..., APPROVED_PAYABLE), call ensureJobOnDraftInvoice(jobId); idempotent; audit Invoice.  
- make-good-on-missed: when marking job missed (or cancelling with isMissed), call createMakeGoodJobIfNeeded(jobId); idempotent; audit both jobs.  
- approval-reminder: set Job.approvalFlaggedAt for COMPLETED_PENDING_APPROVAL older than N days; audit metadata.  
- Hook: in job-actions approveCompletion (or in transitionJob callback), after success call ensureJobOnDraftInvoice. In cancel route or job-actions when isMissed set, call createMakeGoodJobIfNeeded.  
- Tests: idempotency; audit entries; no duplicate make-good; invoice draft correctness.

**PR6 — Verification checklist**  
- Document in CATEGORY_A_VERIFICATION_CHECKLIST.md: each requirement → code location, test, audit evidence.
