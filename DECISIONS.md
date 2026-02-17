# BLVCKSHELL Portal — Locked Decisions

**Purpose:** Single source of truth for product and technical decisions. No implementation should contradict these. See EXECUTION_PLAN.md for production gates and build order.

**Portal authority:** Prompt 1 Revised (Workforce Operations Portal). Marketing = P2; Ops Binder = P3.

---

## 1. Core decisions (§3.1)

| # | Decision | Option | Rationale |
|---|----------|--------|-----------|
| 1 | Auth (Portal) | NextAuth Credentials or custom JWT; bcrypt required | Secure, standard; no magic-link complexity for MVP. |
| 2 | Database | Supabase Postgres: pooled `DATABASE_URL` for runtime, `DIRECT_URL` for Prisma migrations | Pooler for serverless; direct for migrations. Document in README. |
| 3 | File storage (Portal) | Supabase Storage only; no local filesystem | Vercel/serverless-safe; no filesystem. |
| 4 | Rejection flow | COMPLETED_PENDING_APPROVAL → SCHEDULED; ADMIN only; rejection reason stored | Sub can resubmit; audit trail for rejections. |
| 5 | Cancel Job | ADMIN only; from SCHEDULED or COMPLETED_PENDING_APPROVAL | Single authority; no accidental cancels. |
| 6 | Job assignment | Exactly one of assignedWorkforceAccountId OR assignedWorkerId | Schema and UI enforce; no ambiguity. |
| 7 | Checklist JSON | items: `{ itemId, label, required? }`; results: `Record<itemId, { result: PASS\|FAIL\|NA, note? }>` | Stable IDs; P3 alignment. |
| 8 | Upload limits | 10MB max; jpg, jpeg, png, webp | Balance quality vs storage and abuse. |
| 9 | Lead capture (Marketing) | Store in Postgres Lead table + optional email to admin | One source of truth; optional notification. |
| 10 | Node / Next | e.g. Node 20 LTS; Next.js 14.x | Stable, Vercel-supported. |

---

## 2. Production decision locks (§3.2)

| # | Decision | Option / rule | Rationale |
|---|----------|----------------|-----------|
| 11 | Evidence retention | 90 days default; purge process in DATA_RETENTION.md | Storage and compliance; explicit process. |
| 12 | Compliance gating | Expired/missing COI/WSIB blocks new job assignment; ADMIN override only with audit log (metadata: reason, overrideAt) | Audit trail for every override. |
| 13 | Access credential masking | Codes masked in UI (e.g. last 4); full value only to authorized roles; document in SECURITY.md | Reduce exposure of keys/codes. |
| 14 | Max photos per job | Cap per job (e.g. 20); document value here and enforce in UI + server | Cost and abuse control; see §3.3 #19 for enforcement. |
| 15 | Vendor owner job reassignment | Phase 1: **No** — only ADMIN assigns/reassigns jobs | Simplest; can relax later with audit. |

---

## 3. Final implementation locks (§3.3)

Must be implemented as specified. Do not invent alternatives.

### 3.1 Supabase Storage security (#16)

**Locked option:** **Option A (MVP) — Server-only with service role.**

- All uploads and downloads go through **server routes** (API or server actions).
- Server uses Supabase **service role** to read/write buckets.
- **No** client direct bucket access; buckets are **not** public.
- No RLS on Storage for MVP; all access mediated by our backend.

*Alternative Option B (signed upload + download URLs with strict path checks) is acceptable only if explicitly chosen and documented here. Default is A.*

### 3.2 Draft completion data model (#17)

**Locked option:** **JobCompletion with status DRAFT.**

- Allow `JobCompletion` to exist with a status or flag indicating **DRAFT** until the worker submits (then it becomes the single completion record and job moves to COMPLETED_PENDING_APPROVAL).
- **Photos may attach to drafts;** store in same path pattern: `evidence/{jobId}/{completionId}/{timestamp}-{uuid}.{ext}` where completionId is the draft/final completion row.
- Worker can save partial progress (checklist answers + any photos already uploaded); can retry failed uploads and resume later.
- On submit: validate required checklist + requiredPhotoCount + photo cap; then transition out of DRAFT and job → COMPLETED_PENDING_APPROVAL.

*Alternative: separate `JobCompletionDraft` table keyed by jobId + workerId is acceptable if documented here; same behavior (save/resume, photos on draft).*

### 3.3 Workforce-assigned job visibility (#18)

**Locked option:** **Phase 1 — Job visible to workers only when assignedWorkerId is set.**

- When a job has **only** `assignedWorkforceAccountId` (no `assignedWorkerId`), the job is **not** shown in any worker’s `/jobs` list.
- Admin must set `assignedWorkerId` (assign to a specific worker) for the job to appear in that worker’s list.
- Prevents two workers from the same account both showing up; least chaos for Phase 1.
- *Future: optional “claim” flow (e.g. claimedByWorkerId) can be added later with audit.*

### 3.4 Max photos per job — enforcement (#19)

**Locked option:** **Cap = 20 photos per job (evidence for that job’s completion).**

- **UI:** Disable “add photo” / hide upload control when count already at 20; show clear message.
- **Server:** Reject upload request if adding one more would exceed 20 for that job.
- **Server:** Reject completion submit if total evidence count > 20 or < site's requiredPhotoCount.
- Value 20 is configurable in one place (env or constant); document in this file and in SECURITY.md if needed.

### 3.5 Password reset (#20)

**Locked option:** **No self-serve reset in MVP. Admin-initiated reset only, audit logged.**

- No “forgot password” or email-based self-serve flow for MVP.
- Admin can set a new temporary password for a user (or trigger a one-time reset link if we add it later); action is **audit logged** (actor, target user, timestamp).
- Boring and safe for first production deployment.

---

## 4. Summary checklist for implementation

- [ ] Auth: NextAuth or JWT + bcrypt; session timeout and lockout per SECURITY.md.
- [ ] DB: DATABASE_URL (pooled) runtime; DIRECT_URL migrations.
- [ ] Storage: Server-only, service role; no client bucket access.
- [ ] Draft completion: DRAFT status (or JobCompletionDraft table); photos attach to drafts; save/resume.
- [ ] Job visibility: Workers see job only when assignedWorkerId set.
- [ ] Max photos: 20 per job; enforce in UI and server.
- [ ] Password reset: Admin only; audit logged.
- [ ] Compliance: Block assignment when COI/WSIB expired unless ADMIN override (audit log).
- [ ] Deletion: RESTRICT + soft-deactivate for auditable entities; see EXECUTION_PLAN §5.2 step 9.
- [ ] All state transitions and overrides write to AuditLog.

---

*Last updated to align with EXECUTION_PLAN.md Phase 0 (§3.1, §3.2, §3.3) and final implementation locks.*
