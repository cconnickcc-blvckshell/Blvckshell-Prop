# Portal Test Report

**Generated:** February 2026  
**Test run:** Full Vitest suite + Playwright inventory  
**Environment:** Database unreachable (Supabase host: getaddrinfo ENOENT)

---

## Executive Summary

| Metric | Value |
|--------|--------|
| **Vitest test files** | 7 total (6 unit/integration, 1 pure unit) |
| **Tests passed** | 10 |
| **Tests failed** | 10 |
| **Test files passed** | 1 |
| **Test files failed** | 6 |
| **E2E tests (Playwright)** | 3 tests in 2 files (not run this session) |
| **Pass rate (Vitest)** | 50% (10/20) |

**Verdict:** All tests that do **not** require a database or NextAuth pass. All tests that require a **reachable database** or that pull in **next-auth** (and thus Next.js server) fail in the current environment.

---

## 1. Test Results by Suite

### 1.1 Passed — Pure unit tests (no DB, no app imports)

| File | Tests | Status |
|------|-------|--------|
| `src/__tests__/unit/state-machine/pure-transitions.test.ts` | 10 | All pass |

**Coverage:** Job state transition rules (allowed and disallowed transitions).

- allows SCHEDULED → COMPLETED_PENDING_APPROVAL  
- allows SCHEDULED → CANCELLED  
- allows COMPLETED_PENDING_APPROVAL → APPROVED_PAYABLE  
- allows COMPLETED_PENDING_APPROVAL → SCHEDULED (rejection)  
- allows COMPLETED_PENDING_APPROVAL → CANCELLED  
- allows APPROVED_PAYABLE → PAID  
- rejects SCHEDULED → PAID  
- rejects SCHEDULED → APPROVED_PAYABLE  
- rejects PAID → any  
- rejects CANCELLED → any  

---

### 1.2 Failed — Database-dependent tests

**Root cause:** `getaddrinfo ENOENT db.oscqetgchujqzvasjdga.supabase.co` — database host unreachable (network/DNS or no connection).

| File | Tests | Failure reason |
|------|-------|----------------|
| `src/__tests__/integration/api/lead.test.ts` | 3 | `testDb.lead.deleteMany()` in beforeEach — DB unreachable |
| `src/__tests__/unit/state-machine/job-transitions.test.ts` | 7 | `createTestUser()` → `testDb.user.create()` — DB unreachable |

**Lead API tests (3):**

- POST /api/lead › should create lead successfully  
- POST /api/lead › should reject invalid email  
- POST /api/lead › should handle honeypot field  

**Job state machine tests (7):**

- isAllowedJobTransition (5) — fail in beforeEach when creating test users/jobs  
- transitionJob (2) — same DB dependency  

---

### 1.3 Failed — Suite load errors (module / NextAuth)

**Root cause:** `Cannot find module 'next/server'` when next-auth is loaded (Vitest/Node resolution vs Next.js).

| File | Status | Failure reason |
|------|--------|----------------|
| `src/__tests__/unit/actions/job-actions.test.ts` | Suite failed to load | next-auth imports next/server |
| `src/__tests__/unit/actions/invoice-actions.test.ts` | Suite failed to load | same |
| `src/__tests__/unit/guards/rbac.test.ts` | Suite failed to load | same |
| `src/__tests__/integration/api/evidence.test.ts` | Suite failed to load | same |

These suites import server actions or guards that eventually pull in NextAuth, which expects Next.js runtime.

---

## 2. E2E Tests (Playwright)

**Status:** Not executed this run. Inventory:

| File | Test |
|------|------|
| `e2e/admin/invoice-workflow.spec.ts` | Admin Invoice Workflow › should create and manage invoice |
| `e2e/worker/job-completion.spec.ts` | Worker Job Completion Flow › should complete job workflow |
| `e2e/worker/job-completion.spec.ts` | Worker Job Completion Flow › should show error for missing required photos |

**Total:** 3 E2E tests in 2 files.  
**To run:** `npm run test:e2e` (requires app at `TEST_BASE_URL` or `npm run dev`).

---

## 3. Load Tests (k6)

**Status:** Not executed this run.

**Scripts:**

- `src/__tests__/load/mixed-workload.js` — mixed workload, up to 500 VUs  
- `src/__tests__/load/worker-workflow.js` — worker flow, up to 500 VUs  
- `src/__tests__/load/peak-load.js` — peak load, 500 VUs  

**To run:** `npm run test:load` (requires k6 and reachable app).

---

## 4. Failure Analysis

### 4.1 Database unreachable

- **Error:** `getaddrinfo ENOENT db.oscqetgchujqzvasjdga.supabase.co`
- **Impact:** All tests that use `testDb` (setup helpers, lead API, job-transitions with DB) fail.
- **Fix:** Ensure `DATABASE_URL` or `TEST_DATABASE_URL` points to a reachable Postgres/Supabase instance (network, VPN, or local DB).

### 4.2 NextAuth / Next.js in Vitest

- **Error:** `Cannot find module 'next/server'` (from next-auth).
- **Impact:** Any suite that imports code paths that load NextAuth fails to load.
- **Fix:** Run those tests in a Next.js test environment (e.g. Jest with next/jest or integration tests against a running app), or mock NextAuth/next/server in Vitest.

### 4.3 Setup cleanup

- Global `beforeEach` in `setup.ts` runs for every test; cleanup uses `testDb`. When the DB is unreachable, Prisma logs errors; the try/catch prevents the setup from throwing, but tests that then use `testDb` still fail.

---

## 5. Recommendations

1. **Run DB-dependent tests only when DB is available**  
   Use a dedicated test DB and set `TEST_DATABASE_URL` (or `DATABASE_URL`) so Prisma can connect. Then run the full Vitest suite.

2. **Keep pure unit tests for CI without DB**  
   Run `npx vitest run src/__tests__/unit/state-machine/pure-transitions.test.ts` in environments where no DB is configured (e.g. PR checks for quick feedback).

3. **Isolate NextAuth-dependent tests**  
   Either:
   - Run action/guard tests via Next.js test runner (e.g. `next/jest`), or  
   - Mock `@/server/guards/rbac` and NextAuth in Vitest so suites load without `next/server`.

4. **Run E2E and load tests when needed**  
   - E2E: start app, then `npm run test:e2e`.  
   - Load: install k6, then `npm run test:load` (and variants) against a deployed or local app.

---

## 6. Commands Reference

| Command | Purpose |
|---------|--------|
| `npm run test` | Full Vitest run (needs DB for full pass) |
| `npx vitest run src/__tests__/unit/state-machine/pure-transitions.test.ts` | Pure unit tests only (no DB) |
| `npm run test:e2e` | Playwright E2E (app must be running) |
| `npm run test:load` | k6 mixed workload |
| `npm run test:load:peak` | k6 peak load |
| `npm run test:coverage` | Vitest with coverage (needs DB for full coverage) |

---

## 7. Test Inventory Summary

| Category | Files | Tests | Pass (current run) | Fail (current run) |
|----------|-------|-------|--------------------|---------------------|
| Pure unit (state machine) | 1 | 10 | 10 | 0 |
| Unit (actions) | 2 | — | 0 | Suite load error |
| Unit (guards) | 1 | — | 0 | Suite load error |
| Unit (state machine + DB) | 1 | 7 | 0 | 7 |
| Integration (API) | 2 | 3 | 0 | 3 |
| E2E (Playwright) | 2 | 3 | Not run | — |
| Load (k6) | 3 | — | Not run | — |
| **Total Vitest** | **7** | **20** | **10** | **10** |

---

*Report generated from test run with database unreachable and Vitest default configuration.*
