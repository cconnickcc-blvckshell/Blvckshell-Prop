# Deploying to Vercel

The BLVCKSHELL portal is set up for **Vercel** as the production host.

---

## 1. Connect the repo

- In [Vercel](https://vercel.com), import the Git repository (e.g. `cconnickcc-blvckshell/Blvckshell-Prop`).
- **Root Directory:** set to **`portal`** (the Next.js app lives in the `portal/` folder, not the repo root).

---

## 2. Build settings (defaults)

Vercel will detect Next.js. You can leave these as-is or set explicitly:

| Setting        | Value           |
|----------------|-----------------|
| Framework      | Next.js         |
| Root Directory | **portal**      |
| Build Command  | `npm run build` |
| Output Directory | (auto)        |
| Install Command | `npm install`  |

---

## 3. Environment variables

In **Vercel → Project → Settings → Environment Variables**, add these for **Production** (and Preview if you use branch deploys):

| Variable | Description | Example / notes |
|----------|-------------|------------------|
| `DATABASE_URL` | Supabase **pooled** Postgres URL (serverless-safe) | `postgresql://postgres.xxx:password@aws-0-xx.pooler.supabase.com:5432/postgres` |
| `DIRECT_URL` | Supabase **direct** Postgres URL (used for migrations only) | `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | From Supabase Dashboard → Settings → API |
| `NEXTAUTH_URL` | **Production app URL** | `https://your-app.vercel.app` (replace with your real Vercel URL) |
| `NEXTAUTH_SECRET` | Secret for NextAuth sessions | e.g. `openssl rand -base64 32` |
| `NODE_ENV` | Optional | `production` (Vercel sets this by default) |

**Important**

- **NEXTAUTH_URL** must be your live Vercel URL (e.g. `https://blvckshell-portal.vercel.app`). If it’s wrong, login/callbacks will fail.
- After the first deploy, set **NEXTAUTH_URL** to the exact URL Vercel gives you, then redeploy if you had used a placeholder.

---

## 4. Migrations and seed

Migrations and seed are **not** run by Vercel. Run them yourself (e.g. from your machine or CI):

```bash
cd portal
# Use DIRECT_URL
npx prisma migrate deploy
npx prisma db seed   # optional
```

Use the same `DIRECT_URL` (and env) that you use locally for migrations.

---

## 5. Supabase Storage

- Ensure the `evidence` (and optionally `compliance`) buckets exist in Supabase.
- The app uses **server-only** Supabase client with `SUPABASE_SERVICE_ROLE_KEY`; no RLS or public bucket URLs needed for evidence.

---

## 6. After deploy

1. Open **NEXTAUTH_URL** in the dashboard and set it to your real Vercel URL if needed, then redeploy.
2. Test login, worker flows, and admin flows.
3. (Optional) Add a custom domain in Vercel and set **NEXTAUTH_URL** to that domain.

---

## Summary

- **Root Directory:** `portal`
- **NEXTAUTH_URL:** must be your Vercel (or custom) production URL
- **Migrations:** run `prisma migrate deploy` (and seed) outside Vercel with `DIRECT_URL`
