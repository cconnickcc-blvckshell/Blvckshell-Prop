# Comprehensive Execution Plan: All BLVCKSHELL Prompts (Updated)

**Date:** February 16, 2026  
**Scope:** Prompt 1 (Original MVP), **Prompt 1 Revised (Workforce Operations Portal)**, Prompt 2 (Marketing), Prompt 3 (Operations Binder)  
**Purpose:** In-depth review and phased plan to execute all prompts. **Portal implementation follows Prompt 1 Revised (workforce-driven, Supabase, Vercel).**

---

## 1. Executive Summary

| Item | Deliverable | Dependencies | Notes |
|------|-------------|--------------|--------|
| **P3** Operations Binder | Markdown docs in `/ops-binder/` | None | Foundation; checklist IDs & state machines feed portal |
| **P1 Revised** Workforce Portal | Next.js + Prisma + Supabase + Vercel | P3 for checklists & state alignment | **Modify & finalize** existing portal; workforce/teams; no filesystem |
| **P2** Marketing Website | Next.js marketing site + lead capture | None | Independent; same brand |

**Execution order:**  
**Phase 0 (Pre-flight)** → **Phase 1: P3 (Ops Binder)** → **Phase 2A: P1 Revised (Portal)** and **Phase 2B: P2 (Marketing)** (P2 can run in parallel with 2A where useful).

**Portal authority:** Implement the portal to **Prompt 1 Revised** spec. The original Prompt 1 (single User per subcontractor, local file storage) is superseded by P1 Revised for build and deployment.

---

## 2. Dependency Graph and Alignment

```
                    ┌─────────────────────────────────────────────────────────┐
                    │  SHARED: Brand, Ontario/Canada terms, dark/neutral UI   │
                    └─────────────────────────────────────────────────────────┘
                                          │
         ┌────────────────────────────────┼────────────────────────────────┐
         ▼                                ▼                                ▼
┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
│  P3 Ops Binder  │───────────▶│  P1 REVISED     │            │  P2 Marketing   │
│                 │  feeds     │  Workforce      │            │                 │
│  - Checklist IDs│            │  Portal         │            │  - Lead capture │
│  - Job states   │            │  - Supabase     │            │  - No portal     │
│  - Roles (map)  │            │  - Workforce   │            │                 │
└─────────────────┘            │  - Audit log   │            └─────────────────┘
                               └─────────────────┘
```

**Alignment rules:**
- **P3 → P1 Revised:** Checklist item IDs (e.g. LOB-001) from P3 = stable `itemId` in portal ChecklistTemplate and JobCompletion. Job state machine (Scheduled → Completed Pending Approval → Approved Payable → Paid / Cancelled) and rejection/cancel rules match. P3 roles (ADMIN, OPS_MANAGER, SUBCONTRACTOR) map to portal: ADMIN, VENDOR_OWNER, VENDOR_WORKER, INTERNAL_WORKER.
- **Portal tech:** Supabase Postgres (pooled DATABASE_URL runtime; DIRECT_URL migrations) and Supabase Storage only; no client portal; no filesystem; Vercel deploy.

---

## 3. Phase 0: Pre-Flight (Before Building)

Lock and document in **DECISIONS.md** (and portal README where relevant). No build is production-plan ready until these are locked.

### 3.1 Core decisions

| # | Decision | Option | Where |
|---|----------|--------|--------|
| 1 | Auth (Portal) | NextAuth Credentials or custom JWT; bcrypt required | P1 Revised |
| 2 | Database | Supabase Postgres: pooled `DATABASE_URL` runtime, `DIRECT_URL` migrations | P1 Revised |
| 3 | File storage (Portal) | Supabase Storage only; no local filesystem | P1 Revised |
| 4 | Rejection flow | COMPLETED_PENDING_APPROVAL → SCHEDULED; ADMIN only; rejection reason stored | P1 Revised, P3 |
| 5 | Cancel Job | ADMIN only; from SCHEDULED or COMPLETED_PENDING_APPROVAL | P1 Revised, P3 |
| 6 | Job assignment | Exactly one of assignedWorkforceAccountId OR assignedWorkerId | P1 Revised |
| 7 | Checklist JSON | items: `{ itemId, label, required? }`; results: `Record<itemId, { result: PASS\|FAIL\|NA, note? }>` | P1 Revised, P3 |
| 8 | Upload limits | 10MB max; jpg, jpeg, png, webp | P1 Revised |
| 9 | Lead capture (Marketing) | Store in Postgres Lead table + optional email to admin | P2 |
| 10 | Node / Next | e.g. Node 20 LTS; Next.js 14.x | P1 Revised, P2 |

### 3.2 Production decision locks (must be in DECISIONS.md before production)

| # | Decision | Option / rule | Rationale |
|---|----------|----------------|-----------|
| 11 | Evidence retention | 90 days default; purge process in DATA_RETENTION.md | Storage and compliance |
| 12 | Compliance gating | Expired/missing COI/WSIB blocks new job assignment; ADMIN override allowed only with audit log entry (metadata: reason, overrideAt) | Audit trail for overrides |
| 13 | Access credential masking | Codes stored/masked (e.g. last 4 only in UI); full value only to authorized roles; document in SECURITY.md | Reduce exposure |
| 14 | Max photos per job | Cap per job (e.g. 20) to prevent storage blowup; document in DECISIONS | Cost and abuse control |
| 15 | Vendor owner job reassignment | Phase 1: **No** — only ADMIN can assign/reassign jobs | Simplest; can relax later with audit |

### 3.3 Final implementation locks (do before starting implementation)

These prevent Cursor from inventing approaches. Lock in **DECISIONS.md** and enforce in code/schema.

| # | Decision | Locked option | Rationale |
|---|----------|----------------|-----------|
| 16 | **Supabase Storage security** | **Option A (MVP):** All uploads/downloads via server routes using **service role** only; no client direct bucket access; buckets not public. | Simplest and safest; no RLS/signed-URL complexity. Option B (signed URLs with strict path checks) is acceptable if documented. |
| 17 | **Draft completion data model** | Either: (a) `JobCompletionDraft` table (jobId, workerId, checklistResults JSON, evidencePaths[], savedAt), OR (b) `JobCompletion` with status `DRAFT` until submit. Photos may attach to drafts; stored in same evidence path pattern with draft/completion id. Define one approach in DECISIONS.md. | Prevents losing work on upload failure; schema must support it. |
| 18 | **Workforce-assigned job visibility** | Phase 1: When job has `assignedWorkforceAccountId` only, job is **not** shown to all workers in that account until either: (1) admin sets `assignedWorkerId` (claim), or (2) add optional `claimedByWorkerId` and one worker “claims” the job (audit logged). Recommend: **admin assigns to worker** before job appears in worker’s `/jobs`. | Prevents two workers showing up; least chaos. |
| 19 | **Max photos per job enforcement** | Cap (e.g. 20) enforced in **both** UI (disable/add button past cap) and **server** (reject upload and reject completion submit if over cap). Document cap value in DECISIONS.md. | Prevents storage blowup and bypass via API. |
| 20 | **Password reset** | **No self-serve reset in MVP.** Admin can reset a user’s password (new temp password or force-change link); action **audit logged**. | Boring and safe for first production deployment. |

**Deliverable:** `DECISIONS.md` with §3.1, §3.2, and §3.3. A template lives at repo root (`DECISIONS.md`); copy into `portal/` if using a separate portal repo. Portal is not production-plan ready until all three are documented. Implementation must follow the locked options (storage, draft model, visibility/claiming, photo cap enforcement, password reset).

---

## 4. Phase 1: Execute Prompt 3 (Operations Binder)

**Goal:** Full `/ops-binder/` tree with real content; no TBD for core content; bracket placeholders where variable.

### 4.1 Build order (by dependency)

1. **07_State_Machines_and_Roles/** — Roles and Job/WorkOrder/Invoice/Payout states; AuditLog requirements. Align role names with portal: document mapping ADMIN, VENDOR_OWNER, VENDOR_WORKER, INTERNAL_WORKER if P3 uses different labels.
2. **06_Checklists_Library/** — All 8 checklists with stable item IDs (e.g. LOB-001).
3. **03_SOPs/** — SOP_01–SOP_06.
4. **04_Policies/** — POL_01–POL_06.
5. **01_Client_Contract/** — MSA + Schedules A–E + Work Order + Credit/Reclean.
6. **02_Subcontractor_Contract/** — Longform, one-pager, rate sheet, scope will/won’t do, onboarding.
7. **05_QA_Forms/** — QA_01–QA_06.
8. **08_Sales_Enablement/** — Discovery script, site walk, proposal insert.
9. **00_README.md** — Index and “portal-loadable” note.

### 4.2 Deliverables checklist (P3)

- [ ] ops-binder/00_README.md
- [ ] 01_Client_Contract/ (8 files)
- [ ] 02_Subcontractor_Contract/ (5 files)
- [ ] 03_SOPs/ (6 files)
- [ ] 04_Policies/ (6 files)
- [ ] 05_QA_Forms/ (6 files)
- [ ] 06_Checklists_Library/ (8 files, stable item IDs)
- [ ] 07_State_Machines_and_Roles/ (3 files)
- [ ] 08_Sales_Enablement/ (3 files)
- [ ] Cross-doc consistency (proof, scope, communications).

### 4.3 Outputs for P1 Revised

- Checklist IDs → portal seed/admin checklist templates.
- Job (and optional WorkOrder) state machine → portal enums and transition logic.
- Roles doc → map to ADMIN, VENDOR_OWNER, VENDOR_WORKER, INTERNAL_WORKER.
- Audit log field list → portal AuditLog model and write on every transition.

---

## 5. Phase 2A: Execute Prompt 1 Revised (Workforce Operations Portal)

**Goal:** Modify and finalize the existing Subcontractor Portal into a workforce-driven, production-safe operations portal. Supabase + Vercel; no filesystem; full RBAC and audit trail.

### 5.1 Prerequisites

- Phase 0 decisions documented.
- P3 state machine and checklist library available (Phase 1).
- Supabase project: Postgres + Storage bucket(s) for evidence and compliance docs.

### 5.2 Build order (implementation sequence)

**1. Environment and schema**

- Supabase: create project; get pooled `DATABASE_URL` and `DIRECT_URL`; create Storage bucket(s) (e.g. `evidence`, `compliance`) with RLS/policies as needed.
- Prisma: schema with all required models and enums.
  - **Core:** ClientOrganization, WorkforceAccount, User, Worker, ComplianceDocument, Site, AccessCredential, ChecklistTemplate, Job, JobCompletion, Evidence, WorkOrder, IncidentReport, PayoutBatch, PayoutLine, AuditLog.
  - Enums: WorkforceAccountType, UserRole, ComplianceDocumentType, AccessCredentialType/Status, JobStatus, WorkOrderStatus, IncidentReportType, etc.
  - Relations and cascade rules; indexes for lists/filters.
- Migrations: use `DIRECT_URL`; document in README.
- Seed script: 1 admin; 1 vendor workforce + 2 workers; 1 internal workforce + 1 worker; 2 client orgs; 2 sites (with checklist templates); 6 jobs (mixed workforce/worker assignment); 1 missed job + 1 make-good job; 1 work order; 1 incident. SEED.md with instructions.

**2. Auth and RBAC**

- NextAuth (or custom JWT) with role and workforceAccountId (and workerId if available) in session.
- Server-side guards:
  - ADMIN: full access.
  - VENDOR_OWNER: only own WorkforceAccount and jobs assigned to that account.
  - VENDOR_WORKER / INTERNAL_WORKER: only jobs where assigned (by worker or via workforce account).
- Every job/completion/evidence/work order/incident access checked by assignment or admin; no IDOR.

**3. Storage layer**

- **Storage security:** Per DECISIONS.md (§3.3 #16): server-only with service role (no client direct access) OR signed URLs with strict path checks—implement exactly one.
- Supabase Storage client (server-side): upload/download with path pattern `evidence/{jobId}/{completionId}/{timestamp}-{uuid}.{ext}`.
- Validation: file type (jpg, jpeg, png, webp), size ≤ 10MB; **max photos per job** enforced in UI and server (reject upload and completion submit over cap); reject completion if site’s requiredPhotoCount not met.
- Compliance documents: store under compliance bucket; link in ComplianceDocument.storagePath.

**4. Worker and vendor owner flows**

- **Workers:** `/jobs` (list: only jobs where they are assigned worker or per DECISIONS §3.3 #18 visibility/claiming rule), `/jobs/[id]` (detail, checklist, evidence upload, **draft save** per DECISIONS §3.3 #17, submit completion), `/earnings`, `/profile`. Completion: all checklist items + ≥ requiredPhotoCount + within photo cap → SCHEDULED → COMPLETED_PENDING_APPROVAL; write AuditLog.
- **Vendor owner (scaffold):** `/vendor/team`, `/vendor/jobs` — list team and jobs for their WorkforceAccount; no pricing, no approvals.

**5. Admin flows**

- **Workforce:** `/admin/workforce`, `/admin/workforce/[id]` — CRUD workforce accounts; add/remove workers; compliance docs (COI/WSIB); block new assignments if expired COI/WSIB unless ADMIN override (audit logged).
- **Jobs:** `/admin/jobs`, `/admin/jobs/[id]` — Create/edit jobs; assign to WorkforceAccount or Worker (exactly one); calendar-lite list; mark missed + create make-good; review completion; approve (→ APPROVED_PAYABLE) or reject (→ SCHEDULED with reason); cancel (→ CANCELLED). All transitions → AuditLog.
- **Work orders:** `/admin/workorders` — List; approve; assign; track REQUESTED → … → PAID.
- **Incidents:** `/admin/incidents` — List; resolve; link to lost-key flow if needed.
- **Payouts:** `/admin/payouts` — Create batch for date range; include approved jobs; payouts to WorkforceAccount; mark PAID; AuditLog.

**6. State machines and audit**

- Job: only allowed transitions as in spec; reject invalid transitions with clear error.
- WorkOrder: REQUESTED → APPROVED → ASSIGNED → COMPLETED → INVOICED → PAID (enforce in code).
- AuditLog: every state change with actorUserId, actorWorkerId (nullable), actorWorkforceAccountId (nullable), entityType, entityId, fromState, toState, metadata, createdAt.

**7. Documentation**

- **README.md:** Setup, env (DATABASE_URL vs DIRECT_URL), Storage bucket, run, test, deploy (Vercel).
- **DECISIONS.md:** Product/tech decisions (assignment rule, rejection/cancel, retention, etc.).
- **SECURITY.md:** RBAC summary, data handling, no client-side DB, Supabase access.
- **DATA_RETENTION.md:** Evidence retention (e.g. 90 days), purge process.
- **SEED.md:** How to run seed; what it creates.

**8. Security hardening (production gate)**

- **Rate limiting:** Login, job completion submission, evidence upload endpoints (e.g. per-IP or per-user limits; document in SECURITY.md).
- **Session:** Timeout and refresh strategy documented (e.g. 24h max session; refresh on activity); document in SECURITY.md.
- **Login backoff / lockout:** After N failed attempts (e.g. 5), temporary backoff or lockout; document policy in SECURITY.md.
- **Password reset:** Explicitly “out of scope for MVP” in DECISIONS.md, or implement minimal reset flow (e.g. admin-initiated or email link).

**9. Data integrity (production gate)**

- **Deletion strategy:** Prefer **RESTRICT** on FKs for auditable entities (Job, JobCompletion, Evidence, AuditLog); **soft-deactivate** (isActive = false) for User, WorkforceAccount, Site instead of hard delete where audit trail must be preserved. Document cascade/restrict in schema and DECISIONS.
- **Uniques:** User.email; JobCompletion.jobId (1:1 with Job); only one active ChecklistTemplate per site per version policy (document and enforce).
- **FK rule:** completedByWorkerId on JobCompletion may differ from job’s assignedWorkerId when job is assigned to a WorkforceAccount (team); any worker from that account can complete. Document in DECISIONS.

**10. UX reliability (production gate)**

- **Upload retry + draft:** Allow retry on failed uploads; support saving partial completion (draft) so worker can resume (e.g. checklist answers + partial photos) without losing work.
- **Validation errors:** Clear inline errors for missing required photos, missing checklist items, oversize/wrong type before submit.
- **Mobile-first completion:** Job completion flow must work on mobile; camera upload for evidence; touch-friendly checklist and submit.

**11. Tests (production bar)**

- **Unit:** All allowed and denied state transitions per role (Job and, if implemented, WorkOrder); explicit test cases, not “minimal.”
- **RBAC / IDOR:** Attempts to access another user’s job, completion, evidence, work order, incident must return 403; admin and correct owner/worker get 200. Cover job, completion, evidence, workorder, incidents.
- **Storage/upload:** Reject disallowed MIME types and oversize files; assert 400/413 or equivalent and no file stored.
- **E2E (one happy path):** Assign job → worker completes (checklist + photos) → admin approves → add to payout batch → mark paid. Single flow, automated or scripted.

### 5.3 Deliverables checklist (P1 Revised)

- [ ] Next.js app with all required routes (admin, workers, vendor scaffold).
- [ ] Prisma schema + migrations (Supabase: DIRECT_URL for migrate); cascade/restrict and uniques documented.
- [ ] Supabase Storage for evidence and compliance; no filesystem.
- [ ] Seed script + SEED.md (admin, vendor + 2 workers, internal + 1 worker, 2 client orgs, 2 sites, 6 jobs, 1 missed + make-good, 1 work order, 1 incident).
- [ ] README, DECISIONS (including §3.2 production locks), SECURITY, DATA_RETENTION, SEED.
- [ ] No TODOs in core flows; no fake flows.
- [ ] **Production gates:** Rate limit + session + lockout + password reset decision; soft-delete/restrict + uniques; upload retry + draft + mobile-first completion; test suite per §5.2 step 11.
- [ ] Checklist itemIds and Job state machine aligned with P3.

### 5.4 Alignment with P3

- Job status enum and transitions match P3 state machine.
- AuditLog fields match P3 audit requirements (actor ids, entity, fromState, toState, metadata).
- Seed checklists use itemIds from P3 checklist library (or documented subset).
- Roles: P3 “SUBCONTRACTOR” / “OPS_MANAGER” mapped to VENDOR_WORKER / VENDOR_OWNER / INTERNAL_WORKER as documented in DECISIONS or P3 roles doc.

---

## 6. Phase 2B: Execute Prompt 2 (Marketing Website)

**Goal:** Public marketing site; all pages; lead capture; SEO; no portal features.

### 6.1 Prerequisites

- Phase 0 (lead capture decision).
- Optional: P3 copy for positioning.

### 6.2 Build order

1. Scaffold (Next.js, Tailwind, Vercel-ready).
2. Layout: header/footer, CTAs, phone/email, optional PDF download.
3. Home + Contact + `/api/lead` (zod, DB, optional email, honeypot/rate limit).
4. Service pages: /services, /condo-cleaning, /commercial-cleaning, /light-maintenance.
5. About, Privacy.
6. SEO: metadata, OpenGraph, sitemap, robots.txt.
7. README (setup, deploy).

### 6.3 Deliverables checklist (P2)

- [ ] All pages and contact form working.
- [ ] Lead API stores to DB; README and deploy steps.

---

## 7. Repository and Folder Structure

**Option A – Single repo (recommended):**

```
blvckshell/
├── prompts
├── DECISIONS.md
├── PROMPTS_REVIEW.md
├── EXECUTION_PLAN.md
├── ops-binder/           # P3
├── portal/               # P1 Revised
│   ├── prisma/
│   ├── src/
│   ├── README.md
│   ├── DECISIONS.md
│   ├── SECURITY.md
│   ├── DATA_RETENTION.md
│   ├── SEED.md
│   └── package.json
├── marketing/            # P2
└── README.md
```

**Option B – Split repos:** Separate repos for ops-binder, portal, marketing; keep DECISIONS and this plan in one place (e.g. portal or meta repo).

---

## 8. Risk and Mitigation

| Risk | Mitigation |
|------|------------|
| State machine drift (P3 vs portal) | Implement only allowed Job/WorkOrder transitions from P3 and this plan; single source of truth in code and P3 docs. |
| Checklist IDs inconsistent | P3 checklist library = source of truth; seed and admin UI use same itemIds. |
| Supabase connection mistakes | README and DECISIONS: runtime = pooled DATABASE_URL; migrations = DIRECT_URL. |
| Compliance blocking too strict/loose | Document in DECISIONS: “Expired COI/WSIB blocks new assignment unless ADMIN override (audit logged).” |
| Job assignment ambiguity | Enforce in schema and UI: exactly one of assignedWorkforceAccountId or assignedWorkerId. |
| Scope creep | Stick to required screens and models; no client portal, no automated payments, no dashboards/KPI visualization in Phase 1. |
| Dashboard scope creep | Data collected for metrics (missed visits, recleans, time-to-approval, vendor incident rate) but NO visualization in Phase 1; see ROADMAP.md Part 8 |

---

## 9. Definition of Done

- **P3:** Every ops-binder file present with full content; stable checklist IDs; state machine and roles documented; client/sub contracts aligned.
- **P1 Revised:** All required routes work; Supabase Postgres + Storage; workforce/worker model and RBAC; Job (and WorkOrder) state machines enforced; AuditLog on every transition; README, DECISIONS (including production decision locks §3.2), SECURITY, DATA_RETENTION, SEED; seed data as specified; **production readiness gates (§10) satisfied**; test suite per §5.2 step 11; **NO dashboards or KPI visualization** (metrics collected but not visualized per ROADMAP.md Part 8).
- **P2:** All pages live; lead capture and SEO done; README and deploy.

---

## 10. Production Plan Readiness (Portal)

The portal is **production-plan ready** only when the following gates are met. These close gaps identified in PROMPTS_REVIEW (security, data integrity, UX failure handling, decision locking, test bar).

### 10.1 Security

- [ ] **Rate limit** auth (login), upload, and job completion submission endpoints; document limits in SECURITY.md.
- [ ] **Login backoff / lockout** policy (e.g. after N failed attempts); document in SECURITY.md.
- [ ] **Session timeout** (and refresh strategy if any) documented in SECURITY.md.
- [ ] **Password reset:** Either “out of scope for MVP” in DECISIONS.md or minimal flow implemented.

### 10.2 Data integrity

- [ ] **Soft-delete strategy** for auditable entities: prefer RESTRICT on deletes + soft-deactivate (isActive) for User, WorkforceAccount, Site; document in DECISIONS and schema.
- [ ] **Explicit cascade/restrict** rules in Prisma schema; no orphaned records or accidental cascade that drops audit history.
- [ ] **Uniques + indexes** documented and enforced: User.email; JobCompletion.jobId (1:1); one active checklist template per site/version policy.

### 10.3 UX reliability

- [ ] **Upload retry + draft completion save** so workers can retry failed uploads and resume partial completions without losing work.
- [ ] **Clear validation errors** for missing required photos, missing checklist items, file type/size.
- [ ] **Mobile-first job completion** UX: usable on phone; camera upload for evidence; touch-friendly.

### 10.4 Decisions

- [ ] **DECISIONS.md** expanded to include: retention window (e.g. 90 days); compliance gating rules + override metadata required; credential masking policy; max photos per job; vendor owner internal assignment policy (Phase 1: no).
- [ ] **Final implementation locks (§3.3)** in DECISIONS.md: Storage security (server-only vs signed URLs); draft completion model (table or DRAFT status; photos on drafts); workforce-assigned job visibility/claiming rule; max photo cap enforced in UI + server; password reset (admin-initiated, audit logged; no self-serve in MVP).

### 10.5 Tests

- [ ] **Transition tests:** All allowed and denied transitions per role (unit).
- [ ] **RBAC / IDOR tests:** Job, completion, evidence, work order, incident access by wrong role/owner returns 403.
- [ ] **Upload validation tests:** Disallowed MIME and oversize rejected; no file stored.
- [ ] **One E2E flow:** Assign → complete → approve → payout (happy path).

---

## 11. Execution Checklist (High Level)

- [ ] **Phase 0:** Create DECISIONS.md with core decisions (§3.1), production decision locks (§3.2), and final implementation locks (§3.3).
- [ ] **Phase 1:** Run Prompt 3; produce full ops-binder/; verify checklist IDs and state machine.
- [ ] **Phase 2A:** Run **Prompt 1 Revised**; implement workforce portal including production gates (security hardening, data integrity, UX reliability, expanded DECISIONS, test suite per §5.2 step 11).
- [ ] **Phase 2B:** Run Prompt 2; implement marketing site and lead capture.
- [ ] **Production gate sign-off:** Confirm §10 Production Plan Readiness checklist satisfied before treating portal as production-ready.
- [ ] **Final:** Smoke-test portal (workforce CRUD, job assign, complete, approve, payout, work order, incident); marketing (submit lead); confirm no cross-feature leakage.

This plan is the single reference for executing all prompts and keeping the **Workforce Operations Portal** (P1 Revised), Operations Binder (P3), and Marketing site (P2) aligned. **Shipping for production requires §10 (Production Plan Readiness) to be satisfied.**

**⚠️ PRIMARY EXECUTION DOCUMENT:** For CTO approval and step-by-step execution with gold standard coding practices, see **ROADMAP.md**. This is the definitive blueprint that consolidates EXECUTION_PLAN, IMPLEMENTATION_PLAN, DECISIONS, and prompts into a single actionable document with 78 tasks, quality gates, risk mitigation, and execution commitment.

**Task-level checklist:** For a detailed task breakdown, see **IMPLEMENTATION_PLAN.md**.
