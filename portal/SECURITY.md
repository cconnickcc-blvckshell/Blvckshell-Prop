# BLVCKSHELL Portal — Security

**Purpose:** Security policies, RBAC, and operational controls for the Workforce Operations Portal. See DECISIONS.md for locked options.

---

## 1. Authentication

- **Method:** NextAuth.js with Credentials provider; bcrypt for password hashing (salt rounds ≥ 10).
- **Session:** Server-side session; secure cookies. Session timeout and refresh strategy: see §6 (when implemented).
- **Passwords:** Never logged or returned in API responses; hashes only in DB.
- **Password reset:** No self-serve in MVP. Admin-only reset; action must be audit logged (DECISIONS §3.5).

---

## 2. Role-Based Access Control (RBAC)

All sensitive routes and server actions enforce role checks. **Never trust the client.**

| Role | Access |
|------|--------|
| **ADMIN** | Full portal: users, sites, jobs, work orders, payouts, compliance, audit log. Can assign/reassign jobs, approve/reject completions, create payout batches, mark paid. |
| **VENDOR_OWNER** | Own workforce account: team list, vendor jobs list. No job assignment; view only for jobs assigned to their account. |
| **VENDOR_WORKER** | Own assigned jobs only: list, complete (draft/submit), view work orders. |
| **INTERNAL_WORKER** | Same as VENDOR_WORKER for internal workforce account. |

- **Guards:** `requireAdmin()`, `requireVendorOwner()`, `requireWorker()` in `server/guards/rbac.ts`. Used on every admin/vendor/worker route and in server actions.
- **IDOR prevention:** Before returning or mutating a resource (job, work order, completion), the server checks that the current user is allowed (e.g. `canAccessJob(user, jobId)`). Workers see only jobs where `assignedWorkerId` equals their worker record.

---

## 3. Database and Supabase

- **No client-side DB access.** The browser never receives `DATABASE_URL` or direct Postgres credentials. All data access is via server routes and server actions using a single Prisma client (server-only).
- **Supabase:** Runtime uses pooled `DATABASE_URL` (serverless-safe). Migrations use `DIRECT_URL`. Storage is accessed only from the server with the service role; buckets are not public. No RLS on Storage for MVP; all access is mediated by our backend (DECISIONS §3.1).

---

## 4. Input Validation and Uploads

- **Validation:** Zod schemas for all user-supplied inputs (forms, API bodies). Fail fast with clear messages.
- **File uploads:** Max 10 MB per file; types: jpg, jpeg, png, webp (DECISIONS #8). Stored in Supabase Storage via server-only code.
- **Max photos per job:** Cap = 20 per job (evidence for that job’s completion). Enforced in UI (disable add when at 20) and on the server (reject upload/submit if over cap). Value is configurable in one place; see DECISIONS §3.4.

---

## 5. Access Credential Masking

- **Policy:** Access codes (keys, fobs, codes) are masked in the UI (e.g. last 4 characters only). Full value is available only to authorized roles (e.g. assigned worker for that site/job, ADMIN). Documented here and in DECISIONS #13.

---

## 6. Rate Limiting, Session, and Lockout (Planned)

*The following are required for production readiness; document limits and policy here once implemented.*

- **Rate limiting:** Apply to login, job completion submit, and evidence upload endpoints (per-IP or per-user). Limits to be defined and documented in this section.
- **Session timeout:** e.g. 24h max session; refresh on activity. To be configured in auth and documented here.
- **Login backoff / lockout:** After N failed attempts (e.g. 5), temporary backoff or lockout. Policy to be documented here.

---

## 7. Audit and Compliance

- **Audit log:** All job status transitions, rejections, cancellations, and overrides (e.g. compliance override) write to `AuditLog` with actor, entity, from/to state, and optional metadata.
- **Compliance gating:** Expired or missing COI/WSIB blocks new job assignment unless ADMIN overrides with an audit log entry (reason, overrideAt). DECISIONS #12.

---

*Last updated: February 2026. Align with DECISIONS.md and ROADMAP.md.*
