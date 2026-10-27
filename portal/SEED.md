# Portal Seed Data

**Purpose:** Populate the database with demo data for development and testing. Uses checklist item IDs from `ops-binder/06_Checklists_Library/checklist-manifest.json`.

---

## When to run

- **After** `npx prisma migrate deploy` (or `prisma migrate dev`) on a **fresh** database.
- Re-running seed on an already-seeded DB will create **duplicate** jobs, work orders, and incidents (users/orgs/sites use upsert and are safe to re-run for those entities only). For a clean re-seed, reset the DB or run seed once.

---

## Command

```bash
cd portal
npx prisma db seed
```

Or via npm:

```bash
npm run db:seed
```

---

## What the seed creates

| Entity | Count | Details |
|--------|-------|---------|
| **Admin** | 1 | admin@blvckshell.com — full access |
| **Vendor workforce** | 1 | CleanPro Subcontractors |
| **Vendor users** | 2 | Jane (VENDOR_OWNER), Bob (VENDOR_WORKER) |
| **Vendor workers** | 1 | Bob (worker record for job assignment) |
| **Internal workforce** | 1 | BLVCKSHELL Internal |
| **Internal worker** | 1 | Mike (INTERNAL_WORKER) |
| **Client portal user** | 1 | sarah@maplecondos.com (CLIENT) — read-only at /client |
| **Client organizations** | 3 | Maple Condos Inc., Downtown Property Group, Riverside Commercial Ltd. |
| **Sites** | 3 | Maple Tower Lobby, Downtown Plaza Common Areas, Riverside Tower A |
| **Checklist templates** | 3 | One per site (CL_01 Lobby, CL_02 Hallway, CL_01 for Riverside) |
| **Jobs** | 8 | 6 regular (mixed statuses) + 1 missed + 1 make-good |
| **Work order** | 1 | REQUESTED, assigned to vendor |
| **Incident report** | 1 | Property damage at site 1, reported by Bob |

---

## Login

Seed generates a random password at runtime and prints it once when the script finishes. That password is not written into this file or the repo. Re-running seed rotates the password for the seed users and prints the new value.

Seed refuses to run when `NODE_ENV=production`. It also refuses a `DATABASE_URL` that does not point at localhost, 127.0.0.1, or ::1 unless `ALLOW_SEED=1` is set. Leave `ALLOW_SEED` unset for any database that holds real client data.

| Role | Email | Notes |
|------|--------|------|
| Admin | admin@blvckshell.com | Redirects to /admin/jobs |
| Vendor owner | jane@cleanpro.example.com | Can use /vendor/team, /vendor/jobs (and worker routes) |
| Vendor worker | bob@cleanpro.example.com | Sees only jobs where assignedWorkerId = Bob |
| Internal worker | mike@blvckshell.com | Sees only jobs assigned to Mike |
| Client | sarah@maplecondos.com | Read-only portal at /client (Maple Condos Inc. data only) |

---

## Checklist item IDs

Seed uses stable item IDs from the ops-binder manifest:

- **Site 1 (Maple Tower Lobby):** CL_01 — LOB-001 through LOB-010
- **Site 2 (Downtown Plaza):** CL_02 — HLY-001 through HLY-009

These match `ops-binder/06_Checklists_Library/checklist-manifest.json` for portal/seed and admin checklist template creation.

---

## Job assignment rule

Per DECISIONS.md: exactly one of `assignedWorkforceAccountId` or `assignedWorkerId` per job. Seed assigns all jobs to **workers** (assignedWorkerId) so they appear in worker job lists.
