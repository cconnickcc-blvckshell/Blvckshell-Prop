# CURSOR DIRECTIVE — Convert BLVCKSHELL checklists from static PDFs to interactive, DB-backed mobile forms

**Context / Problem**
Right now the "checklists" are effectively static documents (View & Print). This is not acceptable for the portal. These must be **interactive job execution forms** that workers/subcontractors complete on mobile and that **persist every action to the database**, including **required photo evidence**.

Use the existing checklist structure as the source of truth for what fields exist (e.g., Lobby Checklist CL_01 includes item IDs, required flags, photo points, fail conditions, frequency guidance, photo minimums, and "Definition of Done").

---

## Non-negotiable outcomes

### 1) Checklists must be interactive, not static

Each checklist is a **template**. When assigned to a job/site/date, it becomes an **instance** that a worker completes:

* Each item must be recorded as: `PASS | FAIL | N/A` (or similar)
* If an item fails: require a `failReason` (and optionally a note)
* Required items cannot be skipped
* Completion/submit is blocked until "Definition of Done" is satisfied

"Definition of Done" for Lobby includes: all required items pass, no visible issues, minimum photo count met, etc.

### 2) Every submission must persist to the database

We need a proper data model:

* `ChecklistTemplate` (CL_01, versioned)
* `ChecklistTemplateItem` (LOB-001…LOB-010, required flag, photo required, fail condition text)
* `Job` (assignment)
* `ChecklistRun` (the instance of a template for a job)
* `ChecklistRunItem` (each item's result, timestamps, user)
* `EvidencePhoto` (redacted image metadata + storage key)
* `IssueReport` (optional, with photos)

Templates must be **versioned** so that historical jobs remain auditable even if we update templates later.

### 3) Photo attachments must be supported at item-level and/or run-level

The Lobby checklist explicitly defines photo points and minimum photos per visit (e.g., floor after cleaning, glass doors, desk, bins; total minimum 4).
This means:

* Certain items require a photo attachment before PASS is allowed.
* The overall run must validate the minimum required evidence count.
* Photos must attach directly inside the checklist UI (not a separate upload page).

### 4) Mobile-first UX, visually stunning, fast, and idiot-proof

This portal is primarily used on phones. Build the checklist UI like a modern field-ops app:

* Big tap targets, clear progress state, one-handed use
* "Today's Jobs" → "Open Checklist" → "Complete items" → "Capture photos" → "Submit"
* Persistent progress and autosave (no lost work)
* Show completion percentage and "what's blocking submit"
* Use a premium dark theme consistent with the BLVCKSHELL admin aesthetic, but **more polished** than the current static list.

### 5) Camera must be in-app and privacy-safe (no storing unredacted originals)

Photos must be captured **inside the portal UI** using `getUserMedia` (video stream), not file picker camera which may save to camera roll.
Pipeline must be:
**capture (in memory) → detect people → redact (blur/blackout) → upload redacted only → discard original**

* Server must never receive the unredacted original.
* Store metadata: `redactionApplied=true`, `redactionType=face|person|manual`, `modelConfidence` (optional)

If detection fails, block upload and require retake or manual redact.

---

## Implementation requirements (architecture)

### A) Checklist Templates and Runs

Implement:

* Admin can manage templates (later), but for now seed from existing CL_01 structure and others.
* When a job is assigned, generate a `ChecklistRun` from the chosen template version.

### B) Validation Rules

On submit:

* All required items completed
* Required photos present for photo-required items
* Minimum photo count met (template-level rule)
* If any fail: require issue note and optionally auto-create an IssueReport

### C) Role-based access (portal safety)

Workers/subs can only see:

* Jobs assigned to them
* Their own checklist runs
  Admins can see all.

### D) Evidence storage

Use object storage (S3/Supabase storage/etc):

* Only redacted images stored
* Store `storageKey`, `jobId`, `checklistRunId`, `itemId`, `capturedByUserId`, timestamps

---

## Deliverables Cursor must produce

1. **DB schema / Prisma models** (or your current DB layer) for templates + runs + evidence
2. **Routes/API**:

   * create run from template
   * save item result (autosave)
   * upload redacted evidence
   * submit run (final validation)
3. **Mobile UI screens**:

   * Jobs list
   * Checklist run execution view
   * Item row component with PASS/FAIL + photo capture
   * Evidence gallery preview
   * Submit + blocking reasons panel
4. **Camera + redaction client module**

   * in-browser detection (MediaPipe or equivalent)
   * canvas redaction
   * upload redacted blob only

---

## Reference checklist structure you must follow

Lobby Checklist (CL_01) includes:

* Item IDs (LOB-001…LOB-010)
* Required Yes/No
* Photo Point per item
* Fail Condition text
* Frequency guidance
* Photo requirements minimums
* Definition of Done
  Build the system so all other checklists can follow the same schema.

---

## ADDITIONAL NON-NEGOTIABLE REQUIREMENT: Client/Site history + invoicing linkage

### 6) Every checklist run must attach to the Client profile (and Site) as permanent job history

This portal is not just "workers ticking boxes." Completed runs must create an **auditable service record** that can be reviewed later by admin/ops and used for invoices and disputes.

**Data relationships must support:**

* `Client` (property management company)
* `Site` (building/property under that client)
* `ServiceContract` / `Scope` (what they pay for, frequency, included checklists)
* `Job` (a scheduled or ad-hoc visit for a site)
* `ChecklistRun` (execution evidence for that job)
* `Invoice` (groups jobs/runs into billable periods)

**Invariants:**

* A `Job` must belong to exactly one `Site`.
* A `Site` must belong to exactly one `Client`.
* A `ChecklistRun` must belong to exactly one `Job`.
* Therefore every run is automatically tied to `Site` + `Client` for history.

### 7) History views are first-class screens (not an afterthought)

Build screens/components:

* **Client Profile → Sites → Job History**
* Filter by date range, site, checklist type, status, worker
* Each history row opens:

  * checklist item results
  * notes/fail reasons
  * redacted photo evidence gallery
  * timestamps + who completed/approved

### 8) Invoicing must be supported by the data model from day one (even if invoice UI comes later)

Each job/run must carry billable metadata so invoices can be generated deterministically later:

* `billableRateType`: `perVisit | perChecklist | hourly | flatMonthly`
* `rate` (or reference to rate card)
* `billableStatus`: `pending | approved | invoiced | void`
* `invoiceId` nullable (set when included on invoice)
* `approvedAt`, `approvedBy` (if approvals exist)

At minimum, Cursor must implement:

* data fields to support invoice creation
* query endpoints to fetch **uninvoiced completed jobs** for a client/site and aggregate totals

### 9) Approval workflow (optional UI, required data seams)

Even if v1 doesn't have a heavy approval UX, add the seam:

* `ChecklistRun.status`: `InProgress | Submitted | Approved | Rejected`
* Invoices can only include `Approved` runs (or `Submitted` if admin chooses, but keep the flag).
Add this to Cursor too. It locks in the **finance spine** so you don't rebuild later.

---

## ADDITIONAL REQUIREMENT: Invoices + Payroll/Receipts must be generated from completed checklist jobs

### 10) Invoice generation (Client-facing accounting artifacts)

Invoices must be generated from **approved completed Jobs/ChecklistRuns** tied to a Client/Site.

**Data model must include:**

* `Invoice`

  * `id`, `clientId`, `invoiceNumber` (sequential, per-tenant/company), `periodStart`, `periodEnd`
  * `status`: `Draft | Sent | Paid | Void`
  * `issuedAt`, `dueAt` (net 15/30), `notes`, `subtotal`, `tax`, `total`
* `InvoiceLineItem`

  * `invoiceId`
  * reference to billable source: `jobId` and/or `checklistRunId`
  * `description`, `qty`, `unitPrice`, `amount`
  * `siteId` (so line items show building)

**Invariants / rules:**

* Only `Approved` jobs/runs can be invoiced
* Once a job is invoiced, it becomes locked: `billableStatus = Invoiced`, `invoiceId != null`
* Invoice totals must be deterministic from line items (no manual math stored as truth)

**MVP features required:**

* "Generate invoice" flow:

  * choose Client
  * choose period
  * system lists all `Approved` uninvoiced jobs/runs
  * select all / deselect
  * generate `Draft` invoice with line items
* Export:

  * PDF invoice download (server-side generation)
  * optional CSV export for bookkeeping

### 11) Subcontractor receipts / pay statements (Sub payouts)

Subcontractors need a **pay statement** generated from the jobs they completed.

**Data model:**

* `PayoutBatch` (per pay period)

  * `id`, `periodStart`, `periodEnd`, `status`: `Draft | Approved | Paid`
* `Payout`

  * `payoutBatchId`, `workerId` (sub), `subtotal`, `tax` (if applicable), `total`
* `PayoutLineItem`

  * references `jobId` and/or `checklistRunId`
  * `description`, `qty`, `unitPrice`, `amount`, `siteId`

**Rules:**

* A job/run can be included in **exactly one** payout line item (avoid double pay)
* Store `payableStatus`: `Pending | Approved | Paid`
* Payout artifacts:

  * PDF pay statement/receipt for the subcontractor
  * If subs charge HST/GST, support adding their tax on payout (configurable per sub)

### 12) Employee payroll export (Hours-based)

Employees may be hourly.

**Data model seam:**

* `TimeEntry`

  * `workerId`, `jobId`, `clockInAt`, `clockOutAt`, `breakMinutes`, `approvedBy`, `approvedAt`
* OR if you're not doing live clock-in yet:

  * allow "job duration" entry on closeout and generate TimeEntry from it

**Payroll outputs (MVP):**

* Pay period report by employee:

  * total hours, regular vs overtime (optional seam)
  * gross pay estimate (if you store pay rate)
* Export CSV compatible with payroll provider (even if you don't integrate yet)

### 13) Access + audit (finance-grade)

* Only Admin/Ops can generate invoices/payouts
* Workers can only view **their** pay statements (subs) / their time summaries (employees)
* Every invoice/payout generation action must be audited:

  * `createdBy`, `createdAt`, and immutable references to the jobs included

---

## Deliverables Cursor must implement for this section

1. Schema additions (Invoice, LineItems, Payouts, TimeEntries)
2. Endpoints/queries:

   * list uninvoiced approved jobs by client + period
   * create draft invoice with selected jobs
   * list unpaid payable jobs by worker + period
   * create payout batch + statements
3. PDF generation:

   * invoice PDF
   * subcontractor pay statement PDF
4. Basic admin UI pages:

   * Invoices list + invoice detail
   * Payout batches list + payout detail
   * Payroll export page (CSV)

---

## BILLING MODEL REQUIREMENT: Mixed billing (Monthly flat + One-offs + Adjustments)

### 14) Contracts must support monthly flat billing per Site (Net 30) + variable extras

We will support two billable streams simultaneously:

**A) Recurring Contract (Monthly Flat)**

* A Site under a Client can have an active monthly contract.
* The contract generates a monthly base line item (even if no ad-hoc jobs).
* Contract is billed **Net 30** by default.

**B) One-off / Pilot jobs**

* Jobs can be billed independently (per job/per visit/per checklist) and attached to the same Client/Site.
* These can be included in the same invoice as the monthly base for that period.

### 15) Adjustments must exist as first-class objects (extra charges + discounts)

We must never "edit totals" manually. Instead, we attach **adjustments** (positive or negative) with reasons.

Examples:

* Extra charge: biohazard cleanup, heavy salt, flooding, emergency call-in
* Discount/credit: missed scope, complaint resolution, goodwill credit
* Pass-through costs: supplies, dump fees (if applicable)

**Data model:**

* `Contract`

  * `id`, `clientId`, `siteId`
  * `billingCadence`: Monthly
  * `monthlyBaseAmount`
  * `netTermsDays` default 30
  * `effectiveStart`, `effectiveEnd?`
  * `status`: Active/Paused/Ended
* `RateCard` (optional seam, but recommended)

  * per job type, per checklist type, hourly, etc.
* `BillingAdjustment`

  * can attach to: `Invoice` OR `Site` (then pulled into invoice by period) OR `Job`
  * `type`: `Charge | Discount | Credit`
  * `amount` (signed or separate type + positive amount)
  * `reasonCode` (enum) + `notes`
  * `createdBy`, `createdAt`
  * `evidencePhotoIds[]` optional (redacted)
  * `status`: `Proposed | Approved | Applied | Voided`

**Invariant:** invoice totals = sum(monthly base + job line items + approved adjustments) + tax.

### 16) Invoice composition rules (deterministic)

When generating an invoice for `Client` + `Period`:

1. Include each Site's monthly base (for active contracts in that period)
2. Include all `Approved` uninvoiced one-off jobs in that period
3. Include all `Approved` adjustments that apply to that period and are not yet applied
4. Apply taxes (configurable per client/site/service type)

**All included items must be locked** once invoice leaves Draft:

* snapshot amounts + descriptions
* store references to source objects (contract/job/adjustment ids)

### 17) Job pricing fields (so one-offs don't become custom hacks)

Each Job must carry pricing context, either:

* direct: `unitPrice`, `qty`, `pricingModel`
* or reference: `rateCardItemId`

Minimum required:

* `pricingModel`: `IncludedInContract | Fixed | Hourly | PerChecklist | PerVisit`
* `billableAmount` (for Fixed)
* `billableStatus`: Pending/Approved/Invoiced/Void
* `invoiceId` nullable

### 18) Scope creep protection (must be explicit)

Any non-standard work must be captured as:

* a `Job` with pricingModel ≠ IncludedInContract
  OR
* a `BillingAdjustment` with reason + approval

No "silent extras."

### 19) Portal/UX implications (simple v1)

Admin UI must support:

* Client → Sites → Contract (monthly base, net terms, effective dates)
* "Add Adjustment" (charge/discount) with reason + optional photo
* "Generate Invoice" selecting period (system auto-builds draft)

---

## What Cursor must implement now (MVP)

* Schema: Contract + Adjustment + Invoice composition fields
* Queries: build invoice draft for client+period using rules above
* UI: manage contract monthly base + add adjustments + generate invoice
* Locking: once invoice is Sent/Paid, the line items are immutable snapshots
