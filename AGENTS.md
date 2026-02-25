# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Single Next.js 14 app (App Router) in `portal/` — a facilities services workforce portal with admin, worker, client, and marketing portals. See `portal/README.md` for full details.

### Services

| Service | Command | Port |
|---------|---------|------|
| Next.js dev server | `npm run dev` (from `portal/`) | 3000 |
| PostgreSQL | `sudo pg_ctlcluster 16 main start` | 5432 |

### Running the app

1. Start PostgreSQL: `sudo pg_ctlcluster 16 main start`
2. Start dev server: `cd /workspace/portal && npm run dev`
3. Visit http://localhost:3000

### Seed credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@blvckshell.com | password123 |
| Vendor owner | jane@cleanpro.example.com | password123 |
| Vendor worker | bob@cleanpro.example.com | password123 |
| Internal worker | mike@blvckshell.com | password123 |
| Client portal | sarah@maplecondos.com | password123 |

### Key caveats

- **Environment variables**: The root `.env` file (at `/workspace/.env`) is the single source for all env vars. Both `portal/next.config.js` and `portal/prisma.config.ts` load from `../.env`. Do not create a separate `portal/.env` for database URLs.
- **Vitest and seed data conflict**: Tests (`npx vitest run`) use the same database and wipe all tables in `beforeEach`. After running tests, re-seed with `npm run db:seed` (from `portal/`). There is a pre-existing bug: the test cleanup in `src/__tests__/setup.ts` deletes `IncidentReport` after `Worker`, causing FK violations and cascading test failures in DB-dependent tests.
- **Pure unit tests**: `npm run test:unit:pure` (from `portal/`) runs the pure state-machine tests that don't require DB and always pass.
- **ESLint**: Not bundled in `package.json` by default. Install with `npm install --save-dev eslint@^8 eslint-config-next@14` and create `portal/.eslintrc.json` with `{"extends": "next/core-web-vitals"}`. Then `npm run lint` works. Pre-existing lint errors exist in marketing pages (unescaped `'` entities).
- **Prisma**: Uses `@prisma/adapter-pg` driver adapter at runtime. The schema has no `url`/`directUrl` — those are set in `prisma.config.ts`. Run `npx prisma generate` before starting the dev server if `node_modules` were freshly installed.
- **PostgreSQL**: Local dev uses PostgreSQL 16 with user `portaldev` / password `portaldev` / database `portal_dev`.

### New models (workforce system foundations)

The following models were added via migration `20260224210215_workforce_system_foundations`:

- **Payment**: Provider-agnostic payment ledger (`STRIPE`/`SPARC`/`EFT`/`CHEQUE`). Source of truth for money in. See `payment-actions.ts`.
- **NotificationOutbox**: Durable outbox for email/SMS notifications. Write intent in server actions, process async. See `notification-actions.ts`.
- **TimeEntry**: Payroll time tracking for employees (not contractors). See `timeentry-actions.ts`.

New fields on existing models:
- `Invoice.taxJurisdiction`, `taxRateBps`, `taxPolicyVersion` — frozen tax at invoice creation time
- `ClientOrganization.requiredPaymentRail` — per-client payment policy (`STRIPE`/`SPARC`/`EFT`)
- `WorkforceAccount.classification` — `EMPLOYEE` or `CONTRACTOR`
- `WorkforceAccount.allowedPaymentMethod` — `PAYROLL`/`EFT`/`CHEQUE`
- `WorkforceAccount.complianceSuspended` — blocks job assignment and payout

### Worker portal

- Worker pages live under `src/app/(worker)/` with components in `src/components/worker/`.
- All worker pages use **dark theme** (`bg-zinc-950`, `border-zinc-800`, `bg-zinc-900/50` cards). Do not revert to light theme.
- Bottom tab navigation (`WorkerNav.tsx`) replaces top-only nav. It has a fixed bottom bar with tabs: Jobs, Schedule, Earnings, Profile, and a "More" menu for `VENDOR_OWNER` role.
- The worker layout adds `pb-20` to `<main>` to account for the bottom tab bar.
- `searchParams` in Jobs page uses `Promise<{ date?: string }>` pattern for Next.js 14 App Router.
- **Rate limiter**: `src/middleware.ts` limits `/api/auth` to 20 requests and `/api/lead` + `/api/evidence/upload` to 30 requests per 15-minute window (in-memory). Restarting the dev server clears the rate limit store. The store is bounded to 10k entries for serverless safety.
- **Server components cannot use `onClick`** — any event handlers in worker pages must be in a separate client component (e.g., `JobsWeekStrip`, `ProfileEditor`).
- `worker-actions.ts` provides `checkIn`/`checkOut` server actions for job time tracking, using `checkedInAt`/`checkedOutAt` fields on the Job model.

### Hardening layer

- `src/lib/logger.ts` — Structured JSON error logger ("tattletale"). Use `logError()`, `logWarn()`, `logInfo()` with `ErrorContext` for all error handling.
- `src/lib/safe-action.ts` — `safeAction(name, fn)` wraps server actions in try/catch + logging. Returns `{ success, error }` on failure, never crashes.
- `src/lib/env.ts` — Validates required env vars (`DATABASE_URL`, `NEXTAUTH_SECRET`) at import time. Import in critical entry points.
- Error boundaries (`error.tsx`) exist for every route group: root, admin, worker, client, marketing, plus `global-error.tsx`.
- Loading skeletons (`loading.tsx`) exist for admin, worker, client, marketing route groups.
- Not-found pages (`not-found.tsx`) exist for root, admin, worker.
- Security headers (HSTS, X-Frame-Options, etc.) are set in `next.config.js` `headers()`.
- `trustHost: true` in NextAuth config prevents signout redirect loops on Vercel.

### Server-side modules

- `src/lib/preconditions.ts` — Structured pre-flight checks (job approval, invoice send, payout finalize). Returns typed `{ code, message }` failures for UI rendering.
- `src/server/guards/compliance.ts` — Workforce compliance checks (COI/WSIB expiry, suspension). Blocks assignment/payout for non-compliant accounts.
- `src/server/actions/payment-actions.ts` — Payment recording, settlement, failure. Auto-transitions invoice to Paid when settled >= total.
- `src/server/actions/notification-actions.ts` — Notification outbox CRUD + retry.
- `src/server/actions/timeentry-actions.ts` — Time entry CRUD + payroll export batch.
