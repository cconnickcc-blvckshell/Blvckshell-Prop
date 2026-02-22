# BLVCKSHELL Full-Scale Implementation Plan

**Purpose:** Task-level build bible to complete everything in EXECUTION_PLAN.md, DECISIONS.md, and the prompts (P1 Revised, P2, P3). Execute in order; dependencies are explicit.

**How to use:** Work through phases in sequence. Complete all tasks in a phase (or a listed dependency set) before moving on. Check off tasks; use the Task Index at the end for status. Production sign-off (Phase 3) is required before treating the portal as production-ready.

**References:** EXECUTION_PLAN.md (phases, gates), DECISIONS.md (locked options), prompts (P1 Revised, P2, P3).

---

## Phase 0: Pre-Flight (Before Any Build)

**Goal:** All decisions locked and documented. No implementation until Phase 0 is complete.

| ID | Task | Deliverable / Acceptance | Ref |
|----|------|---------------------------|-----|
| **P0-1** | Confirm DECISIONS.md exists at repo root with §1 Core, §2 Production locks, §3 Final implementation locks | DECISIONS.md contains tables and §3.1–§3.5 (Storage, Draft, Visibility, Max photos, Password reset) | EXECUTION_PLAN §3 |
| **P0-2** | If portal is in a separate repo, copy DECISIONS.md into `portal/` and keep in sync | `portal/DECISIONS.md` present and matches root | EXECUTION_PLAN §3 |
| **P0-3** | Confirm Node (e.g. 20 LTS) and Next.js (e.g. 14.x) versions are documented in DECISIONS and README | Version stated in DECISIONS §1 #10 and in any README setup | DECISIONS §1 |
| **P0-4** | Create repo structure: `ops-binder/`, `portal/`, `marketing/` (or split repos per plan) | Folders exist; root README points to each area | EXECUTION_PLAN §7 |

**Phase 0 complete when:** DECISIONS.md is the single source of truth and repo structure is ready. No TBD in DECISIONS for items that affect build.

---

## Phase 1: Operations Binder (P3)

**Goal:** Full `/ops-binder/` tree with real content; stable checklist IDs; state machine and roles documented for portal alignment.

**Dependency:** Phase 0 done. No code dependency.

### 1.1 State machines and roles (do first — portal will consume)

| ID | Task | Deliverable / Acceptance | Ref |
|----|------|---------------------------|-----|
| **P1-01** | Create `ops-binder/07_State_Machines_and_Roles/01_Roles_and_RBAC.md` | Roles defined; map to ADMIN, VENDOR_OWNER, VENDOR_WORKER, INTERNAL_WORKER | prompts P3, EXECUTION §4.1 |
| **P1-02** | Create `02_State_Machines_Jobs_WorkOrders_Invoices_Payouts.md` | Job, WorkOrder, Invoice, Payout states and allowed transitions; who can do each | prompts P3 (I) |
| **P1-03** | Create `03_Audit_Log_Requirements.md` | Fields: actorUserId, actorWorkerId, actorWorkforceAccountId, entityType, entityId, fromState, toState, metadata, createdAt | prompts P3 (I) |

### 1.2 Checklist library (stable IDs for portal seed)

| ID | Task | Deliverable / Acceptance | Ref |
|----|------|---------------------------|-----|
| **P1-04** | Create `ops-binder/06_Checklists_Library/CL_01_Lobby_Checklist.md` through `CL_08_Seasonal_Deep_Clean_Checklist.md` | Each has stable item IDs (e.g. LOB-001); tasks, frequency, photo points, fail conditions | prompts P3 (H) |
| **P1-05** | Export or list all checklist item IDs in one place (e.g. in 00_README or a manifest) for portal seed | Portal can copy itemIds into Prisma seed / admin UI | EXECUTION §4.3 |

### 1.3 SOPs

| ID | Task | Deliverable / Acceptance | Ref |
|----|------|---------------------------|-----|
| **P1-06** | Create `ops-binder/03_SOPs/SOP_01_Common_Area_Cleaning.md` through `SOP_06_Light_Maintenance_Scope_And_Workflow.md` | Step-by-step; decision trees; reference checklist IDs where relevant | prompts P3 (E) |

### 1.4 Policies

| ID | Task | Deliverable / Acceptance | Ref |
|----|------|---------------------------|-----|
| **P1-07** | Create `ops-binder/04_Policies/POL_01` through `POL_06` | Quality, Health & Safety, Privacy, Conduct, Communications, Billing; "who decides" and "done" clear | prompts P3 (F) |

### 1.5 Client contract

| ID | Task | Deliverable / Acceptance | Ref |
|----|------|---------------------------|-----|
| **P1-08** | Create `ops-binder/01_Client_Contract/01_Master_Service_Agreement.md` | Parties, term, schedules, payment, HST, termination, liability, Ontario law; "review by Ontario counsel" note | prompts P3 (A) |
| **P1-09** | Create Schedules A–E, Work Order template, Credit/Reclean addendum (02–08) | Scope, add-ons, access, QA/evidence, insurance, work order, credit policy | prompts P3 (B) |

### 1.6 Subcontractor contract

| ID | Task | Deliverable / Acceptance | Ref |
|----|------|---------------------------|-----|
| **P1-10** | Create `ops-binder/02_Subcontractor_Contract/` all 5 files | Longform, one-pager, rate sheet, scope will/won't do, onboarding; non-solicit; remedies; proof aligned with Schedule D | prompts P3 (C, D) |

### 1.7 QA forms and sales enablement

| ID | Task | Deliverable / Acceptance | Ref |
|----|------|---------------------------|-----|
| **P1-11** | Create `ops-binder/05_QA_Forms/QA_01` through `QA_06` | Required fields, pass/fail, signatures, timestamps; QA_01 scoring; QA_05 board summary | prompts P3 (G) |
| **P1-12** | Create `ops-binder/08_Sales_Enablement/` all 3 files | Discovery script (PMs), site walk checklist, proposal QA insert | prompts P3 (J) |
| **P1-13** | Create `ops-binder/00_README.md` | Index of binder; "portal-loadable" note; how to use | EXECUTION §4.1 |

### 1.8 Cross-check

| ID | Task | Deliverable / Acceptance | Ref |
|----|------|---------------------------|-----|
| **P1-14** | Verify cross-doc consistency: proof requirements, scope, "who communicates with client" aligned between client and sub contracts | No contradictions; terms reused | prompts P3 output bar |

**Phase 1 complete when:** All 47 ops-binder files exist with full content; checklist IDs are stable and listed for portal; state machine and AuditLog fields match portal spec.

---

## Phase 2A: Workforce Operations Portal (P1 Revised)

**Goal:** Production-safe portal: Supabase Postgres + Storage, workforce/worker model, RBAC, state machines, audit log, docs, seed, production gates, tests.

**Dependencies:** Phase 0 and Phase 1 complete. Supabase project created (Postgres + Storage buckets).

### 2A.1 Environment and schema

| ID | Task | Deliverable / Acceptance | Ref |
|----|------|---------------------------|-----|
| **P2A-01** | Create Supabase project; obtain pooled `DATABASE_URL` and `DIRECT_URL`; create Storage buckets `evidence` and `compliance` (private; no public access) | Env vars documented; buckets exist | DECISIONS §3.1 #16, EXECUTION §5.2 step 1 |
| **P2A-02** | Initialize Next.js 14+ App Router, TypeScript, Tailwind in `portal/` | `portal/package.json`, `src/app`, Tailwind config | prompts P1 Revised |
| **P2A-03** | Add Prisma; configure `schema.prisma` with `directUrl` and `url` for Supabase (pooled for url) | README documents DATABASE_URL vs DIRECT_URL | DECISIONS §1 #2 |
| **P2A-04** | Define all Prisma models: ClientOrganization, WorkforceAccount, User, Worker, ComplianceDocument, Site, AccessCredential, ChecklistTemplate, Job, JobCompletion, Evidence, WorkOrder, IncidentReport, PayoutBatch, PayoutLine, AuditLog | Schema with enums and relations | prompts P1 Revised, EXECUTION §5.2 step 1 |
| **P2A-05** | Add JobCompletion status/flag for DRAFT per DECISIONS §3.2 (#17) | Draft completions can be saved and resumed; photos attach to drafts | DECISIONS §3.2 |
| **P2A-06** | Set cascade/restrict: RESTRICT on Job, JobCompletion, Evidence, AuditLog FKs; soft-deactivate (isActive) for User, WorkforceAccount, Site — document in schema comments and DECISIONS | No accidental cascade that drops audit history | EXECUTION §5.2 step 9, §10.2 |
| **P2A-07** | Enforce uniques: User.email; JobCompletion.jobId (1:1); one active ChecklistTemplate per site per version (business rule + index if needed) | Migrations apply; documented | EXECUTION §5.2 step 9 |
| **P2A-08** | Run migrations using DIRECT_URL; document in README | Migrations run successfully; README states DIRECT_URL for migrate | EXECUTION §5.2 step 1 |
| **P2A-09** | Write seed script: 1 admin; 1 vendor workforce + 2 workers; 1 internal + 1 worker; 2 client orgs; 2 sites (with checklist templates using P3 itemIds); 6 jobs (mixed assignedWorkerId); 1 missed + make-good; 1 work order; 1 incident | `prisma/seed.ts` (or equivalent); runnable via `npx prisma db seed` | prompts P1 Revised, EXECUTION §5.3 |
| **P2A-10** | Create `portal/SEED.md` with instructions and list of what seed creates | SEED.md in portal | EXECUTION §5.2 step 7 |

### 2A.2 Auth and RBAC

| ID | Task | Deliverable / Acceptance | Ref |
|----|------|---------------------------|-----|
| **P2A-11** | Implement NextAuth Credentials provider (or custom JWT) with bcrypt; store role, workforceAccountId, workerId in session | Login/logout work; session has role and ids | DECISIONS §1 #1 |
| **P2A-12** | Server-side guards: ADMIN full access; VENDOR_OWNER only own WorkforceAccount and jobs for that account; VENDOR_WORKER/INTERNAL_WORKER only jobs where assignedWorkerId = their worker id | No IDOR; 403 for unauthorized access | prompts P1 Revised RBAC |
| **P2A-13** | Enforce job visibility: when job has only assignedWorkforceAccountId (no assignedWorkerId), job does NOT appear in any worker's `/jobs` list; admin must set assignedWorkerId | Matches DECISIONS §3.3 #18 | DECISIONS §3.3 |

### 2A.3 Storage layer

| ID | Task | Deliverable / Acceptance | Ref |
|----|------|---------------------------|-----|
| **P2A-14** | Implement server-only upload/download using Supabase service role; no client direct bucket access; path `evidence/{jobId}/{completionId}/{timestamp}-{uuid}.{ext}` | All uploads/downloads via API or server actions | DECISIONS §3.1 #16 |
| **P2A-15** | Validate file type (jpg, jpeg, png, webp) and size ≤ 10MB on server; reject with clear error | Invalid requests rejected; no file stored | DECISIONS §1 #8 |
| **P2A-16** | Enforce max 20 photos per job: server rejects upload if count would exceed 20; server rejects completion submit if count > 20 or < requiredPhotoCount; UI disables add-photo at 20 | DECISIONS §3.4 #19 fully enforced | DECISIONS §3.4 |

### 2A.4 Worker and vendor flows

| ID | Task | Deliverable / Acceptance | Ref |
|----|------|---------------------------|-----|
| **P2A-17** | Build `/jobs` (list): only jobs where user's worker id = assignedWorkerId | Workers see only their assigned jobs | prompts P1 Revised |
| **P2A-18** | Build `/jobs/[id]`: site info, access instructions, checklist (from template), evidence uploader, draft save, submit completion | Detail page; draft save and resume; submit validates checklist + photos | DECISIONS §3.2, EXECUTION §5.2 step 4 |
| **P2A-19** | On submit: validate all checklist items answered, requiredPhotoCount met, within photo cap; create/update JobCompletion (out of DRAFT), set job → COMPLETED_PENDING_APPROVAL; write AuditLog | State transition and audit | prompts P1 Revised state machine |
| **P2A-20** | Build `/earnings` and `/profile` for workers | Read-only earnings; profile view | prompts P1 Revised |
| **P2A-21** | Scaffold `/vendor/team` and `/vendor/jobs` for VENDOR_OWNER (list team and jobs for their account; no pricing, no approvals) | Pages exist and respect RBAC | prompts P1 Revised |

### 2A.5 Admin flows

| ID | Task | Deliverable / Acceptance | Ref |
|----|------|---------------------------|-----|
| **P2A-22** | Build `/admin/workforce` and `/admin/workforce/[id]`: CRUD workforce accounts; add/remove workers; upload/view compliance docs (COI/WSIB); block new job assignment if COI/WSIB expired unless ADMIN override with audit log (metadata: reason, overrideAt) | Compliance gating and override per DECISIONS §2 #12 | EXECUTION §5.2 step 5 |
| **P2A-23** | Build `/admin/jobs` and `/admin/jobs/[id]`: create/edit jobs; assign exactly one of WorkforceAccount or Worker; calendar-lite list; mark missed + create make-good job; review completion/photos; approve (→ APPROVED_PAYABLE) or reject (→ SCHEDULED with reason); cancel (→ CANCELLED); all transitions write AuditLog | Job state machine enforced | prompts P1 Revised, EXECUTION §5.2 step 5 |
| **P2A-24** | Build `/admin/workorders`: list; approve; assign; track WorkOrder states REQUESTED → … → PAID | WorkOrder state machine in code | prompts P1 Revised |
| **P2A-25** | Build `/admin/incidents`: list; resolve; link to lost-key if needed | Incidents manageable | prompts P1 Revised |
| **P2A-26** | Build `/admin/payouts`: create batch for date range; include approved jobs; payouts to WorkforceAccount; mark jobs PAID; write AuditLog | Payout flow and audit | prompts P1 Revised |

### 2A.6 State machines and audit

| ID | Task | Deliverable / Acceptance | Ref |
|----|------|---------------------------|-----|
| **P2A-27** | Centralize Job transition logic: only allowed transitions; reject invalid with clear error; every transition writes AuditLog (actorUserId, actorWorkerId, actorWorkforceAccountId, entityType, entityId, fromState, toState, metadata, createdAt) | No soft or illegal transitions | prompts P1 Revised, P3 |
| **P2A-28** | Enforce WorkOrder state machine in code (REQUESTED → APPROVED → ASSIGNED → COMPLETED → INVOICED → PAID) | Same pattern as Job | prompts P1 Revised |

### 2A.7 Documentation

| ID | Task | Deliverable / Acceptance | Ref |
|----|------|---------------------------|-----|
| **P2A-29** | Write `portal/README.md`: setup, env (DATABASE_URL vs DIRECT_URL), Storage buckets, run, test, deploy (Vercel) | README complete | EXECUTION §5.2 step 7 |
| **P2A-30** | Ensure `portal/DECISIONS.md` exists (copy from root or symlink) and matches DECISIONS.md §1–§4 | Portal DECISIONS up to date | EXECUTION §3 |
| **P2A-31** | Write `portal/SECURITY.md`: RBAC summary, rate limits, session timeout, lockout policy, credential masking, max photos, no client DB, Supabase access model | SECURITY.md complete | EXECUTION §10.1 |
| **P2A-32** | Write `portal/DATA_RETENTION.md`: evidence retention (e.g. 90 days), purge process | DATA_RETENTION.md complete | DECISIONS §2 #11 |

### 2A.8 Security hardening

| ID | Task | Deliverable / Acceptance | Ref |
|----|------|---------------------------|-----|
| **P2A-33** | Add rate limiting to login, job completion submit, and evidence upload endpoints; document limits in SECURITY.md | Rate limits applied and documented | EXECUTION §10.1 |
| **P2A-34** | Implement session timeout (e.g. 24h) and refresh strategy; document in SECURITY.md | Session policy documented and applied | EXECUTION §10.1 |
| **P2A-35** | Implement login backoff/lockout after N failed attempts (e.g. 5); document in SECURITY.md | Lockout policy documented and applied | EXECUTION §10.1 |
| **P2A-36** | Implement admin-only password reset (set temp password or one-time link); action audit logged | DECISIONS §3.5 #20 | DECISIONS §3.5 |

### 2A.9 UX reliability

| ID | Task | Deliverable / Acceptance | Ref |
|----|------|---------------------------|-----|
| **P2A-37** | Upload retry: allow retry on failed uploads; show clear error | Worker can retry without losing draft | EXECUTION §10.3 |
| **P2A-38** | Draft completion save: worker can save partial (checklist + any photos); resume later; submit only when valid | Matches DECISIONS §3.2 | DECISIONS §3.2 |
| **P2A-39** | Inline validation errors: missing required photos, missing checklist items, file type/size before submit | Clear messages | EXECUTION §10.3 |
| **P2A-40** | Mobile-first job completion: layout and camera upload work on phone; touch-friendly controls | Usable on mobile | EXECUTION §10.3 |

### 2A.10 Tests

| ID | Task | Deliverable / Acceptance | Ref |
|----|------|---------------------------|-----|
| **P2A-41** | Unit tests: all allowed and denied Job (and WorkOrder) transitions per role; explicit cases | Transition matrix covered | EXECUTION §10.5 |
| **P2A-42** | RBAC/IDOR tests: access to another user's job, completion, evidence, work order, incident returns 403; admin and correct owner get 200 | All five resource types covered | EXECUTION §10.5 |
| **P2A-43** | Storage/upload tests: disallowed MIME and oversize rejected; no file stored | 400/413 or equivalent | EXECUTION §10.5 |
| **P2A-44** | One E2E (or scripted) happy path: assign job → worker completes (checklist + photos) → admin approves → add to payout → mark paid | Single full flow | EXECUTION §10.5 |

**Phase 2A complete when:** All routes work; production gates (§10) satisfied; test suite passes; docs complete; seed runs.

---

## Phase 2B: Marketing Website (P2)

**Goal:** Public site; all pages; lead capture; SEO; no portal features.

**Dependency:** Phase 0 (lead capture decision). Can run in parallel with Phase 2A.

### 2B.1 Scaffold and layout

| ID | Task | Deliverable / Acceptance | Ref |
|----|------|---------------------------|-----|
| **P2B-01** | Initialize Next.js 14+ App Router, TypeScript, Tailwind in `marketing/`; Vercel-ready | `marketing/package.json`, app router, Tailwind | prompts P2 |
| **P2B-02** | Build layout: header, footer, CTAs ("Request a Quote", "Book a Site Walk"), phone, email, optional "Download Condo Proposal (PDF)" | Site-wide navigation and CTAs | prompts P2 |
| **P2B-03** | Apply brand: dark/neutral, strong typography, whitespace; no UI library | Matches P2 brand | prompts P2 |

### 2B.2 Home and contact

| ID | Task | Deliverable / Acceptance | Ref |
|----|------|---------------------------|-----|
| **P2B-04** | Build Home: hero, who we serve, what we solve, how it works, services snapshot, why BLVCKSHELL, service area, FAQ (6–8), contact CTA | All sections present; no lorem | prompts P2 |
| **P2B-05** | Build Contact page: form (Name, Company, Role, Phone, Email, Property Type, # sites, Message, consent checkbox); service area + response time | Form and copy | prompts P2 |
| **P2B-06** | Implement `/api/lead`: zod validation; store in Lead table (id, createdAt, name, company, role, phone, email, propertyType, sitesCount, message, sourcePage); optional email to admin; honeypot/rate limit if chosen | Lead capture works in dev | DECISIONS §1 #9, prompts P2 |

### 2B.3 Service and static pages

| ID | Task | Deliverable / Acceptance | Ref |
|----|------|---------------------------|-----|
| **P2B-07** | Build `/services`, `/condo-cleaning`, `/commercial-cleaning`, `/light-maintenance` | Content per prompt; will/won't do on light maintenance | prompts P2 |
| **P2B-08** | Build `/about` and `/privacy` | Credible copy; basic privacy (PIPEDA-friendly if applicable) | prompts P2 |
| **P2B-09** | Add downloads: link/button to `/public/BLVCKSHELL_Condo_Cleaning_Proposal.pdf` or placeholder + README "drop PDF here" | No fake PDF content | prompts P2 |

### 2B.4 SEO and docs

| ID | Task | Deliverable / Acceptance | Ref |
|----|------|---------------------------|-----|
| **P2B-10** | Metadata and OpenGraph for each page; sitemap; robots.txt | SEO requirements met | prompts P2 |
| **P2B-11** | Use next/image; minimal JS; proper headings and labels; keyboard nav | Performance and a11y | prompts P2 |
| **P2B-12** | Write `marketing/README.md`: setup, env, deploy (Vercel) | README complete | prompts P2 |

**Phase 2B complete when:** All pages live; contact form and lead API work; SEO and README done.

---

## Phase 3: Production Gate Sign-Off and Final Validation

**Goal:** Confirm production readiness and run smoke tests before release.

| ID | Task | Deliverable / Acceptance | Ref |
|----|------|---------------------------|-----|
| **P3-01** | Complete EXECUTION_PLAN §10 Production Plan Readiness checklist (Security, Data integrity, UX reliability, Decisions, Tests) | All §10 items checked | EXECUTION §10 |
| **P3-02** | Smoke-test portal: login as admin, vendor owner, worker; create workforce/job; assign worker; complete job (draft + submit); approve; create payout; mark paid; create work order and incident | All critical paths work | EXECUTION §11 |
| **P3-03** | Smoke-test marketing: submit lead; verify stored in DB (or email); check all links and CTAs | Lead capture and navigation work | EXECUTION §11 |
| **P3-04** | Confirm no cross-feature leakage (portal and marketing separate; shared brand only) | No portal routes from marketing; no marketing routes from portal | EXECUTION §11 |

**Phase 3 complete when:** §10 sign-off done and smoke tests pass. Portal may be treated as production-ready.

---

## Task Index (Checklist)

Use this to track progress. Complete in phase order; within a phase, respect task dependencies where stated.

### Phase 0
- [ ] P0-1  [ ] P0-2  [ ] P0-3  [ ] P0-4

### Phase 1 (Ops Binder)
- [ ] P1-01  [ ] P1-02  [ ] P1-03  [ ] P1-04  [ ] P1-05  [ ] P1-06  [ ] P1-07  [ ] P1-08  [ ] P1-09  [ ] P1-10  [ ] P1-11  [ ] P1-12  [ ] P1-13  [ ] P1-14

### Phase 2A (Portal)
- [ ] P2A-01 … P2A-10  (Environment and schema)
- [ ] P2A-11 … P2A-13  (Auth and RBAC)
- [ ] P2A-14 … P2A-16  (Storage)
- [ ] P2A-17 … P2A-21  (Worker and vendor flows)
- [ ] P2A-22 … P2A-26  (Admin flows)
- [ ] P2A-27 … P2A-28  (State machines and audit)
- [ ] P2A-29 … P2A-32  (Documentation)
- [ ] P2A-33 … P2A-36  (Security hardening)
- [ ] P2A-37 … P2A-40  (UX reliability)
- [ ] P2A-41 … P2A-44  (Tests)

### Phase 2B (Marketing)
- [ ] P2B-01 … P2B-12

### Phase 3 (Sign-off)
- [ ] P3-01  [ ] P3-02  [ ] P3-03  [ ] P3-04

---

## Summary

| Phase | Task count | Purpose |
|-------|------------|---------|
| P0    | 4          | Decisions locked; repo structure |
| P1    | 14         | Ops binder (47 files); checklist IDs and state machine for portal |
| P2A   | 44         | Workforce portal (schema, auth, storage, all routes, docs, hardening, tests) |
| P2B   | 12         | Marketing site (pages, lead capture, SEO) |
| P3    | 4          | Production gate sign-off and smoke tests |
| **Total** | **78** | |

**Critical path:** P0 → P1 → P2A → P3. P2B can run in parallel with P2A after P0.

This document is the full-scale implementation plan. For phase rationale and risk mitigation, see EXECUTION_PLAN.md. For locked options, see DECISIONS.md.
