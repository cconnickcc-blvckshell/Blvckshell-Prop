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
- `/api/auth/callback/:path*` (POST only — actual login attempts)  
- `/api/lead` (POST only)  
- `/api/evidence/upload`  

**Behavior:**  
- For these paths, reads client IP via `getClientIP(request)`, then `checkRateLimit(ip, limit, windowMs)`.  
- Auth POST (callback): limit 10, window 15 minutes.  
- Lead and evidence upload: limit 30, window 15 minutes.  
- If not allowed:  
  - Auth POST: redirects to `/login?error=RateLimit`  
  - Others: returns 429 JSON `{ error: "Too many requests. Please wait a few minutes and try again." }` with `Retry-After` header.  
- Otherwise: `NextResponse.next()`.

**Critical:** NextAuth internal GET routes (`/api/auth/providers`, `/api/auth/csrf`, `/api/auth/session`, `/api/auth/error`) are **not** rate-limited — these are fetched on every page load.

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
| Rate limit | Middleware on /api/auth/callback/* (POST, 10/15min), /api/lead (POST, 30/15min), /api/evidence/upload (30/15min). |

---

## Preconditions (Pre-flight Checks)

**File:** `src/lib/preconditions.ts`  
**Purpose:** Structured pre-flight checks before critical transitions. Returns typed failures the UI can render as "why is this blocked?"

### Interface

```typescript
interface PreconditionResult {
  passed: boolean;
  failures: PreconditionFailure[];
}

interface PreconditionFailure {
  code: string;   // Machine-readable code (e.g. "NO_SUBMITTED_CHECKLIST")
  message: string; // Human-readable message
}
```

### Functions

| Function | Checks | Failure codes |
|----------|--------|---------------|
| checkJobApprovalPreconditions(jobId) | Status is COMPLETED_PENDING_APPROVAL; ≥1 submitted checklist run; billable/payout amounts set; evidence count meets site.requiredPhotoCount | NOT_FOUND, WRONG_STATUS, NO_SUBMITTED_CHECKLIST, NO_BILLABLE_AMOUNT, INSUFFICIENT_EVIDENCE |
| checkInvoiceSendPreconditions(invoiceId) | Status is Draft; ≥1 line item; no system placeholder lines | NOT_FOUND, WRONG_STATUS, NO_LINE_ITEMS, HAS_PLACEHOLDERS |
| checkPayoutFinalizePreconditions(batchId) | Status not PAID; ≥1 payout line; no compliance-suspended accounts; no inactive accounts | NOT_FOUND, ALREADY_PAID, NO_LINES, COMPLIANCE_SUSPENDED, INACTIVE_ACCOUNTS |

**Usage:** Call in UI before showing "Approve" / "Send" / "Finalize" buttons to surface blocking reasons to admin.

---

## Compliance Guards

**File:** `src/server/guards/compliance.ts`  
**Purpose:** Workforce compliance checks. Blocks job assignment and payout for non-compliant accounts.

### Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| checkWorkforceCompliance(workforceAccountId) | Full compliance check for a workforce account | `ComplianceCheckResult` |
| canAssignJob({ workforceAccountId?, workerId? }) | Pre-flight for job assignment | `ComplianceCheckResult` |

### ComplianceCheckResult

```typescript
interface ComplianceCheckResult {
  compliant: boolean;
  issues: ComplianceIssue[];
}

interface ComplianceIssue {
  code: string;
  message: string;
  severity: "BLOCKING" | "WARNING";
}
```

### Compliance Rules

| Check | Applies to | Severity | Code |
|-------|-----------|----------|------|
| Account not found | All | BLOCKING | NOT_FOUND |
| Account inactive | All | BLOCKING | INACTIVE |
| complianceSuspended = true | All | BLOCKING | SUSPENDED |
| Missing COI | VENDOR | BLOCKING | MISSING_COI |
| Expired COI | VENDOR | BLOCKING | EXPIRED_COI |
| Missing WSIB | VENDOR | BLOCKING | MISSING_WSIB |
| Expired WSIB | VENDOR | BLOCKING | EXPIRED_WSIB |
| Missing HST number | VENDOR | WARNING | MISSING_HST |

**Usage:**  
- Call `canAssignJob()` before assigning a job to a worker/account.  
- Call `checkWorkforceCompliance()` in payout batch creation to filter out non-compliant accounts.  
- The `complianceSuspended` flag can be set manually by admin or automatically by a background compliance check.

---

*End of Policies and Guards.*
