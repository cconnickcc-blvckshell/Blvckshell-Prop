# Phase 1: Portal Hardening — File-Level Tasks

**Objective:** Make existing workflows unbreakable. No new features beyond Client read-only portal.  
**Weeks 2–4.** Each task is implementable and traceable to a file or module.

---

## 1.1 Admin Portal (P0)

### 1.1.1 Create clients, sites, contracts — verify E2E
| Task | File(s) | Action |
|------|---------|--------|
| Verify client create flow | `portal/src/app/admin/clients/new/page.tsx`, `ClientForm.tsx`, `portal/src/app/admin/clients/actions.ts` | Run E2E; ensure validation and success path work |
| Verify site create | `portal/src/app/admin/clients/[id]/page.tsx` (sites section), `portal/src/app/admin/clients/actions.ts` (`createSite`) | Same |
| Verify contract create/edit | `portal/prisma/schema.prisma` (Contract), admin clients detail or dedicated contract UI | Identify where contracts are created; verify or add flow |

### 1.1.2 Schedule jobs, customize tasks per location
| Task | File(s) | Action |
|------|---------|--------|
| Schedule jobs | `portal/src/app/admin/jobs/new/page.tsx`, `CreateJobForm.tsx`, job-actions or admin API | Verify create job; link to site; scheduledStart/End |
| Customize tasks per location | `portal/src/app/admin/clients/[id]/page.tsx`, checklist-actions, `ChecklistTemplate` | Verify checklist templates per site; add/remove items |

### 1.1.3 Assign or replace workforce
| Task | File(s) | Action |
|------|---------|--------|
| Assign workforce to job | `portal/src/app/admin/jobs/[id]/page.tsx` or job edit form | Ensure assign Worker or WorkforceAccount; reassign path |
| Workforce list | `portal/src/app/admin/workforce/page.tsx`, `portal/src/app/admin/workforce/[id]/page.tsx` | Verify add worker, link to account |

### 1.1.4 Review submissions
| Task | File(s) | Action |
|------|---------|--------|
| Review completion | `portal/src/app/admin/jobs/[id]/page.tsx` (completion display, evidence, checklist results) | Verify admin sees full submission; evidence thumbnails/links |

### 1.1.5 Approve / reject jobs with reason → audit
| Task | File(s) | Action |
|------|---------|--------|
| Approve | `portal/src/server/actions/job-actions.ts` (`approveCompletion`), `portal/src/lib/state-machine.ts` (`transitionJob`) | Confirm audit log written (AuditLog create in transition) |
| Reject with reason | `portal/src/server/actions/job-actions.ts` (`rejectCompletion`) | Confirm rejection reason required and stored in metadata; audit entry |
| UI for reject reason | `portal/src/app/admin/jobs/[id]/page.tsx` (reject modal/form) | Ensure reason is required and sent to action |

### 1.1.6 Generate invoices & payroll / subcontractor payments
| Task | File(s) | Action |
|------|---------|--------|
| Invoices | `portal/src/app/admin/invoices/page.tsx`, `invoices/new`, `invoices/[id]`, `portal/src/server/actions/invoice-actions.ts` | Verify create draft, add jobs, mark sent/paid; PDF download |
| Payouts | `portal/src/app/admin/payouts/page.tsx`, `payouts/batch/[id]`, `portal/src/server/actions/payout-actions.ts` | Verify create batch, mark paid; pay statement PDF |

### 1.1.7 Review audit log
| Task | File(s) | Action |
|------|---------|--------|
| Audit log page | If missing: add `portal/src/app/admin/audit/page.tsx`; query `AuditLog` with filters | Create or verify page; list by entity, actor, date; link from AdminNav |

### 1.1.8 Every empty state has a CTA
| Task | File(s) | Action |
|------|---------|--------|
| Jobs empty | `portal/src/app/admin/jobs/page.tsx` | "Create your first job" → link to `/admin/jobs/new` (already done per prior work) |
| Invoices empty | `portal/src/app/admin/invoices/page.tsx` | "Create your first invoice" → `/admin/invoices/new` |
| Payouts empty | `portal/src/app/admin/payouts/page.tsx` | Clear CTAs for "Jobs ready for payout" and "Payout batches" |
| Clients empty | `portal/src/app/admin/clients/page.tsx` | "Add client" → `/admin/clients/new` |
| Workforce empty | `portal/src/app/admin/workforce/page.tsx` | "Add workforce account" → `/admin/workforce/new` |
| Docs empty | `portal/src/app/admin/docs/page.tsx` | Sections hidden when empty; single message when both empty (already done) |
| Work orders empty | `portal/src/app/admin/workorders/page.tsx` | Add CTA if missing |
| Incidents empty | `portal/src/app/admin/incidents/page.tsx` | Add CTA if missing |
| Leads empty | `portal/src/app/admin/leads/page.tsx` | Optional: "No submissions yet" is acceptable |

### 1.1.9 Every destructive action has confirmation
| Task | File(s) | Action |
|------|---------|--------|
| Job cancel | `portal/src/app/admin/jobs/[id]/page.tsx`, cancel button / `JobAdminActions` | Add confirm dialog ("Cancel this job? This cannot be undone.") before calling cancel API |
| Reject completion | Same page | Confirm dialog with reason field |
| Checklist template delete | `portal/src/app/admin/clients/[id]/checklist-actions.ts` (delete) | Ensure delete is behind confirmation in UI (client detail page) |
| Invoice void | `portal/src/app/admin/invoices/[id]/page.tsx` or actions | If void exists, add confirmation |
| Any other delete/void | Grep admin for delete, void, cancel | List and add confirm where missing |

---

## 1.2 Employee / Subcontractor Portal (P0)

### 1.2.1–1.2.6 Core workflow (verify)
| Task | File(s) | Action |
|------|---------|--------|
| See assigned jobs | `portal/src/app/(worker)/jobs/page.tsx` | Verify list only assigned; empty state has guidance |
| Complete checklist | `portal/src/app/(worker)/jobs/[id]/page.tsx`, `JobDetailClient`, checklist-run-actions | Verify load checklist, save items, submit run |
| Upload evidence | Same page; `portal/src/app/api/evidence/upload/route.ts`, `upload-actions.ts` | Verify upload; redaction required; max photos enforced |
| Submit completion | `portal/src/server/actions/job-actions.ts` (`submitCompletion`) | Verify transition to COMPLETED_PENDING_APPROVAL; audit log |
| See paystub / owed moneys | `portal/src/app/(worker)/earnings/page.tsx`, vendor: `portal/src/app/(worker)/vendor/earnings/page.tsx` | Verify data source (payout lines / jobs approved); display correct |

### 1.2.7 Cannot submit without required evidence
| Task | File(s) | Action |
|------|---------|--------|
| Enforce min photos | `portal/src/server/actions/job-actions.ts` (`submitCompletion`), site.requiredPhotoCount | Check count of evidence for job completion >= requiredPhotoCount; return clear error |
| UI message | `portal/src/app/(worker)/jobs/[id]/page.tsx` or `JobDetailClient` | Show "Upload at least X photos before submitting" when short |

### 1.2.8 Cannot submit another worker’s job
| Task | File(s) | Action |
|------|---------|--------|
| Server enforce | `portal/src/server/actions/job-actions.ts` (`submitCompletion`, `saveDraft`) | Already: job.assignedWorkerId === user.workerId; verify and keep |
| API enforce | `portal/src/app/api/evidence/upload/route.ts` | Verify upload checks job assignment (via upload-actions / canAccessJob) |

### 1.2.9 Clear feedback when submission blocked
| Task | File(s) | Action |
|------|---------|--------|
| Copy | `portal/src/app/(worker)/jobs/[id]/page.tsx` or component | E.g. "You need at least X photos" / "Complete all required checklist items" / "Only the assigned worker can submit" |
| Show on submit | Same | Disable submit or show inline error with reason |

### 1.2.10 Offline / slow: retry, no data loss
| Task | File(s) | Action |
|------|---------|--------|
| Draft save | `portal/src/server/actions/job-actions.ts` (`saveDraft`) | Ensure draft is saved so refresh doesn’t lose data |
| Submit | Same; client | On network error: show "Connection issue. Retry?" and retry; do not clear form on 5xx |
| Upload | `portal/src/app/api/evidence/upload/route.ts` | Client: on failure, keep file and retry button (implement in JobDetailClient or upload component) |

---

## 1.3 Client Portal (Read-Only) — NEW

**No client route group exists yet.** Create from scratch.

### 1.3.1 Route, layout, auth
| Task | File(s) | Action |
|------|---------|--------|
| Route group | `portal/src/app/(client)/layout.tsx` | Create layout; protect with guard (e.g. requireClient or token-based client auth) |
| Auth model | Decide: Client = separate login (e.g. magic link / token) or sub-account under ClientOrganization | If not in schema: add ClientContact login or ClientPortalToken; document in DECISIONS |
| Guard | `portal/src/server/guards/rbac.ts` or new `requireClientPortal()` | Restrict to client-scoped data (sites/jobs/invoices for their org only) |

### 1.3.2 Client: view sites
| Task | File(s) | Action |
|------|---------|--------|
| Page | `portal/src/app/(client)/sites/page.tsx` or `portal/src/app/(client)/page.tsx` | List sites for client’s organization (by clientOrganizationId); read-only |

### 1.3.3 Client: view job history
| Task | File(s) | Action |
|------|---------|--------|
| Page | `portal/src/app/(client)/jobs/page.tsx` or under site | List jobs for their sites; status, date, site name; link to evidence |

### 1.3.4 Client: view evidence
| Task | File(s) | Action |
|------|---------|--------|
| Access | Reuse or mirror `portal/src/app/api/evidence/[id]/route.ts` | New route or same route: allow client role to access evidence for jobs belonging to their org’s sites |
| UI | `portal/src/app/(client)/jobs/[id]/page.tsx` or evidence tab | Display evidence thumbnails/links for completed jobs |

### 1.3.5 Client: view invoices
| Task | File(s) | Action |
|------|---------|--------|
| Page | `portal/src/app/(client)/invoices/page.tsx` | List invoices for client org; status, period, amount; read-only |
| Detail | `portal/src/app/(client)/invoices/[id]/page.tsx` | Line items, totals; no edit |

### 1.3.6 Client: download reports
| Task | File(s) | Action |
|------|---------|--------|
| Report | Define "report" (e.g. invoice PDF, or job completion summary PDF) | If invoice: reuse `portal/src/app/api/invoices/[id]/pdf/route.ts` with client auth |
| UI | Client invoice detail page | "Download PDF" button; ensure route allows client role for their org’s invoices |

### 1.3.7 Read-only enforced
| Task | File(s) | Action |
|------|---------|--------|
| No write actions | All (client) pages and API usage | No create/update/delete; only GET/list; buttons are "View" / "Download" only |

---

## 1.4 Cross-Cutting (Audit)

| Task | File(s) | Action |
|------|---------|--------|
| Approve/reject audit | `portal/src/lib/state-machine.ts`, `portal/src/server/actions/job-actions.ts` | Already: transitionJob writes AuditLog; verify entityType, fromState, toState, actorUserId, metadata (rejection reason) |
| Invoice status audit | `portal/src/server/actions/invoice-actions.ts` | Already: updateInvoiceStatus in transaction with AuditLog |
| Payout audit | `portal/src/server/actions/payout-actions.ts` | Already: createPayoutBatch, markPayoutBatchPaid with AuditLog |

---

## Summary: New Files to Create (Phase 1)

- `portal/src/app/(client)/layout.tsx` — client layout + auth
- `portal/src/app/(client)/page.tsx` — client dashboard or redirect to sites
- `portal/src/app/(client)/sites/page.tsx` — list sites (or combined with dashboard)
- `portal/src/app/(client)/jobs/page.tsx` — job history (optional: per-site filter)
- `portal/src/app/(client)/jobs/[id]/page.tsx` — job detail + evidence (read-only)
- `portal/src/app/(client)/invoices/page.tsx` — list invoices
- `portal/src/app/(client)/invoices/[id]/page.tsx` — invoice detail + PDF download
- Optional: `portal/src/server/guards/client.ts` — requireClientPortal or equivalent
- Optional: `portal/src/app/admin/audit/page.tsx` — if audit log viewer doesn’t exist

**Existing files to touch:** Admin empty states and confirmations (see 1.1.8, 1.1.9); worker submit feedback and retry (1.2.7–1.2.10); evidence and invoice API for client access (1.3.4, 1.3.6).

---

*Reference: LAUNCH_SPINE_90_DAY_PLAN.md, 90_DAY_WEEK_BY_WEEK_CHECKLIST.md, AUDIT_ENVELOPE_SPEC.md*
