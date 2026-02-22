# Blvck Bible — APIs

**Purpose:** In-depth record of every HTTP API route.  
**Location:** `portal/src/app/api/**/route.ts`  
**Update:** When adding or changing API routes.

---

## Convention

- All routes are Next.js App Router **Route Handlers** (export GET, POST, etc. from `route.ts`).
- Auth is **not** enforced in middleware (to avoid Edge getToken issues); routes that need auth must call `requireAuth()` or role-specific guards from server code.
- Rate limiting is applied in **middleware** only for paths listed in config (auth, lead, evidence upload).
- Response shape: JSON for REST; PDF/stream for invoice PDF.

---

## API Catalog

### GET/POST `/api/auth/[...nextauth]`

| Property | Value |
|----------|--------|
| **Purpose** | NextAuth.js handlers (sign-in, sign-out, session, callbacks). |
| **Auth** | N/A (entry point for auth). |
| **Rate limit** | 5 requests per 15 minutes per IP (middleware). |
| **File** | `src/app/api/auth/[...nextauth]/route.ts` |
| **Export** | `GET`, `POST` (handlers from auth config). |

**Notes:** Credentials provider; session includes user id, name, role, workforceAccountId, workerId, clientOrganizationId (see auth callbacks in `src/lib/auth.ts`).

---

### POST `/api/lead`

| Property | Value |
|----------|--------|
| **Purpose** | Submit marketing lead from contact/pilot form. |
| **Auth** | None (public). |
| **Rate limit** | 10 requests per 15 minutes per IP (middleware). |
| **File** | `src/app/api/lead/route.ts` |

**Request:** JSON body validated by `leadSchema` (Zod).  
**Fields (typical):** name, email, company?, role?, phone?, propertyType?, sitesCount?, message?, sourcePage?, honeypot?, preferredContact?, buildingAddress?, frequency?, callbackTime?.

**Response:** 200 OK on success; 400 on validation error.  
**Behavior:** Honeypot check (if honeypot set, treat as spam); insert Lead into DB.  
**Schema:** `src/lib/lead-schema.ts`.

---

### POST `/api/evidence/upload`

| Property | Value |
|----------|--------|
| **Purpose** | Upload one evidence file (photo) for a job completion. |
| **Auth** | Caller must be authenticated; upload action may enforce worker/completion ownership. |
| **Rate limit** | 10 requests per 15 minutes per IP (middleware). |
| **File** | `src/app/api/evidence/upload/route.ts` |

**Request:** `multipart/form-data` (FormData).  
**Required fields:**  
- `file` (File)  
- `jobId` (string)  
- `completionId` (string)  

**Optional fields:**  
- `itemId` (string)  
- `checklistRunId` (string)  
- `redactionApplied` (must be `"true"` string — else 400)  
- `redactionType` (string)  

**Response:** 200 `{ success: true, data: { ... } }`; 400 `{ error: string }`; 500 on server error.  
**Behavior:** Validates redactionApplied === true; calls `uploadEvidence()` from `@/server/actions/upload-actions`. Stores file in Supabase evidence bucket; creates Evidence record linked to JobCompletion.  
**See:** 08_Storage_And_Evidence.md, upload-actions.

---

### GET `/api/evidence/[id]`

| Property | Value |
|----------|--------|
| **Purpose** | Retrieve evidence by id (e.g. redirect to signed URL or stream). |
| **Auth** | Should enforce access (e.g. same rules as job/completion access). |
| **File** | `src/app/api/evidence/[id]/route.ts` |

**Response:** Depends on implementation (redirect or stream).  
**See:** storage.ts for bucket and path layout.

---

### GET `/api/jobs/[id]/completion`

| Property | Value |
|----------|--------|
| **Purpose** | Get completion data for a job (e.g. for worker completion UI). |
| **Auth** | Caller must have access to job (canAccessJob). |
| **File** | `src/app/api/jobs/[id]/completion/route.ts` |

**Response:** JSON with completion and related data or 404.

---

### GET `/api/invoices/[id]/pdf`

| Property | Value |
|----------|--------|
| **Purpose** | Generate and return invoice PDF. |
| **Auth** | Admin or client (client: invoice must belong to their org). |
| **File** | `src/app/api/invoices/[id]/pdf/route.ts` |

**Response:** PDF stream (Content-Type application/pdf) or error.  
**See:** invoice-actions for invoice loading; PDF generation (e.g. react-pdf or similar) in route or shared util.

---

### POST `/api/admin/jobs/[id]/cancel`

| Property | Value |
|----------|--------|
| **Purpose** | Cancel a job (transition to CANCELLED). |
| **Auth** | requireAdmin. |
| **File** | `src/app/api/admin/jobs/[id]/cancel/route.ts` |

**Request:** POST (body optional).  
**Response:** 200 on success; 4xx on validation/forbidden.  
**Behavior:** Calls job transition logic (state-machine); job must not be in terminal state (PAID/CANCELLED).

---

### GET `/api/payouts/batch/[id]/statement`

| Property | Value |
|----------|--------|
| **Purpose** | Get payout batch statement (e.g. PDF or JSON for vendor statement). |
| **Auth** | Admin or vendor owner (batch lines for their workforce account). |
| **File** | `src/app/api/payouts/batch/[id]/statement/route.ts` |

**Response:** Statement document or JSON.  
**See:** payout-actions, 01_Data_Model (PayoutBatch, PayoutLine).

---

### GET `/api/health`

| Property | Value |
|----------|--------|
| **Purpose** | Health check (e.g. for load balancer or monitoring). |
| **Auth** | None. |
| **File** | `src/app/api/health/route.ts` |

**Response:** 200 OK (body may include db or dependency status).  
**Note:** No rate limit in middleware.

---

## Middleware (Rate Limit Only)

**File:** `src/middleware.ts`  
**Matcher:**  
- `/api/auth/:path*`  
- `/api/lead`  
- `/api/evidence/upload`  

**Limits:**  
- Auth: 5 requests per 15 minutes per IP.  
- Lead and evidence upload: 10 requests per 15 minutes per IP.  
**Implementation:** `checkRateLimit(ip, limit, windowMs)` from `@/lib/rate-limit`; on exceed returns 429 JSON `{ error: "Too many requests. Please try again later." }`.

---

## Adding a New API Route

1. Create `src/app/api/<path>/route.ts` and export GET/POST/etc.  
2. If the route is sensitive (auth, lead, upload), add path to middleware matcher and set limit in middleware.  
3. Enforce auth inside the route (e.g. `await requireAdmin()`) before performing work.  
4. Document here: path, method, purpose, auth, rate limit, request/response, file path.  
5. Update 00_BLVCK_BIBLE_MASTER.md Table of Contents / APIs section if adding a new category.

---

*End of APIs.*
