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
| **Rate limit** | 10 requests per 15 minutes per IP (POST to /api/auth/callback only; GET routes are not rate-limited). |
| **File** | `src/app/api/auth/[...nextauth]/route.ts` |
| **Export** | `GET`, `POST` (handlers from auth config). |

**Notes:** Credentials provider; session includes user id, name, role, workforceAccountId, workerId, clientOrganizationId (see auth callbacks in `src/lib/auth.ts`).

---

### POST `/api/lead`

| Property | Value |
|----------|--------|
| **Purpose** | Submit marketing lead from contact/pilot form. |
| **Auth** | None (public). |
| **Rate limit** | 30 requests per 15 minutes per IP (middleware). |
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
| **Rate limit** | 30 requests per 15 minutes per IP (middleware). |
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

## Stripe Integration

### POST `/api/stripe/checkout`

| Property | Value |
|----------|--------|
| **Purpose** | Create a Stripe Checkout session for client self-pay. |
| **Auth** | Authenticated user (getCurrentUser). |
| **Rate limit** | None. |
| **File** | `src/app/api/stripe/checkout/route.ts` |

**Request:** JSON body `{ invoiceId: string }`.

**Response:** 200 `{ url: string, sessionId: string }` (redirect to Stripe Checkout); 4xx on error.

**Behavior:**  
- Loads invoice; requires `status === "Sent"` and `client.requiredPaymentRail === "STRIPE"`.  
- Creates Stripe Checkout session with invoice metadata.  
- Returns Checkout URL for client redirect.  
- **Important:** Blvckshell remains the system of record; Stripe is a settlement rail.

**See:** `lib/stripe.ts`, `payment-actions.ts`.

---

### POST `/api/stripe/webhook`

| Property | Value |
|----------|--------|
| **Purpose** | Handle Stripe webhook events (e.g. `checkout.session.completed`). |
| **Auth** | Stripe signature verification (no user auth). |
| **Rate limit** | None (Stripe controls call frequency). |
| **File** | `src/app/api/stripe/webhook/route.ts` |

**Request:** Raw body from Stripe with `stripe-signature` header.

**Response:** 200 `{ received: true }` on success; 400 on signature failure.

**Behavior:**  
- Verifies webhook signature using `STRIPE_WEBHOOK_SECRET`.  
- On `checkout.session.completed`:  
  - Creates `Payment` record with `status: "SETTLED"`.  
  - If total settled >= invoice total, transitions invoice to `Paid`.  
  - Writes AuditLog with `actorUserId: "system"`.  
  - Queues payment confirmation notification.

**Environment:** Requires `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.

---

## Notification System

### POST `/api/notifications/process`

| Property | Value |
|----------|--------|
| **Purpose** | Process pending notifications from the outbox (cron job endpoint). |
| **Auth** | Bearer token matching `CRON_SECRET` (if set). |
| **Rate limit** | None. |
| **File** | `src/app/api/notifications/process/route.ts` |

**Request:** POST (body optional).

**Response:** 200 `{ processed: number, sent: number, failed: number }`.

**Behavior:**  
- Fetches up to 50 `PENDING` notifications from `NotificationOutbox`.  
- For EMAIL: integrates with SendGrid (if `SENDGRID_API_KEY` set) or marks as sent in dev mode.  
- For SMS: integrates with Twilio (if `TWILIO_ACCOUNT_SID` set) or marks as sent in dev mode.  
- On failure: sets `status: "FAILED"` with error message.

**Usage:** Called by Vercel Cron or external scheduler. Frequency: every 1–5 minutes.

---

## Worker Endpoints

### GET `/api/worker/paystub`

| Property | Value |
|----------|--------|
| **Purpose** | Generate PDF pay statement for authenticated worker. |
| **Auth** | Authenticated worker (getCurrentUser with workerId). |
| **Rate limit** | None. |
| **File** | `src/app/api/worker/paystub/route.ts` |

**Query params:** `month` (YYYY-MM format, required).

**Response:** PDF stream with `Content-Disposition: attachment; filename="pay-statement-YYYY-MM.pdf"`.

**Behavior:**  
- Loads worker info and jobs in `APPROVED_PAYABLE` or `PAID` for the given month.  
- Generates PDF using pdfkit with:  
  - Header (BLVCKSHELL, worker name, email, account, period).  
  - Job table (date, site, amount, status).  
  - Totals (total, paid, pending).

**Error:** 400 if month param invalid; 404 if worker not found.

---

### PATCH `/api/worker/profile`

| Property | Value |
|----------|--------|
| **Purpose** | Update worker's profile (name, phone). |
| **Auth** | Authenticated user (getCurrentUser). |
| **Rate limit** | None. |
| **File** | `src/app/api/worker/profile/route.ts` |

**Request:** JSON body `{ name: string, phone?: string }`.

**Response:** 200 `{ success: true }` on success; 400 if name missing.

**Behavior:** Updates `User.name` and `User.phone` for authenticated user.

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
- `/api/auth/callback/:path*` (POST only — login attempts)  
- `/api/lead` (POST only)  
- `/api/evidence/upload`  

**Limits:**  
- Auth POST (callback): 10 requests per 15 minutes per IP.  
- Lead and evidence upload: 30 requests per 15 minutes per IP.  

**Critical:** NextAuth internal GET routes (`/api/auth/providers`, `/api/auth/csrf`, `/api/auth/session`, `/api/auth/error`) are **not** rate-limited — these are fetched on every page load for session checks.

**Implementation:** `checkRateLimit(ip, limit, windowMs)` from `@/lib/rate-limit`; on exceed:
- Auth POST: redirects to `/login?error=RateLimit`
- Others: returns 429 JSON `{ error: "Too many requests. Please wait a few minutes and try again." }` with `Retry-After` header.

---

## Adding a New API Route

1. Create `src/app/api/<path>/route.ts` and export GET/POST/etc.  
2. If the route is sensitive (auth, lead, upload), add path to middleware matcher and set limit in middleware.  
3. Enforce auth inside the route (e.g. `await requireAdmin()`) before performing work.  
4. Document here: path, method, purpose, auth, rate limit, request/response, file path.  
5. Update 00_BLVCK_BIBLE_MASTER.md Table of Contents / APIs section if adding a new category.

---

*End of APIs.*
