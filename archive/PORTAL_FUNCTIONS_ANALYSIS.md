# Portal Functions — CTO Analysis

**Purpose:** Inventory and analysis of all portal functions (API routes, server actions, guards, and supporting lib) with strengths, weaknesses, areas for improvement, and high-value opportunities in **efficiency**, **functionality**, and **security**.

**Generated:** February 2026.

---

## 1. Function Inventory

### 1.1 API Routes (`portal/src/app/api/`)

| Route | Method | Purpose | Auth / Guard |
|-------|--------|---------|--------------|
| `/api/auth/[...nextauth]` | * | NextAuth handlers (sign in/out, session) | NextAuth |
| `/api/health` | GET | Health check | None |
| `/api/lead` | POST | Marketing lead capture (contact form) | None (rate-limited) |
| `/api/evidence/upload` | POST | Upload evidence photo (multipart) | Worker via action | 
| `/api/evidence/[id]` | GET | Stream evidence image by ID | User + `canAccessJob` |
| `/api/jobs/[id]/completion` | GET | Return `completionId` for job (for uploads) | User + `canAccessJob` or ADMIN |
| `/api/admin/jobs/[id]/cancel` | POST | Cancel job (transition to CANCELLED) | `requireAdmin` |
| `/api/invoices/[id]/pdf` | GET | Generate invoice PDF | Admin only |
| `/api/payouts/batch/[id]/statement` | GET | Generate pay statement PDF for worker in batch | Admin only |

**Middleware (rate limiting):** Applied to `/api/auth/*`, `/api/lead`, `/api/evidence/upload` (5 req/15min for auth, 10/15min for lead and upload).

### 1.2 Server Actions (`portal/src/server/actions/`)

| File | Functions | Purpose |
|------|-----------|---------|
| `job-actions.ts` | `saveDraft`, `submitCompletion`, `approveCompletion`, `rejectCompletion` | Draft/submit job completion; admin approve/reject |
| `checklist-run-actions.ts` | `createOrGetChecklistRun`, `saveChecklistRunItem`, `submitChecklistRun` | Checklist run lifecycle for a job |
| `invoice-actions.ts` | `getUninvoicedApprovedJobs`, `createDraftInvoice`, `getInvoiceWithDetails`, `addJobToInvoice`, `removeJobFromInvoice`, `addBillingAdjustment`, `addContractBaseToInvoice`, `listInvoices`, `updateInvoiceStatus` | Invoice CRUD and workflow |
| `payout-actions.ts` | `createPayoutBatch`, `markPayoutBatchPaid` | Payout batch creation and mark paid |
| `upload-actions.ts` | `uploadEvidence` | Validate, store evidence in Supabase; enforce redaction and per-job photo limit |

All actions use guards: `requireWorker`, `requireAdmin`, or `requireVendorOwner` as appropriate; job/account access via `canAccessJob` / `canAccessWorkforceAccount` where needed.

### 1.3 Guards (`portal/src/server/guards/rbac.ts`)

| Function | Purpose |
|----------|---------|
| `getCurrentUser` | Session user or null |
| `requireAuth` | Throw if not authenticated |
| `requireAdmin` | Throw if not ADMIN |
| `requireVendorOwner` | Throw if not VENDOR_OWNER |
| `requireWorker` | Throw if not VENDOR_WORKER | INTERNAL_WORKER | VENDOR_OWNER |
| `canAccessJob(user, jobId)` | ADMIN: all; VENDOR_OWNER: job’s workforce account; Worker: job’s assigned worker |
| `canAccessWorkforceAccount(user, workforceAccountId)` | ADMIN: all; VENDOR_OWNER: own only |

### 1.4 Lib — State & Business Rules

| File | Exports | Purpose |
|------|---------|---------|
| `state-machine.ts` | `isAllowedJobTransition`, `canTransitionJob`, `transitionJob`; `isAllowedWorkOrderTransition`, `canTransitionWorkOrder`, `transitionWorkOrder` | Job and work order state transitions with role checks and audit logging |
| `validations.ts` | `loginSchema`, `jobCompletionSchema`, `fileUploadSchema`, `createWorkforceAccountSchema`, `createSiteSchema`, `createJobSchema` | Zod schemas for inputs |
| `lead-schema.ts` | `leadSchema` | Lead form (with honeypot `website`) |
| `storage.ts` | `storage`, path helpers, `isValidFileType`, `isValidFileSize`, `MAX_PHOTOS_PER_JOB`, etc. | Supabase storage; evidence path and file rules |
| `rate-limit.ts` | `checkRateLimit`, `getClientIP` | In-memory rate limit for middleware |
| `auth.ts` | NextAuth config | Session, providers, callbacks |
| `prisma.ts` | Prisma client singleton | DB access |
| `checklist-parser.ts` | `parseChecklistMarkdown`, `getAvailableChecklistTemplates` | Checklist markdown → structured template |
| `docs.ts` | `getChecklistSlugs`, `getSopSlugs`, `getChecklistContent`, `getSopContent` | Doc content for checklists/SOPs |

---

## 2. Strengths

- **Centralized RBAC:** Guards and `canAccessJob` / `canAccessWorkforceAccount` ensure consistent access control; layout and actions both rely on them.
- **State machine:** Job and work order transitions are explicit and role-gated; terminal states and invalid transitions are blocked; transitions can be audited.
- **Validation:** Zod schemas for login, job completion, file upload, workforce, site, and job creation reduce invalid data and clarify API contracts.
- **Evidence rules:** File type/size and max photos per job enforced; redaction requirement (when correctly checked) supports privacy/compliance.
- **Rate limiting:** Auth, lead, and evidence upload endpoints are rate-limited in middleware to blunt abuse and brute force.
- **Lead honeypot:** `website` field on lead form; non-empty value returns success without persisting, reducing spam.
- **PDF generation:** Invoice and pay statement PDFs generated server-side with admin-only access.
- **Evidence access:** `/api/evidence/[id]` checks job access before serving file; no direct storage URLs exposed.

---

## 3. Weaknesses & Risks

- **Evidence upload route — redaction check:** The route correctly treats FormData's `redactionApplied` as a string and compares to `"true"`; the resulting boolean is used for the reject check. Comment added clarifying FormData sends strings.
- **Rate limit storage:** In-memory rate limiting does not persist across instances/restarts; under multi-instance or serverless, limits are per-instance. For production at scale, use Redis/Upstash/Vercel KV.
- **Error handling:** ✅ Invoice PDF route now has proper try-catch and error handling. Other routes may benefit from similar structured error responses.
- **ID validation:** A few API routes take `id` from params without CUID/format validation; invalid IDs could cause unnecessary DB errors or leak “not found” vs “invalid id” behavior.
- **Audit surface:** ✅ Now covers invoice status changes and payout batch operations. Job/work order transitions already audited. Workforce/site edits may need audit coverage if they become sensitive operations.

---

## 4. Areas for Improvement

- **Upload route:** ✅ Comment added clarifying FormData sends strings.
- **API IDs:** Validate route params (e.g. CUID) in a small shared helper and return 400 for bad format, 404 for not found.
- **Logging:** Add request ID and user id to log lines for auth, evidence, jobs, invoices, and payouts; consider a thin logging wrapper.
- **Rate limiting:** Document “in-memory, single-instance” in code and in runbooks; plan migration path to Redis/KV for multi-instance and stricter limits.
- **Audit:** ✅ Invoice status changes and payout batch operations now audited. Job/work order transitions already covered. Consider adding audit for workforce/site edits if they become sensitive.

---

## 5. Missed Opportunities & High-Value Features

### 5.1 Efficiency

| Opportunity | Description | Impact |
|-------------|-------------|--------|
| **Bulk approve/reject jobs** | Admin selects multiple jobs in COMPLETED_PENDING_APPROVAL and approves or rejects in one action. | Fewer clicks, faster closing of batches. |
| **Bulk add jobs to invoice** | From “uninvoiced approved jobs” view, select many jobs and add to one draft invoice in one action. | Same as above for billing. |
| **Cache checklist templates** | Checklist templates per site are derived from markdown/docs; cache per site (or invalidate on template change) to avoid repeated parsing. | Lower CPU and faster job/checklist loads. |
| **Background PDF generation** | For large invoices or batch statements, queue PDF generation and notify when ready (or store and link) instead of on-the-fly GET. | Avoids timeouts and improves responsiveness. |
| **Worker UX shortcuts** | “Submit and next job” or “Copy previous completion” for similar jobs. | Faster data entry for workers. |

### 5.2 Functionality

| Opportunity | Description | Impact |
|-------------|-------------|--------|
| **Notifications** | In-app or email when: job assigned, completion submitted (for admin), approval/rejection (for worker), invoice ready, payout created. | Better awareness and fewer missed steps. |
| **Reporting dashboard** | Simple reports: jobs by site/period, completion rate, time-to-approval, payout totals by worker/vendor. | Operational visibility and client/board reporting. |
| **Incident/work order integration** | Link incidents to jobs/sites; link work orders to jobs where applicable; visibility in one place. | Clearer audit trail and escalation. |
| **Client portal (read-only)** | Client view: their sites, completed visits, evidence summary, invoices (view/download). | Reduces “send me a report” and builds trust. |
| **Recurring job templates** | Define recurrence (e.g. weekly) and generate future jobs in advance or on a schedule. | Less manual scheduling. |
| **Export** | Export jobs, invoices, or payouts to CSV/Excel for accounting or external analysis. | Fits existing workflows. |

### 5.3 Security

| Opportunity | Description | Impact |
|-------------|-------------|--------|
| **Stronger auth** | 2FA/MFA for admin (and optionally vendor owners). | Protects sensitive actions and financial data. |
| **Audit log viewer** | Admin UI to filter and view audit log (job transitions, approval, cancel, invoice status, payout, key changes). | Compliance and incident investigation. |
| **Rate limit more endpoints** | Apply rate limits to invoice PDF, payout statement, and other expensive or sensitive GETs to prevent abuse and DoS. | Protects availability and resources. |
| **Session and token hardening** | Shorten session lifetime for admin; consider refresh tokens or “remember device” for workers. | Reduces impact of stolen sessions. |
| **Input sanitization** | Ensure all user-supplied strings displayed in PDFs or exports are sanitized/escaped to avoid injection in generated documents. | Document-level safety. |

---

## 6. Summary

- **Inventory:** 9 API routes, 5 server-action modules (multiple functions each), 1 guard module, and shared lib for state machine, validation, storage, rate limit, and auth.
- **Strengths:** RBAC, state machine, validation schemas, evidence and rate-limit controls, lead honeypot, and access-checked evidence and PDFs.
- **Weaknesses:** Upload redaction check bug, in-memory rate limits, and partial audit coverage.
- **Improvements:** Fix upload check, validate API IDs, improve logging, document rate-limit behavior, extend audit log.
- **High value:** Bulk actions (efficiency), notifications and reporting (functionality), 2FA and audit log viewer (security). Prioritizing a minimal audit log and clearer logging will yield quick wins for compliance and operations.
