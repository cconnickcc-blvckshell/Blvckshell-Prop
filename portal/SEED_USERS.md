# Seed User Logins & Passwords

**Source:** Created by `prisma/seed.ts` when you run `npm run db:seed` (or `npx prisma db seed`).

**⚠️ Security:** These are development/seed credentials only. Do not use in production. Change passwords after first login in production, or do not run seed in production.

---

## Shared password (all seed users)

| Field     | Value        |
|----------|--------------|
| Password | `password123` |

---

## Users

| Role            | Email                     | Password     | Name           | Notes                          |
|-----------------|---------------------------|--------------|----------------|--------------------------------|
| **Admin**       | `admin@blvckshell.com`    | `password123`| Admin User     | Full admin; redirects to `/admin/jobs` |
| **Vendor owner**| `jane@cleanpro.example.com` | `password123`| Jane Vendor   | CleanPro Subcontractors; Team + Vendor Jobs |
| **Vendor worker** | `bob@cleanpro.example.com` | `password123`| Bob Worker    | Sees assigned jobs; redirects to `/jobs` |
| **Internal worker** | `mike@blvckshell.com`   | `password123`| Mike Internal | BLVCKSHELL Internal; redirects to `/jobs` |
| **Client**      | `sarah@maplecondos.com`   | `password123`| Sarah PM       | Maple Condos Inc.; read-only portal at `/client` |

---

## Seed clients (organizations & sites)

| Client organization      | Primary contact   | Sites (seed) |
|--------------------------|-------------------|--------------|
| Maple Condos Inc.        | Sarah PM          | Maple Tower Lobby |
| Downtown Property Group  | Tom Manager       | Downtown Plaza Common Areas |
| Riverside Commercial Ltd.| Alex Facilities   | Riverside Tower A |

---

## Quick reference

```
Admin:         admin@blvckshell.com      / password123
Vendor owner:  jane@cleanpro.example.com / password123
Vendor worker: bob@cleanpro.example.com  / password123
Internal:      mike@blvckshell.com       / password123
Client:        sarah@maplecondos.com     / password123  → /client
```

---

## After seeding

1. Run seed: `cd portal && npm run db:seed`
2. Open `/login` (or `/portal` which redirects to `/login`)
3. Sign in with any email/password above
4. Admin → `/admin/jobs`; Workers → `/jobs`; Client → `/client`
