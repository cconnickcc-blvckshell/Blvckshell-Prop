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
| **Client organizations** | 2 | Maple Condos Inc., Downtown Property Group |
| **Sites** | 2 | Maple Tower Lobby, Downtown Plaza Common Areas |
| **Checklist templates** | 2 | One per site (CL_01 Lobby items, CL_02 Hallway items) |
| **Jobs** | 8 | 6 regular (mixed statuses) + 1 missed + 1 make-good |
| **Work order** | 1 | REQUESTED, assigned to vendor |
| **Incident report** | 1 | Property damage at site 1, reported by Bob |

---

## Login credentials (all use password: `password123`)

| Role | Email | Notes |
|------|--------|------|
| Admin | admin@blvckshell.com | Redirects to /admin/jobs |
| Vendor owner | jane@cleanpro.example.com | Can use /vendor/team, /vendor/jobs (and worker routes) |
| Vendor worker | bob@cleanpro.example.com | Sees only jobs where assignedWorkerId = Bob |
| Internal worker | mike@blvckshell.com | Sees only jobs assigned to Mike |

---

## Checklist item IDs

Seed uses stable item IDs from the ops-binder manifest:

- **Site 1 (Maple Tower Lobby):** CL_01 — LOB-001 through LOB-010
- **Site 2 (Downtown Plaza):** CL_02 — HLY-001 through HLY-009

These match `ops-binder/06_Checklists_Library/checklist-manifest.json` for portal/seed and admin checklist template creation.

---

## Job assignment rule

Per DECISIONS.md: exactly one of `assignedWorkforceAccountId` or `assignedWorkerId` per job. Seed assigns all jobs to **workers** (assignedWorkerId) so they appear in worker job lists.
