# BLVCKSHELL — Comprehensive Program Report

**Audience:** Developer handoff / investor due diligence  
**Scope:** Entire program — marketing site, workforce portal, admin, workflows, security, style, accessibility, capability  
**Date:** February 2026

---

## 1. Executive Summary

**BLVCKSHELL** is a single Next.js 14 application that combines (1) a **public marketing website** for facilities services (cleaning, light maintenance, commercial), (2) a **workforce portal** for workers and vendor owners to view and complete assigned jobs with interactive checklists and in-app camera evidence, and (3) an **admin portal** for locations (clients/sites), workforce, jobs, invoicing, payouts, work orders, incidents, and docs. The stack is **Next.js 14, Prisma 7, Supabase (Postgres + Storage), NextAuth 5 (Credentials + JWT)**. Authentication is role-based (ADMIN, VENDOR_OWNER, VENDOR_WORKER, INTERNAL_WORKER) with layout-level and action-level guards. The codebase is production-oriented: state machines for Job and WorkOrder, audit logging, evidence redaction policy, and a full billing spine (Contract, Invoice, Payout batches, pay statement PDFs). Strengths include clear RBAC, deterministic invoicing/payouts, and in-app camera + redaction for privacy. Gaps include no rate limiting, no middleware for route protection, and partial accessibility coverage.

---

## 2. Program Overview

| Layer | Purpose | Users |
|-------|--------|--------|
| **Marketing** | Lead generation, service pages, contact, about, privacy | Public (unauthenticated) |
| **Portal entry** | `/login`, `/portal` (redirect by role) | All authenticated |
| **Admin** | Clients/sites, workforce, jobs, invoices, payouts, work orders, incidents, docs | ADMIN only |
| **Worker** | Jobs list/detail, checklist completion, in-app camera evidence, profile, earnings, vendor views | VENDOR_WORKER, INTERNAL_WORKER, VENDOR_OWNER |

**Single codebase:** `portal/` is the only app. Marketing lives under route group `(marketing)`; admin under `admin/`; worker under `(worker)/`. No separate marketing repo or monorepo packages.

---

## 3. Architecture & Tech Stack

| Concern | Choice |
|--------|--------|
| **Framework** | Next.js 14 (App Router) |
| **Database** | PostgreSQL (Supabase); Prisma 7 ORM |
| **Auth** | NextAuth 5 (beta), Credentials provider, JWT, 24h session |
| **Storage** | Supabase Storage (evidence, compliance); server-only access with service role |
| **Styling** | Tailwind CSS 4, dark theme (zinc/emerald) for admin and marketing |
| **Forms** | React Hook Form, Zod validation (client + server) |
| **PDF** | pdfkit (invoice PDF, pay statement PDF) |
| **Content** | Markdown in `portal/content/docs/` (SOPs, checklists) and `ops-binder/` (reference) |

**Config:** `prisma.config.ts` holds `url` / `directUrl` (env); `next.config.js`, `tailwind.config.ts`, `postcss.config.js`. Env: `.env` at repo root (and/or `portal/.env`) — `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

---

## 4. Itemized File & Action Inventory

### 4.1 App routes (pages)

| Path | File | Purpose |
|------|------|--------|
| **Root** | `app/layout.tsx`, `app/globals.css` | Root layout, global styles |
| **Marketing** | | |
| `/` | `(marketing)/page.tsx` | Home |
| `/services` | `(marketing)/services/page.tsx` | Services overview |
| `/condo-cleaning` | `(marketing)/condo-cleaning/page.tsx` | Condo cleaning |
| `/commercial-cleaning` | `(marketing)/commercial-cleaning/page.tsx` | Commercial cleaning |
| `/light-maintenance` | `(marketing)/light-maintenance/page.tsx` | Light maintenance |
| `/contact` | `(marketing)/contact/page.tsx` | Contact (form → lead) |
| `/about` | `(marketing)/about/page.tsx` | About |
| `/privacy` | `(marketing)/privacy/page.tsx` | Privacy |
| **Auth / portal** | | |
| `/login` | `login/page.tsx` | Login (Credentials) |
| `/portal` | `portal/page.tsx` | Portal entry (redirect by role) |
| **Admin** | | |
| `/admin` | `admin/page.tsx` | Redirect → `/admin/jobs` |
| `/admin` | `admin/layout.tsx` | Admin layout (requireAdmin, AdminNav) |
| `/admin/clients` | `admin/clients/page.tsx` | Client list |
| `/admin/clients/new` | `admin/clients/new/page.tsx` | New client form |
| `/admin/clients/[id]` | `admin/clients/[id]/page.tsx` | Client detail, sites, checklist manager |
| `/admin/workforce` | `admin/workforce/page.tsx` | Workforce account list |
| `/admin/workforce/new` | `admin/workforce/new/page.tsx` | New workforce form |
| `/admin/workforce/[id]` | `admin/workforce/[id]/page.tsx` | Workforce detail, workers, jobs |
| `/admin/jobs` | `admin/jobs/page.tsx` | Jobs list (optional ?siteId=) |
| `/admin/jobs/new` | `admin/jobs/new/page.tsx` | New job form |
| `/admin/jobs/[id]` | `admin/jobs/[id]/page.tsx` | Job detail, run/evidence, approve/reject |
| `/admin/invoices` | `admin/invoices/page.tsx` | Invoice list |
| `/admin/invoices/new` | `admin/invoices/new/page.tsx` | New draft invoice (client + period) |
| `/admin/invoices/[id]` | `admin/invoices/[id]/page.tsx` | Invoice detail, line items, add jobs/contract base, PDF, Mark Sent/Paid |
| `/admin/payouts` | `admin/payouts/page.tsx` | Payout batches, jobs ready, create batch |
| `/admin/payouts/batch/[id]` | `admin/payouts/batch/[id]/page.tsx` | Batch detail, pay statements per worker |
| `/admin/workorders` | `admin/workorders/page.tsx` | Work orders list |
| `/admin/incidents` | `admin/incidents/page.tsx` | Incident reports list |
| `/admin/docs` | `admin/docs/page.tsx` | Docs index (SOPs, checklists) |
| `/admin/docs/sops/[slug]` | `admin/docs/sops/[slug]/page.tsx` | SOP doc by slug |
| `/admin/docs/checklists/[slug]` | `admin/docs/checklists/[slug]/page.tsx` | Checklist doc by slug |
| **Worker** | | |
| `(worker)/layout.tsx` | | Worker layout (requireWorker, WorkerNav) |
| `/jobs` | `(worker)/jobs/page.tsx` | Worker job list |
| `/jobs/[id]` | `(worker)/jobs/[id]/page.tsx` | Job detail, checklist run, evidence (camera) |
| `/profile` | `(worker)/profile/page.tsx` | Worker profile |
| `/earnings` | `(worker)/earnings/page.tsx` | Earnings summary |
| `/vendor/jobs` | `(worker)/vendor/jobs/page.tsx` | Vendor jobs (owner) |
| `/vendor/team` | `(worker)/vendor/team/page.tsx` | Vendor team (owner) |

### 4.2 API routes

| Method | Path | File | Purpose |
|--------|------|------|--------|
| * | `/api/auth/[...nextauth]` | `api/auth/[...nextauth]/route.ts` | NextAuth handlers |
| GET | `/api/health` | `api/health/route.ts` | Health check |
| POST | `/api/lead` | `api/lead/route.ts` | Lead form submit (Zod, honeypot); public |
| GET | `/api/evidence/[id]` | `api/evidence/[id]/route.ts` | Serve evidence image (auth + canAccessJob) |
| POST | `/api/evidence/upload` | `api/evidence/upload/route.ts` | Upload evidence (worker; redactionApplied required) |
| GET | `/api/jobs/[id]/completion` | `api/jobs/[id]/completion/route.ts` | Get/create completion ID |
| POST | `/api/admin/jobs/[id]/cancel` | `api/admin/jobs/[id]/cancel/route.ts` | Cancel job (admin) |
| GET | `/api/invoices/[id]/pdf` | `api/invoices/[id]/pdf/route.ts` | Invoice PDF (admin) |
| GET | `/api/payouts/batch/[id]/statement` | `api/payouts/batch/[id]/statement/route.ts` | Pay statement PDF (admin; ?workforceAccountId=) |

### 4.3 Server actions

| Action file | Functions | Guard | Purpose |
|-------------|-----------|--------|---------|
| `invoice-actions.ts` | getUninvoicedApprovedJobs, createDraftInvoice, getInvoiceWithDetails, addJobToInvoice, removeJobFromInvoice, addBillingAdjustment, listInvoices, updateInvoiceStatus, addContractBaseToInvoice | requireAdmin (or list/get with admin) | Invoicing and contract base |
| `checklist-run-actions.ts` | createOrGetChecklistRun, saveChecklistRunItem, submitChecklistRun | requireWorker | Checklist run lifecycle |
| `job-actions.ts` | saveDraft, submitCompletion, (job CRUD via admin) | requireWorker / requireAdmin | Job completion draft/submit |
| `upload-actions.ts` | uploadEvidence | requireWorker | Evidence upload (enforces redactionApplied) |
| `payout-actions.ts` | createPayoutBatch, markPayoutBatchPaid | requireAdmin | Payout batches (unpaid jobs only), mark paid |
| `clients/actions.ts` | createClient, updateClient, createSite, etc. | requireAdmin | Client/site CRUD |
| `admin/jobs/actions.ts` | createJob, etc. | requireAdmin | Job creation |
| `admin/workforce/actions.ts` | createWorkforceAccount, etc. | requireAdmin | Workforce CRUD |

### 4.4 Guards (RBAC)

| File | Functions | Purpose |
|------|-----------|---------|
| `server/guards/rbac.ts` | getCurrentUser, requireAuth, requireAdmin, requireVendorOwner, requireWorker, canAccessJob, canAccessWorkforceAccount | Session and role checks; job/account access |

### 4.5 Lib

| File | Purpose |
|------|---------|
| `auth.ts` | NextAuth config (Credentials, JWT, callbacks) |
| `prisma.ts` | Prisma client singleton |
| `storage.ts` | Supabase Storage client (server), evidence path, file type/size validation, MAX_PHOTOS_PER_JOB |
| `state-machine.ts` | Job and WorkOrder state transitions; canTransition*, transition* with AuditLog |
| `validations.ts` | Zod schemas (login, job completion, file upload, workforce, site, job) |
| `lead-schema.ts` | Zod schema for lead form (honeypot) |
| `checklist-parser.ts` | Parse checklist markdown → items (itemId, label, required, photoRequired, photoPointLabel) |
| `docs.ts` | Load markdown from content/docs (SOPs, checklists) |
| `animations.ts` | Framer Motion variants (if used) |

### 4.6 Components (selected)

| Component | Purpose |
|-----------|---------|
| `JobDetailClient.tsx` | Worker job detail: checklist (PASS/FAIL/NA), per-item photo, run-level evidence, Take photo (camera), Save Draft, Submit, blocking panel |
| `EvidenceCameraCapture.tsx` | In-app camera (getUserMedia), capture, manual redaction (draw rects), “No sensitive content”, export blob → upload with redactionApplied |
| `admin/AdminNav.tsx` | Admin nav (Locations, Workforce, Jobs, Invoices, Work Orders, Incidents, Payouts, Docs) |
| `admin/JobAdminActions.tsx` | Approve / Reject / Cancel job |
| `admin/CreatePayoutBatchForm.tsx` | Period → create payout batch |
| `admin/MarkBatchPaidButton.tsx` | Mark batch PAID |
| `admin/invoices/[id]/InvoiceDraftActions.tsx` | Add/remove job, add adjustment (draft) |
| `admin/invoices/[id]/InvoiceStatusActions.tsx` | Mark as Sent / Mark as Paid |
| `admin/invoices/[id]/AddContractBaseButton.tsx` | Add monthly base from contracts |
| `worker/WorkerNav.tsx` | Worker nav (Jobs, Profile, Earnings, Vendor) |
| `marketing/Header.tsx`, `Footer.tsx` | Marketing header/footer |
| `forms/LoginForm.tsx` | Login form (email/password) |

### 4.7 Prisma schema (models)

**Enums:** WorkforceAccountType, UserRole, ComplianceDocumentType, AccessCredentialType/Status, JobStatus, WorkOrderStatus, IncidentReportType, SuppliesProvidedBy, PayoutBatchStatus, PayoutLineStatus, ChecklistRunStatus, BillingCadence, ContractStatus, InvoiceStatus, BillingAdjustmentType/Status, JobPricingModel, BillableStatus.

**Models:** ClientOrganization, ClientContact, WorkforceAccount, User, Worker, ComplianceDocument, Site, SiteAssignment, AccessCredential, ChecklistTemplate, ChecklistRun, ChecklistRunItem, Job, JobCompletion, Evidence, WorkOrder, IncidentReport, PayoutBatch, PayoutLine, Contract, Invoice, InvoiceLineItem, BillingAdjustment, AuditLog, Lead.

---

## 5. Workflows (end-to-end)

### 5.1 Marketing → Lead

1. User visits marketing pages (e.g. `/contact`).
2. Submits form; POST `/api/lead` with Zod validation; honeypot `website` → silent ok.
3. Lead stored in `Lead` table (name, email, phone, message, sourcePage, etc.).

### 5.2 Worker: Job completion with checklist and evidence

1. Worker logs in → redirected to `/jobs` (worker layout).
2. Clicks job → `/jobs/[id]`; server creates/gets ChecklistRun, loads Job + run items.
3. `JobDetailClient`: PASS/FAIL/NA per item, autosave to ChecklistRunItem; for photo-required items and run-level, “Take photo” opens `EvidenceCameraCapture`.
4. Camera: getUserMedia → capture frame → manual redaction (draw or “No sensitive content”) → blob uploaded to `/api/evidence/upload` with `redactionApplied=true`.
5. Server rejects uploads without `redactionApplied=true`. Evidence linked to checklistRunId, itemId.
6. Submit: validation (required items, min photos, item photos) → submitChecklistRun; JobCompletion synced; job status → COMPLETED_PENDING_APPROVAL.

### 5.3 Admin: Approve job → Invoice → Payout

1. Admin sees job in `/admin/jobs/[id]` (run, items, evidence); Approve → transitionJob(APPROVED_PAYABLE).
2. Invoices: New draft (client + period) → add jobs (uninvoiced approved), optionally “Add monthly base from contracts” → Download PDF, Mark as Sent → jobs locked (billableStatus = Invoiced).
3. Payouts: “Jobs ready” = unpaid approved jobs; Create batch (period) → PayoutLine per job (description, siteId, checklistRunId); batch detail → Download pay statement PDF per worker; Mark batch paid → jobs → PAID.

### 5.4 State machines

- **Job:** SCHEDULED → COMPLETED_PENDING_APPROVAL (worker) | CANCELLED (admin); COMPLETED_PENDING_APPROVAL → APPROVED_PAYABLE | SCHEDULED | CANCELLED (admin); APPROVED_PAYABLE → PAID (admin via payout).
- **WorkOrder:** REQUESTED → APPROVED → ASSIGNED → COMPLETED → INVOICED → PAID (admin/worker transitions). All transitions logged in AuditLog.

---

## 6. Security

| Aspect | Implementation | Gap / Note |
|--------|----------------|-------------|
| **Auth** | NextAuth Credentials, bcrypt, JWT 24h | No rate limiting on login; no lockout (SECURITY.md §6 planned) |
| **RBAC** | requireAdmin / requireWorker / requireVendorOwner on every admin/worker page and relevant actions; canAccessJob / canAccessWorkforceAccount for resource-level checks | Strong |
| **IDOR** | Job and evidence access gated by canAccessJob; evidence served only after check | Good |
| **Upload** | File type/size validated; max 20 photos per job; evidence only with redactionApplied=true | Good |
| **Storage** | Supabase server-only, service role; no client direct access | Good |
| **Secrets** | DB and Supabase keys server-side only; NEXTAUTH_SECRET required | Good |
| **Middleware** | **None** — protection is layout + server action only; no global middleware for /admin or /(worker) | Add middleware for defense in depth |
| **Audit** | Job and WorkOrder transitions write to AuditLog (actor, entity, from/to, metadata) | Good |

---

## 7. Accessibility

| Area | Current | Suggestion |
|------|---------|------------|
| **Semantics** | Headings and landmarks in places; not all lists/tables have full structure | Audit headings (h1/h2), use `<main>`, `<nav>`, `<section>` consistently |
| **Forms** | Labels and inputs in forms; some buttons lack explicit labels | Ensure every control has visible or aria-label; LoginForm and lead form need explicit labels/ids |
| **Focus** | Default browser focus; modals (camera) trap focus not fully verified | Trap focus in EvidenceCameraCapture; restore on close |
| **Color** | Contrast generally good (zinc/white/emerald); amber for warnings | Run contrast checker (WCAG AA) on amber and red states |
| **Motion** | Framer Motion used; no prefers-reduced-motion handling | Respect `prefers-reduced-motion` for animations |
| **Screen readers** | Some aria-hidden on decorative elements; not all live regions | Add aria-live for success/error toasts; ensure status changes announced |

---

## 8. Style & UX

| Area | Implementation |
|------|----------------|
| **Theme** | Dark (zinc-950, zinc-800/900); emerald for primary actions; amber for warnings; red for errors/destructive |
| **Marketing** | Same dark theme; Header/Footer; service pages with copy and CTAs |
| **Admin** | Tables and cards; sticky nav; consistent borders and spacing |
| **Worker** | Job list and detail; checklist with large tap targets (56px), progress %, blocking panel; camera full-screen modal |
| **Consistency** | Tailwind utility-first; no design tokens file; some magic numbers (e.g. 52px/56px) could be tokens |

---

## 9. Strengths

1. **Single app, clear structure** — Marketing, admin, worker in one repo with clear route groups and guards.
2. **RBAC and resource access** — Every sensitive path and action guarded; canAccessJob/canAccessWorkforceAccount prevent IDOR.
3. **State machines** — Job and WorkOrder transitions are explicit and audited; no ad-hoc status flips.
4. **Billing spine** — Contract, Invoice, line items, adjustments, locking on Sent/Paid; one job = one payout line; pay statement PDF.
5. **Evidence and privacy** — In-app camera only; server rejects non-redacted uploads; manual redaction with “No sensitive content” option.
6. **Checklist run model** — ChecklistRun + ChecklistRunItem give an auditable execution record; sync to JobCompletion for backward compatibility.
7. **Validation** — Zod on lead, login, job completion, upload, workforce, site, job; honeypot on lead.
8. **Documentation** — SECURITY.md, DECISIONS.md, CTO reports, implementation plans, migration sync notes.

---

## 10. Weaknesses

1. **No middleware** — Route protection relies on layouts; a misconfiguration could expose admin/worker routes; no central place for auth checks.
2. **Rate limiting absent** — Login, lead submit, evidence upload are not rate-limited (SECURITY.md §6).
3. **Session** — 24h JWT; no refresh-on-activity or configurable timeout documented in code.
4. **Worker layout theme** — Worker layout uses `bg-gray-50` (light) while admin/marketing are dark; inconsistent.
5. **Public assets** — No `public/` folder; marketing images are remote (e.g. Unsplash); no single asset pipeline.
6. **Error handling** — Some actions return generic “Failed”; stack traces can leak in dev; no global error boundary strategy documented.
7. **Tests** — No unit or e2e tests in the inventory; coverage not established.
8. **Accessibility** — Not fully audited; focus trap and live regions incomplete; no prefers-reduced-motion.

---

## 11. Suggestions

1. **Add middleware** — In `middleware.ts`, check session for `/admin/*` and `/(worker)/*` (or pathname match), redirect to `/login` or `/` if unauthorized.
2. **Rate limiting** — Add rate limit to `/api/auth/*` (login), `/api/lead`, `/api/evidence/upload` (per IP or per user).
3. **Unify worker theme** — Use same dark theme as admin for worker layout for consistency and brand.
4. **Design tokens** — Extract spacing and tap-target sizes (e.g. `minTapTarget: 56`) into a small theme/tokens file or Tailwind config.
5. **Accessibility pass** — Run axe or Lighthouse; add focus trap and aria-live for critical flows; add prefers-reduced-motion for animations.
6. **Tests** — Add Jest + React Testing Library for critical actions (e.g. submitChecklistRun, createDraftInvoice); add one e2e (e.g. login → job list) with Playwright.
7. **Error boundaries** — Add error.tsx at key segments (admin, worker) and a global error page; avoid leaking stack in production.
8. **Env validation** — Validate required env at startup (e.g. NEXTAUTH_SECRET, DATABASE_URL) and fail fast with clear message.

---

## 12. Scoring (1–10, 10 = strong)

| Category | Score | Notes |
|----------|-------|--------|
| **Style / UX** | 8 | Consistent dark theme, clear hierarchy, mobile tap targets; worker theme differs; no token system. |
| **Security** | 7 | Strong RBAC and IDOR prevention; no rate limiting or lockout; no middleware. |
| **Accessibility** | 5 | Basic semantics and labels; no focus trap in modals; no reduced-motion; no full a11y audit. |
| **Capability** | 9 | Full checklist run, evidence with redaction, invoicing, payouts, pay statement PDF, contract base; only TimeEntry/payroll CSV missing. |
| **Maintainability** | 7 | Clear structure and docs; no tests; some duplication (e.g. status colors in multiple files). |
| **Scalability** | 7 | Prisma + Supabase scale; single app; no caching strategy for list pages; migrations can timeout on pooler. |
| **Documentation** | 8 | SECURITY.md, DECISIONS.md, CTO reports, implementation plans; API and component docs minimal. |

**Overall (weighted):** ~7.3 — Strong capability and style; security and accessibility need targeted improvements.

---

## 13. Handoff Notes

**For a developer:**

- **Start:** `portal/` is the app; `npm install`, `cp .env.example .env`, set DATABASE_URL and DIRECT_URL; run migrations with DIRECT_URL if pooler times out (see `sync_after_manual.sql`).
- **Auth:** Session in JWT; extend in `lib/auth.ts` callbacks if adding more claims.
- **New admin page:** Add under `app/admin/`, call `requireAdmin()` in page or layout.
- **New API:** Add under `app/api/`; use getCurrentUser or requireAdmin/requireWorker; validate input with Zod.
- **DB changes:** Edit `prisma/schema.prisma`, create migration; if applying manually, run `sync_after_manual.sql` or `prisma migrate resolve --applied <name>`.

**For an investor:**

- The product is a **unified operations platform**: marketing (lead gen), workforce (mobile-friendly job execution with checklists and privacy-safe evidence), and back-office (invoicing, payouts, audit trail). The data model supports multiple clients, sites, contracts, and deterministic billing and payouts. Technical debt is documented (rate limiting, middleware, tests, a11y); the codebase is structured for incremental hardening.

---

*End of report. Last updated: February 2026.*
