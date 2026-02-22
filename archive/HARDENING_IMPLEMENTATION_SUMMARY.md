# Hardening Implementation Summary

**Date:** February 2026  
**Status:** ✅ Complete

---

## What Was Implemented

### 1. Middleware Protection ✅

**File:** `portal/src/middleware.ts`

- Route protection for `/admin/**`, `/jobs/**`, `/vendor/**`, `/portal`
- Defense-in-depth: Even if a layout/route is misconfigured, middleware blocks unauthorized access
- Role-based redirects (ADMIN → `/admin`, workers → `/jobs`)

---

### 2. Rate Limiting ✅

**Files:**
- `portal/src/lib/rate-limit.ts` — Rate limiting utility (in-memory, edge-compatible)
- `portal/src/middleware.ts` — Rate limiting applied to sensitive endpoints

**Limits:**
- Login: 5 attempts per 15 minutes per IP
- Lead submit: 10 requests per 15 minutes per IP
- Evidence upload: 10 requests per 15 minutes per IP

**Note:** v1 uses in-memory store. For production scale, migrate to Redis/Upstash/Vercel KV.

---

### 3. Invoice Auto-Base Logic ✅

**File:** `portal/src/server/actions/invoice-actions.ts`

- `createDraftInvoice` now auto-adds monthly base from active contracts (D1)
- Admin can remove base lines (requires audit note — to be implemented in UI)
- `recomputeInvoiceTotals` computes tax correctly

---

### 4. Tax Snapshot + PDF Correctness ✅

**Files:**
- `portal/src/server/actions/invoice-actions.ts` — Tax calculation (Ontario HST 13%)
- `portal/src/app/api/invoices/[id]/pdf/route.ts` — PDF shows "HST (13%)" instead of "Tax"

**Implementation:**
- Tax computed as `round(subtotalCents * 0.13)`
- Stored in `taxCents` field
- PDF displays: Subtotal, HST (13%), Total

---

### 5. Evidence Retention Job ✅

**File:** `portal/scripts/evidence-retention.ts`

- Deletes evidence older than 90 days (D3)
- Skips dispute-flagged items (when schema includes `disputeFlag`)
- Logs deletions (IDs only, not content)
- Can be run via cron or scheduled task

**Usage:**
```bash
npx tsx scripts/evidence-retention.ts
```

---

### 6. Vendor Payout Totals Page (D4) ✅

**File:** `portal/src/app/(worker)/vendor/earnings/page.tsx`

- Shows payout totals by period (aggregate, not per-worker)
- Summary cards: Total Earnings, Paid, Pending
- Period list with job count and status
- Added to WorkerNav for VENDOR_OWNER role

---

## Documentation Created

1. **AUTHORITATIVE_DECISIONS.md** — Locked decisions (D1–D5)
2. **OPERATIONAL_PRIVACY_APPENDIX.md** — Operational policies, privacy practices, compliance posture
3. **PRE_LAUNCH_CHECKLIST.md** — Pre-launch verification checklist
4. **HARDENING_IMPLEMENTATION_SUMMARY.md** — This document

---

## Next Steps (Post-Launch)

1. **UI for base removal audit note:** Add UI to require audit note when admin removes monthly base line item
2. **Dispute flag:** Add `disputeFlag` to Evidence/Job schema when dispute workflow is defined
3. **Rate limiting migration:** Migrate from in-memory to Redis/Upstash/Vercel KV when scaling
4. **Cron setup:** Configure cron job for evidence retention script (e.g., daily at 2 AM)

---

## Testing Checklist

- [ ] Test middleware blocks unauthorized access to `/admin/**`
- [ ] Test rate limiting on login (5 attempts)
- [ ] Test draft invoice auto-adds monthly base
- [ ] Test invoice PDF shows HST (13%) correctly
- [ ] Test vendor earnings page shows payout totals by period
- [ ] Test evidence retention script deletes old evidence

---

*All hardening tasks complete. System is ready for pre-launch checklist verification.*
