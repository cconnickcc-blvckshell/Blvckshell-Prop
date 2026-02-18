# BLVCKSHELL — CTO Status Report: Codebase vs Docs

**Date:** February 17, 2026  
**Purpose:** Compare actual implementation to ROADMAP.md, DECISIONS.md, and supporting docs.  
**Scope:** Phase 0, Phase 1 (Ops Binder), Phase 2A (Portal), Phase 2B (Marketing); no Phase 3 sign-off yet.

---

## Executive Summary

| Area | Doc status | Codebase reality | Verdict |
|------|------------|-------------------|---------|
| **Phase 0** | Complete | DECISIONS §1–§4 exist; repo structure; README | ✅ Aligned |
| **Phase 1 (Ops Binder)** | 47 files | 47 markdown files + checklist-manifest.json | ✅ Aligned |
| **Phase 2A (Portal)** | Partially complete | Most routes and logic present; gaps below | 🟡 Mostly aligned, gaps |
| **Phase 2B (Marketing)** | Parallel after P0 | Next.js app, all required pages, `/api/lead` | ✅ Aligned |
| **Tests** | Required (2A.10) | No test framework or tests in repo | ❌ Not started |
| **Security hardening** | Rate limit, lockout, admin reset | Not implemented; session 24h only | ❌ Gaps |
| **Env / deploy** | Single DB, Vercel | Root `.env` for portal + marketing; two Vercel projects required (Root = `portal`, Root = `marketing`) | ✅ Documented |

**Bottom line:** Core portal and marketing are built and aligned with docs. Production gates (Part 4 of ROADMAP) are not satisfied: **no test suite**, **no rate limiting**, **no login lockout**, **no admin password reset**. Ops Binder is complete; portal is feature-rich but not yet production-ready per the roadmap. **Vercel:** Use two projects with Root Directory set to `portal` and `marketing` respectively; building from repo root causes "No Next.js detected" / "no app directory."

---

## Phase 0: Pre-Flight

| Step | Doc | Codebase | Status |
|------|-----|----------|--------|
| 0.1 | DECISIONS.md with §1–§4 | File at repo root; §1 (core), §2 (production locks), §3 (implementation locks), §4 (summary checklist) present | ✅ |
| 0.2 | Repo structure | `ops-binder/`, `portal/`, `marketing/` exist; root README links to each | ✅ |
| 0.3 | Node 20 LTS, Next.js 14.x | README and DECISIONS state versions; portal package.json has Next 14.x | ✅ |
| 0.4 | Root README | Overview, links to portal/marketing/ops-binder, execution order | ✅ |

**Verdict:** Phase 0 complete and aligned with docs.

---

## Phase 1: Operations Binder

| Requirement | Doc | Codebase | Status |
|-------------|-----|----------|--------|
| 47 markdown files | ROADMAP Part 3 Phase 1 | 47 files under `ops-binder/`: 00_README, 01_Client_Contract (8), 02_Subcontractor (5), 03_SOPs (6), 04_Policies (6), 05_QA_Forms (6), 06_Checklists_Library (8 + manifest), 07_State_Machines (3), 08_Sales (3) | ✅ |
| Checklist manifest | Export item IDs for portal seed | `ops-binder/06_Checklists_Library/checklist-manifest.json` exists | ✅ |
| State machines / roles | 07_State_Machines_and_Roles | 01_Roles_and_RBAC, 02_State_Machines_Jobs_WorkOrders_..., 03_Audit_Log_Requirements | ✅ |

**Verdict:** Phase 1 complete; 47 files and manifest present and used by portal seed.

---

## Phase 2A: Workforce Operations Portal

### 2A.1 Environment and schema

| Step | Doc | Codebase | Status |
|------|-----|----------|--------|
| 2A.1.1 | Supabase project, buckets | Env vars and buckets are environment-specific; README documents them | ⏳ Environment-dependent |
| 2A.1.2 | Next.js 14, TypeScript, Tailwind | `portal/` has Next 14, TS, Tailwind | ✅ |
| 2A.1.3 | Prisma + Supabase URLs | `schema.prisma` uses `url` / `directUrl` (env) | ✅ |
| 2A.1.4 | All models | Schema has 19+ models (User, WorkforceAccount, Worker, Job, JobCompletion, Evidence, AuditLog, Lead, etc.); roadmap said “15” — likely dated | ✅ |
| 2A.1.5 | DRAFT / draft completions | `JobCompletion.isDraft`; draft save/resume in actions | ✅ |
| 2A.1.6 | Cascade RESTRICT; soft-delete | Restrict on Job, JobCompletion, Evidence, AuditLog; `isActive` on User, Site, WorkforceAccount, etc. | ✅ |
| 2A.1.7 | Uniques | User.email, JobCompletion.jobId unique; checklist template uniqueness noted | ✅ |
| 2A.1.8 | Migrations | `prisma/migrations/` has init, production constraints, add_lead | ✅ (apply depends on DB) |
| 2A.1.9 | Seed script | `prisma/seed.ts` — admin, vendor, internal, orgs, sites, templates, jobs, work order, incident; uses manifest item IDs | ✅ |
| 2A.1.10 | SEED.md | `portal/SEED.md` — when to run, command, what’s created, credentials | ✅ |

**Verdict:** Schema and seed fully implemented; Supabase setup is env-specific.

### 2A.2 Auth and RBAC

| Step | Doc | Codebase | Status |
|------|-----|----------|--------|
| 2A.2.1 | NextAuth Credentials, bcrypt, session role/workerId | `lib/auth.ts` Credentials + bcrypt; session has role, workforceAccountId, workerId | ✅ |
| 2A.2.2 | RBAC guards | `server/guards/rbac.ts`: requireAdmin, requireVendorOwner, requireWorker | ✅ |
| 2A.2.3 | Job visibility (assignedWorkerId only) | `canAccessJob()` in rbac.ts; workers see job only when assignedWorkerId set | ✅ |

**Verdict:** Auth and RBAC implemented as specified.

### 2A.3 Storage

| Step | Doc | Codebase | Status |
|------|-----|----------|--------|
| 2A.3.1 | Server-only Supabase service role; path pattern | `lib/storage.ts` service role; `generateEvidencePath`: evidence/{jobId}/{completionId}/{timestamp}-{uuid}.{ext} | ✅ |
| 2A.3.2 | File type and size | ALLOWED_FILE_TYPES, MAX_PHOTO_SIZE 10MB; validation in storage + upload action | ✅ |
| 2A.3.3 | Max 20 photos | Server: upload-actions rejects at 20; job-actions submit enforces min/max. UI: JobDetailClient disables at 20, shows “Maximum 20 photos” | ✅ |

**Verdict:** Storage and 20-photo cap implemented in UI and server.

### 2A.4 Worker and vendor flows

| Step | Doc | Codebase | Status |
|------|-----|----------|--------|
| 2A.4.1 | `/jobs` list | `app/(worker)/jobs/page.tsx` | ✅ |
| 2A.4.2 | `/jobs/[id]` detail, checklist, evidence, draft, submit | `app/(worker)/jobs/[id]/page.tsx` + JobDetailClient | ✅ |
| 2A.4.3 | Draft save/resume | `saveDraft` in job-actions; upload creates draft completion if needed | ✅ |
| 2A.4.4 | Completion submit, state + AuditLog | `submitCompletion`; transition to COMPLETED_PENDING_APPROVAL; state-machine used | ✅ |
| 2A.4.5 | `/earnings`, `/profile` | `app/(worker)/earnings/page.tsx`, `profile/page.tsx` | ✅ |
| 2A.4.6 | `/vendor/team`, `/vendor/jobs` | `app/(worker)/vendor/team/page.tsx`, `vendor/jobs/page.tsx` (list team and jobs) | ✅ |

**Verdict:** Worker and vendor flows implemented; ROADMAP had 2A.4.6 as “Pending” but code has both vendor pages.

### 2A.5 Admin flows

| Step | Doc | Codebase | Status |
|------|-----|----------|--------|
| 2A.5.1 | `/admin/workforce`, `/admin/workforce/[id]` | Pages exist; detail shows compliance (COI/WSIB), “block assignment” and “Admin override with audit log” in UI | 🟡 Compliance display done; assignment blocking and override with AuditLog need verification |
| 2A.5.2 | `/admin/jobs`, `/admin/jobs/[id]` | Pages exist; JobAdminActions for approve/reject/cancel; API route for cancel | ✅ |
| 2A.5.3 | `/admin/workorders` | Page exists | ✅ |
| 2A.5.4 | `/admin/incidents` | Page exists | ✅ |
| 2A.5.5 | `/admin/payouts` | Page exists; CreatePayoutBatchForm, MarkBatchPaidButton, payout-actions | ✅ |

**Verdict:** Admin routes and main actions present; confirm job-assignment compliance blocking and ADMIN override audit logging in implementation.

### 2A.6 State machines and audit

| Step | Doc | Codebase | Status |
|------|-----|----------|--------|
| 2A.6.1 | Job transition logic, AuditLog | `lib/state-machine.ts`; transitions write AuditLog | ✅ |
| 2A.6.2 | WorkOrder state machine | Same pattern (REQUESTED → … → PAID) | ✅ |

**Verdict:** Implemented.

### 2A.7 Documentation

| Step | Doc | Codebase | Status |
|------|-----|----------|--------|
| 2A.7.1 | portal/README.md | Setup, env (DATABASE_URL vs DIRECT_URL), Storage, run, seed | ✅ |
| 2A.7.2 | DECISIONS | Root DECISIONS.md; portal references it | ✅ |
| 2A.7.3 | portal/SECURITY.md | RBAC, storage, max photos, credential masking; §6 “Rate limiting, session, lockout (Planned)” | ✅ |
| 2A.7.4 | portal/DATA_RETENTION.md | 90-day evidence retention, purge process | ✅ |

**Verdict:** Docs present; SECURITY.md correctly marks rate limit/lockout as planned.

### 2A.8 Security hardening (ROADMAP Day 16)

| Step | Doc | Codebase | Status |
|------|-----|----------|--------|
| 2A.8.1 | Rate limiting (login, submit, upload) | Not implemented | ❌ |
| 2A.8.2 | Session timeout 24h and refresh | Session maxAge 24h in auth; no explicit refresh logic noted | 🟡 Partial |
| 2A.8.3 | Login backoff/lockout after 5 failures | Not implemented | ❌ |
| 2A.8.4 | Admin-only password reset, audit logged | Not implemented | ❌ |

**Verdict:** Security hardening not done; required for production gate.

### 2A.9 UX reliability

| Step | Doc | Codebase | Status |
|------|-----|----------|--------|
| 2A.9.1 | Upload retry | UI can retry; draft save preserves state | 🟡 |
| 2A.9.2 | Draft save/resume | Done | ✅ |
| 2A.9.3 | Inline validation errors | JobDetailClient shows photo/checklist errors | ✅ |
| 2A.9.4 | Mobile-first completion | Tailwind responsive; no dedicated camera flow verified | 🟡 |

**Verdict:** Mostly there; optional to tighten retry and mobile.

### 2A.10 Tests (ROADMAP Days 18–19)

| Step | Doc | Codebase | Status |
|------|-----|----------|--------|
| 2A.10.1 | Unit: state transitions per role | No test framework (no Vitest/Jest in package.json); no test files | ❌ |
| 2A.10.2 | RBAC/IDOR tests | Not present | ❌ |
| 2A.10.3 | Upload validation tests | Not present | ❌ |
| 2A.10.4 | E2E: assign → complete → approve → payout | Not present | ❌ |

**Verdict:** Test suite not started; blocks production gate (Part 4 Gate 5).

### 2A.11 Production gate sign-off (Day 20)

- Not executed; depends on 2A.8 and 2A.10.

---

## Phase 2B: Marketing Website

| Requirement | Doc | Codebase | Status |
|-------------|-----|----------|--------|
| Next.js 14, App Router, Tailwind | ROADMAP 2B.1 | marketing/ has Next.js, app router, build output | ✅ |
| Home, contact, services, condo/commercial/light-maintenance, about, privacy | ROADMAP 2B.2–2B.3 | app routes present (page, contact, services, condo-cleaning, commercial-cleaning, light-maintenance, about, privacy) | ✅ |
| `/api/lead` | ROADMAP 2B.2.3 | `marketing/app/api/lead/route.ts`; zod schema; creates Lead (Prisma) | ✅ |
| SEO: metadata, sitemap, robots | ROADMAP 2B.4 | app/sitemap.ts, app/robots.ts; metadata in layout and pages | ✅ |
| marketing/README | ROADMAP 2B.4.3 | Present: setup, root .env, DATABASE_URL, Vercel (Root = marketing), deploy | ✅ |

**Verdict:** Marketing site and lead capture implemented; README and SEO in place.

---

## ROADMAP Part 4: Quality gates (summary)

| Gate | Status |
|------|--------|
| 1. Code quality | TypeScript, Zod, RBAC, server-only DB: aligned. |
| 2. Security | Rate limiting, lockout, admin password reset: **not implemented**. |
| 3. Data integrity | Cascade, soft-delete, uniques, max photos, compliance: **implemented**; assignment block + override audit: verify. |
| 4. UX reliability | Draft save, validation, 20-photo UI: done; retry/mobile: partial. |
| 5. Testing | **No tests.** |
| 6. Documentation | README, DECISIONS, SECURITY, DATA_RETENTION, SEED: present. |

---

## Doc vs code discrepancies

1. **ROADMAP 2A.4.6** — Marked “⏳ Pending”; **code has** `/vendor/team` and `/vendor/jobs`. Update ROADMAP to ✅.
2. **ROADMAP “78 tasks”** — No single task index; either add one or reword to “all tasks in this roadmap”.
3. **ROADMAP 2A.6** — Duplicate “2A.6 State machines and audit” section; remove duplicate and keep one.
4. **Schema model count** — Docs say “15 models”; schema has more (e.g. includes Lead, ClientContact, SiteAssignment). Update or clarify.

## Database constraints (Migration #2)

Per CTO schema review: production readiness also depends on **DB-level constraints** that Prisma does not enforce. Confirm in Supabase that the following have been applied (via a follow-up migration or raw SQL):

- **Job:** CHECK that exactly one of `assignedWorkforceAccountId` / `assignedWorkerId` is set.
- **SiteAssignment:** CHECK that exactly one of `workforceAccountId` / `workerId` is set.
- **ChecklistTemplate:** UNIQUE partial index on `siteId` WHERE `isActive` = true (one active per site).
- **Worker:** UNIQUE on `userId`; **JobCompletion:** UNIQUE on `jobId`.
- **Evidence:** FK to JobCompletion with ON DELETE CASCADE.
- **AccessCredential:** CHECK for CODE vs non-CODE identifier/hash rules.
- **Indexes:** Job (assignedWorkerId + scheduledStart; assignedWorkforceAccountId + scheduledStart); AuditLog (entityType, entityId, createdAt).

If not yet applied, treat as a prerequisite before production sign-off.

---

## Recommendations for CTO

1. **Before production:** Implement 2A.8 (rate limiting, login lockout, admin password reset) and 2A.10 (unit, RBAC/IDOR, upload, one E2E). Then run 2A.11 production checklist and smoke test.
2. **Verify:** Job assignment blocking when COI/WSIB expired and ADMIN override with AuditLog (code path and one manual test). Workforce detail page shows compliance status and “blocked” messaging; confirm assign flow actually checks compliance and records override in AuditLog when admin overrides.
3. **Apply Migration #2:** Add CHECK constraints, unique indexes, Evidence CASCADE, and AccessCredential rules in Supabase (see “Database constraints” above) if not already applied.
4. **Update ROADMAP:** Mark vendor scaffold complete; remove duplicate 2A.6; fix “78 tasks” or add task index; align model count wording.
5. **Phase 3:** Run only after Gates 2 and 5 (security + tests) are satisfied, Migration #2 is confirmed, and 2A.11 is signed off.

---

**Report status:** Based on codebase and doc review as of February 17, 2026. Environment-specific steps (Supabase project, buckets, migration apply) not verified.
