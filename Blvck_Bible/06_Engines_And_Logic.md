# Blvck Bible — Engines and Business Logic

**Purpose:** In-depth record of pricing, quote, and site-snapshot engines and area presets.  
**Locations:** `portal/src/server/pricing/`, `portal/src/server/finance/`.  
**Update:** When formulas or gates change.

---

## Quote Engine

**File:** `src/server/pricing/quote-engine.ts`

### computeQuoteSnapshot(quoteId): Promise<ComputeQuoteSnapshotResult>

**Purpose:** Compute a single snapshot of quote economics (margin, revenue floor, confidence, gates) from current quote data and its PricingPolicy.

**Steps (conceptual):**  
1. Load Quote with area lines, add-on lines, pricing policy.  
2. Compute base minutes (area presets + overrides), travel, winter delta.  
3. Apply billing rate (and overrides).  
4. Compute base revenue, risk-adjusted revenue (riskRules from policy).  
5. Compute supply cost, gross profit, gross margin (bps).  
6. Apply stress margin (stressMarginBps, minStressMarginBps).  
7. Check gates: passesBaseGate, passesStressGate, passesRevenueFloor (minimumMonthlyRevenueCents).  
8. Compute allowed payout at target and stress (subPayoutCeilingCentsPerHour from policy).  
9. Confidence score/band (internal heuristic).  
10. Return result (and optionally persist via persistQuoteSnapshot).

**Output:** Snapshot fields used in QuoteSnapshot (billingRateCentsPerHour, riskMultiplierBps, minutesPerVisitBase/Travel/WinterDelta/Total, hoursPerVisit, monthlyHours, baseRevenueCents, riskAdjustedRevenueCents, monthlySupplyCostCents, grossProfitCents, grossMarginBps, stressGrossMarginBps, allowedPayoutCentsPerHourAtTarget/AtStress, passesBaseGate, passesStressGate, passesRevenueFloor, confidenceScore, confidenceBand).

### persistQuoteSnapshot(draft: QuoteSnapshotDraft)

**Purpose:** Write one QuoteSnapshot row from a QuoteSnapshotDraft (returned by computeQuoteSnapshot). Snapshot version is included in the draft (caller/computeQuoteSnapshot sets nextVersion = max existing + 1).

**Usage:** Called from quote-actions.computeAndPersistSnapshot after computeQuoteSnapshot. Signature: `persistQuoteSnapshot(draft): Promise<{ ok: true; id: string } | { ok: false; error: string }>`.

---

## Site Snapshot Engine

**File:** `src/server/finance/site-snapshot-engine.ts`

### computeSiteSnapshot(params: { siteId, month, ... }): Promise<...>

**Purpose:** Compute site performance for a given month: revenue (base, add-on, credits, net), COGS (payout, supply), gross profit, margin, payout ratio, reclean count, rejected checklist count, AR buckets (0–30, 31–60, 61–90, 90+).

**Inputs:** siteId, month (first day of month), and any overrides (e.g. supply allocation).  
**Data sources:** Jobs, InvoiceLineItems, Contracts, BillingAdjustments, SiteSupplyAllocation, ChecklistRun (reclean/rejected), AR from invoices.

**Output:** Structure matching SitePerformanceSnapshot fields (baseRevenueCents, addOnRevenueCents, creditsCents, netRevenueCents, payoutCogsCents, supplyCogsCents, totalCogsCents, grossProfitCents, grossMarginBps, payoutRatioBps, addOnPayoutCogsCents, addOnGrossMarginBps, recleanCount, rejectedChecklistCount, arOutstandingCents, ar_0_30_cents, ar_31_60_cents, ar_61_90_cents, ar_90_plus_cents).

### persistSiteSnapshot(siteId, month, result, computedByUserId)

**Purpose:** Insert or update SitePerformanceSnapshot (version handling); set computedAt, computedByUserId. If snapshot already exists and is OPEN, may update; if CLOSED, do not overwrite (or only recompute when explicitly allowed, e.g. Founder).

**Usage:** Called from finance-actions.computeSiteSnapshotAction and recomputeSiteSnapshot.

---

## Area Presets

**File:** `src/server/pricing/area-presets.ts`  
**Gold standard detail:** [10_Gold_Standard_Quoting.md](./10_Gold_Standard_Quoting.md).

### computeAreaMinutesFromPreset(type: QuoteAreaType, measurements: AreaMeasurements)

**Purpose:** Map QuoteAreaType and measurements (preset S/M/L, optional finish, optional count) to labor minutes. Uses BASE_MINUTES[type][preset] plus optional FINISH_ADDERS (carpet, tile, vinyl, mixed, glass-heavy, chrome, concrete, premium).

**Returns:** number (minutes) or null if preset missing/invalid.  
**Usage:** createQuoteAreaLine / updateQuoteAreaLine when payload has measurements.preset; result stored as QuoteAreaLine.computedMinutes.

### clampMinutes(value: number): number

**Purpose:** Clamp minutes to 0..MAX_COMPUTED_MINUTES (999).  
**Usage:** After computing minutes from preset or when accepting override/computed minutes in payload.

### AREA_PRESET_MINUTES (BASE_MINUTES)

**Purpose:** Default minutes per QuoteAreaType and SizePreset (S, M, L). Example: LOBBY S=15, M=25, L=40; HALLWAYS S=20, M=35, L=55. Tune via RateCard when that editor exists.  
**Usage:** computeAreaMinutesFromPreset; exported for reference.

---

## Dependencies

- **Quote engine:** Prisma (Quote, QuoteAreaLine, QuoteAddOnLine, PricingPolicy), area-presets.  
- **Site snapshot engine:** Prisma (Job, InvoiceLineItem, Contract, BillingAdjustment, SiteSupplyAllocation, ChecklistRun, Invoice, etc.).  
- **Area presets:** No DB; pure function of type and measurements.

---

*End of Engines and Business Logic.*
