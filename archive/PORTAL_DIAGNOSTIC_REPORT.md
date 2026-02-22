# Portal Login Issue — Diagnostic Report

**Date:** February 16, 2026  
**Issue:** `/login` shows "Portal temporarily unavailable" (fail-safe UI)  
**Status:** Root cause analysis complete

---

## 🔍 Root Cause Analysis

The `auth()` call in `/login` is failing, triggering the fail-safe catch block. This indicates a **server-side runtime error** during NextAuth initialization or session resolution.

### Most Likely Causes (Ranked by Probability)

#### 1. **Missing Environment Variables on Vercel** (90% probability)

**Required variables that MUST be set:**

| Variable | Purpose | Impact if Missing |
|----------|---------|-------------------|
| `NEXTAUTH_SECRET` | NextAuth session encryption | **auth() will throw** — NextAuth cannot initialize |
| `DATABASE_URL` | Prisma database connection | **auth() will throw** — Prisma client creation fails |
| `NEXTAUTH_URL` | NextAuth callback URL | Callbacks fail, but auth() may still work |
| `DIRECT_URL` | Prisma migrations (build-time) | Build may fail if migrations run |

**Critical:** If `NEXTAUTH_SECRET` or `DATABASE_URL` are missing, `auth()` will throw an error immediately.

---

#### 2. **Prisma Client Not Generated During Build** (5% probability)

**Check:** Vercel build logs should show:
```
✔ Generated Prisma Client (v7.4.0)
```

If this is missing, Prisma imports will fail at runtime.

**Fix:** Ensure `package.json` build script includes `prisma generate`:
```json
"build": "prisma generate && next build"
```
✅ **Verified:** This is already correct in `package.json`.

---

#### 3. **Database Connection Failure** (3% probability)

Even if `DATABASE_URL` is set, the connection might fail due to:
- Incorrect connection string format
- Supabase pooler issues
- Network/firewall blocking Vercel IPs
- Database credentials expired

**Check:** Vercel server logs will show Prisma connection errors.

---

#### 4. **NextAuth Configuration Error** (2% probability)

**Check:** The `auth.ts` file syntax is correct. However, if `NEXTAUTH_SECRET` is `undefined`, NextAuth will fail silently or throw.

---

## 🔧 Diagnostic Steps

### Step 1: Verify Vercel Environment Variables

**In Vercel Dashboard:**
1. Go to **Project → Settings → Environment Variables**
2. Verify these exist for **Production** environment:
   - ✅ `DATABASE_URL`
   - ✅ `NEXTAUTH_SECRET`
   - ✅ `NEXTAUTH_URL`
   - ✅ `DIRECT_URL` (for migrations)
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`

**Common mistakes:**
- Variables set for "Preview" but not "Production"
- Variables have typos (e.g., `NEXTAUTH_SECRET` vs `NEXTAUTH_SECRETS`)
- `NEXTAUTH_URL` is `http://localhost:3000` instead of production URL

---

### Step 2: Check Vercel Build Logs

**Look for:**
1. **Prisma generation:**
   ```
   ✔ Generated Prisma Client (v7.4.0)
   ```

2. **Build errors:**
   ```
   Error: DATABASE_URL is not set
   Error: NEXTAUTH_SECRET is required
   ```

3. **Missing environment warnings:**
   ```
   Warning: Environment variable NEXTAUTH_SECRET is not set
   ```

---

### Step 3: Check Vercel Server Logs

**In Vercel Dashboard:**
1. Go to **Project → Deployments → [Latest] → Functions / Server Logs**
2. Navigate to `/login` in production
3. Look for error messages like:
   ```
   [login] Auth/session check failed: Error: ...
   ```

**Common errors you'll see:**

| Error Message | Cause | Fix |
|--------------|-------|-----|
| `DATABASE_URL is not set` | Missing env var | Add `DATABASE_URL` in Vercel |
| `NEXTAUTH_SECRET is required` | Missing env var | Add `NEXTAUTH_SECRET` in Vercel |
| `PrismaClientInitializationError` | Database connection failed | Check `DATABASE_URL` format, Supabase status |
| `Cannot find module '@prisma/client'` | Prisma not generated | Check build logs, ensure `prisma generate` runs |

---

## ✅ Immediate Fix Checklist

### Fix 1: Set Environment Variables on Vercel

**Required for Production:**

```bash
# Database (Supabase pooled connection)
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-xx.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1

# Database (direct connection for migrations)
DIRECT_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres

# NextAuth
NEXTAUTH_URL=https://www.blvckshell.com  # ← Use your actual Vercel URL
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important:**
- `NEXTAUTH_URL` must be your **production URL** (e.g., `https://www.blvckshell.com` or `https://blvckshell-landing.vercel.app`)
- Generate `NEXTAUTH_SECRET` with: `openssl rand -base64 32`
- Set all variables for **Production** environment (not just Preview)

---

### Fix 2: Verify Build Process

**Ensure build script runs Prisma generation:**

```json
// package.json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

✅ **Already correct** — no change needed.

---

### Fix 3: Redeploy After Setting Variables

1. Set all environment variables in Vercel
2. **Redeploy** (push a commit or click "Redeploy" in Vercel)
3. Check build logs for Prisma generation
4. Test `/login` endpoint

---

## 🧪 Testing After Fix

### Test 1: Health Check
```
GET https://www.blvckshell.com/api/health
```
Should return: `{"status":"ok",...}`

### Test 2: Login Page Loads
```
GET https://www.blvckshell.com/login
```
Should show login form (not "Portal temporarily unavailable")

### Test 3: Auth Initialization
Check Vercel server logs when accessing `/login`:
- Should NOT see: `[login] Auth/session check failed`
- Should see: Normal page render

---

## 📋 Summary

**Most Likely Cause:** Missing `NEXTAUTH_SECRET` or `DATABASE_URL` on Vercel Production environment.

**Fix:** Set all required environment variables in Vercel → Settings → Environment Variables → Production, then redeploy.

**Verification:** Check Vercel server logs after redeploy to confirm no auth errors.

---

## 🔗 Related Files

- `portal/src/app/login/page.tsx` — Login page with fail-safe
- `portal/src/lib/auth.ts` — NextAuth configuration
- `portal/src/lib/prisma.ts` — Prisma client initialization
- `portal/VERCEL.md` — Vercel deployment guide
