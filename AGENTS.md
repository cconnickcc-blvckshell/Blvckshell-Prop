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
