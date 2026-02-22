# Blvck Bible — Gold Standard: Quoting

**Purpose:** Authoritative record of the quote workflow, invariants, data model, and file paths for the Blvckshell gold-standard quoting system. No manual final price; quotes are derived → validated → snapshot → frozen.  
**Source of truth:** `portal/src/server/actions/quote-actions.ts`, `portal/src/server/pricing/quote-engine.ts`, `portal/src/server/pricing/area-presets.ts`, `portal/prisma/schema.prisma`.  
**Update:** When quote workflow, gates, or line CRUD change.

---

## 1. Quote workflow (start to finish)

| Step | Route | Data read | Data written | Server action(s) | Invariants |
|------|--------|-----------|--------------|------------------|------------|
| 1. List | `/admin/quotes` | Quote, Site, PricingPolicy | — | `listQuotes(filters?)` | requireAdmin |
| 2. Create | `/admin/quotes/new` | Site (PROSPECT/ACTIVE), PricingPolicy | Quote | `getPricingPolicies()`, `getSitesForQuote()`, `createQuote(siteId, pricingPolicyId)` | Admin; policy + site exist |
| 3. Walkthrough | `/admin/quotes/[id]/walkthrough` | Quote + areaLines, addOnLines, site, pricingPolicy | QuoteAreaLine, QuoteAddOnLine | `getQuote(id)`, `createQuoteAreaLine`, `updateQuoteAreaLine`, `deleteQuoteAreaLine`, `createQuoteAddOnLine`, `updateQuoteAddOnLine`, `deleteQuoteAddOnLine` | Scope mutability: quote status DRAFT or READY_FOR_REVIEW only; override reason when override minutes set; add-on margin gate when includedInProposal |
| 4. Pricing | `/admin/quotes/[id]/pricing` | Quote + lines + snapshots | QuoteSnapshot, Quote.status (SENT), AuditLog | `getQuote(id)`, `computeAndPersistSnapshot(quoteId)`, `transitionQuoteToSent(quoteId)` | hasScope (≥1 area line, totalMinutesPerVisit > 0) to enable Compute; SENT only if gates pass + not expired |
| 5. Proposal | `/admin/quotes/[id]/proposal` | Quote + latest snapshot + lines | — | `getQuoteForProposal(quoteId)` | Proposal economics from **QuoteSnapshot only** (no manual final price) |

**File paths (pages):**

- List: `portal/src/app/admin/quotes/page.tsx`
- New: `portal/src/app/admin/quotes/new/page.tsx`, `CreateQuoteForm.tsx`
- Walkthrough: `portal/src/app/admin/quotes/[id]/walkthrough/page.tsx`, `WalkthroughScopeClient.tsx`
- Pricing: `portal/src/app/admin/quotes/[id]/pricing/page.tsx`, `QuotePricingClient.tsx`
- Proposal: `portal/src/app/admin/quotes/[id]/proposal/page.tsx`

---

## 2. Gold-standard invariants (enforced server-side)

### Scope mutability

- **Line CRUD (area + add-on)** is allowed only when `quote.status` is **DRAFT** or **READY_FOR_REVIEW**. If status is SENT, WON, LOST, or EXPIRED, `createQuoteAreaLine`, `updateQuoteAreaLine`, `deleteQuoteAreaLine`, `createQuoteAddOnLine`, `updateQuoteAddOnLine`, `deleteQuoteAddOnLine` return error.  
- **Enforced in:** every line mutation in `quote-actions.ts` via `isMutableStatus(quote.status)`.

### Override minutes ⇒ reason required

- For **QuoteAreaLine**, if `overrideMinutes != null`, then `overrideReason` must be non-empty (trimmed).  
- **Enforced in:** `createQuoteAreaLine`, `updateQuoteAreaLine` in `quote-actions.ts`.

### Add-on margin gate

- **QuoteAddOnLine:** `priceCents` and `marginBps` are **computed server-side** from policy `addonBillingRateCentsPerHour` and payout (quote’s expected subcontractor rate or payload).  
- If `includedInProposal === true` and computed `marginBps < policy.addonMinMarginBps`, the create/update is **rejected**.  
- **Enforced in:** `createQuoteAddOnLine`, `updateQuoteAddOnLine` in `quote-actions.ts`.

### Scope gate before pricing

- **Pricing page:** "Compute snapshot" is disabled and a callout is shown if `quote.areaLines.length < 1` or `totalMinutesPerVisit <= 0` (total = base + travel + winter).  
- **Quote engine:** `computeQuoteSnapshot(quoteId)` returns `{ ok: false, error: "Total monthly hours must be positive" }` when `monthlyHours <= 0`.  
- **Enforced in:** pricing page (`hasScope`), quote-engine, and optionally in `computeAndPersistSnapshot` (engine already errors).

### SENT transition gates

- **transitionQuoteToSent(quoteId):** Allowed only if: quote status is DRAFT or READY_FOR_REVIEW; quote not expired; latest snapshot exists; `passesBaseGate && passesStressGate && passesRevenueFloor`.  
- **Enforced in:** `transitionQuoteToSent()` in `quote-actions.ts`.

### Proposal from snapshot only

- Proposal page and any future PDF must use **QuoteSnapshot** for final economics (riskAdjustedRevenueCents, grossMarginBps, snapshotVersion). No manual final monthly price field.  
- **Enforced by convention:** proposal page reads `quote.snapshots[0]` only for displayed numbers.

---

## 3. Data model (Prisma)

### PricingPolicy

- **Relevant fields:** id, cityCode, effectiveDate, version, anchorBillingRateCentsPerHour, minimumMonthlyRevenueCents, defaultTravelMinutesPerVisit, defaultMonthlySupplyCostCents?, defaultWinterMinutesPerVisitDelta, winterStartMonth, winterEndMonth, daysValid, targetMarginBps, stressMarginBps, minStressMarginBps, subPayoutCeilingCentsPerHour, addonBillingRateCentsPerHour, addonMinMarginBps, riskRules (Json).  
- **Usage:** Quotes reference one policy; snapshot stores policy identity (cityCode, effectiveDate, version) at compute time.

### Quote

- **Header fields:** id, siteId, pricingPolicyId, status (QuoteStatus), expiresAt, visitsPerWeek, billingRateCentsPerHour, billingRateOverrideReason?, expectedSubcontractorRateCentsPerHour?, payoutOverrideReason?, travelMinutesPerVisit, monthlySupplyCostCents, winterMinutesPerVisitDelta, revenueFloorOverrideReason?, **riskFactors?** (Json, array of enabled factor keys), **buildingClass?** (BuildingClass: POOR/AVERAGE/PREMIUM), createdAt, updatedAt.  
- **Relations:** site, pricingPolicy, areaLines, addOnLines, snapshots.  
- **Editable via:** updateQuoteHeader (visits, travel, winter, supply cost, expected sub rate; quote must be mutable). overrideBillingRate (founder-only). updateQuoteRiskFactors (risk factor keys + building class).

### QuoteAreaLine

- **Fields:** id, quoteId, type (QuoteAreaType), measurements (Json), computedMinutes, overrideMinutes?, overrideReason?.  
- **measurements:** Typically `{ preset: "S"|"M"|"L", finish?: string, count?: number }`. Preset drives server-side computed minutes via `area-presets.ts`.

### QuoteAddOnLine

- **Fields:** id, quoteId, name, estimatedLaborMinutes, billingRateCentsPerHour, expectedPayoutCentsPerHour?, priceCents, marginBps, includedInProposal.  
- **priceCents, marginBps:** Always computed server-side; never set by client.

### QuoteSnapshot

- **Fields:** id, quoteId, snapshotVersion, **rateCardRef** (e.g. `area-presets:2026-02-22-v1`), pricingPolicyCityCode, pricingPolicyEffectiveDate, pricingPolicyVersion, billingRateCentsPerHour, riskMultiplierBps, minutesPerVisitBase/Travel/WinterDelta/Total, hoursPerVisit, monthlyHours, baseRevenueCents, riskAdjustedRevenueCents, monthlySupplyCostCents, grossProfitCents, grossMarginBps, stressGrossMarginBps, allowedPayoutCentsPerHourAtTarget/AtStress, passesBaseGate, passesStressGate, passesRevenueFloor, confidenceScore, confidenceBand, createdAt.  
- **Versioning:** snapshotVersion increments per quote (max existing + 1). **rateCardRef** records the time-system identity used (no silent drift when presets change).

### QuoteAreaType enum

- LOBBY, HALLWAYS, STAIRWELLS, ELEVATORS, GARBAGE, WASHROOMS, GLASS, OTHER.

---

## 4. Quote engine (snapshot computation)

**File:** `portal/src/server/pricing/quote-engine.ts`

### computeQuoteSnapshot(quoteId): Promise<ComputeQuoteSnapshotResult>

- **Inputs (from DB):** Quote with areaLines, addOnLines, pricingPolicy. Uses quote.travelMinutesPerVisit, winterMinutesPerVisitDelta, visitsPerWeek, billingRateCentsPerHour, monthlySupplyCostCents; policy targetMarginBps, minStressMarginBps, minimumMonthlyRevenueCents, riskRules, etc.
- **Logic:**  
  - baseMinutes = sum(overrideMinutes ?? computedMinutes) over areaLines.  
  - totalMinutesPerVisit = baseMinutes + travel + winterDelta.  
  - monthlyHours = (totalMinutesPerVisit/60) * visitsPerWeek * 4.33.  
  - If monthlyHours <= 0 → return `{ ok: false, error: "Total monthly hours must be positive" }`.  
  - Base revenue, risk-adjusted revenue, COGS ceiling, labor ceiling, allowed payout at target and stress; passesBaseGate, passesStressGate, passesRevenueFloor; confidence score/band.  
- **Output:** QuoteSnapshotDraft (all fields needed for QuoteSnapshot row).

### persistQuoteSnapshot(draft: QuoteSnapshotDraft): Promise<{ ok: true; id: string } | { ok: false; error: string }>

- **Purpose:** Insert one QuoteSnapshot row from draft. Version = existing max snapshotVersion + 1 (computed in computeQuoteSnapshot).  
- **Usage:** Called from `computeAndPersistSnapshot(quoteId)` in quote-actions (which calls computeQuoteSnapshot then persistQuoteSnapshot).

### Gates (stored on QuoteSnapshot, enforced on SENT)

- **passesBaseGate:** grossMarginBps >= policy.targetMarginBps.  
- **passesStressGate:** stressGrossMarginBps >= policy.minStressMarginBps.  
- **passesRevenueFloor:** riskAdjustedRevenueCents >= policy.minimumMonthlyRevenueCents.

---

## 5. Area presets (minutes from type + preset)

**File:** `portal/src/server/pricing/area-presets.ts`

- **computeAreaMinutesFromPreset(type: QuoteAreaType, measurements: AreaMeasurements): number | null**  
  - Uses BASE_MINUTES[type][preset] for S/M/L; optional finish adder (carpet, tile, vinyl, mixed, glass-heavy, chrome, concrete, premium).  
  - measurements.preset required for non-null result; optional measurements.count (multiplier), measurements.finish.  
- **clampMinutes(value: number): number** — clamps to 0..MAX_COMPUTED_MINUTES (999).  
- **AREA_PRESET_MINUTES** — base minutes by QuoteAreaType and SizePreset (S/M/L).  
- **Usage:** createQuoteAreaLine / updateQuoteAreaLine compute computedMinutes from preset when measurements.preset is valid; otherwise require explicit computedMinutes in payload.

---

## 6. Walkthrough UI (scope capture)

- **Area lines:** Add line (type, preset S/M/L, finish optional, override minutes + required reason). List with delete. Computed minutes shown; server derives from preset when possible.  
- **Add-on lines:** Add line (name, estimated labor minutes, include in proposal). List shows server-computed price and margin; delete.  
- **Sidebar:** Base minutes (sum of final area minutes), travel, winter delta, total minutes/visit, estimated monthly hours.  
- **"Go to pricing" link:** Enabled only when at least one area line exists and totalMinutesPerVisit > 0.

**Component:** `portal/src/app/admin/quotes/[id]/walkthrough/WalkthroughScopeClient.tsx` (client). Page passes quote id, areaLines, addOnLines, travelMinutesPerVisit, winterMinutesPerVisitDelta, visitsPerWeek.

---

## 7. Founder-only overrides

- **overrideBillingRate(quoteId, billingRateCentsPerHour, reason):** requireFounder; updates Quote, writes AuditLog.  
- **overrideRevenueFloor(quoteId, reason):** requireFounder; updates Quote, writes AuditLog.  
- **Location:** `quote-actions.ts`.

---

## 8. Tests (gold-standard coverage)

- **Override reason:** createQuoteAreaLine / updateQuoteAreaLine reject when overrideMinutes set but overrideReason missing.  
- **SENT immutability:** deleteQuoteAreaLine / deleteQuoteAddOnLine reject when quote.status is SENT.  
- **Add-on margin:** createQuoteAddOnLine rejects when includedInProposal true and marginBps < policy.addonMinMarginBps.  
- **Compute snapshot:** computeQuoteSnapshot returns error when monthly hours <= 0 (e.g. zero area lines and zero travel/winter); succeeds after at least one area line with positive minutes.  
- **Files:** `portal/src/__tests__/unit/actions/quote-actions.test.ts`, `portal/src/__tests__/unit/pricing/quote-engine.test.ts`.

---

## 9. Reference: QUOTE_WORKFLOW_CODE_TRUTH

A detailed code-truth document (workflow, data model, bug list, fix plan) was written at **portal/docs/QUOTE_WORKFLOW_CODE_TRUTH.md**. That document described the state **before** walkthrough scope capture was implemented. After implementation:

- Walkthrough is **no longer a stub:** WalkthroughScopeClient provides area line and add-on line add/delete and calls the six line CRUD actions.  
- All invariants above are enforced server-side.  
- Pricing page blocks compute when !hasScope and shows link back to walkthrough.  
- This Gold Standard doc is the ongoing source for quoting; update it when the workflow or invariants change.

---

*End of Gold Standard (Quoting).*
