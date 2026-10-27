# Seed users

**Source:** Created by `prisma/seed.ts` when you run `npm run db:seed` (or `npx prisma db seed`).

The seed script generates a random password at runtime and prints it once. The password is not stored in this file. Re-running seed rotates that password and prints the new value.

Seed refuses to run when `NODE_ENV=production`. It also refuses a `DATABASE_URL` that does not point at localhost, 127.0.0.1, or ::1 unless `ALLOW_SEED=1` is set. Do not set `ALLOW_SEED` against a production database, and do not point a cloud agent at the production database to seed it.

---

## Users

| Role | Email | Name | Notes |
|------|-------|------|-------|
| **Admin** | `admin@blvckshell.com` | Admin User | Full admin; redirects to `/admin/jobs` |
| **Vendor owner** | `jane@cleanpro.example.com` | Jane Vendor | CleanPro Subcontractors; Team + Vendor Jobs |
| **Vendor worker** | `bob@cleanpro.example.com` | Bob Worker | Sees assigned jobs; redirects to `/jobs` |
| **Internal worker** | `mike@blvckshell.com` | Mike Internal | BLVCKSHELL Internal; redirects to `/jobs` |
| **Client** | `sarah@maplecondos.com` | Sarah PM | Maple Condos Inc.; read-only portal at `/client` |

---

## Seed clients (organizations & sites)

| Client organization | Primary contact | Sites (seed) |
|---------------------|-----------------|--------------|
| Maple Condos Inc. | Sarah PM | Maple Tower Lobby |
| Downtown Property Group | Tom Manager | Downtown Plaza Common Areas |
| Riverside Commercial Ltd. | Alex Facilities | Riverside Tower A |

---

## After seeding

1. Run seed against local Postgres: `cd portal && npm run db:seed`
2. Copy the password printed at the end of that command. It applies to every seed user for that run.
3. Open `/login` (or `/portal` which redirects to `/login`)
4. Admin → `/admin/jobs`; Workers → `/jobs`; Client → `/client`
