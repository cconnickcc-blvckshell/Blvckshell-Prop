# Blvck Bible — Automation and Bulk Operations

**Purpose:** In-depth record of background/cron-style automations and bulk operation flows.  
**Locations:** `portal/src/server/automation/`, `portal/src/server/bulk-actions/`, `portal/src/server/actions/bulk-actions.ts`.  
**Update:** When adding or changing automation or bulk behavior.

---

## Automation Functions

### flagOverdueApprovals(actorUserId: string)

**File:** `src/server/automation/flagOverdueApprovals.ts`  
**Purpose:** Find jobs in status COMPLETED_PENDING_APPROVAL that are past a configured threshold (e.g. hours since submitted) and set approvalFlaggedAt (or equivalent) so admins can see overdue approvals.  
**Returns:** Summary (e.g. { flagged: number, jobIds: string[] }).  
**Usage:** Called from bulk-actions.runFlagOverdueApprovals() (admin-triggered or cron).  
**Guard:** Caller should use requireAdmin; actorUserId is written to audit if applicable.

---

### ensureJobOnDraftInvoice(invoiceId: string)

**File:** `src/server/automation/ensureJobOnDraftInvoice.ts`  
**Purpose:** Ensure a draft invoice has at least one job (or line item). If none, may create a placeholder job or line so invoice structure is valid.  
**Usage:** Called when generating drafts or when invoice is created; behavior is policy-dependent (see DECISIONS.md or code).  
**Guard:** Admin only (caller).

---

### createMakeGoodJobIfNeeded(jobId: string)

**File:** `src/server/automation/createMakeGoodJobIfNeeded.ts`  
**Purpose:** If the job is missed (isMissed) or otherwise requires a make-good, create a linked Job (makeGoodJobId) for the follow-up work.  
**Usage:** Called after job is marked missed or when make-good is requested.  
**Guard:** Admin (caller).

---

## Bulk Operations (Entry Points)

**File:** `src/server/actions/bulk-actions.ts`

All bulk execute actions validate first (preview) then run the corresponding module.  
Guards: requireAdmin for execute and preview.

| Entry point | Preview function | Execute function | Module |
|-------------|------------------|------------------|--------|
| Bulk job action | previewBulkJobAction(jobIds, action) | executeBulkJobActionAction(jobIds, action) | bulk-actions/jobs.ts |
| Bulk generate drafts | previewBulkGenerateDrafts(...) | executeBulkGenerateDraftsAction(...) | bulk-actions/invoices.ts |
| Bulk resolve incidents | previewBulkResolveIncidents(incidentIds) | executeBulkResolveIncidentsAction(incidentIds) | bulk-actions/incidents.ts |
| Bulk work order transition | previewBulkWorkOrderTransition(workOrderIds, toStatus) | executeBulkWorkOrderTransitionAction(...) | bulk-actions/work-orders.ts |
| Flag overdue approvals | — | runFlagOverdueApprovals() | automation/flagOverdueApprovals.ts |

---

## Bulk Jobs

**File:** `src/server/bulk-actions/jobs.ts`

- **validateBulkJobAction(jobIds, action):** Check that all jobs exist, are in an allowed status for the action (e.g. cancel only if not PAID/CANCELLED), and user has access. Return validation result (ok, errors per job).  
- **executeBulkJobAction(jobIds, action):** For each job, perform transition (e.g. CANCELLED) via state-machine.transitionJob; log audit.  
**Actions (typical):** cancel, approve (transition to APPROVED_PAYABLE), reject (back to SCHEDULED).  
**Idempotency:** Each job transition is independent; already terminal jobs are skipped or return error in validation.

---

## Bulk Invoices (Generate Drafts)

**File:** `src/server/bulk-actions/invoices.ts`

- **validateBulkGenerateDrafts(clientId, periodStart, periodEnd):** Determine which clients/periods would get new draft invoices; return preview (e.g. list of invoice params).  
- **executeBulkGenerateDrafts(...):** Create draft invoices (createDraftInvoice or createDraftInvoiceInternal) for each client/period in scope.  
**Uniqueness:** Do not create duplicate draft for same client/period; validation should prevent double-create.

---

## Bulk Incidents

**File:** `src/server/bulk-actions/incidents.ts`

- **validateBulkResolveIncidents(incidentIds):** Check incidents exist and are not already resolved.  
- **executeBulkResolveIncidents(incidentIds):** Set resolvedAt (and optionally resolutionNotes) for each IncidentReport.  
**Guard:** Admin.

---

## Bulk Work Orders

**File:** `src/server/bulk-actions/work-orders.ts`

- **validateBulkWorkOrderTransition(workOrderIds, toStatus):** Check each work order exists and transition is allowed (isAllowedWorkOrderTransition).  
- **executeBulkWorkOrderTransition(workOrderIds, toStatus):** Call transitionWorkOrder for each; audit log.  
**Guard:** Admin.

---

## Bulk Operation ID

**File:** `src/server/bulk-actions/index.ts`  
**Function:** generateBulkOperationId(): string — returns a unique id for the bulk run (e.g. for audit or idempotency key).  
**Usage:** Optional; use when logging or correlating bulk runs.

---

*End of Automation and Bulk Operations.*
