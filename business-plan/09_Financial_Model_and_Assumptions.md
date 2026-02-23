# Financial Model and Assumptions

## Blvckshell — Facilities Execution and Accountability Operator

---

## Revenue Categories (Multi-Service Model)

Revenue is tracked in five categories for margin governance and forecasting:

| Category | Description | Margin target |
|----------|-------------|----------------|
| **1. Recurring cleaning** | Tier 1: common-area cleaning under contract (flat monthly or scope-based). | 25% (gate); floor 20%. |
| **2. Turnover cleaning** | Tier 2: unit turnovers; per-unit pricing. | ≥ 25%. |
| **3. Maintenance** | Tier 4: light maintenance; hourly or flat-rate. | ≥ 30%. |
| **4. Facilities support** | Tier 5: coordination, oversight, reporting; retainer or per-event. | ≥ 25%. |
| **5. Pilot revenue** | Fixed-scope pilots (all five types); prepaid/deposit. | 30–40% (conservative 30%). |

Forecasts and KPIs use these categories so that mix shift (e.g. maintenance as a larger share of revenue) is visible and margin impact is calculated.

---

## Structured Pricing and Margin Governance

Pricing is outcome-priced where possible, scope-locked, and margin-governed. Philosophy: not cheapest, not experimental; defensible margins per tier.

### Cleaning Pricing

| Element | Rule |
|---------|------|
| Structure | Flat monthly or scope-based (areas, frequency). |
| Margin gate | 25% minimum; no contract accepted below 20% gross margin. |
| Change orders | Scope or frequency changes require written amendment and price adjustment. |

### Turnover Pricing

| Element | Rule |
|---------|------|
| Structure | Per unit; tiered by unit size or condition. |
| Labour | Labour-estimated internally; payout ceiling applied so margin ≥ 25%. |
| Margin | ≥ 25% on every turnover job. |

### Maintenance Pricing

| Element | Rule |
|---------|------|
| Rate band | $55–75/hr for labour; flat-rate for common tasks (e.g. bulb replacement, filter check) where defined. |
| Margin | ≥ 30% on maintenance work. |
| Scope | Only non-licensed, non-permit work; scope document per job. |

### Pilot Pricing

| Element | Rule |
|---------|------|
| Structure | Fixed-scope; prepaid or deposit (no net-30 for pilots). |
| Bounds | Clearly bounded scope; no out-of-scope work without change order and payment. |
| Margin | Target 30–40%; conservative forecast uses 30%. |

---

## Pricing Engine Logic

Revenue per site is determined by scope (areas, frequency, standards) and agreed price. The model uses a **site-level revenue** assumption: each site generates a monthly contract value. Pricing is set so that after labour (subcontractor payout), supplies, and site-specific costs, **gross margin falls in the 20–30% range**, with 25% as target.

| Input | Typical range (illustrative) | Use in model |
|-------|------------------------------|---------------|
| Monthly contract value per site | $2,500–$4,000 (Windsor target) | Based on local rate indicators and typical multi-residential scope; base case uses mid-range (e.g. $2,800) per site depending on size/frequency. |
| Visit frequency | 2–4x per week equivalent | Drives labour hours and payout per site. |
| Price per visit (alternative view) | $150–$350 | Can be converted to monthly equivalent for comparison. |

**Rule:** Before accepting a contract, site-level economics are estimated: revenue minus labour (at payout ceiling), supplies, and any site-specific cost. If resulting gross margin is below 20%, the contract is rejected or re-scoped unless a documented exception applies (e.g. strategic, time-limited).

---

## Blended Margin Modeling

As the mix of services shifts, company-level gross margin changes. Example conservative blend:

| Revenue category | Share of revenue (example) | Gross margin |
|------------------|----------------------------|--------------|
| Recurring cleaning | 60% | 25% |
| Turnover cleaning | 15% | 25–30% |
| Maintenance | 15% | 30–35% |
| Facilities support | 5% | 25% |
| Pilot revenue | 5% | 30–40% |

**Blended margin (example):** (0.60 × 25%) + (0.15 × 27.5%) + (0.15 × 32.5%) + (0.05 × 25%) + (0.05 × 35%) ≈ **26.5%**.

If maintenance reaches 25% of revenue (with same margin assumptions): (0.50 × 25%) + (0.15 × 27.5%) + (0.25 × 32.5%) + (0.05 × 25%) + (0.05 × 35%) ≈ **27.5%**. So increasing the share of higher-margin maintenance improves blended margin from ~25% (cleaning-only) toward ~27–28%. All math is defensible and reviewed at site and category level.

---

## Margin Governance Framework (Consolidated)

Single reference for margin policy and enforcement across the plan:

| Element | Rule |
|---------|------|
| **Target gross margin** | 25%. Pricing and payout ceiling set to achieve this at site and company level. |
| **Acceptable range** | 20–30%. Contracts outside this range require documented exception and time limit. |
| **Stress floor** | 15%. Below this only under defined stress scenario; corrective action (reprice, re-scope, or exit) required. |
| **Add-on minimum** | 30% gross margin. Recleans, spot work, and other add-ons must clear 30%; otherwise declined or re-scoped. |
| **Enforcement** | Contract acceptance gate; payout ceiling per site; site-level review; no blending to hide poor contracts. |
| **Governance** | Margin is non-negotiable for growth; no emotional pricing. If a deal cannot be done at 20%+, walk away. |

---

## Margin Enforcement Explanation

| Layer | Mechanism |
|-------|------------|
| Contract acceptance | No contract below 20% gross margin (15% only under stress scenario). |
| Payout ceiling | Maximum labour cost per site or per visit is fixed so that (Revenue − Payout − Supplies − Other direct) / Revenue ≥ 20%. |
| Add-ons | Recleans and other add-ons priced at ≥ 30% gross margin. |
| Review | Site-level P&L or equivalent reviewed so that underperforming sites are corrected or exited. |

Margin is enforced at the site and at the company level. No "blending" of high-margin and low-margin sites to hide poor contracts; each contract must be margin-compliant.

---

## Site-Level Economics (Illustrative)

| Item | Per site per month (example) |
|------|-----------------------------|
| Revenue | $2,800 |
| Subcontractor payout (ceiling) | $1,890 |
| Supplies | $140 |
| Other direct (e.g. travel, small consumables) | $70 |
| **Gross profit** | **$700** |
| **Gross margin** | **25%** |

Payout ceiling of $1,890 is set so that $2,800 − $1,890 − $140 − $70 = $700 (25%). If labour cost exceeds ceiling, the contract would be below target margin; therefore rates or scope are negotiated to stay within ceiling.

---

## Unit Economics Snapshot (Investor-Oriented)

Per-site economics and contribution to overhead at scale:

| Metric | Per site (monthly) | Per site (annualized) |
|--------|--------------------|------------------------|
| Revenue | $2,800 | $33,600 |
| Direct cost (labour + supplies + other) | $2,100 | $25,200 |
| Gross profit | $700 | $8,400 |
| Gross margin | 25% | 25% |

**Contribution to overhead (gross profit):**

| Sites | Monthly gross profit | Annual gross profit (contribution) |
|-------|----------------------|------------------------------------|
| 1 | $700 | $8,400 |
| 5 | $3,500 | $42,000 |
| 10 | $7,000 | $84,000 |
| 15 | $10,500 | $126,000 |

At $8,400/year overhead (Year 1), one site covers overhead (break-even); each additional site contributes $8,400/year to profit before founder salary or other fixed cost.

---

## Cohort and Retention Assumptions

| Assumption | Value | Use |
|------------|--------|-----|
| Site retention (renewal rate) | 80–85% | Conservative: 15–20% of sites may not renew in any 12-month period. Forecasts do not assume 100% retention. |
| Contract term | Typically 12 months | Renewal is a sales event; no automatic rollover assumed. |
| Contract LTV | $33,600 (1 year) to $67,200 (2 years) | At $2,800/month; LTV grows with retention. |
| Acquisition cost | Minimal in Year 1 | No paid acquisition model; if CAC tracked, payback target under 12 months from gross profit per site. |

---

## Retention and LTV Modeling (Investor Summary)

Investors look for retention, LTV, and LTV/CAC. Below uses plan assumptions; alternate contract values show sensitivity.

### Base case (plan: $2,800/site/month, 25% margin, 80–85% retention)

| Assumption | Value |
|------------|--------|
| Avg monthly revenue per site | $2,800 |
| Gross margin | 25% |
| Annual churn (sites not renewed) | 15–20% (conservative) |
| Implied average contract lifespan | 3–5 years (depending on churn path) |

**Lifetime value (LTV) per site:**

| Lifespan | Annual revenue | Annual gross profit | Total gross profit (LTV) |
|----------|----------------|----------------------|--------------------------|
| 3 years | $33,600 | $8,400 | $25,200 |
| 5 years | $33,600 | $8,400 | $42,000 |

**Acquisition cost (CAC) — conservative estimate:** Sales time, proposal, site walk, onboarding: **$1,500–$3,000 per site**. No paid acquisition in Year 1; if tracked, target payback &lt; 12 months from gross profit per site.

**LTV/CAC (illustrative):** At $42,000 gross profit LTV (5-year) and $3,000 CAC → **LTV/CAC ≈ 14x**. At 3-year LTV $25,200 and $2,000 CAC → **≈ 12.6x**. Both are healthy for a service business.

### Higher contract value scenario ($5,000/site/month)

| Lifespan | Annual revenue | Annual gross profit (25%) | Total gross profit (LTV) |
|----------|----------------|---------------------------|--------------------------|
| 3 years | $60,000 | $15,000 | $45,000 |
| 5 years | $60,000 | $15,000 | $75,000 |

At $3,000 CAC: **LTV/CAC = 15–25x**. This scenario illustrates how unit economics improve as contract values or retention improve; the plan does not assume $5,000/site in base case.

---

## Payout Ceiling Logic

- **Definition:** Maximum amount paid to labour (subcontractor or employee) per site per period (e.g. per month or per visit) such that gross margin target is met.
- **Formula (conceptual):** Payout ceiling = Revenue × (1 − Target margin) − Supplies − Other direct.
- **Example:** Revenue $2,800, target 25%, supplies $140, other $70 → Max labour = $2,800 − $700 − $140 − $70 = $1,890.
- **Use:** Subcontractor agreements and scheduling are managed so that actual payout does not exceed this ceiling. If a site consistently cannot be served within ceiling, the contract is renegotiated or exited.

---

## Supply Cost Considerations

| Category | Assumption |
|----------|------------|
| Supplies as % of revenue | 4–6% in base case. |
| Included | Cleaning chemicals, disposables, basic equipment (mops, buckets). Not major equipment. |
| Pass-through | Unless contract explicitly includes supplies, supplies are cost to Blvckshell; built into margin calculation. |
| Variance | Some sites may be 3–4%; others 6–8%; model uses a single blended rate (e.g. 5%) for simplicity. |

---

## Insurance Scaling Assumptions

| Phase | Assumption |
|-------|------------|
| Year 1 (0–4 sites) | Base CGL and other required policies; cost estimated at $2,000–$4,000 per year. |
| Year 2–3 | Premium may increase with revenue or site count; $4,000–$8,000 per year illustrative. |
| No assumption | That insurance cost will stay flat regardless of size; scaling is conservative. |

---

## Founder Compensation Strategy (Deferred Year 1)

| Period | Assumption |
|--------|------------|
| Year 1 | No founder salary or draw. Founder compensation deferred to preserve cash and align with break-even focus. |
| Year 2 onward | Founder salary or equivalent introduced when revenue and cash flow support it; amount not specified here but included in overhead in multi-year forecast. |

This is a conservative choice; it is not a guarantee that the business will be profitable without it. Break-even is analyzed both with and without founder salary (Section 12).

---

## Overhead Structure

| Category | Year 1 (low fixed) | Comment |
|----------|--------------------|---------|
| Insurance | $2,500–$4,000 | CGL and related; quotes in this range for Ontario services of this scope. |
| Professional (legal, accounting) | $1,500–$3,000 | Setup, filings, year-end; basic accounting expected in this range. |
| Software / tools | $500–$1,500 | Internal system, basic tools; ~$50–$200/month market subscriptions. |
| Marketing / sales (minimal) | $500–$1,500 | No large ad spend. |
| Other admin | $500–$1,000 | Bank, registration, misc. |
| **Total fixed overhead (Year 1)** | **$5,500–$11,000** | Rounded for model; use mid-range (e.g. $8,000) for base case. Company has begun or will begin collecting quotes to verify. |

**Labour cost context:** Market indications show typical local cleaner rates around $25–$50/hr (Windsor; general to deep cleaning). Subcontractor payout ceilings and margin structures are set consistent with these rates.

No office lease or full-time admin in Year 1 base case. Overhead scales in Year 2–3 as revenue and activity grow (Section 11). **Capital expenditure (CapEx):** Even a labour-heavy service business requires replacement equipment and occasional upgrades. Model includes an annual CapEx allowance of **$1,000–$3,000** (Year 1), scaling with site count (e.g. $2,000–$5,000 in Year 2–3). This covers mops, vacuums, small equipment, and tools; not major machinery. Banks expect to see CapEx acknowledged.

---

## Payroll Burden Scenario (Transition to Employees)

The base model is subcontractor-heavy. If the company shifts to employees (wages + CPP, EI, vacation, WSIB burden), total labour cost typically increases by **15–25%** versus subcontractor payout for equivalent hours, depending on benefit level and classification. In that case:

- **Margin impact:** Gross margin would compress unless prices are raised or productivity improves. The margin model would be recalibrated: either increase contract prices at renewal, or accept a lower target (e.g. 20–22%) with clear path back to 25% via efficiency or price.
- **No assumption:** The plan does not assume a shift to employees in Year 1–2; this paragraph documents the contingency so banks and investors see that the risk is acknowledged.

---

## Inflation and Escalation

The base model uses flat pricing and cost assumptions. In practice:

| Factor | Assumption if modeled | Effect |
|--------|------------------------|--------|
| **Price escalator** | 2–3% per year at renewal | Contract terms may allow annual increase; if so, revenue grows without adding sites. |
| **Labour (subcontractor) increase** | 2–3% per year | If wages rise and price does not, margin compresses by roughly 1–2 percentage points per year. |
| **Combined (3% price, 3% labour)** | Neutral to slight margin improvement | If both move in line, margin remains stable. If labour outpaces price, margin compresses; the plan’s 20% floor and payout ceiling force reprice or re-scope. |

A short note in lender or investor materials: *"With 3% annual price escalator and 3% labour increase, margin remains stable; if labour outpaces price, margin compresses and renewal pricing or scope adjustment is required per margin governance."*

---

## Assumption Summary (No Optimism Bias)

| Assumption | Value or range |
|------------|----------------|
| Gross margin target | 25% |
| Gross margin acceptable range | 20–30% |
| Gross margin stress floor | 15% |
| Add-on margin minimum | 30% |
| Supplies as % of revenue | 4–6% (e.g. 5%) |
| Founder salary Year 1 | $0 |
| Sites Year 1 | 0–4 (base case 2–3) |
| Revenue ramp | Slow; meaningful revenue from Month 4 onward |
| AR timing | 30–45 days; cash flow and LOC sized accordingly |
| Contract value per site (monthly) | $2,000–$3,500 illustrative; model uses explicit site count × monthly value |
| Revenue categories | Recurring cleaning, Turnover, Maintenance, Facilities support, Pilot (Section 04, 09) |
| Pilot conversion rate | Conservative 30–50%; pilots are pipeline, not inflated Year 1 revenue |

All projections in Sections 10, 11, and 12 use these assumptions or stated variants. No hidden optimism.
