# Release policy appendix

**Status:** Locked (pending your explicit approval of D1–D5).  
**Purpose:** Single source of truth for billing, tax, retention, vendor visibility, and evidence for release and audits.

---

## Evidence and redaction (Phase 3)

- Evidence is captured via **in-app camera** with **mandatory manual redaction** (draw areas or confirm “No sensitive content”). The system enforces the capture path but **does not cryptographically verify** pixel modification.
- A malicious actor could forge a POST with `redactionApplied=true`; for the current threat model (cleaning workforce), this is **acceptable for v1**. Privacy by design and data minimization are satisfied.
- **Enhancement path:** Auto face/person detection/blur can be added later without schema changes.

---

## Decision 1 — Billing base behavior

**Locked:** **A) Monthly base auto-added by default** when generating a draft invoice for a client/month. Admin may remove a base line with an audit note if needed.

---

## Decision 2 — Tax handling v1

**Locked:** **A) Ontario HST only (13%)**, no exemptions in v1. Invoice line items and PDF reflect HST where applicable. Heavier GST/HST-per-client or multi-province is deferred.

---

## Decision 3 — Evidence retention

**Locked:** **90 days default** for photos/evidence. Retention is **extended** when a job/evidence is dispute-flagged. Manual delete-on-request process to be defined (support/legal); not required for initial release.

---

## Decision 4 — Vendor owner visibility (money)

**Locked:** **B) Jobs + payout totals per period.** Vendor owners see their jobs (current) plus **aggregate payout totals by period** (e.g. by month or pay period). They do **not** see full per-worker payout breakdown (that remains admin-only).

---

## Decision 5 — Manual redaction (formal)

**Locked:** Manual redaction is **sufficient for v1**; auto-detection is an **enhancement**. This is the formal release stance for audits and product docs.

---

## Implementation notes (for Cursor/hardening)

- **Middleware:** Add route guards for `/admin/**`, `/jobs/**` (worker), and `/vendor/**` so one routing mistake cannot expose protected pages.
- **Rate limiting:** Add for login, lead submit, and evidence upload (edge or API-level) before scaling.
- **Billing code:** Implement auto-add of monthly base to draft invoices per Decision 1; add Ontario HST (13%) to invoice logic and PDF per Decision 2.
- **Retention:** Document 90-day default and dispute-extension in SECURITY.md or ops runbook; implement automated or scheduled purge/archive when you add retention tooling.
- **Vendor payout visibility:** Add a “Payout totals by period” view for vendor owners (no per-worker breakdown) per Decision 4.

---

*Document version: 1.0. Approve D1–D5 to treat as release policy.*
