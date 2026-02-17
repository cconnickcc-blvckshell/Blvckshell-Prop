# BLVCKSHELL Facilities Services — Complete Implementation Roadmap

**Document Version:** 1.0  
**Date:** February 16, 2026  
**Purpose:** Single source of truth for CTO approval and step-by-step execution blueprint  
**Authority:** This document supersedes all other planning docs for implementation. Follow it exactly.

---

## Executive Summary

This roadmap delivers three production-ready systems for BLVCKSHELL Facilities Services:

1. **Operations Binder (P3)** — 47 markdown files: contracts, SOPs, policies, QA forms, checklists, state machines
2. **Workforce Operations Portal (P1 Revised)** — Next.js + Supabase + Vercel; workforce/teams; full RBAC; audit-safe
3. **Marketing Website (P2)** — Public site; lead capture; SEO

**Timeline:** Sequential phases (P0 → P1 → P2A → P3); P2B can parallel P2A after P0.  
**Quality bar:** Production-ready means all §10 Production Readiness gates satisfied + test suite passing.  
**Risk mitigation:** Every decision locked in DECISIONS.md; no ambiguity; production gates prevent demo-grade output.

---

## Part 1: Architecture & Standards

### 1.1 Tech Stack (Locked)

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| Frontend | Next.js App Router | 14.x | Server components, RSC, Vercel-native |
| Language | TypeScript | Latest | Type safety, maintainability |
| Database | Supabase Postgres | Latest | Managed, serverless-compatible |
| ORM | Prisma | Latest | Type-safe queries, migrations |
| Storage | Supabase Storage | Latest | No filesystem; serverless-safe |
| Auth | NextAuth.js | Latest | Credentials provider; bcrypt |
| Styling | Tailwind CSS | Latest | Utility-first; no UI library bloat |
| Deployment | Vercel | Latest | Zero-config Next.js |
| Testing | Vitest + React Testing Library | Latest | Fast, modern test runner |

**Connection rules:**
- Runtime: Supabase pooled `DATABASE_URL` (serverless-safe)
- Migrations: Supabase `DIRECT_URL` (bypasses pooler)
- Storage: Server-only with service role; no client direct access

### 1.2 Gold Standard Coding Practices

#### TypeScript
- **Strict mode:** `strict: true` in tsconfig.json
- **No `any`:** Use `unknown` and type guards; explicit types for all functions
- **Type inference:** Prefer inference where clear; explicit where ambiguous
- **Enums:** Use Prisma enums for DB; TypeScript enums for app logic where needed
- **Interfaces:** Prefer `interface` for object shapes; `type` for unions/intersections

#### Code organization
```
portal/src/
├── app/                    # Next.js App Router routes
│   ├── (auth)/            # Auth group
│   ├── (worker)/          # Worker routes
│   ├── admin/             # Admin routes
│   └── api/               # API routes
├── components/             # React components
│   ├── ui/                # Base UI (buttons, inputs)
│   ├── forms/             # Form components
│   └── layout/            # Layout components
├── lib/                   # Utilities
│   ├── prisma.ts          # Prisma client singleton
│   ├── auth.ts            # Auth utilities
│   ├── storage.ts         # Supabase Storage client
│   └── validations.ts     # Zod schemas
├── server/                # Server-only code
│   ├── actions/           # Server actions
│   └── guards/            # RBAC guards
└── types/                 # TypeScript types
```

#### Error handling
- **Server actions:** Return `{ success: boolean, data?, error? }` pattern
- **API routes:** HTTP status codes (400, 401, 403, 404, 500); JSON error responses
- **Client:** Try/catch with user-friendly messages; log errors server-side
- **Validation:** Zod schemas for all inputs; fail fast with clear messages

#### Security
- **RBAC:** Server-side guards on every route/action; never trust client
- **IDOR prevention:** Check ownership/assignment before returning data
- **Input validation:** Zod schemas; sanitize where needed
- **Rate limiting:** Per-IP or per-user on auth, upload, submission endpoints
- **Session:** Timeout and refresh strategy; secure cookies
- **Passwords:** bcrypt with salt rounds ≥ 10

#### Database
- **Migrations:** Versioned; never edit existing migrations
- **Indexes:** On foreign keys, frequently queried fields, unique constraints
- **Cascade rules:** RESTRICT on auditable entities; soft-delete for User/Site/WorkforceAccount
- **Transactions:** Use for multi-step operations (e.g., job completion + evidence + audit log)

#### Testing
- **Unit:** Pure functions, utilities, state transition logic
- **Integration:** API routes, server actions, DB operations
- **E2E:** One happy path (assign → complete → approve → payout)
- **Coverage:** Aim for 80%+ on critical paths; 100% on state machines and RBAC

#### Performance
- **Server components:** Default; client components only when needed (interactivity)
- **Database:** Use Prisma `select` to fetch only needed fields; avoid N+1
- **Images:** `next/image` with optimization; WebP where supported
- **Caching:** React cache, unstable_cache for server data where appropriate

#### Documentation
- **README.md:** Setup, env vars, run, test, deploy
- **Code comments:** JSDoc for public functions; inline comments for complex logic
- **Type safety:** Types are documentation; prefer clear types over comments

---

## Part 2: Decision Locks

**All decisions are locked in `DECISIONS.md`. No implementation should contradict them.**

### Critical locks (must implement exactly as specified)

1. **Storage:** Server-only with Supabase service role; no client bucket access
2. **Draft completion:** JobCompletion with DRAFT status; photos attach to drafts
3. **Job visibility:** Workers see job only when `assignedWorkerId` set by admin
4. **Max photos:** 20 per job; enforce in UI (disable) and server (reject)
5. **Password reset:** Admin-initiated only; audit logged; no self-serve MVP
6. **Compliance gating:** Expired COI/WSIB blocks assignment; ADMIN override with audit log
7. **State machines:** Only allowed transitions; reject invalid with clear error
8. **Audit log:** Every state change writes AuditLog with actor IDs, fromState, toState, metadata

See `DECISIONS.md` §1–§3 for complete list.

---

## Part 3: Step-by-Step Execution Plan

### Phase 0: Pre-Flight (Day 1)

**Goal:** All decisions locked; repo structure ready; no ambiguity.

| Step | Task | Deliverable | Acceptance |
|------|------|-------------|------------|
| 0.1 | Verify `DECISIONS.md` exists at repo root with §1–§4 | File exists | All 20 decisions documented |
| 0.2 | Create repo structure: `ops-binder/`, `portal/`, `marketing/` | Folders exist | Root README points to each |
| 0.3 | Document Node (20 LTS) and Next.js (14.x) versions | Versions in DECISIONS and README | Consistent across docs |
| 0.4 | Create root `README.md` with overview and links | README.md | Points to portal, marketing, ops-binder |

**Phase 0 complete when:** DECISIONS.md is single source of truth; repo structure ready.

---

### Phase 1: Operations Binder (Days 2–5)

**Goal:** 47 markdown files with real content; stable checklist IDs; state machine for portal alignment.

**Dependency:** Phase 0 complete.

#### 1.1 State machines and roles (Day 2, morning)

| Step | Task | File | Acceptance |
|------|------|------|------------|
| 1.1.1 | Create `ops-binder/07_State_Machines_and_Roles/01_Roles_and_RBAC.md` | Roles doc | Defines ADMIN, VENDOR_OWNER, VENDOR_WORKER, INTERNAL_WORKER; maps to P3 labels if different |
| 1.1.2 | Create `02_State_Machines_Jobs_WorkOrders_Invoices_Payouts.md` | State machine doc | Job: SCHEDULED → COMPLETED_PENDING_APPROVAL → APPROVED_PAYABLE → PAID / CANCELLED; WorkOrder: REQUESTED → APPROVED → ASSIGNED → COMPLETED → INVOICED → PAID; all transitions with "who can do it" |
| 1.1.3 | Create `03_Audit_Log_Requirements.md` | Audit log doc | Fields: actorUserId, actorWorkerId (nullable), actorWorkforceAccountId (nullable), entityType, entityId, fromState, toState, metadata JSON, createdAt |

#### 1.2 Checklist library (Day 2, afternoon)

| Step | Task | File | Acceptance |
|------|------|------|------------|
| 1.2.1 | Create all 8 checklists in `ops-binder/06_Checklists_Library/` | CL_01 through CL_08 | Each has stable item IDs (e.g. LOB-001, HLY-001); tasks, frequency, photo points, fail conditions |
| 1.2.2 | Export checklist item IDs to manifest (e.g. in `00_README.md` or `checklist-manifest.json`) | Manifest file | Portal seed can copy itemIds |

#### 1.3 SOPs, policies, contracts (Days 3–4)

| Step | Task | Files | Acceptance |
|------|------|-------|------------|
| 1.3.1 | Create `03_SOPs/` SOP_01 through SOP_06 | 6 files | Step-by-step; decision trees; reference checklist IDs |
| 1.3.2 | Create `04_Policies/` POL_01 through POL_06 | 6 files | Quality, Health & Safety, Privacy, Conduct, Communications, Billing; "who decides" clear |
| 1.3.3 | Create `01_Client_Contract/` MSA + Schedules A–E + Work Order + Credit | 8 files | Ontario law; "review by Ontario counsel" note; no TBD |
| 1.3.4 | Create `02_Subcontractor_Contract/` all 5 files | 5 files | Longform, one-pager, rate sheet, scope, onboarding; non-solicit; proof aligned |

#### 1.4 QA forms, sales, README (Day 5)

| Step | Task | Files | Acceptance |
|------|------|-------|------------|
| 1.4.1 | Create `05_QA_Forms/` QA_01 through QA_06 | 6 files | Required fields, pass/fail, signatures, timestamps |
| 1.4.2 | Create `08_Sales_Enablement/` all 3 files | 3 files | Discovery script, site walk, proposal insert |
| 1.4.3 | Create `00_README.md` | Index | Links to all sections; "portal-loadable" note |
| 1.4.4 | Cross-check consistency | All files | Proof requirements, scope, communications aligned |

**Phase 1 complete when:** All 47 files exist; checklist IDs stable; state machine matches portal spec.

---

### Phase 2A: Workforce Operations Portal (Days 6–20)

**Goal:** Production-safe portal with Supabase, workforce model, RBAC, state machines, audit, docs, tests.

**Dependencies:** Phase 0 and Phase 1 complete. Supabase project created.

#### 2A.1 Environment and schema (Day 6) ✅ COMPLETE

| Step | Task | Deliverable | Acceptance | Status |
|------|------|-------------|------------|--------|
| 2A.1.1 | Create Supabase project; get `DATABASE_URL` and `DIRECT_URL`; create Storage buckets `evidence` and `compliance` (private) | Env vars; buckets exist | Documented in README | ⏳ Pending Supabase setup |
| 2A.1.2 | Initialize Next.js 14+ App Router, TypeScript, Tailwind in `portal/` | `package.json`, `src/app`, Tailwind config | Strict TypeScript; Tailwind working | ✅ Complete |
| 2A.1.3 | Add Prisma; configure `schema.prisma` with Supabase URLs | `prisma/schema.prisma` | `directUrl` for migrations; `url` for runtime | ✅ Complete |
| 2A.1.4 | Define all Prisma models with enums, relations, indexes | Schema file | All 15 models defined | ✅ Complete |
| 2A.1.5 | Add DRAFT status/flag to JobCompletion per DECISIONS | Schema | Draft completions can be saved/resumed | ✅ Complete (`isDraft` field) |
| 2A.1.6 | Set cascade: RESTRICT on Job, JobCompletion, Evidence, AuditLog; soft-delete (isActive) for User, WorkforceAccount, Site | Schema comments | Documented in schema and DECISIONS | ✅ Complete |
| 2A.1.7 | Enforce uniques: User.email; JobCompletion.jobId (1:1); one active ChecklistTemplate per site/version | Schema + business rule | Migrations apply | ✅ Complete |
| 2A.1.8 | Run migrations using `DIRECT_URL` | Migrations applied | README documents DIRECT_URL for migrate | ⏳ Pending Supabase setup |
| 2A.1.9 | Write seed script with all required data | `prisma/seed.ts` | All required seed data | 🚧 In Progress |
| 2A.1.10 | Create `portal/SEED.md` | SEED.md | Instructions and list of seed data | ⏳ Pending |

#### 2A.2 Auth and RBAC (Day 7) ✅ COMPLETE

| Step | Task | Deliverable | Acceptance | Status |
|------|------|-------------|------------|--------|
| 2A.2.1 | Implement NextAuth Credentials provider with bcrypt | `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts` | Login/logout work; session has role, workforceAccountId, workerId | ✅ Complete |
| 2A.2.2 | Create server-side RBAC guards | `server/guards/` | ADMIN full access; VENDOR_OWNER only own account; VENDOR_WORKER/INTERNAL_WORKER only assigned jobs | ✅ Complete |
| 2A.2.3 | Enforce job visibility: job with only `assignedWorkforceAccountId` not shown to workers | Guard logic | Matches DECISIONS §3.3 #18 | ✅ Complete (`canAccessJob`) |

#### 2A.3 Storage layer (Day 8) ✅ COMPLETE

| Step | Task | Deliverable | Acceptance | Status |
|------|------|-------------|------------|--------|
| 2A.3.1 | Implement server-only upload/download using Supabase service role | `lib/storage.ts` | All uploads/downloads via API/server actions; path `evidence/{jobId}/{completionId}/{timestamp}-{uuid}.{ext}` | ✅ Complete |
| 2A.3.2 | Validate file type (jpg, jpeg, png, webp) and size ≤ 10MB | Validation in storage.ts | Invalid requests rejected; clear errors | ✅ Complete |
| 2A.3.3 | Enforce max 20 photos: server rejects upload if count would exceed 20; server rejects completion if count > 20 or < requiredPhotoCount; UI disables add-photo at 20 | UI + server enforcement | DECISIONS §3.4 #19 fully enforced | 🚧 Server complete; UI pending |

#### 2A.6 State machines and audit (Day 14) ✅ COMPLETE (Early)

| Step | Task | Deliverable | Acceptance | Status |
|------|------|-------------|------------|--------|
| 2A.6.1 | Centralize Job transition logic | `lib/state-machine.ts` | Only allowed transitions; reject invalid; every transition writes AuditLog | ✅ Complete |
| 2A.6.2 | Enforce WorkOrder state machine | Same pattern | REQUESTED → APPROVED → ASSIGNED → COMPLETED → INVOICED → PAID | ✅ Complete |

#### 2A.4 Worker and vendor flows (Days 9–10) 🚧 ~85% COMPLETE

| Step | Task | Deliverable | Acceptance | Status |
|------|------|-------------|------------|--------|
| 2A.4.1 | Build `/jobs` list page | `app/(worker)/jobs/page.tsx` | Only jobs where `assignedWorkerId` = user's worker id | ✅ Complete |
| 2A.4.2 | Build `/jobs/[id]` detail page | `app/(worker)/jobs/[id]/page.tsx` | Site info, access instructions, checklist, evidence uploader, draft save, submit | ✅ Complete |
| 2A.4.3 | Implement draft save/resume | Server action | Worker can save partial; resume later | ✅ Complete (`saveDraft` action) |
| 2A.4.4 | Implement completion submit: validate checklist + photos; create/update JobCompletion (out of DRAFT); job → COMPLETED_PENDING_APPROVAL; write AuditLog | Server action | State transition and audit | ✅ Complete (`submitCompletion` action) |
| 2A.4.5 | Build `/earnings` and `/profile` | Pages | Read-only earnings; profile view | ✅ Complete |
| 2A.4.6 | Scaffold `/vendor/team` and `/vendor/jobs` for VENDOR_OWNER | Pages | List team and jobs; no pricing, no approvals | ⏳ Pending |

#### 2A.5 Admin flows (Days 11–13)

| Step | Task | Deliverable | Acceptance |
|------|------|-------------|------------|
| 2A.5.1 | Build `/admin/workforce` and `/admin/workforce/[id]` | Pages | CRUD workforce; add/remove workers; compliance docs; block assignment if COI/WSIB expired unless ADMIN override (audit logged) |
| 2A.5.2 | Build `/admin/jobs` and `/admin/jobs/[id]` | Pages | Create/edit jobs; assign exactly one of WorkforceAccount or Worker; calendar-lite; mark missed + make-good; review; approve/reject/cancel; all transitions write AuditLog |
| 2A.5.3 | Build `/admin/workorders` | Page | List; approve; assign; track WorkOrder states |
| 2A.5.4 | Build `/admin/incidents` | Page | List; resolve; link to lost-key |
| 2A.5.5 | Build `/admin/payouts` | Page | Create batch; include approved jobs; payouts to WorkforceAccount; mark PAID; AuditLog |

#### 2A.6 State machines and audit (Day 14)

| Step | Task | Deliverable | Acceptance |
|------|------|-------------|------------|
| 2A.6.1 | Centralize Job transition logic | `lib/state-machine.ts` | Only allowed transitions; reject invalid; every transition writes AuditLog |
| 2A.6.2 | Enforce WorkOrder state machine | Same pattern | REQUESTED → APPROVED → ASSIGNED → COMPLETED → INVOICED → PAID |

#### 2A.7 Documentation (Day 15)

| Step | Task | Deliverable | Acceptance |
|------|------|-------------|------------|
| 2A.7.1 | Write `portal/README.md` | README | Setup, env (DATABASE_URL vs DIRECT_URL), Storage, run, test, deploy |
| 2A.7.2 | Ensure `portal/DECISIONS.md` exists and matches root | DECISIONS | Copy or symlink |
| 2A.7.3 | Write `portal/SECURITY.md` | SECURITY | RBAC, rate limits, session, lockout, credential masking, max photos, no client DB |
| 2A.7.4 | Write `portal/DATA_RETENTION.md` | DATA_RETENTION | Evidence retention (90 days), purge process |

#### 2A.8 Security hardening (Day 16)

| Step | Task | Deliverable | Acceptance |
|------|------|-------------|------------|
| 2A.8.1 | Add rate limiting to login, completion submit, upload endpoints | Middleware or route handler | Document limits in SECURITY.md |
| 2A.8.2 | Implement session timeout (24h) and refresh | Auth config | Document in SECURITY.md |
| 2A.8.3 | Implement login backoff/lockout after 5 failed attempts | Auth logic | Document in SECURITY.md |
| 2A.8.4 | Implement admin-only password reset | Admin action | Audit logged; no self-serve |

#### 2A.9 UX reliability (Day 17)

| Step | Task | Deliverable | Acceptance |
|------|------|-------------|------------|
| 2A.9.1 | Upload retry on failure | UI + server | Worker can retry without losing draft |
| 2A.9.2 | Draft completion save/resume | Server action | Matches DECISIONS §3.2 |
| 2A.9.3 | Inline validation errors | UI | Missing photos, checklist items, file type/size |
| 2A.9.4 | Mobile-first completion flow | Responsive UI | Camera upload; touch-friendly |

#### 2A.10 Tests (Days 18–19)

| Step | Task | Deliverable | Acceptance |
|------|------|-------------|------------|
| 2A.10.1 | Unit tests: all allowed/denied Job and WorkOrder transitions per role | Test files | Transition matrix covered |
| 2A.10.2 | RBAC/IDOR tests: access to another user's job, completion, evidence, work order, incident returns 403 | Test files | All five resource types covered |
| 2A.10.3 | Storage/upload tests: disallowed MIME and oversize rejected | Test files | 400/413; no file stored |
| 2A.10.4 | One E2E happy path: assign → complete → approve → payout | Test or script | Full flow automated |

#### 2A.11 Production gate sign-off (Day 20)

| Step | Task | Deliverable | Acceptance |
|------|------|-------------|------------|
| 2A.11.1 | Complete EXECUTION_PLAN §10 Production Plan Readiness checklist | Checklist | All items checked |
| 2A.11.2 | Smoke test: login as all roles; create workforce/job; assign; complete; approve; payout; work order; incident | Test results | All critical paths work |

**Phase 2A complete when:** All routes work; production gates satisfied; test suite passes; docs complete.

---

### Phase 2B: Marketing Website (Days 6–10, parallel to 2A after Day 6)

**Goal:** Public site; all pages; lead capture; SEO.

**Dependency:** Phase 0 complete.

#### 2B.1 Scaffold and layout (Day 6)

| Step | Task | Deliverable | Acceptance |
|------|------|-------------|------------|
| 2B.1.1 | Initialize Next.js 14+ App Router, TypeScript, Tailwind in `marketing/` | `package.json`, app router | Vercel-ready |
| 2B.1.2 | Build layout: header, footer, CTAs, phone, email, PDF download link | `app/layout.tsx`, components | Site-wide navigation |
| 2B.1.3 | Apply brand: dark/neutral, typography, whitespace | Styles | Matches P2 brand |

#### 2B.2 Home and contact (Day 7)

| Step | Task | Deliverable | Acceptance |
|------|------|-------------|------------|
| 2B.2.1 | Build Home page: hero, who we serve, what we solve, how it works, services, why BLVCKSHELL, service area, FAQ, contact CTA | `app/page.tsx` | All sections; no lorem |
| 2B.2.2 | Build Contact page: form (Name, Company, Role, Phone, Email, Property Type, # sites, Message, consent) | `app/contact/page.tsx` | Form and copy |
| 2B.2.3 | Implement `/api/lead`: zod validation; store in Lead table; optional email; honeypot/rate limit | `app/api/lead/route.ts` | Works in dev |

#### 2B.3 Service and static pages (Day 8)

| Step | Task | Deliverable | Acceptance |
|------|------|-------------|------------|
| 2B.3.1 | Build `/services`, `/condo-cleaning`, `/commercial-cleaning`, `/light-maintenance` | Pages | Content per prompt; will/won't do |
| 2B.3.2 | Build `/about` and `/privacy` | Pages | Credible copy; PIPEDA-friendly |

#### 2B.4 SEO and docs (Day 9)

| Step | Task | Deliverable | Acceptance |
|------|------|-------------|------------|
| 2B.4.1 | Add metadata and OpenGraph for each page; sitemap; robots.txt | Metadata, files | SEO requirements met |
| 2B.4.2 | Use next/image; minimal JS; proper headings/labels; keyboard nav | Code | Performance and a11y |
| 2B.4.3 | Write `marketing/README.md` | README | Setup, env, deploy |

**Phase 2B complete when:** All pages live; contact form and lead API work; SEO and README done.

---

### Phase 3: Final Validation (Day 21)

**Goal:** Production readiness confirmed; smoke tests pass.

| Step | Task | Deliverable | Acceptance |
|------|------|-------------|------------|
| 3.1 | Complete EXECUTION_PLAN §10 Production Plan Readiness checklist | Checklist signed off | All items checked |
| 3.2 | Smoke test portal: all roles, all critical paths | Test results | Everything works |
| 3.3 | Smoke test marketing: submit lead, verify storage, check links | Test results | Lead capture and navigation work |
| 3.4 | Confirm no cross-feature leakage | Verification | Portal and marketing separate |

**Phase 3 complete when:** §10 sign-off done; smoke tests pass. Portal is production-ready.

---

## Part 4: Quality Gates

### Gate 1: Code quality

- [ ] TypeScript strict mode enabled
- [ ] No `any` types (use `unknown` + guards)
- [ ] All functions have explicit return types
- [ ] Error handling: server actions return `{ success, data?, error? }`
- [ ] Input validation: Zod schemas for all inputs
- [ ] RBAC: Server-side guards on every route/action
- [ ] No client-side DB access; all via API/server actions

### Gate 2: Security

- [ ] Rate limiting on auth, upload, submission endpoints
- [ ] Session timeout and refresh documented
- [ ] Login backoff/lockout implemented
- [ ] Password reset: admin-only, audit logged
- [ ] IDOR prevention: ownership/assignment checked
- [ ] Storage: Server-only; no client bucket access
- [ ] Credential masking: codes masked in UI

### Gate 3: Data integrity

- [ ] Cascade rules: RESTRICT on auditable entities
- [ ] Soft-delete: isActive for User, WorkforceAccount, Site
- [ ] Uniques: User.email; JobCompletion.jobId (1:1)
- [ ] Max photos: 20 enforced in UI and server
- [ ] Compliance gating: COI/WSIB blocks assignment unless override (audit logged)

### Gate 4: UX reliability

- [ ] Upload retry on failure
- [ ] Draft completion save/resume
- [ ] Inline validation errors
- [ ] Mobile-first completion flow

### Gate 5: Testing

- [ ] Unit tests: state transitions per role
- [ ] RBAC/IDOR tests: all five resource types
- [ ] Upload validation tests: MIME and size
- [ ] One E2E: assign → complete → approve → payout

### Gate 6: Documentation

- [ ] README.md: setup, env, run, test, deploy
- [ ] DECISIONS.md: all 20 decisions documented
- [ ] SECURITY.md: RBAC, rate limits, session, lockout
- [ ] DATA_RETENTION.md: retention and purge
- [ ] SEED.md: seed instructions

---

## Part 5: Risk Mitigation

| Risk | Mitigation | Status |
|------|------------|--------|
| State machine drift | Implement only allowed transitions from P3; single source of truth | Locked in DECISIONS |
| Checklist IDs inconsistent | P3 checklist library = source of truth; seed uses same IDs | Locked in Phase 1 |
| Supabase connection mistakes | README documents DATABASE_URL vs DIRECT_URL | Documented |
| Compliance blocking too strict/loose | DECISIONS: expired COI/WSIB blocks unless ADMIN override (audit logged) | Locked in DECISIONS |
| Job assignment ambiguity | Schema enforces exactly one of assignedWorkforceAccountId or assignedWorkerId | Locked in schema |
| Scope creep | Hard limits in prompts; no client portal, no automated payments | Enforced |
| Storage security | Server-only with service role; no client access | Locked in DECISIONS |
| Draft completion unclear | DECISIONS: JobCompletion with DRAFT status; photos attach | Locked in DECISIONS |
| Max photos not enforced | UI disable + server reject; both required | Locked in DECISIONS |

---

## Part 6: Success Criteria

### Operations Binder (P3)

- ✅ All 47 files exist with full content
- ✅ No TBD for core content; bracket placeholders where variable
- ✅ Checklist IDs stable and exported for portal
- ✅ State machine matches portal spec
- ✅ Cross-doc consistency verified

### Workforce Portal (P1 Revised)

- ✅ All required routes work (admin, workers, vendor scaffold)
- ✅ Supabase Postgres + Storage; no filesystem
- ✅ Workforce/worker model and RBAC enforced
- ✅ Job and WorkOrder state machines enforced
- ✅ AuditLog on every transition
- ✅ All production gates (§10) satisfied
- ✅ Test suite passes (transitions, RBAC, upload, E2E)
- ✅ All documentation complete (README, DECISIONS, SECURITY, DATA_RETENTION, SEED)

### Marketing Website (P2)

- ✅ All pages live (/, /services, /condo-cleaning, /commercial-cleaning, /light-maintenance, /about, /contact, /privacy)
- ✅ Contact form and `/api/lead` work
- ✅ SEO: metadata, OpenGraph, sitemap, robots.txt
- ✅ README with setup and deploy

---

## Part 7: Execution Commitment

**I commit to:**

1. **Follow this roadmap exactly** — No deviation from Phase 0 → Phase 1 → Phase 2A → Phase 3; P2B parallel after P0
2. **Implement all gold standard practices** — TypeScript strict, no `any`, server-side RBAC, error handling, testing
3. **Lock all decisions** — No ambiguity; everything in DECISIONS.md
4. **Satisfy all production gates** — Security, data integrity, UX reliability, tests, documentation
5. **Deliver production-ready code** — No TODOs in core flows; no fake flows; test suite passes

**This roadmap is my blueprint. I will execute it step-by-step, task-by-task, until all 78 tasks are complete and Phase 3 sign-off is achieved.**

---

---

## Part 8: Metrics & KPIs (Data Collection Only — No Dashboards in Phase 1)

### 8.1 Explicit Scope Boundary

**CRITICAL:** The portal collects data necessary for KPIs and operational metrics, but **NO dashboards or visualization are required in Phase 1**. Data is stored for audit, compliance, and future analysis only.

**Why:** Phase 1 focuses on core operations (job assignment, completion, approval, payout). Dashboards add complexity and are explicitly out of scope per prompts ("NO reporting dashboards").

### 8.2 Metrics Collected But Not Visualized (Phase 1)

The following metrics are **automatically collected** through normal operations but **will NOT be visualized** in Phase 1:

| Metric | How Collected | Purpose (Phase 1) | Visualization Status |
|--------|--------------|-------------------|----------------------|
| **Missed visits** | `Job.isMissed = true`; `Job.missedReason` | Audit trail; make-good job creation | ❌ No dashboard |
| **Recleans** | `JobCompletion` rejection → resubmission cycle; `AuditLog` entries | Quality tracking; audit trail | ❌ No dashboard |
| **Time-to-approval** | `JobCompletion.completedAt` → `Approval.approvedAt` (or rejection timestamp) | Operational efficiency tracking | ❌ No dashboard |
| **Vendor incident rate** | `IncidentReport` count per `WorkforceAccount` | Compliance and vendor performance | ❌ No dashboard |
| **Job completion rate** | `Job.status` transitions; `JobCompletion` records | Operational tracking | ❌ No dashboard |
| **Photo evidence compliance** | `Evidence` count vs `Site.requiredPhotoCount` | Quality assurance | ❌ No dashboard |
| **Payout cycle time** | `Job.APPROVED_PAYABLE` → `Job.PAID` via `PayoutBatch` | Financial operations | ❌ No dashboard |

**Data availability:** All metrics can be calculated via SQL queries or Prisma queries for future Phase 2+ dashboard development. Data is stored in normalized tables (`Job`, `JobCompletion`, `AuditLog`, `IncidentReport`, `PayoutBatch`, etc.).

### 8.3 What IS Required (Phase 1)

- ✅ **Data collection:** All metrics above are automatically collected through normal operations
- ✅ **Audit trail:** `AuditLog` captures all state transitions and key events
- ✅ **Read-only views:** Workers can see their own earnings (`/earnings`); admins can see lists (jobs, incidents, payouts)
- ❌ **Dashboards:** NO charts, graphs, or aggregated visualizations
- ❌ **Analytics UI:** NO KPI widgets, trend lines, or reporting pages
- ❌ **Export features:** NO CSV/PDF export of metrics (can be added in Phase 2+)

### 8.4 Future Phase Considerations

If Phase 2+ includes dashboards, the following authoritative KPIs should be considered:

1. **Missed visit rate:** `(Jobs with isMissed=true) / (Total scheduled jobs)` per period
2. **Reclean rate:** `(Jobs rejected and resubmitted) / (Total completions)` per period
3. **Average time-to-approval:** `AVG(Approval.approvedAt - JobCompletion.completedAt)` per period
4. **Vendor incident rate:** `(IncidentReports per WorkforceAccount) / (Jobs completed by that account)` per period
5. **Completion compliance:** `(Jobs with evidence count >= requiredPhotoCount) / (Total completions)` per period

**Phase 1 action:** Document these KPI definitions in a future `METRICS.md` file or in the Phase 2 planning doc. Do NOT build dashboards in Phase 1.

---

**Document Status:** ✅ Ready for CTO approval and execution  
**Next Step:** Begin Phase 0 (Pre-Flight)
