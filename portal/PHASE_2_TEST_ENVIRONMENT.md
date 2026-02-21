# Phase 2: Test Environment — Setup & Split

**Objective:** Dedicated test DB, mock NextAuth for unit tests, clear split of test suites, CI-friendly commands.

**Reference:** 90_DAY_WEEK_BY_WEEK_CHECKLIST.md (Weeks 5–7), TEST_REPORT.md, EVIDENCE_PIPELINE_TEST_PLAN.md.

---

## 1. Test database

- **Option A (recommended):** Supabase test project — create a separate project, set `TEST_DATABASE_URL` in `.env.test` or CI secrets. Use for integration and DB-dependent unit tests.
- **Option B:** Local Postgres — run Postgres in Docker or natively, point `TEST_DATABASE_URL` at it.
- **Usage:** When `TEST_DATABASE_URL` (or `DATABASE_URL`) is set and reachable, run full Vitest suite including `job-transitions.test.ts`, `lead.test.ts`. When DB is not available, run only the **pure** suite (see below).

**Apply migrations on test DB:**
```bash
DATABASE_URL="$TEST_DATABASE_URL" npx prisma migrate deploy
```

---

## 2. Mock NextAuth for unit tests

**Problem:** Suites that import `@/server/actions/job-actions`, `invoice-actions`, or `@/server/guards/rbac` pull in `@/lib/auth`, which pulls in `next/server` → Vitest (Node) fails to resolve.

**Approaches:**

1. **Mock at Vitest setup**  
   In `src/__tests__/setup.ts` or a dedicated setup file for action/guard tests:
   - `vi.mock('@/lib/auth', () => ({ auth: vi.fn(() => Promise.resolve({ user: { id: '…', role: 'ADMIN', … } })) }));`
   - Optionally mock `next/server` with empty or stub implementations so the module graph loads.

2. **Run action/guard tests in Next.js test environment**  
   Use `next/jest` or similar so that `next/server` and NextAuth resolve. Slower but no mocks.

3. **Isolate pure logic**  
   Keep state-machine and validation logic in modules that do not import auth (e.g. `state-machine.ts` transition rules). Test those with Vitest; test actions/guards via integration or E2E.

**Current status:** Pure state-machine tests pass without mocks. Action and guard tests require one of the above to run in CI without a full Next server.

---

## 3. Split suites

| Suite            | Scope                    | Command / trigger        | DB required |
|------------------|--------------------------|--------------------------|-------------|
| **Pure unit**    | State machine, pure logic | `vitest run src/__tests__/unit/state-machine/pure-transitions.test.ts` | No  |
| **Unit (actions/guards)** | job-actions, invoice-actions, rbac | After NextAuth mock or Next env | Optional (if mocked) |
| **DB integration** | job-transitions (DB), lead API | Full `vitest run` (exclude e2e) | Yes |
| **E2E**          | Playwright specs          | `npm run test:e2e`       | Yes (app + DB) |
| **Load**         | k6 scripts                | `npm run test:load`      | Yes (app)   |

**CI recommendation:**
- On every commit: run **pure unit** suite only (no DB, no Next server). Fast feedback.
- On schedule or on tag: run **full Vitest** (with `TEST_DATABASE_URL`) + **E2E** (with deployed or local app).

---

## 4. Commands reference

| Command | Purpose |
|--------|---------|
| `npm run test` | Full Vitest (fails if DB unreachable for DB-dependent tests) |
| `npx vitest run src/__tests__/unit/state-machine/pure-transitions.test.ts` | Pure unit only — use in CI when no DB |
| `npm run test:e2e` | Playwright E2E (app must be running at `TEST_BASE_URL`) |
| `npm run test:load` | k6 load tests |

**Suggested npm scripts (add to package.json if desired):**
- `"test:unit:pure": "vitest run src/__tests__/unit/state-machine/pure-transitions.test.ts"` — for CI without DB.
- `"test:integration": "vitest run --exclude '**/e2e/**' --exclude '**/*.spec.ts'"` — full Vitest excluding E2E (expects DB).

---

## 5. Mandatory scenarios and abuse tests

See **PHASE_2_MANDATORY_ABUSE_CHECKLIST.md** for the list of mandatory test scenarios (evidence, job lifecycle, money) and abuse tests (rate limit, large uploads, invalid role, double submit), mapped to existing tests and implementation notes.
