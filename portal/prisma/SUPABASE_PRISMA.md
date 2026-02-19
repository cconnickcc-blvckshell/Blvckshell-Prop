# Supabase + Prisma Setup

Prisma **must** use two URLs: pooled for runtime, and a **direct or session-pooler** URL for migrations/introspection (see Prisma 7: `prisma.config.ts`). Using only the runtime pooler for `migrate` or `db pull` can cause misleading "db down" errors.

## 0. P1001 "Can't reach database server" at `db.<ref>.supabase.co:5432`

If Prisma can't reach the direct host, **credentials are irrelevant** (pre-auth). Common causes:

### Root cause #1 (most common): **IPv6-only direct endpoint**

Supabase's **direct** connection (`db.<project-ref>.supabase.co:5432`) is **IPv6-only**. If your network doesn't route IPv6, you get P1001.

**Diagnosis (Windows):**

```powershell
Resolve-DnsName db.oscqetgchujqzvasjdga.supabase.co
Test-NetConnection db.oscqetgchujqzvasjdga.supabase.co -Port 5432
```

- **Only AAAA (IPv6), no A (IPv4)** → direct endpoint is IPv6-only; your path likely can't use it.
- **Test-NetConnection fails** (RemoteAddress empty, PingSucceeded False) → network can't reach that endpoint.

**Fix (recommended):** Use **Supavisor Session mode** for `DIRECT_URL` instead of the direct host.  
In Supabase Dashboard → **Connect** → use the **Session pooler** connection string (not Transaction, not Direct). Set:

- `DIRECT_URL` = **Session pooler URL** (e.g. `postgres.oscqetgchujqzvasjdga@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require`)
- `DATABASE_URL` = same pooler or Transaction pooler for runtime (with `pgbouncer=true&connection_limit=1` for serverless)

Session mode gives "direct-like" behavior over IPv4 so Prisma CLI works.

### Other causes

- **Outbound 5432 blocked** (corporate/VPN/firewall) → try another network or hotspot.
- **Supabase Network Restrictions** → allow your IP or temporarily disable to test.
- **Password with `@ # %` etc.** → URL-encode in the connection string (e.g. `%40` for `@`).

---

## 1. Environment

In `.env` (repo root). Use your real password; replace `[YOUR-PASSWORD]`. If you hit P1001 on direct, set `DIRECT_URL` to the **Session pooler** URL (see §0).

```env
# Runtime (serverless). Supabase pooler — Session or Transaction mode.
DATABASE_URL="postgresql://postgres.oscqetgchujqzvasjdga:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1&sslmode=require"

# Prisma CLI (migrate / db pull). Use Session pooler URL if direct (db.xxx.supabase.co) fails with P1001 (IPv6).
DIRECT_URL="postgresql://postgres.oscqetgchujqzvasjdga:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

Prisma 7: connection URLs live in `prisma.config.ts`, not in the schema. Schema has no `url`/`directUrl`:

```prisma
datasource db {
  provider = "postgresql"
}
```

`prisma.config.ts` (portal root) sets `datasource.url` to `DIRECT_URL` so the CLI uses it for migrate/db pull.

## 2. Verify connectivity

From the same machine that runs Prisma:

```bash
# Direct (must work for migrate / db pull)
psql "$DIRECT_URL" -c "select now();"

# Pooled (runtime)
psql "$DATABASE_URL" -c "select now();"
```

If `DIRECT_URL` fails: try Session pooler URL instead of direct (IPv6); or check network/SSL.  
If only `DATABASE_URL` fails: pooler URL or pgbouncer params.

## 3. When Supabase is ahead of Prisma

If you applied manual SQL in Supabase, sync Prisma to the DB:

```bash
cd portal
npx prisma db pull
npx prisma generate
```

Then commit the updated `schema.prisma`. Use migrations again once Prisma is the single source of truth.

## 4. Pooler settings (serverless)

For Vercel/serverless, the pooled URL should include:

- `pgbouncer=true`
- `connection_limit=1`
- `sslmode=require`

This avoids connection saturation that can look like "Supabase is down."

## 5. ID and enum alignment

- **IDs**: Decide whether the DB or the app generates primary keys. If the DB has `id text NOT NULL` with no default, Prisma after `db pull` won’t have `@default(cuid())`; align DB defaults and Prisma so they don’t drift.
- **Enums**: Postgres enums must match Prisma (names and values). To list DB enums:

```sql
select n.nspname as schema, t.typname as enum_name, e.enumlabel as value
from pg_type t
join pg_enum e on t.oid = e.enumtypid
join pg_namespace n on n.oid = t.typnamespace
order by enum_name, e.enumsortorder;
```
