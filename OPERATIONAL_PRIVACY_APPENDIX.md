# Operational & Privacy Appendix — BLVCKSHELL Portal

**Purpose:** Single source of truth for operational policies, privacy practices, and compliance posture.  
**Audience:** Legal, compliance, auditors, operations team.  
**Status:** Locked per AUTHORITATIVE_DECISIONS.md

---

## Evidence Capture and Redaction

### Capture Method

- Evidence is captured **in-app only** via device camera (`getUserMedia` API).
- **No file picker** is available to workers; evidence cannot be uploaded from device storage.
- All evidence is linked to a specific job completion and optional checklist item.

### Redaction Policy

- **Mandatory manual redaction** is required before evidence can be uploaded.
- Workers must either:
  - Draw rectangles over sensitive areas (faces, people, personal information, license plates, etc.), or
  - Confirm "No sensitive content" if the image contains no sensitive information.
- The system **enforces the capture path** (server rejects uploads unless `redactionApplied === true`).
- **Note:** The system does not cryptographically verify pixel modification. Enforcement is client-declared. For the current threat model (cleaning workforce), this is acceptable for v1.

### Privacy Posture

- **No unredacted originals are stored or accepted.**
- Redaction metadata (type, applied flag) is stored with each evidence record.
- Evidence is served only to authorized users (assigned worker, admin) via authenticated API routes.

---

## Evidence Retention Policy (D3)

- **Default retention:** 90 days from upload date.
- **Extended retention:** Evidence linked to dispute-flagged jobs is retained beyond 90 days (policy TBD; delete-on-request process to be defined).
- **Deletion:** Automated cleanup job runs daily (configurable) and deletes evidence older than retention period, skipping dispute-flagged items.
- **Logging:** Deletion events are logged (evidence IDs only, not content).

**Implementation:** See `portal/scripts/evidence-retention.ts`

---

## Tax Policy (D2)

- **Tax jurisdiction:** Ontario, Canada
- **Tax type:** HST (Harmonized Sales Tax)
- **Tax rate:** 13%
- **Scope:** Applied to all invoice subtotals (line items + adjustments).
- **Exemptions:** None in v1.
- **Multi-province:** Not supported in v1.

**Implementation:**
- Tax is computed at invoice generation and stored as a snapshot (`taxCents`).
- Invoice PDFs display: Subtotal, HST (13%), Total.
- Tax calculation: `taxCents = round(subtotalCents * 0.13)`

---

## Billing Policy (D1)

### Monthly Contract Base

- Monthly base amounts from active contracts are **auto-added** to draft invoices when generating for a client/month.
- Admin may **remove** a base line item if needed.
- **Removal requires an audit note** (reason, removedBy, removedAt).
- Removal is **logged and immutable** (no silent changes).

**Invariant:** Invoice totals are always explainable by line items + audit notes.

### Invoice Locking

- When an invoice is marked **Sent** or **Paid**, all related jobs are locked (`billableStatus = Invoiced`).
- Locked jobs cannot be modified or removed from the invoice.

---

## Vendor Owner Visibility (D4)

Vendor owners (VENDOR_OWNER role) have access to:

- **Job list:** All jobs assigned to their workforce account (read-only, no pricing).
- **Payout totals by period:** Aggregate payout totals by period (e.g., monthly summaries).

Vendor owners **do NOT** have access to:

- Per-worker earnings breakdown
- Payout line items
- Internal rate logic
- Client pricing or invoice details

**Invariant:** Transparency without internal leakage.

---

## Authentication and Access Control

- **Method:** NextAuth.js with Credentials provider; bcrypt password hashing.
- **Session:** JWT-based, 24-hour timeout.
- **Role-based access control (RBAC):** All sensitive routes and actions enforce role checks.
- **Rate limiting:** Login (5 attempts per 15 minutes per IP), lead submit (10 per 15 minutes), evidence upload (10 per 15 minutes).

---

## Data Storage and Access

- **Database:** PostgreSQL (Supabase); server-only access via Prisma.
- **File storage:** Supabase Storage; server-only access with service role key.
- **No client-side database or storage credentials** are exposed.
- **Audit logging:** All job status transitions, rejections, cancellations, and overrides are logged with actor, entity, from/to state, and metadata.

---

## Compliance and Audit

- **Audit trail:** All billing changes (invoice creation, line item additions/removals, status changes) are logged.
- **Evidence chain:** Evidence is linked to job completions and checklist runs; deletion is logged.
- **Invoice immutability:** Once Sent or Paid, invoices and related jobs are locked.

---

## Enhancement Path

- **Auto-detection/blur:** Manual redaction is sufficient for v1; auto face/person detection is a documented enhancement.
- **Multi-province tax:** Ontario HST only in v1; multi-province GST/HST configurable per client is deferred.
- **Dispute workflow:** Extended retention for dispute-flagged evidence is documented but workflow TBD.

---

*Last updated: February 2026. Align with AUTHORITATIVE_DECISIONS.md and SECURITY.md.*
