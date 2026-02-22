# Quote Workflow End-to-End (Code-Truth)

## Statement of fact

**Walkthrough is stubbed.** Evidence: `portal/src/app/admin/quotes/[id]/walkthrough/page.tsx` only renders static text (`Area lines: {quote.areaLines.length}. Add-on lines: {quote.addOnLines.length}.`) and a "Go to pricing" link. There is no form, no "Add area line" / "Add add-on line" UI, and **no server actions exist** that create or update `QuoteAreaLine` or `QuoteAddOnLine`. The Prisma models exist and are used by `getQuote()` and the quote engine; the UI to write scope was never implemented.

---

## A) Start-to-finish user workflow (intended)

### 1. `/admin/quotes` (list)

| Question | Answer |
|----------|--------|
| **Data read** | All quotes (or filtered by status) with `site.name`, `site.address`, `pricingPolicy.cityCode`, `pricingPolicy.effectiveDate`, plus quote fields: `id`, `siteId`, `status`, `expiresAt`, `visitsPerWeek`, `billingRateCentsPerHour`, `createdAt`. |
| **Data written** | None. |
| **Server action(s)** | `listQuotes(filters?)` from `portal/src/server/actions/quote-actions.ts`. |
| **Prisma models** | `Quote` (read), `Site` (relation), `PricingPolicy` (relation). |
| **Invariants** | Admin-only via `requireAdmin()` in `listQuotes`. |

**File:** `portal/src/app/admin/quotes/page.tsx` — server component; calls `listQuotes()`; renders list and "New quote" link.

---

### 2. `/admin/quotes/new` (create)

| Question | Answer |
|----------|--------|
| **Data read** | Sites (lifecycle PROSPECT/ACTIVE), PricingPolicies. |
| **Data written** | One `Quote` row: `siteId`, `pricingPolicyId`, `status: DRAFT`, `expiresAt` (now + policy.daysValid), `visitsPerWeek: 4`, `billingRateCentsPerHour` from policy, `travelMinutesPerVisit`, `monthlySupplyCostCents`, `winterMinutesPerVisitDelta` from policy. |
| **Server action(s)** | `getPricingPolicies()`, `getSitesForQuote()` (page load); `createQuote(siteId, pricingPolicyId)` (form submit). |
| **Prisma models** | Read: `PricingPolicy`, `Site`. Write: `Quote`. |
| **Invariants** | Admin-only. `createQuote` validates policy and site exist; no other server-side validation. |

**Files:**
- `portal/src/app/admin/quotes/new/page.tsx` — fetches policies + sites, renders `CreateQuoteForm`.
- `portal/src/app/admin/quotes/new/CreateQuoteForm.tsx` — client form; onSubmit calls `createQuote(siteId, pricingPolicyId)` then `router.push(/admin/quotes/${quoteId}/walkthrough)`.

---

### 3. `/admin/quotes/[id]/walkthrough` (scope capture)

| Question | Answer |
|----------|--------|
| **Data read** | Quote by id with `site`, `pricingPolicy`, `areaLines`, `addOnLines`, latest snapshot (1). |
| **Data written** | **Nothing.** No server action is called from this page that writes to the DB. |
| **Server action(s)** | Only `getQuote(quoteId)` — read-only. **No** `createQuoteAreaLine`, `updateQuoteAreaLine`, `deleteQuoteAreaLine`, `createQuoteAddOnLine`, etc. |
| **Prisma models** | Read: `Quote`, `Site`, `PricingPolicy`, `QuoteAreaLine`, `QuoteAddOnLine`, `QuoteSnapshot`. Write: none. |
| **Invariants** | None enforced here; there is no write path. |

**File:** `portal/src/app/admin/quotes/[id]/walkthrough/page.tsx` (lines 1–39). It:
- Calls `getQuote(id)` (quote-actions).
- Renders: back link, "Walkthrough: {quote.site.name}", subtitle "Measurements → minutes (override requires reason)", a paragraph "Area lines: {quote.areaLines.length}. Add-on lines: {quote.addOnLines.length}.", and a link "Go to pricing".
- **No components** are used for adding/editing lines. **No form.** **No server actions** for scope writes.

---

### 4. `/admin/quotes/[id]/pricing` (compute snapshot + gates)

| Question | Answer |
|----------|--------|
| **Data read** | Quote (with areaLines, addOnLines, snapshots, site, pricingPolicy). |
| **Data written** | `QuoteSnapshot` when user clicks "Compute snapshot"; `Quote.status` → SENT when user clicks "Mark as SENT" (and AuditLog). |
| **Server action(s)** | `getQuote(quoteId)` (page); `computeAndPersistSnapshot(quoteId)`, `transitionQuoteToSent(quoteId)` (client). |
| **Prisma models** | Read: Quote, QuoteAreaLine, QuoteAddOnLine, QuoteSnapshot, PricingPolicy, Site. Write: QuoteSnapshot, Quote, AuditLog. |
| **Invariants** | SENT only if: quote status DRAFT or READY_FOR_REVIEW; not expired; latest snapshot exists; `passesBaseGate && passesStressGate && passesRevenueFloor`. Enforced in `transitionQuoteToSent()` in quote-actions.ts. |

**Files:**
- `portal/src/app/admin/quotes/[id]/pricing/page.tsx` — server component; `getQuote(id)`; passes props to `QuotePricingClient`.
- `portal/src/app/admin/quotes/[id]/pricing/QuotePricingClient.tsx` — client; buttons call `computeAndPersistSnapshot(quoteId)` and `transitionQuoteToSent(quoteId)`.

---

### 5. `/admin/quotes/[id]/proposal` (proposal)

| Question | Answer |
|----------|--------|
| **Data read** | Quote with site, snapshots (latest 1), areaLines, addOnLines via `getQuoteForProposal(quoteId)`. Display uses `quote.snapshots[0]` only for the numbers shown. |
| **Data written** | None. |
| **Server action(s)** | `getQuoteForProposal(quoteId)`. |
| **Prisma models** | Quote, Site, QuoteSnapshot, QuoteAreaLine, QuoteAddOnLine. |
| **Invariants** | Page shows "No snapshot yet" if `!quote.snapshots[0]`. Rendered proposal text is from **QuoteSnapshot** (snapshotVersion, riskAdjustedRevenueCents, grossMarginBps). PDF is not implemented; placeholder text says "PDF generation from snapshot data can be wired here". |

**File:** `portal/src/app/admin/quotes/[id]/proposal/page.tsx`. Proposal **does read from QuoteSnapshot** for the displayed economics; no manual final price is shown. Invariant satisfied for what exists. PDF not wired.

---

## B) Data model truth (Prisma)

All of the following **exist** in `portal/prisma/schema.prisma`.

### PricingPolicy (lines 734–758)

- `id`, `cityCode`, `effectiveDate`, `version`, `anchorBillingRateCentsPerHour`, `minimumMonthlyRevenueCents`, `defaultTravelMinutesPerVisit`, `defaultMonthlySupplyCostCents?`, `defaultWinterMinutesPerVisitDelta`, `winterStartMonth`, `winterEndMonth`, `daysValid`, `targetMarginBps`, `stressMarginBps`, `minStressMarginBps`, `subPayoutCeilingCentsPerHour`, `addonBillingRateCentsPerHour`, `addonMinMarginBps`, `riskRules` (Json).

### Quote (lines 760–787)

- **Header:** `id`, `siteId`, `pricingPolicyId`, `status` (QuoteStatus), `expiresAt`, `visitsPerWeek`, `billingRateCentsPerHour`, `billingRateOverrideReason?`, `expectedSubcontractorRateCentsPerHour?`, `payoutOverrideReason?`, `travelMinutesPerVisit`, `monthlySupplyCostCents`, `winterMinutesPerVisitDelta`, `revenueFloorOverrideReason?`, `createdAt`, `updatedAt`.
- Relations: `site`, `pricingPolicy`, `areaLines`, `addOnLines`, `snapshots`.

### QuoteAreaLine (lines 789–800)

- `id`, `quoteId`, `type` (QuoteAreaType), `measurements` (Json), `computedMinutes`, `overrideMinutes?`, `overrideReason?`. Relation: `quote`.

### QuoteAddOnLine (lines 802–815)

- `id`, `quoteId`, `name`, `estimatedLaborMinutes`, `billingRateCentsPerHour`, `expectedPayoutCentsPerHour?`, `priceCents`, `marginBps`, `includedInProposal`. Relation: `quote`.

### QuoteSnapshot (lines 817–850)

- Snapshot fields: `id`, `quoteId`, `snapshotVersion`, `pricingPolicyCityCode`, `pricingPolicyEffectiveDate`, `pricingPolicyVersion`, `billingRateCentsPerHour`, `riskMultiplierBps`, `minutesPerVisitBase|Travel|WinterDelta|Total`, `hoursPerVisit`, `monthlyHours`, `baseRevenueCents`, `riskAdjustedRevenueCents`, `monthlySupplyCostCents`, `grossProfitCents`, `grossMarginBps`, `stressGrossMarginBps`, `allowedPayoutCentsPerHourAtTarget|AtStress`, `passesBaseGate`, `passesStressGate`, `passesRevenueFloor`, `confidenceScore`, `confidenceBand`, `createdAt`.

### QuoteAreaType enum (lines 926–935)

- LOBBY, HALLWAYS, STAIRWELLS, ELEVATORS, GARBAGE, WASHROOMS, GLASS, OTHER.

**No models are missing.** Scope cannot be created because **there is no UI and no server actions** that insert/update QuoteAreaLine or QuoteAddOnLine.

---

## C) Walkthrough: why it is empty and unusable

- **Is the Walkthrough page currently a stub?**  
  **Yes.** It only displays counts and a link. No forms, no add/edit/delete for lines.

- **Are QuoteAreaLine / QuoteAddOnLine implemented but no UI to create/edit them?**  
  **Yes.** Models exist and are included in `getQuote()`. There is no UI and no server actions that create or update them.

- **Is the UI present but not wired to server actions?**  
  **No.** There is no UI for area/add-on lines.

- **Are server actions missing?**  
  **Yes.** There are no `createQuoteAreaLine`, `updateQuoteAreaLine`, `deleteQuoteAreaLine`, `createQuoteAddOnLine`, `updateQuoteAddOnLine`, `deleteQuoteAddOnLine` (or similar) in the codebase.

- **Are writes failing (validation, RBAC, Prisma)?**  
  **N/A.** No writes are attempted from the walkthrough.

**Code path:**

- **Page:** `portal/src/app/admin/quotes/[id]/walkthrough/page.tsx`  
  - Server component; `await getQuote(id)`; renders static content and one Link to pricing. No child components for lines. No actions called except `getQuote`.

- **Actions used:** Only `getQuote(quoteId)` from `portal/src/server/actions/quote-actions.ts` (lines 79–91). It returns quote with `areaLines` and `addOnLines`; the page only displays `.length`.

---

## D) What must exist on Walkthrough (minimum viable)

### Area lines UI

- **Add line:** Type selector (QuoteAreaType: LOBBY, HALLWAYS, …). Measurement inputs (e.g. presets sm/md/lg or length×width). **Computed minutes** (derived from measurements or preset). Optional **override minutes** with **required reason**.
- **Save:** Call a server action that does `prisma.quoteAreaLine.create({ data: { quoteId, type, measurements, computedMinutes, overrideMinutes?, overrideReason? } })`.
- **Edit / Delete:** Buttons that call `updateQuoteAreaLine` / `deleteQuoteAreaLine` (to be implemented).

**DB writes:** `QuoteAreaLine` only. Invariant (plan): if `overrideMinutes != null` then `overrideReason` required — enforce in server action.

### Add-on lines UI

- **Add line:** Name, estimated labor minutes, billing rate (e.g. from policy), include-in-proposal toggle. Optionally show margin; add-on margin gate (cannot include if margin &lt; policy.addonMinMarginBps) can be enforced in action.
- **Save:** `prisma.quoteAddOnLine.create({ data: { quoteId, name, estimatedLaborMinutes, billingRateCentsPerHour, priceCents, marginBps, includedInProposal } })`. Price/margin can be computed server-side from policy addon rate and min margin.
- **Edit / Delete:** Corresponding update/delete actions.

**DB writes:** `QuoteAddOnLine` only.

---

## E) Pricing step: snapshot computation (code-truth)

- **Quote engine:** `portal/src/server/pricing/quote-engine.ts`.
  - **Function:** `computeQuoteSnapshot(quoteId): Promise<ComputeQuoteSnapshotResult>`.
  - **Inputs (from DB):** Quote (with `areaLines`, `addOnLines`, `pricingPolicy`), plus quote fields: `travelMinutesPerVisit`, `winterMinutesPerVisitDelta`, `visitsPerWeek`, `billingRateCentsPerHour`, `monthlySupplyCostCents`, and policy fields (targetMarginBps, minStressMarginBps, minimumMonthlyRevenueCents, riskRules, etc.).
  - **Logic:**  
    - `baseMinutes = sum(overrideMinutes ?? computedMinutes)` over `quote.areaLines`.  
    - `totalMinutesPerVisit = baseMinutes + travelMinutes + winterDelta`.  
    - `monthlyHours = (totalMinutesPerVisit/60) * visitsPerWeek * 4.33`.  
    - If `monthlyHours <= 0` → **returns** `{ ok: false, error: "Total monthly hours must be positive" }`.  
    - Then revenue, risk-adjusted revenue, COGS ceiling, labor ceiling, allowed payout, stress scenario, gates (passesBaseGate, passesStressGate, passesRevenueFloor), confidence; returns draft.
  - **When there are zero area lines:** `baseMinutes = 0`. So `totalMinutesPerVisit = 0 + travel + winter`; if that is positive, monthlyHours can be positive. If both travel and winter are 0, then `monthlyHours = 0` and the engine returns **error** "Total monthly hours must be positive". So **zero area lines** either yields a very small scope (travel+winter only) or this error.
- **Snapshot creation/versioning:** `persistQuoteSnapshot(draft)` in same file does `prisma.quoteSnapshot.create(...)`. Version is `nextVersion = (existing max snapshotVersion) + 1`. Called from `computeAndPersistSnapshot(quoteId)` in quote-actions.ts (which calls `computeQuoteSnapshot` then `persistQuoteSnapshot`).
- **Gates:** `passesBaseGate`, `passesStressGate`, `passesRevenueFloor` are computed in the engine and stored on QuoteSnapshot. They are **enforced server-side** in `transitionQuoteToSent()` in `portal/src/server/actions/quote-actions.ts`: cannot transition to SENT unless latest snapshot exists and all three gates are true, and quote not expired.

**Files:**
- Quote engine: `portal/src/server/pricing/quote-engine.ts` (`computeQuoteSnapshot`, `persistQuoteSnapshot`).
- Quote actions: `portal/src/server/actions/quote-actions.ts` (`computeAndPersistSnapshot`, `transitionQuoteToSent`).
- Pricing page: `portal/src/app/admin/quotes/[id]/pricing/page.tsx` (server); `portal/src/app/admin/quotes/[id]/pricing/QuotePricingClient.tsx` (client; calls compute + transition).

---

## F) Proposal step: source of PDF data

- **Current behavior:** Proposal page reads quote via `getQuoteForProposal(quoteId)` and displays **only** `quote.snapshots[0]` for the economics (snapshotVersion, riskAdjustedRevenueCents, grossMarginBps). Text states "Proposal PDF generated from QuoteSnapshot only (audit version)."
- **PDF:** Not implemented; placeholder says "PDF generation from snapshot data can be wired here."
- **Invariant:** Proposal **does** read from QuoteSnapshot for the numbers shown. No manual final price field is used. So for the implemented part, the invariant is satisfied. When PDF is wired, it **must** use QuoteSnapshot only (not raw Quote or line items for final price).

---

## G) Bug list (exact blockers)

1. **Walkthrough page has no "Add area line" component or form.** File: `portal/src/app/admin/quotes/[id]/walkthrough/page.tsx`. Only static text and "Go to pricing" link.
2. **Walkthrough page has no "Add add-on line" component or form.** Same file; no UI for add-ons.
3. **Server action `createQuoteAreaLine` does not exist.** Grep: no matches for createQuoteAreaLine / QuoteAreaLine in `portal/src`.
4. **Server action `createQuoteAddOnLine` does not exist.** Same; no create/update/delete for QuoteAddOnLine.
5. **No server actions to update or delete QuoteAreaLine / QuoteAddOnLine.** So even if lines were created, they could not be edited or removed from the UI (and they cannot be created from the UI at all).
6. **Pricing page does not enforce "at least one area line" before compute.** The engine returns an error when monthly hours are not positive (which happens with 0 area lines and zero travel/winter), but the pricing UI does not pre-check scope; user sees a generic error after clicking "Compute snapshot".
7. **No preset or measurement-to-minutes logic in UI or server.** Plan mentioned presets (sm/md/lg) and measurements → computed minutes; none of this is implemented.
8. **Override minutes invariant (overrideReason required when overrideMinutes set) is not enforced in any action** because no action writes QuoteAreaLine yet.

---

## H) Required fix plan (minimum to make it usable)

### 1. Server actions (file: `portal/src/server/actions/quote-actions.ts`)

- **Add** `createQuoteAreaLine(quoteId, data: { type, measurements, computedMinutes, overrideMinutes?, overrideReason? })`.
  - Require admin. Validate: if `overrideMinutes != null` then `overrideReason` required. Load quote; ensure quote exists and is DRAFT (or allow in READY_FOR_REVIEW). Create `QuoteAreaLine`. Revalidate walkthrough path.
- **Add** `updateQuoteAreaLine(lineId, data)` and `deleteQuoteAreaLine(lineId)` (admin, quote DRAFT).
- **Add** `createQuoteAddOnLine(quoteId, data: { name, estimatedLaborMinutes, billingRateCentsPerHour?, priceCents?, marginBps?, includedInProposal })`.
  - Optionally snap billing rate from quote’s pricingPolicy.addonBillingRateCentsPerHour; compute priceCents/marginBps server-side; enforce addonMinMarginBps when includedInProposal.
- **Add** `updateQuoteAddOnLine(lineId, data)` and `deleteQuoteAddOnLine(lineId)`.

### 2. Walkthrough UI (file: `portal/src/app/admin/quotes/[id]/walkthrough/page.tsx`)

- Keep server component; keep `getQuote(id)` and pass quote (and quoteId) to a **client component** that renders area lines and add-on lines with add/edit/delete.
- **Add** client component(s), e.g. `WalkthroughScopeClient` or split into `AreaLinesEditor` and `AddOnLinesEditor`:
  - List existing `quote.areaLines` with type, computedMinutes, overrideMinutes, overrideReason; buttons Edit, Delete. "Add area line" form: type (select QuoteAreaType), measurements (e.g. JSON or preset key), computed minutes (input or derived), optional override minutes + reason; submit → `createQuoteAreaLine(quoteId, ...)`.
  - List existing `quote.addOnLines`; "Add add-on line" form: name, estimatedLaborMinutes, include in proposal; submit → `createQuoteAddOnLine(quoteId, ...)`.
- **File to add:** e.g. `portal/src/app/admin/quotes/[id]/walkthrough/WalkthroughScopeClient.tsx` (or `AreaLinesEditor.tsx` + `AddOnLinesEditor.tsx`).

### 3. Validation rules

- In `createQuoteAreaLine` / `updateQuoteAreaLine`: if `overrideMinutes != null`, require `overrideReason` (non-empty string); else return `{ ok: false, error: "Override reason required when overriding minutes" }`.
- In `createQuoteAddOnLine`: when `includedInProposal` is true, ensure marginBps >= quote.pricingPolicy.addonMinMarginBps or return error (or compute server-side and reject if below).

### 4. Optional but useful

- **Presets:** A small map or config (e.g. LOBBY_sm → 15 min, LOBBY_md → 25, …) used when user selects preset; write to `measurements` as e.g. `{ preset: "md" }` and set `computedMinutes` in the same action.
- **Pricing page:** Before "Compute snapshot", if `quote.areaLines.length === 0`, show message "Add at least one area line in Walkthrough before computing snapshot" and disable or hide the Compute button until scope exists (optional; engine already errors).

### 5. Tests to add

- **Unit:** `createQuoteAreaLine` rejects when overrideMinutes set but overrideReason missing; allows create when valid; creates QuoteAreaLine in DB.
- **Unit:** `computeQuoteSnapshot` returns error when monthly hours <= 0 (e.g. zero area lines and zero travel); returns ok when at least one area line has positive minutes.
- **Integration (optional):** Full flow: create quote → add area line → compute snapshot → transition to SENT (gates pass).

---

## I) Output format summary

| Item | Value |
|------|--------|
| **Walkthrough** | **Stubbed.** Evidence: `portal/src/app/admin/quotes/[id]/walkthrough/page.tsx` only renders `Area lines: {quote.areaLines.length}. Add-on lines: {quote.addOnLines.length}.` and a link; no form, no components for lines, no server actions that write QuoteAreaLine or QuoteAddOnLine. |
| **Quote list** | `portal/src/app/admin/quotes/page.tsx` — `listQuotes()`. |
| **New quote** | `portal/src/app/admin/quotes/new/page.tsx`, `CreateQuoteForm.tsx` — `createQuote()`. |
| **Pricing** | `portal/src/app/admin/quotes/[id]/pricing/page.tsx`, `QuotePricingClient.tsx` — `getQuote()`, `computeAndPersistSnapshot()`, `transitionQuoteToSent()`. |
| **Proposal** | `portal/src/app/admin/quotes/[id]/proposal/page.tsx` — `getQuoteForProposal()`; displays from `quote.snapshots[0]` only. |
| **Quote engine** | `portal/src/server/pricing/quote-engine.ts` — `computeQuoteSnapshot()`, `persistQuoteSnapshot()`. |
| **Quote actions** | `portal/src/server/actions/quote-actions.ts` — listQuotes, getPricingPolicies, getSitesForQuote, createQuote, getQuote, computeAndPersistSnapshot, transitionQuoteToSent, overrideBillingRate, overrideRevenueFloor, getQuoteForProposal. **No createQuoteAreaLine, createQuoteAddOnLine, or any QuoteAreaLine/QuoteAddOnLine mutations.** |
| **Prisma models** | PricingPolicy, Quote, QuoteAreaLine, QuoteAddOnLine, QuoteSnapshot, QuoteAreaType enum — all present in schema. |

**Why it was shipped like this:** The Gold Standard plan specified schema, engines, and routes. The walkthrough was implemented as a **placeholder route** (title, back link, scope counts, link to pricing) so the navigation and quote creation flow existed, with the expectation that scope-capture UI and corresponding server actions would be added later. That follow-up was not implemented, so the walkthrough cannot create quote scope and the system is non-functional for real quoting until the fixes in section H are done.
