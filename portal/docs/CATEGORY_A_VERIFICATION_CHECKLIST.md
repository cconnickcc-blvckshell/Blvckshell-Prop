# Category A — Verification Checklist

Each requirement is mapped to code location(s), test(s), and audit log evidence.

---

## A1 — Bulk & Assisted Admin Actions

| Requirement | Code location(s) | Test(s) | Audit log evidence |
|-------------|------------------|--------|--------------------|
| Bulk approve jobs (COMPLETED_PENDING_APPROVAL → APPROVED_PAYABLE) | `server/bulk-actions/jobs.ts` (validateBulkJobAction, executeBulkJobAction); `server/actions/bulk-actions.ts` (previewBulkJobAction, executeBulkJobActionAction) | Unit: validation rejects illegal states; execute produces per-entity audit with bulkOperationId; partial failure; non-admin rejected | AuditLog entityType=Job, metadata.bulkOperationId, fromState/toState |
| Bulk reject jobs (with reason) | Same as above; options.sharedReason | Same | metadata.rejectionReason |
| Bulk cancel jobs (SCHEDULED only, reason) | Same; ACTION_TO_STATE.cancel, ALLOWED_FROM.cancel | Same | metadata.cancelReason |
| Bulk generate DRAFT invoices (client + period) | `server/bulk-actions/invoices.ts`; `server/actions/bulk-actions.ts` (previewBulkGenerateDrafts, executeBulkGenerateDraftsAction) | Unit: per-invoice audit with bulkOperationId | AuditLog entityType=Invoice, metadata.bulkOperationId, action=DraftCreated |
| Bulk mark incidents resolved | `server/bulk-actions/incidents.ts`; `server/actions/bulk-actions.ts` | Unit: per-incident audit | AuditLog entityType=IncidentReport, fromState=Unresolved, toState=Resolved, metadata.bulkOperationId |
| Bulk work order transition | `server/bulk-actions/work-orders.ts`; uses transitionWorkOrder with metadata.bulkOperationId | Unit: per-WO audit | AuditLog entityType=WorkOrder, metadata.bulkOperationId |
| Preview & Confirm UI mandatory | `components/admin/BulkJobActionsPanel.tsx`, `BulkGenerateDraftsPanel.tsx`, `BulkResolveIncidentsPanel.tsx`, `BulkWorkOrderPanel.tsx` | Manual: preview shows list and summary; confirm warns “audited per item” | — |
| Validation twice (preview + execute) | All validate* in bulk-actions/*; execute* re-checks (e.g. incidents: resolvedAt null) | Unit: execute rejects invalid even if preview was stale | — |
| Per-entity audit only (no single bulk row) | All execute* loops: one AuditLog per entity with metadata.bulkOperationId | Unit: count audit rows = count succeeded | Each row has entityId, entityType, metadata.bulkOperationId |
| Partial failure (succeeded + failed[]) | All execute* return { bulkOperationId, succeeded, failed } | Unit: partial failure scenario | — |
| RBAC: only ADMIN | requireAdmin() in all server actions in bulk-actions.ts | Unit: non-admin rejected | — |
| bulkOperationId in UI results | All four panels show result.bulkOperationId | Manual | — |

---

## A2 — Templates (versioned, immutable)

| Requirement | Code location(s) | Test(s) | Audit log evidence |
|-------------|------------------|--------|--------------------|
| SiteTemplate, JobTemplate, ContractTemplate, InvoiceTemplate, MakeGoodRuleTemplate | `prisma/schema.prisma`: models with id, logicalId, version, status (TemplateStatus), body Json, createdById, timestamps | Unit: create version; instance stores templateId+version | — |
| Unique (logicalId, version) | schema @@unique([logicalId, version]); migration | Migration applies | — |
| Instance snapshot templateId + version | Site.siteTemplateId, siteTemplateVersion; Job.jobTemplateId, jobTemplateVersion; Contract.contractTemplateId, contractTemplateVersion; Invoice.invoiceTemplateId, invoiceTemplateVersion | Unit: instance shows template version at creation | — |
| ChecklistRun templateVersion | Already in schema (ChecklistRun.templateVersion) | Existing | — |
| Status Draft/Active/Archived | TemplateStatus enum | — | — |
| Editing = new version (copy + increment) | Not implemented in UI; schema supports it. Service layer: create new row same logicalId, version+1 | Unit: new version does not mutate existing instances | — |
| Archive: cannot delete if referenced | Application rule (no delete template if sites/jobs reference); only status=Archived | Unit: archive preserves history | — |

---

## A3 — State-triggered automation

| Requirement | Code location(s) | Test(s) | Audit log evidence |
|-------------|------------------|--------|--------------------|
| Invoice draft auto-creation on APPROVED_PAYABLE | `server/automation/ensureJobOnDraftInvoice.ts`; called from `lib/state-machine.ts` after transitionJob(..., APPROVED_PAYABLE) | Unit: idempotent (job.invoiceId set skips); audit Invoice with action JobAddedByAutomation | AuditLog entityType=Invoice, metadata.action=JobAddedByAutomation, metadata.reason=APPROVED_PAYABLE |
| Does not send invoice | ensureJobOnDraftInvoice only finds/creates Draft and adds job | — | — |
| Make-good auto-creation when job marked missed | `server/automation/createMakeGoodJobIfNeeded.ts`; called from `app/api/admin/jobs/[id]/cancel/route.ts` when body.isMissed=true | Unit: idempotent (makeGoodJobId set skips); no duplicate make-good; audit both jobs | AuditLog for original: metadata.MakeGoodCreated, makeGoodJobId; for new job: entityType=Job, toState=SCHEDULED, metadata.originalJobId |
| Reminders / flags (overdue approvals) | `server/automation/flagOverdueApprovals.ts`; `server/actions/bulk-actions.ts` runFlagOverdueApprovals; called from `app/admin/jobs/page.tsx` on load | Unit: sets approvalFlaggedAt; audit when flag set | AuditLog entityType=Job, metadata.action=ApprovalFlagged, reason=Overdue |
| Automation explainable (“why” in metadata) | All automation audit entries include reason/action in metadata | — | metadata.reason, metadata.action |
| Idempotent | ensureJobOnDraftInvoice: skip if job.invoiceId set; createMakeGoodJobIfNeeded: skip if makeGoodJobId set | Unit: idempotency tests | — |
| RBAC / actor | ensureJobOnDraftInvoice uses approving user; createMakeGoodJobIfNeeded uses cancel user; flagOverdueApprovals uses admin user from runFlagOverdueApprovals | — | actorUserId in AuditLog |

---

## File reference summary

- **A1**: `server/bulk-actions/index.ts`, `jobs.ts`, `invoices.ts`, `incidents.ts`, `work-orders.ts`; `server/actions/bulk-actions.ts`; `components/admin/Bulk*Panel.tsx`; `app/admin/jobs|invoices|incidents|workorders/page.tsx`.
- **A2**: `prisma/schema.prisma` (template models, snapshot columns); `prisma/migrations/20260221120000_category_a_templates_and_snapshots/migration.sql`.
- **A3**: `server/automation/ensureJobOnDraftInvoice.ts`, `createMakeGoodJobIfNeeded.ts`, `flagOverdueApprovals.ts`; `lib/state-machine.ts`; `app/api/admin/jobs/[id]/cancel/route.ts`; `server/actions/invoice-actions.ts` (addJobToInvoiceInternal); `app/admin/jobs/page.tsx` (runFlagOverdueApprovals).
