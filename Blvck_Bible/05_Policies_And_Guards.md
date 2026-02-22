# Blvck Bible — Policies and Guards

**Purpose:** In-depth record of RBAC, session shape, middleware, and rate limiting.  
**Source:** `portal/src/server/guards/rbac.ts`, `portal/src/middleware.ts`, `portal/src/lib/rate-limit.ts`, `portal/src/lib/auth.ts`.  
**Update:** When adding roles or guards.

---

## User Roles

| Role | Description | Typical use |
|------|-------------|-------------|
| ADMIN | Full admin portal access | Operations, clients, sites, jobs, invoices, payouts, workforce, work orders, incidents, quotes, finance, audit, docs. |
| FOUNDER | Same as ADMIN plus founder-only actions | Billing rate override, revenue floor override, snapshot recompute (pricing/finance). |
| CLIENT | Read-only access to own organization’s data | Client portal: invoices, jobs, sites for their clientOrganizationId. |
| VENDOR_OWNER | Access to own workforce account’s jobs and payouts | Vendor portal: jobs assigned to their workforce account, earnings, batch statement. |
| VENDOR_WORKER | Access to jobs assigned to self | Worker portal: assigned jobs, completion, evidence, earnings. |
| INTERNAL_WORKER | Same as VENDOR_WORKER | Internal workers (workforce account type INTERNAL). |

**Persistence:** `User.role` in DB. Session populated via NextAuth callbacks (see auth.ts) with role, workforceAccountId, workerId, clientOrganizationId.

---

## Session User Shape

**Type:** `SessionUser` (rbac.ts).  
**Used by:** All guards and canAccess* functions.

| Field | Type | Purpose |
|-------|------|---------|
| id | string | User.id |
| name | string | User.name |
| role | UserRole | User.role |
| workforceAccountId | string \| undefined | User.workforceAccountId (VENDOR_OWNER, workers) |
| workerId | string \| undefined | Worker.id when user has linked Worker (for canAccessJob worker check) |
| clientOrganizationId | string \| undefined | User.clientOrganizationId (CLIENT) |

---

## Guard Functions

**File:** `src/server/guards/rbac.ts`.  
**Usage:** Call at start of server action or API route that requires auth or role.

| Function | Throws if | Returns |
|----------|-----------|---------|
| getCurrentUser() | — | SessionUser \| null |
| requireAuth() | No session | SessionUser |
| requireAdmin() | Not authenticated or role not ADMIN/FOUNDER | SessionUser |
| requireFounder() | Not authenticated or role not FOUNDER | SessionUser |
| isFounder(user) | — | boolean |
| requireClient() | Not authenticated or role not CLIENT or no clientOrganizationId | SessionUser |
| requireVendorOwner() | Not authenticated or role not VENDOR_OWNER | SessionUser |
| requireWorker() | Not authenticated or role not VENDOR_WORKER/INTERNAL_WORKER/VENDOR_OWNER | SessionUser |
| canAccessJob(user, jobId) | — | Promise<boolean> |
| canAccessInvoice(user, invoiceId) | — | Promise<boolean> |
| canAccessWorkforceAccount(user, workforceAccountId) | — | Promise<boolean> |

### Access Rules (Entity-Level)

- **Job:**  
  - ADMIN: all jobs.  
  - CLIENT: jobs where job.site.clientOrganizationId === user.clientOrganizationId.  
  - VENDOR_OWNER: jobs where job.assignedWorkforceAccountId === user.workforceAccountId.  
  - VENDOR_WORKER / INTERNAL_WORKER: jobs where job.assignedWorkerId === user.workerId (job visible only when assigned to that worker).  
- **Invoice:**  
  - ADMIN: all.  
  - CLIENT: invoice.clientId === user.clientOrganizationId.  
- **WorkforceAccount:**  
  - ADMIN: all.  
  - VENDOR_OWNER: user.workforceAccountId === workforceAccountId.  

**Implementation:** Each canAccess* loads the entity (or minimal fields) and checks the condition above.

---

## Middleware

**File:** `src/middleware.ts`.  
**Purpose:** Rate limiting only. Route protection is **not** in middleware (to avoid Edge getToken/session issues).

**Matcher:**  
- `/api/auth/:path*`  
- `/api/lead`  
- `/api/evidence/upload`  

**Behavior:**  
- For these paths, reads client IP via `getClientIP(request)`, then `checkRateLimit(ip, limit, windowMs)`.  
- Auth: limit 5, window 15 minutes.  
- Lead and evidence upload: limit 10, window 15 minutes.  
- If not allowed: returns 429 JSON `{ error: "Too many requests. Please try again later." }`.  
- Otherwise: `NextResponse.next()`.

---

## Rate Limit Implementation

**File:** `src/lib/rate-limit.ts`.  
**Functions:**  
- `checkRateLimit(ip, limit, windowMs): { allowed: boolean }` — in-memory store (per process); no distributed rate limit.  
- `getClientIP(request): string` — from headers (x-forwarded-for, x-real-ip, etc.) or fallback.

**Note:** For multi-instance deployment, replace with Redis or similar if global rate limiting is required.

---

## Auth Configuration

**File:** `src/lib/auth.ts`.  
**Provider:** NextAuth with Credentials provider.  
**Session:** Strategy typically JWT or database; session callbacks add role, workforceAccountId, workerId, clientOrganizationId to session.user so that SessionUser can be built in rbac.ts from `auth()`.

**Route:** `src/app/api/auth/[...nextauth]/route.ts` exports GET/POST handlers.

---

## Policy Summary Table

| Area | Policy |
|------|--------|
| Admin routes | requireAdmin() (ADMIN or FOUNDER). |
| Founder-only actions | requireFounder() (e.g. billing override, snapshot recompute). |
| Client routes | requireClient(); then filter all data by clientOrganizationId. |
| Worker routes | requireWorker(); job access via canAccessJob (assignedWorkerId for workers). |
| Vendor owner routes | requireVendorOwner(); job/payout access via canAccessWorkforceAccount and assignment. |
| API routes | Call appropriate guard or canAccess* before performing action. |
| Rate limit | Middleware on /api/auth/*, /api/lead, /api/evidence/upload. |

---

*End of Policies and Guards.*
