# Deployment Notes — Hardening & Stackable Templates

**Date:** February 2026  
**Commit:** 74fc953

---

## What Was Pushed

### ✅ Hardening Features (Backend - No UI Required)

1. **Middleware Protection** (`portal/src/middleware.ts`)
   - Route guards for `/admin/**`, `/jobs/**`, `/vendor/**`
   - Rate limiting for login, lead submit, evidence upload
   - **Not visible in UI** - works automatically

2. **Rate Limiting** (`portal/src/lib/rate-limit.ts`)
   - Login: 5 attempts per 15 minutes per IP
   - Lead submit: 10 requests per 15 minutes per IP
   - Evidence upload: 10 requests per 15 minutes per IP
   - **Not visible in UI** - returns 429 error when exceeded

3. **Invoice Auto-Base** (`portal/src/server/actions/invoice-actions.ts`)
   - Monthly base auto-added when creating draft invoice
   - **Visible in:** `/admin/invoices/new` → Create draft → Auto-populates base lines

4. **Tax Calculation** (`portal/src/server/actions/invoice-actions.ts`, PDF route)
   - Ontario HST 13% computed automatically
   - **Visible in:** Invoice PDF shows "HST (13%)" line

5. **Vendor Earnings Page** (`portal/src/app/(worker)/vendor/earnings/page.tsx`)
   - **Visible in:** `/vendor/earnings` (for VENDOR_OWNER role)
   - Shows payout totals by period (aggregate, not per-worker)

6. **Evidence Retention Script** (`portal/scripts/evidence-retention.ts`)
   - **Not visible in UI** - run via cron or manually
   - Deletes evidence older than 90 days

---

### ✅ Stackable Checklist Templates (UI Feature)

**Location:** `/admin/clients/[id]` → Each site shows "Checklist Templates" section

**What Changed:**
- **Before:** Only one template per site (replaced when assigning new one)
- **After:** Multiple templates per site (stackable)

**How to Use:**
1. Go to `/admin/clients` → Click on a client
2. Scroll to a site → See "Checklist Templates" section
3. Select a template from dropdown → Click "Add Template"
4. Multiple templates will be listed with "Remove" buttons
5. When worker completes job, all active templates are merged into one checklist

**Migration Required:**
```bash
cd portal
npx prisma migrate deploy
# or
npx prisma migrate dev
```

---

## What's Visible in Admin Portal

### Admin Routes (All Protected by Middleware)

- `/admin` → Dashboard (redirects to `/admin/jobs`)
- `/admin/clients` → Client list
- `/admin/clients/[id]` → **Checklist Templates visible here** ✅
- `/admin/clients/new` → New client form
- `/admin/workforce` → Workforce accounts
- `/admin/jobs` → Jobs list
- `/admin/jobs/new` → New job form
- `/admin/jobs/[id]` → Job detail (approve/reject)
- `/admin/invoices` → Invoice list
- `/admin/invoices/new` → **Auto-base feature works here** ✅
- `/admin/invoices/[id]` → **PDF shows HST (13%)** ✅
- `/admin/payouts` → Payout batches
- `/admin/workorders` → Work orders
- `/admin/incidents` → Incidents
- `/admin/docs` → Documentation

### Worker Routes (Protected by Middleware)

- `/jobs` → Job list
- `/jobs/[id]` → Job detail (checklist completion)
- `/profile` → Profile
- `/earnings` → Earnings (for workers)
- `/vendor/earnings` → **Payout totals (for vendor owners)** ✅
- `/vendor/jobs` → Vendor jobs list
- `/vendor/team` → Vendor team

---

## Post-Deployment Steps

### 1. Run Database Migration

```bash
cd portal
npx prisma migrate deploy
```

This adds `checklistId` column to `ChecklistTemplate` table.

### 2. Verify Checklist Templates

1. Log in as ADMIN
2. Go to `/admin/clients`
3. Click on a client
4. Scroll to a site
5. You should see "Checklist Templates" section
6. Try adding multiple templates - they should stack

### 3. Test Invoice Auto-Base

1. Go to `/admin/invoices/new`
2. Select a client and period
3. Click "Create draft"
4. Go to invoice detail page
5. Monthly base lines should be auto-added (if contracts exist)

### 4. Test Tax Calculation

1. Create a draft invoice
2. Add some jobs
3. Download PDF
4. Verify it shows "HST (13%)" line

### 5. Test Vendor Earnings (if you have vendor owner account)

1. Log in as VENDOR_OWNER
2. Go to `/vendor/earnings`
3. Should see payout totals by period

---

## Troubleshooting

### Checklist Templates Not Showing

- **Check:** Did you run the migration? (`npx prisma migrate deploy`)
- **Check:** Are you logged in as ADMIN?
- **Check:** Does the site exist? Go to `/admin/clients/[id]`

### Invoice Auto-Base Not Working

- **Check:** Does the client have active contracts?
- **Check:** Are contracts in the invoice period?
- **Check:** Server logs for errors

### Rate Limiting Too Strict

- Edit `portal/src/middleware.ts` to adjust limits
- Current: Login 5/15min, Lead/Upload 10/15min

---

## Files Changed

- `portal/src/middleware.ts` (new)
- `portal/src/lib/rate-limit.ts` (new)
- `portal/src/server/actions/invoice-actions.ts` (modified)
- `portal/src/app/api/invoices/[id]/pdf/route.ts` (modified)
- `portal/src/app/(worker)/vendor/earnings/page.tsx` (new)
- `portal/src/app/admin/clients/[id]/ChecklistManager.tsx` (modified)
- `portal/src/app/admin/clients/[id]/checklist-actions.ts` (modified)
- `portal/src/app/admin/clients/[id]/page.tsx` (modified)
- `portal/src/server/actions/checklist-run-actions.ts` (modified)
- `portal/prisma/schema.prisma` (modified)
- `portal/prisma/migrations/20260219000000_add_checklist_id_to_template/migration.sql` (new)

---

*All changes pushed to `main` branch. Run migrations before testing.*
