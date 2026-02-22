# BLVCK BIBLE
## Complete Developer & Operations Manual for Blvckshell Portal

**Generated:** 2026-02  
**Purpose:** Gold-standard record of every API, workflow, policy, data model, and convention for the Blvckshell facilities execution platform  
**Target:** Developers, operators, and future maintainers — no prior knowledge assumed  
**Status:** Living document — update as the system evolves  
**Standard:** Same or higher depth as institutional developer manuals (e.g. SHIFTRO BIBLE)

---

## TABLE OF CONTENTS

1. [Introduction](#introduction)
2. [System Overview](#system-overview)
3. [Architecture Layers](#architecture-layers)
4. [Data Model](#data-model)
5. [APIs](#apis)
6. [Server Actions](#server-actions)
7. [Workflows & State Machines](#workflows--state-machines)
8. [Policies & Guards](#policies--guards)
9. [Engines & Business Logic](#engines--business-logic)
10. [Gold Standard (Quoting)](#gold-standard-quoting)
11. [Automation & Bulk Operations](#automation--bulk-operations)
12. [Storage & Evidence](#storage--evidence)
13. [Glossary & Conventions](#glossary--conventions)
14. [Hard Invariants](#hard-invariants)
15. [Exception Cockpit](#exception-cockpit)
16. [Common Tasks](#common-tasks)
17. [Troubleshooting](#troubleshooting)

---

## INTRODUCTION

### What is Blvckshell Portal?

Blvckshell Portal is the **internal audit and workflow system** for Blvckshell, a facilities execution and accountability operator (cleaning, turnovers, turnover audits, light maintenance, facilities support) in Ontario. The portal supports:

- **Admin:** Clients, sites, jobs, checklists, invoices, payouts, workforce, work orders, incidents, quotes, finance snapshots, audit, docs
- **Worker:** Assigned jobs, checklist completion, evidence upload, earnings
- **Client:** Invoices, jobs, sites (read-only for their organization)
- **Vendor:** Jobs and earnings for their workforce account
- **Marketing:** Lead capture, public pages

The portal does **not** sell as a product; it is the operational backbone for margin control, quality enforcement, and documentation.

### Core Principles

1. **Evidence-based delivery:** Checklist runs and evidence (photos) are required for job approval and billing.
2. **Margin discipline:** Pricing (quotes), payouts, and site snapshots enforce margin gates (e.g. 25% target, 30% add-on).
3. **Role-scoped access:** RBAC (Admin, Founder, Client, Vendor, Worker) with entity-level checks (job, invoice, workforce account).
4. **Audit trail:** AuditLog records actor, entity, and state changes for key operations.
5. **Snapshot integrity:** Quotes and site performance use versioned/snapshot patterns for reproducibility.

### Who Should Read This?

- **New developers** joining the project  
- **Existing developers** needing a single reference for APIs and workflows  
- **Operators** understanding job/invoice/payout lifecycle  
- **QA** understanding test boundaries and invariants  

### How to Use This Document

1. **Start here** for overview and navigation.  
2. **Use sub-documents** for depth: Data Model, APIs, Server Actions, Workflows, Policies, Engines, Automation, Storage, Glossary.  
3. **Update this document** when adding routes, actions, or workflows.  
4. **Link to this document** in code comments and PRs where appropriate.

---

## SYSTEM OVERVIEW

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js App (App Router)                                    │
│  - (admin)/*  (worker)/*  (client)/*  (marketing)/*  /login  │
└──────────────────────────┬──────────────────────────────────┘
                           │ Server Components / Server Actions
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Guards (RBAC) + Middleware                                  │
│  - requireAdmin, requireWorker, requireClient, requireVendor │
│  - canAccessJob, canAccessInvoice, canAccessWorkforceAccount │
│  - Rate limiting on /api/auth, /api/lead, /api/evidence/upload │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Server Actions & API Routes                                 │
│  - quote-actions, invoice-actions, job-actions, payout-actions │
│  - checklist-run-actions, upload-actions, bulk-actions       │
│  - API: /api/lead, /api/evidence/upload, /api/invoices/[id]/pdf, etc. │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Engines & State Machines                                    │
│  - quote-engine, site-snapshot-engine, area-presets          │
│  - state-machine (Job, WorkOrder transitions)                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Data Layer (Prisma + PostgreSQL)                            │
│  - ClientOrganization, Site, Job, ChecklistRun, Invoice, etc. │
│  - AuditLog for key mutations                                │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Prisma ORM) |
| Auth | NextAuth (credentials + session) |
| Storage | Supabase Storage (evidence, compliance) |
| Testing | Vitest (unit), Playwright (e2e) |

### Project Structure (Portal)

```
portal/
├── prisma/
│   ├── schema.prisma      # Full data model
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── app/               # App Router routes
│   │   ├── (admin)/       # Admin layout + pages
│   │   ├── (worker)/      # Worker layout + pages
│   │   ├── (client)/      # Client layout + pages
│   │   ├── (marketing)/   # Marketing + lead capture
│   │   ├── api/           # API routes
│   │   └── login/
│   ├── server/
│   │   ├── actions/       # Server actions (quote, invoice, job, payout, checklist, upload, bulk)
│   │   ├── guards/        # RBAC (rbac.ts)
│   │   ├── pricing/       # quote-engine, area-presets
│   │   ├── finance/       # site-snapshot-engine
│   │   ├── automation/    # flagOverdueApprovals, ensureJobOnDraftInvoice, createMakeGoodJobIfNeeded
│   │   └── bulk-actions/  # jobs, invoices, incidents, work-orders
│   ├── lib/               # auth, prisma, state-machine, storage, validations, rate-limit, etc.
│   └── components/
└── Blvck_Bible/           # This documentation (at repo root: Blvck_Bible/)
```

---

## ARCHITECTURE LAYERS

### Layer 1: App Routes (UI)

| Segment | Path | Guard | Purpose |
|---------|------|--------|---------|
| Admin | `/admin/*` | requireAdmin (ADMIN or FOUNDER) | Clients, sites, jobs, invoices, payouts, workforce, work orders, incidents, quotes, finance, audit, docs |
| Worker | `/(worker)/*` | requireWorker (VENDOR_WORKER, INTERNAL_WORKER, VENDOR_OWNER) | Jobs, completion, earnings |
| Client | `/(client)/*` | requireClient (CLIENT) | Invoices, jobs, sites (own org only) |
| Marketing | `/(marketing)/*` | None | Public pages, lead form |
| Login | `/login` | None | Credentials sign-in |

**Rule:** Route protection is enforced in layout or page via guard calls (requireAdmin, requireWorker, requireClient). Middleware does **not** perform auth (avoids Edge getToken issues); it only does rate limiting on selected API paths.

### Layer 2: Guards & Middleware

- **Guards:** `src/server/guards/rbac.ts` — getCurrentUser, requireAuth, requireAdmin, requireFounder, requireClient, requireVendorOwner, requireWorker, canAccessJob, canAccessInvoice, canAccessWorkforceAccount.
- **Middleware:** `src/middleware.ts` — rate limit only. Matcher: `/api/auth/*`, `/api/lead`, `/api/evidence/upload`. Limits: 5 req/15min (auth), 10 req/15min (lead, upload).

**See:** [05_Policies_And_Guards.md](./05_Policies_And_Guards.md)

### Layer 3: Server Actions & API Routes

- **Server actions:** Invoked from Server Components or form actions; run on server with session. All under `src/server/actions/` and `src/app/admin/.../actions.ts` (form handlers).
- **API routes:** REST-style under `src/app/api/`. Used for upload (multipart), PDF generation, health, auth, lead submit, job completion fetch, evidence fetch.

**See:** [02_APIs.md](./02_APIs.md), [03_Server_Actions.md](./03_Server_Actions.md)

### Layer 4: Engines & State Machines

- **Quote engine:** Compute and persist quote snapshots (margin, revenue floor, gates).  
- **Site snapshot engine:** Compute and persist site performance snapshots (revenue, COGS, margin, AR buckets).  
- **Area presets:** Map area types (LOBBY, HALLWAYS, etc.) to minutes for quoting.  
- **State machine:** Job status transitions (SCHEDULED → COMPLETED_PENDING_APPROVAL → APPROVED_PAYABLE → PAID; CANCELLED terminal). WorkOrder transitions (REQUESTED → APPROVED → ASSIGNED → COMPLETED → INVOICED → PAID).

**See:** [04_Workflows_And_State_Machines.md](./04_Workflows_And_State_Machines.md), [06_Engines_And_Logic.md](./06_Engines_And_Logic.md), [10_Gold_Standard_Quoting.md](./10_Gold_Standard_Quoting.md) (quote workflow and invariants).

### Layer 5: Data Layer

- **Prisma:** Single schema in `prisma/schema.prisma`. PostgreSQL.  
- **Audit:** AuditLog table for actor, entityType, entityId, fromState, toState, metadata.  
- **No append-only ledger:** Unlike some enterprise systems; audit is key-mutation logging.

**See:** [01_Data_Model.md](./01_Data_Model.md)

---

## DATA MODEL

Summary only here. Full table-by-table documentation is in **[01_Data_Model.md](./01_Data_Model.md)**.

| Bounded area | Main entities | Purpose |
|--------------|----------------|---------|
| Clients & sites | ClientOrganization, ClientContact, Site, SiteAssignment, AccessCredential | Client orgs, sites, access |
| Workforce | WorkforceAccount, User, Worker, ComplianceDocument | Internal/vendor accounts, workers, compliance |
| Checklists | ChecklistTemplate, ChecklistRun, ChecklistRunItem | Site checklists, run per job, items with result |
| Jobs & completion | Job, JobCompletion, Evidence | Scheduled jobs, completion, evidence (photos) |
| Invoicing | Contract, Invoice, InvoiceLineItem, BillingAdjustment | Contracts per site, invoices, line items, adjustments |
| Payouts | PayoutBatch, PayoutLine | Batch payouts to workforce |
| Work orders & incidents | WorkOrder, IncidentReport | Ad-hoc work, incident reports |
| Quotes | PricingPolicy, Quote, QuoteAreaLine, QuoteAddOnLine, QuoteSnapshot | Pricing policy, quote builder, scope capture (walkthrough), snapshots; see [10_Gold_Standard_Quoting.md](./10_Gold_Standard_Quoting.md) |
| Finance | SitePerformanceSnapshot, SiteSupplyAllocation | Per-site per-month snapshot, supply allocation |
| Templates | SiteTemplate, JobTemplate, ContractTemplate, InvoiceTemplate, MakeGoodRuleTemplate | Versioned templates (Draft/Active/Archived) |
| Audit & lead | AuditLog, Lead | Audit trail, marketing leads |

**Enums (examples):** UserRole (ADMIN, FOUNDER, CLIENT, VENDOR_OWNER, VENDOR_WORKER, INTERNAL_WORKER), JobStatus, InvoiceStatus, ChecklistRunStatus, WorkOrderStatus, PayoutBatchStatus, QuoteStatus, etc.

---

## APIs

Every HTTP API route is documented in **[02_APIs.md](./02_APIs.md)** with method, path, purpose, request/response shape, and auth/rate-limit notes.

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/lead | Submit marketing lead (rate-limited; honeypot; Zod schema) |
| GET/POST | /api/auth/[...nextauth] | NextAuth handlers |
| POST | /api/evidence/upload | Upload evidence file (FormData; rate-limited; redaction required) |
| GET | /api/evidence/[id] | Get evidence (e.g. redirect or stream) |
| GET | /api/jobs/[id]/completion | Get job completion (worker) |
| GET | /api/invoices/[id]/pdf | Generate invoice PDF |
| POST | /api/admin/jobs/[id]/cancel | Cancel job (admin) |
| GET | /api/payouts/batch/[id]/statement | Payout batch statement |
| GET | /api/health | Health check |

---

## SERVER ACTIONS

All server actions are listed and described in **[03_Server_Actions.md](./03_Server_Actions.md)** by module: quote-actions, invoice-actions, job-actions, checklist-run-actions, payout-actions, upload-actions, finance-actions, bulk-actions, plus form actions in app/admin (clients, workforce, jobs, checklist-actions).

**Convention:** Actions that mutate state should use guards (e.g. requireAdmin) and write AuditLog where appropriate. Idempotency and uniqueness (e.g. payout line per job/run) are documented in the Data Model and Actions docs.

---

## WORKFLOWS & STATE MACHINES

**[04_Workflows_And_State_Machines.md](./04_Workflows_And_State_Machines.md)** covers:

- **Job lifecycle:** SCHEDULED → COMPLETED_PENDING_APPROVAL (worker submit) → APPROVED_PAYABLE (admin approve) → PAID; or CANCELLED. Approval requires at least one submitted ChecklistRun.
- **ChecklistRun:** InProgress → Submitted → Approved | Rejected.
- **WorkOrder:** REQUESTED → APPROVED → ASSIGNED → COMPLETED → INVOICED → PAID.
- **Invoice:** Draft → Sent → Paid | Void.
- **Payout batch:** CALCULATED → APPROVED → RELEASED → PAID.
- **Quote:** DRAFT → READY_FOR_REVIEW → SENT | WON | LOST | EXPIRED.

Allowed transitions and role rules are defined in `src/lib/state-machine.ts` and enforced in transitionJob / transitionWorkOrder and related actions.

---

## POLICIES & GUARDS

**[05_Policies_And_Guards.md](./05_Policies_And_Guards.md)** documents:

- **User roles:** ADMIN, FOUNDER, CLIENT, VENDOR_OWNER, VENDOR_WORKER, INTERNAL_WORKER.
- **Guard functions:** requireAuth, requireAdmin, requireFounder, requireClient, requireVendorOwner, requireWorker, canAccessJob, canAccessInvoice, canAccessWorkforceAccount.
- **Middleware:** Rate limiting only; paths and limits.
- **Session:** SessionUser shape (id, name, role, workforceAccountId, workerId, clientOrganizationId).

---

## ENGINES & BUSINESS LOGIC

**[06_Engines_And_Logic.md](./06_Engines_And_Logic.md)** covers:

- **Quote engine:** computeQuoteSnapshot, persistQuoteSnapshot; margin gates, revenue floor, confidence score.
- **Site snapshot engine:** computeSiteSnapshot, persistSiteSnapshot; revenue, COGS, margin, AR buckets, recleans.
- **Area presets:** computeAreaMinutesFromPreset, clampMinutes, AREA_PRESET_MINUTES (S/M/L per QuoteAreaType, finish modifiers).

---

## GOLD STANDARD (QUOTING)

**[10_Gold_Standard_Quoting.md](./10_Gold_Standard_Quoting.md)** is the authoritative record for quoting:

- **Workflow:** List → New → Walkthrough (scope capture) → Pricing (compute snapshot + gates) → Proposal (from snapshot only).
- **Invariants:** Scope mutability (DRAFT/READY_FOR_REVIEW only); override minutes ⇒ override reason required; add-on price/margin server-side, include-in-proposal blocked when margin &lt; addonMinMarginBps; scope gate before pricing; SENT only when gates pass; proposal from QuoteSnapshot only.
- **File paths:** quote-actions, quote-engine, area-presets, walkthrough/pricing/proposal pages.
- **Data model:** PricingPolicy, Quote, QuoteAreaLine, QuoteAddOnLine, QuoteSnapshot, QuoteAreaType.

---

## AUTOMATION & BULK OPERATIONS

**[07_Automation_And_Bulk_Operations.md](./07_Automation_And_Bulk_Operations.md)** (see TOC #11) covers:

- **Automation:** flagOverdueApprovals, ensureJobOnDraftInvoice, createMakeGoodJobIfNeeded.
- **Bulk operations:** preview/execute for bulk job action, bulk generate drafts, bulk resolve incidents, bulk work order transition; runFlagOverdueApprovals.

---

## STORAGE & EVIDENCE

**[08_Storage_And_Evidence.md](./08_Storage_And_Evidence.md)** (see TOC #12) covers:

- **Buckets:** evidence, compliance.
- **Evidence:** generateEvidencePath, redaction attestation, MAX_PHOTOS_PER_JOB, allowed file types/size.
- **Compliance:** generateCompliancePath (workforce documents).
- **Retention:** Evidence retention script/behavior if applicable.

---

## GLOSSARY & CONVENTIONS

**[09_Glossary_And_Conventions.md](./09_Glossary_And_Conventions.md)** (see TOC #13) defines terms (e.g. ChecklistRun, JobCompletion, SitePerformanceSnapshot, RevenueCategory, BillableStatus) and file-location conventions, plus references to DECISIONS.md and business plan where relevant.

---

## HARD INVARIANTS

**[11_Hard_Invariants.md](./11_Hard_Invariants.md)** (see TOC #14) is the authoritative record of scale-safe financial and operational laws:

- **LAW 1 — Money facts:** Approved job economics frozen at APPROVED_PAYABLE; invoice and payout lines copy these facts; no recomputation.
- **LAW 2 — DB uniqueness:** InvoiceLineItem (one job per invoice), PayoutLine (one payout per job), ChecklistTemplate (one active per site), SiteAssignment (XOR workerId/workforceAccountId).
- **LAW 3 — Refusal bias:** No sending invoices with placeholders; no duplicate payouts; no approval without checklist/amounts; no changing approved economics after approval.
- **LAW 4 — Evidence integrity:** Evidence tied to correct job/run/item; enforced at upload.

Snapshot immutability (CLOSED = no recompute without Founder override + AuditLog). Acceptance criteria and auditability requirements.

---

## EXCEPTION COCKPIT

**[12_Exception_Cockpit.md](./12_Exception_Cockpit.md)** (see TOC #15) specifies the single-admin "Exception Cockpit": one page or section for visibility into:

- Jobs pending approval > 24h (exact query)
- Checklist runs rejected
- Evidence upload failures / missing required photos
- Jobs stuck in Scheduled too long
- Invoices draft with placeholders (hard block)
- Payout batches ready but blocked (and why)
- Optional: compliance expiring

Exact Prisma-style queries and minimal UI blocks (count, list/table, link to entity). Worker-facing blocking reasons (missing photo, unanswered item, cap reached, redaction required).

---

## COMMON TASKS

(See TOC #16.)

- **Add a new API route:** Create under `src/app/api/.../route.ts`; document in 02_APIs.md; add rate limit in middleware if needed.
- **Add a new server action:** Add to appropriate `src/server/actions/*.ts` or app form actions; call guard; document in 03_Server_Actions.md.
- **Change job or work order transitions:** Update `src/lib/state-machine.ts` and 04_Workflows_And_State_Machines.md.
- **Add a role or guard:** Update `src/server/guards/rbac.ts`, auth callbacks (role in session), and 05_Policies_And_Guards.md.
- **Add a Prisma model or enum:** Migrate; update 01_Data_Model.md.

---

## TROUBLESHOOTING

(See TOC #17.)

- **"Unauthorized" / "Forbidden":** Check role and guard (requireAdmin vs requireWorker vs requireClient). Ensure session has role and, for CLIENT, clientOrganizationId; for Worker, workerId when needed for canAccessJob.
- **Job approval fails:** Job must have at least one ChecklistRun in status Submitted. See state machine and job-actions.
- **Payout uniqueness:** One PayoutLine per (job or checklistRun) per batch; see payout-actions and schema.
- **Evidence upload 400:** Requires redactionApplied=true; file, jobId, completionId required. See 02_APIs and upload-actions.
- **Rate limit 429:** 15-minute window; 5 for auth, 10 for lead/upload. See middleware and 05_Policies_And_Guards.
- **Quote compute snapshot fails / "Total monthly hours must be positive":** Add at least one area line on walkthrough and ensure total minutes per visit (base + travel + winter) > 0. See 10_Gold_Standard_Quoting.md.
- **Cannot add/edit/delete quote lines:** Quote status must be DRAFT or READY_FOR_REVIEW. SENT/WON/LOST/EXPIRED quotes have immutable scope.

---

*End of master document. Use sub-documents for full detail.*
