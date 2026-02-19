# Authoritative Decisions — BLVCKSHELL Portal

**Status:** Locked and authoritative. These decisions govern all implementation.  
**Date:** February 2026

---

## D1 — Monthly Contract Base

**Status:** ✅ Locked

- Monthly base is **auto-added** to draft invoices when generating for a client/month.
- Admin may **remove** a base line item.
- Removal **requires an audit note** (reason, removedBy, removedAt).
- Removal is **logged and immutable**.

**Invariant:** Invoice totals are always explainable by line items + audit notes. No silent changes.

**Implementation:** See `invoice-actions.ts` — `createDraftInvoice` auto-adds base; removal requires audit note.

---

## D2 — Tax (v1)

**Status:** ✅ Locked

- **Ontario HST only (13%)**
- No exemptions in v1
- No cross-province logic

**Invariant:** Tax is computed at invoice generation, stored as a snapshot, and printed on PDF.

**Implementation:** Invoice model stores `taxRate` and `taxAmount`; PDF shows subtotal, HST (13%), total.

---

## D3 — Evidence Retention

**Status:** ✅ Locked

- Default: **90 days**
- If `disputeFlag === true` → retention extended (no auto-delete)
- Delete-on-request deferred (documented but not implemented)

**Invariant:** Evidence is deleted by policy, not forgotten by accident.

**Implementation:** Background job/cron deletes evidence older than 90 days, skipping dispute-flagged items. Logs deletions.

---

## D4 — Vendor Owner Visibility

**Status:** ✅ Locked

- Vendor owners see:
  - Job list (assigned to their workforce)
  - Payout **totals by period** (aggregate, not per-worker)
- Vendor owners **do NOT** see:
  - Per-worker earnings
  - Payout line items
  - Internal rate logic

**Invariant:** Transparency without internal leakage.

**Implementation:** Vendor earnings page shows aggregate totals by period; no per-worker breakdown.

---

## D5 — Redaction Stance

**Status:** ✅ Locked

- Manual redaction is **formally acceptable for v1**
- Auto-detect blur is a **documented enhancement**
- Privacy posture is satisfied via:
  - In-app camera (no file picker)
  - Mandatory redaction (draw or confirm "No sensitive content")
  - Server rejection of non-redacted uploads (`redactionApplied === true` required)

**Invariant:** No unredacted originals are stored or accepted.

**Implementation:** `EvidenceCameraCapture` component; API route and `upload-actions.ts` enforce `redactionApplied === true`.

---

## What This Unlocks

With these decisions locked:

- Billing logic is **deterministic**
- Invoice PDFs are **legally coherent**
- Audit posture is **defensible**
- Implementation can no longer "guess" behavior
- **Policy ambiguity eliminated** — systems rot point removed

**Status:** Officially out of "prototype danger."

---

*This document is the single source of truth for all billing, tax, retention, vendor visibility, and evidence policies.*
