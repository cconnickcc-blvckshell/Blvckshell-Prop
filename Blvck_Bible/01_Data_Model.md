# Blvck Bible — Data Model

**Purpose:** In-depth record of every Prisma model and enum.  
**Source of truth:** `portal/prisma/schema.prisma`  
**Update:** When schema or migrations change.

---

## Overview

The Blvckshell portal uses a single PostgreSQL database with Prisma ORM. Models are grouped by bounded area. All monetary values are stored in **cents** (Int). Templates use versioned pattern (logicalId + version, status Draft/Active/Archived).

---

## Bounded Area 1: Client & Sites

### ClientOrganization

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| name | String | Display name |
| primaryContactName, primaryContactEmail, primaryContactPhone | String | Primary contact |
| notes | String? | Optional notes |
| requiredPaymentRail | PaymentRail | Required payment method (STRIPE, SPARC, EFT). Default STRIPE. |
| createdAt | DateTime | |

**Relations:** clientContacts, contracts, invoices, payments, portalUsers (User), sites.  
**Usage:** Client org is the billing and access boundary for client portal users. `requiredPaymentRail` enforces which payment method the client uses for self-pay.

---

### ClientContact

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| clientOrganizationId | String | FK |
| name, email, phone, role | String / String? | Contact details |
| isActive | Boolean | Default true |
| createdAt | DateTime | |

**Usage:** Additional contacts per client org.

---

### Site

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| clientOrganizationId | String | FK |
| name, address | String | Site identity |
| accessInstructions, serviceWindow | String? | Operations |
| estimatedDurationMinutes | Int? | Scheduling hint |
| requiredPhotoCount | Int | Default 4 (evidence) |
| suppliesProvidedBy | Enum (COMPANY, CLIENT, MIXED) | Who provides supplies |
| doNotEnterUnits | Boolean | Default true |
| isActive, lifecycleStatus | Boolean, Enum (PROSPECT, ACTIVE, INACTIVE) | |
| siteTemplateId, siteTemplateVersion | String?, Int? | Optional template snapshot ref |
| createdAt / updatedAt | DateTime | |

**Relations:** accessCredentials, billingAdjustments, checklistTemplates, contracts, incidentReports, invoiceLineItems, jobs, quotes, siteAssignments, siteSupplyAllocations, sitePerformanceSnapshots, workOrders.  
**Usage:** One site per building/location; jobs and contracts are per site.

---

### SiteAssignment

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| siteId, workforceAccountId?, workerId? | String | FK |
| roleOnSite | String? | Role label |
| isActive | Boolean | Default true |
| createdAt, updatedAt | DateTime | |

**Usage:** Links site to workforce account and/or specific worker.

---

### AccessCredential

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| siteId | String | FK |
| type | Enum (KEY, FOB, CODE) | |
| identifier, identifierHash, identifierHint | String? | Optional; hash for sensitive |
| issuedToWorkerId, issuedAt, returnedAt | String?, DateTime, DateTime? | |
| status | Enum (ACTIVE, LOST, RETURNED) | Default ACTIVE |
| notes | String? | |

**Usage:** Keys/fobs/codes per site; can be issued to worker.

---

## Bounded Area 2: Workforce & Users

### WorkforceAccount

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| type | WorkforceAccountType | INTERNAL or VENDOR |
| classification | WorkforceClassification | EMPLOYEE or CONTRACTOR (default CONTRACTOR) |
| allowedPaymentMethod | PaymentMethodType | PAYROLL, EFT, or CHEQUE (default EFT) |
| displayName, legalName | String, String? | |
| primaryContactName, primaryContactEmail, primaryContactPhone | String | |
| hstNumber, wsibAccountNumber | String? | |
| isActive | Boolean | Default true |
| complianceSuspended | Boolean | Blocks job assignment and payout if true (default false) |
| createdAt, updatedAt | DateTime | |

**Relations:** auditLogs, complianceDocuments, jobs, payoutLines, siteAssignments, users, workOrders, workers.  
**Usage:** Internal or vendor “company”; workers and payouts belong to an account.

---

### User

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| email | String | Unique |
| passwordHash | String | |
| role | Enum (ADMIN, FOUNDER, CLIENT, VENDOR_OWNER, VENDOR_WORKER, INTERNAL_WORKER) | |
| workforceAccountId?, clientOrganizationId? | String? | FK for scope |
| name, phone | String, String? | |
| isActive | Boolean | Default true |
| createdAt | DateTime | |

**Relations:** auditLogs, worker (1:1 optional), workforceAccount, clientOrganization, and many “created” template relations.  
**Usage:** One user per login; role + workforceAccountId/clientOrganizationId/workerId (via Worker) drive RBAC.

---

### Worker

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| userId | String | Unique FK to User |
| workforceAccountId | String | FK |
| hasPhotoIdOnFile | Boolean | Default false |
| isActive | Boolean | Default true |
| createdAt, updatedAt | DateTime | |

**Relations:** user, workforceAccount, checklistRuns, jobs (assignedJobs), jobCompletions, siteAssignments, incidentReports, accessCredentials (issued).  
**Usage:** Worker persona; job assignment and completion are per Worker.

---

### ComplianceDocument

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| workforceAccountId | String | FK |
| type | Enum (COI, WSIB, AGREEMENT, HST, OTHER) | |
| storagePath | String | Supabase path |
| expiresAt | DateTime? | |
| uploadedAt | DateTime | |

**Usage:** Compliance docs per workforce account; stored in compliance bucket.

---

## Bounded Area 3: Checklists

### ChecklistTemplate

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| siteId | String | FK |
| checklistId | String? | Optional logical id (stackable) |
| version | Int | Default 1 |
| isActive | Boolean | Default true |
| items | Json | Array of item definitions |
| createdAt | DateTime | |

**Usage:** Per-site checklist definition; versioned; ChecklistRun stores templateSnapshot at run creation (gold standard).

---

### ChecklistRun

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| jobId, checklistTemplateId | String | FK |
| templateVersion | Int | Snapshot of version at run time |
| status | Enum (InProgress, Submitted, Approved, Rejected) | Default InProgress |
| completedByWorkerId | String | FK |
| submittedAt, approvedAt, approvedById | DateTime?, String? | |
| templateSnapshot | Json? | Frozen item definitions at run creation |
| templateSnapshotHash, templateSnapshotCapturedAt | String?, DateTime? | Integrity |
| createdAt, updatedAt | DateTime | |

**Relations:** checklistTemplate, completedByWorker, job, items (ChecklistRunItem), evidence.  
**Usage:** One run per job per checklist; must be Submitted before job can move to APPROVED_PAYABLE.

---

### ChecklistRunItem

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| checklistRunId, itemId | String | itemId from template |
| result | String | e.g. pass/fail |
| failReason, note | String? | |
| completedAt, completedByWorkerId | DateTime?, String? | |

**Usage:** Per-item result for a run; unique (checklistRunId, itemId).

---

## Bounded Area 4: Jobs & Completion

### Job

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| siteId | String | FK |
| scheduledStart, scheduledEnd | DateTime, DateTime? | |
| status | Enum (SCHEDULED, COMPLETED_PENDING_APPROVAL, APPROVED_PAYABLE, PAID, CANCELLED) | Default SCHEDULED |
| payoutAmountCents | Int | |
| assignedWorkforceAccountId?, assignedWorkerId? | String? | FK |
| isMissed, missedReason | Boolean, String? | |
| makeGoodJobId?, isReclean, recleanOfJobId?, recleanReason? | String?, Boolean, String?, String? | Make-good and reclean links |
| qualityRejectedAt | DateTime? | |
| startedAt, endedAt, actualDurationMinutes | DateTime?, Int? | |
| checkInMethod | String? | |
| pricingModel | Enum? (IncludedInContract, Fixed, Hourly, PerChecklist, PerVisit) | Default Fixed |
| billableAmountCents?, billableStatus | Int?, Enum (Pending, Approved, Invoiced, Void) | Default Pending |
| invoiceId?, approvedAt, approvedById | String?, DateTime?, String? | |
| approvalFlaggedAt | DateTime? | Overdue approval flag |
| jobTemplateId?, jobTemplateVersion? | String?, Int? | Optional template ref |
| createdAt | DateTime | |

**Relations:** site, assignedWorker, assignedWorkforceAccount, invoice, checklistRuns, makeGoodJob/recleans, completion (JobCompletion), approvedBy.  
**Usage:** Core work unit; state machine in state-machine.ts.

---

### JobCompletion

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| jobId | String | Unique FK |
| completedByWorkerId | String | FK |
| completedAt | DateTime | Default now() |
| checklistResults | Json | |
| notes | String? | |
| isDraft | Boolean | Default false |

**Relations:** job, completedByWorker, evidence.  
**Usage:** One completion per job; evidence (photos) attached here.

---

### Evidence

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| jobCompletionId | String | FK |
| storagePath | String | Supabase path |
| fileType | String | MIME type |
| uploadedAt | DateTime | |
| checklistRunId?, itemId? | String? | Optional link to run/item |
| redactionApplied | Boolean | Default false (must be true for upload) |
| redactionType | String? | |
| capturedByUserId?, redactionAttestedAt?, redactionAttestedByUserId? | String?, DateTime?, String? | Gold standard attestation |

**Usage:** Photos/evidence per completion; stored in evidence bucket.

---

## Bounded Area 5: Contracts & Invoicing

### Contract

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| clientOrganizationId, siteId | String | FK |
| billingCadence | Enum (Monthly) | Default Monthly |
| monthlyBaseAmountCents | Int | |
| netTermsDays | Int | Default 30 |
| effectiveStart, effectiveEnd | DateTime, DateTime? | |
| status | Enum (Active, Paused, Ended) | Default Active |
| contractTemplateId?, contractTemplateVersion? | String?, Int? | |
| createdAt, updatedAt | DateTime | |

**Usage:** One contract per site (or per client/site); drives invoice base line.

---

### Invoice

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| clientId | String | FK ClientOrganization |
| invoiceNumber | String | Unique |
| periodStart, periodEnd | DateTime | |
| status | Enum (Draft, Sent, Paid, Void) | Default Draft |
| issuedAt, dueAt | DateTime? | |
| notes | String? | |
| subtotalCents, taxCents, totalCents | Int | Default 0 |
| taxJurisdiction | String | Tax jurisdiction code (default "ON") |
| taxRateBps | Int | Tax rate in basis points (default 1300 = 13%) |
| taxPolicyVersion | Int | Version of tax policy at invoice creation (default 1) |
| invoiceTemplateId?, invoiceTemplateVersion? | String?, Int? | |
| createdById | String | FK User |
| createdAt, updatedAt | DateTime | |

**Relations:** client, createdBy, lineItems, jobs, adjustments, payments.  
**Usage:** Invoices are per client; line items link jobs/contracts/adjustments. Tax fields are frozen at invoice creation time to ensure reproducible calculations even if tax policy changes.

---

### InvoiceLineItem

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| invoiceId, jobId?, checklistRunId?, contractId? | String | FK (job/run/contract optional) |
| description | String | |
| qty | Int | Default 1 |
| unitPriceCents, amountCents | Int | |
| siteId | String | FK |
| revenueCategory | Enum (BASE_RECURRING, ADD_ON, OTHER) | Default BASE_RECURRING |

**Usage:** One line per job or contract base or adjustment; siteId for reporting.

---

### BillingAdjustment

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| invoiceId?, siteId, jobId? | String | FK |
| type | Enum (Charge, Discount, Credit) | |
| adjustmentCategory | Enum (CREDIT, CHARGE) | |
| amountCents | Int | |
| reasonCode?, notes? | String? | |
| createdById | String | FK User |
| status | Enum (Proposed, Approved, Applied, Voided) | Default Proposed |
| evidencePhotoIds | String[] | Default [] |
| revenueCategory | Enum? | |
| createdAt | DateTime | |

**Usage:** Credits/charges; can be attached to invoice when applied.

---

## Bounded Area 6: Payouts

### PayoutBatch

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| periodStart, periodEnd | DateTime | |
| status | Enum (CALCULATED, APPROVED, RELEASED, PAID) | Default CALCULATED |
| createdAt | DateTime | |

**Relations:** payoutLines.  
**Usage:** One batch per period; lines are per workforce account / job or run.

---

### PayoutLine

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| payoutBatchId, workforceAccountId | String | FK |
| jobId?, checklistRunId? | String? | Optional (one of job or run for job-based pay) |
| amountCents | Int | |
| status | Enum (PENDING, APPROVED, RELEASED, PAID, VOID) | Default PENDING |
| description?, siteId? | String?, String? | |

**Usage:** Uniqueness: one line per job (or per checklist run) per batch per workforce account; enforced in createPayoutBatch logic.

---

## Bounded Area 7: Work Orders & Incidents

### WorkOrder

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| siteId | String | FK |
| requestedBy | String | |
| description | String | |
| approvedByAdminId | String? | |
| priceCents | Int | |
| status | Enum (REQUESTED, APPROVED, ASSIGNED, COMPLETED, INVOICED, PAID) | Default REQUESTED |
| beforePhotos, afterPhotos | String[] | Default [] |
| assignedWorkforceAccountId? | String? | FK |
| approvedAt, completedAt, invoicedAt | DateTime? | |

**Usage:** Ad-hoc work; state machine in state-machine.ts.

---

### IncidentReport

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| siteId, workerId | String | FK |
| type | Enum (SAFETY, PROPERTY_DAMAGE, BIOHAZARD, LOST_KEY, OTHER) | |
| description | String | |
| photos | String[] | Default [] |
| reportedAt | DateTime | Default now() |
| resolvedAt?, resolutionNotes? | DateTime?, String? | |

**Usage:** Incidents per site/worker; resolution optional.

---

## Bounded Area 8: Quotes & Pricing

### PricingPolicy

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| cityCode | String | e.g. Windsor |
| effectiveDate | DateTime | |
| version | Int | |
| anchorBillingRateCentsPerHour | Int | |
| minimumMonthlyRevenueCents | Int | |
| defaultTravelMinutesPerVisit | Int | |
| defaultMonthlySupplyCostCents? | Int? | |
| defaultWinterMinutesPerVisitDelta | Int | |
| winterStartMonth, winterEndMonth | Int | e.g. 10, 3 |
| daysValid | Int | e.g. 30 |
| targetMarginBps, stressMarginBps, minStressMarginBps | Int | e.g. 2500, 2000, 1500 |
| subPayoutCeilingCentsPerHour | Int | |
| addonBillingRateCentsPerHour | Int | |
| addonMinMarginBps | Int | |
| riskRules | Json | factor → bps |

**Usage:** Snapshot of pricing rules; quoted by (cityCode, effectiveDate, version). Quotes reference one PricingPolicy.

---

### Quote

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| siteId, pricingPolicyId | String | FK |
| status | Enum (DRAFT, READY_FOR_REVIEW, SENT, WON, LOST, EXPIRED) | Default DRAFT |
| expiresAt | DateTime | |
| visitsPerWeek | Int | |
| billingRateCentsPerHour | Int | |
| billingRateOverrideReason? | String? | |
| expectedSubcontractorRateCentsPerHour? | Int? | |
| payoutOverrideReason? | String? | |
| travelMinutesPerVisit | Int | |
| monthlySupplyCostCents | Int | |
| winterMinutesPerVisitDelta | Int | |
| revenueFloorOverrideReason? | String? | |
| createdAt, updatedAt | DateTime | |

**Relations:** site, pricingPolicy, areaLines, addOnLines, snapshots.  
**Usage:** Quote builder; snapshots store computed margin/revenue per version.

---

### QuoteAreaLine, QuoteAddOnLine, QuoteSnapshot

- **QuoteAreaLine:** type (QuoteAreaType), measurements (Json — e.g. preset S/M/L, finish), computedMinutes, overrideMinutes?, overrideReason?. **Gold standard:** overrideMinutes ⇒ overrideReason required; scope editable only when quote is DRAFT or READY_FOR_REVIEW. See [10_Gold_Standard_Quoting.md](./10_Gold_Standard_Quoting.md).
- **QuoteAddOnLine:** name, estimatedLaborMinutes, billingRateCentsPerHour, expectedPayoutCentsPerHour?, priceCents, marginBps, includedInProposal. **Gold standard:** priceCents and marginBps computed server-side; includedInProposal blocked when marginBps < policy.addonMinMarginBps.
- **QuoteSnapshot:** Immutable snapshot row per quote version (snapshotVersion); stores pricingPolicy ref, billing rate, risk multiplier, minutes, revenue, margin gates, confidence score/band, passesBaseGate, passesStressGate, passesRevenueFloor. Proposal must use snapshot only for economics.

---

## Bounded Area 9: Finance & Snapshots

### SitePerformanceSnapshot

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| siteId, month | String, DateTime | month = first day of month |
| version | Int | Default 1 |
| status | Enum (OPEN, CLOSED) | Default OPEN |
| baseRevenueCents, addOnRevenueCents, creditsCents, netRevenueCents | Int | |
| payoutCogsCents, supplyCogsCents, totalCogsCents | Int | |
| grossProfitCents, grossMarginBps, payoutRatioBps | Int | |
| addOnPayoutCogsCents, addOnGrossMarginBps | Int | |
| recleanCount, rejectedChecklistCount | Int | |
| arOutstandingCents, ar_0_30_cents, ar_31_60_cents, ar_61_90_cents, ar_90_plus_cents | Int | |
| computedAt, computedByUserId | DateTime, String | FK User |
| lockedAt | DateTime? | When closed |

**Usage:** One snapshot per site per month (versioned); OPEN until closed (locked).

---

### SiteSupplyAllocation

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| siteId, month | String, DateTime | first day of month |
| amountCents | Int | |
| note? | String? | |
| createdByUserId | String | FK User |

**Usage:** Manual supply allocation per site per month for snapshot COGS.

---

## Bounded Area 10: Templates (Versioned)

All template models follow: **logicalId** (string), **version** (int), **status** (Draft, Active, Archived), **body** (Json), **createdById**, **createdAt**, **updatedAt**. Unique on (logicalId, version).

- **SiteTemplate** — site definition template.  
- **JobTemplate** — job definition template.  
- **ContractTemplate** — contract terms template.  
- **InvoiceTemplate** — invoice layout/terms template.  
- **MakeGoodRuleTemplate** — make-good rule template.

Sites, Jobs, Contracts, Invoices reference template by id (and optionally version) for audit.

---

## Bounded Area 11: Audit & Lead

### AuditLog

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| actorUserId | String | FK User (required) |
| actorWorkerId?, actorWorkforceAccountId? | String? | Optional actor context |
| entityType, entityId | String | e.g. "Job", jobId |
| fromState, toState | String? | State transition |
| metadata | Json? | |
| createdAt | DateTime | |

**Usage:** Key mutations (job transition, invoice status, etc.) should log here.

---

### Lead

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| createdAt | DateTime | Default now() |
| name, company?, role? | String, String? | |
| phone?, email | String?, String | |
| propertyType?, sitesCount? | String?, Int? | |
| message?, sourcePage? | String?, String? | |
| honeypot? | String? | Spam trap |
| preferredContact?, buildingAddress?, frequency?, callbackTime? | String? | |

**Usage:** Marketing lead capture; honeypot and validation in lead API.

---

## Bounded Area 10: Payments, Notifications, Time Tracking

### Payment

Provider-agnostic payment ledger. Blvckshell is the system of record; payment providers are settlement rails only.

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| invoiceId | String | FK to Invoice |
| clientId | String | FK to ClientOrganization |
| provider | PaymentRail | STRIPE, SPARC, EFT, CHEQUE |
| providerRef | String? | External reference (Stripe session ID, EFT trace, etc.) |
| amountCents | Int | Payment amount |
| status | PaymentStatus | PENDING → SETTLED or FAILED |
| settledAt | DateTime? | When funds confirmed |
| failedAt | DateTime? | When payment failed |
| failureReason | String? | Reason for failure |
| metadata | Json? | Provider-specific data |
| createdAt, updatedAt | DateTime | |

**Relations:** Invoice, ClientOrganization.  
**Usage:** Every money-in event creates a Payment record. `settlePayment()` auto-transitions Invoice to Paid when total settled >= totalCents.

**Indexes:** invoiceId, clientId, provider, status, providerRef.

---

### NotificationOutbox

Durable outbox for email/SMS notifications. Write intent in server actions, process async via background worker.

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| channel | NotificationChannel | EMAIL, SMS |
| templateKey | String | Template identifier (e.g. "payment_received") |
| recipient | String | Email or phone number |
| payload | Json | Template variables |
| relatedEntityType | String | Entity type for audit trail |
| relatedEntityId | String | Entity ID for audit trail |
| status | NotificationStatus | PENDING → SENT or FAILED |
| providerMessageId | String? | SendGrid/Twilio message ID |
| error | String? | Error message if failed |
| createdAt | DateTime | Default now() |
| sentAt | DateTime? | When sent |

**Usage:** All business events write intent here; `/api/notifications/process` cron job dispatches to providers.

**Indexes:** status, relatedEntityType+relatedEntityId, channel, createdAt.

---

### TimeEntry

Payroll time tracking for employees (not contractors). Contractors are paid via AP/payout.

| Field | Type | Purpose |
|-------|------|---------|
| id | String (cuid) | PK |
| workerId | String | FK to Worker |
| workforceAccountId | String | FK to WorkforceAccount |
| jobId | String? | FK to Job (optional, for job-linked time) |
| date | DateTime | Work date |
| regularMinutes | Int | Regular hours in minutes |
| overtimeMinutes | Int | OT hours in minutes (default 0) |
| rateCentsPerHour | Int | Pay rate |
| status | TimeEntryStatus | DRAFT → SUBMITTED → APPROVED → EXPORTED → PAID |
| approvedAt | DateTime? | When approved |
| approvedById | String? | Approving user ID |
| payrollExportedAt | DateTime? | When exported to payroll |
| payrollBatchRef | String? | Batch reference for reconciliation |
| notes | String? | |
| createdAt, updatedAt | DateTime | |

**Relations:** Worker, WorkforceAccount.  
**Usage:** `createTimeEntry()` only for EMPLOYEE classification. `exportPayrollBatch()` marks as EXPORTED.

**Indexes:** workerId, workforceAccountId, date, status, payrollBatchRef.

---

## Enums (Quick Reference)

| Enum | Values |
|------|--------|
| UserRole | ADMIN, FOUNDER, CLIENT, VENDOR_OWNER, VENDOR_WORKER, INTERNAL_WORKER |
| JobStatus | SCHEDULED, COMPLETED_PENDING_APPROVAL, APPROVED_PAYABLE, PAID, CANCELLED |
| ChecklistRunStatus | InProgress, Submitted, Approved, Rejected |
| InvoiceStatus | Draft, Sent, Paid, Void |
| WorkOrderStatus | REQUESTED, APPROVED, ASSIGNED, COMPLETED, INVOICED, PAID |
| PayoutBatchStatus | CALCULATED, APPROVED, RELEASED, PAID |
| PayoutLineStatus | PENDING, APPROVED, RELEASED, PAID, VOID |
| QuoteStatus | DRAFT, READY_FOR_REVIEW, SENT, WON, LOST, EXPIRED |
| SnapshotStatus | OPEN, CLOSED |
| TemplateStatus | Draft, Active, Archived |
| BillableStatus | Pending, Approved, Invoiced, Void |
| RevenueCategory | BASE_RECURRING, ADD_ON, OTHER |
| SuppliesProvidedBy | COMPANY, CLIENT, MIXED |
| SiteLifecycleStatus | PROSPECT, ACTIVE, INACTIVE |
| QuoteAreaType | LOBBY, HALLWAYS, STAIRWELLS, ELEVATORS, GARBAGE, WASHROOMS, GLASS, OTHER |
| WorkforceAccountType | INTERNAL, VENDOR |
| WorkforceClassification | EMPLOYEE, CONTRACTOR |
| PaymentMethodType | PAYROLL, EFT, CHEQUE |
| PaymentRail | STRIPE, SPARC, EFT, CHEQUE |
| PaymentStatus | PENDING, SETTLED, FAILED, REFUNDED |
| NotificationChannel | EMAIL, SMS |
| NotificationStatus | PENDING, SENT, FAILED |
| TimeEntryStatus | DRAFT, SUBMITTED, APPROVED, EXPORTED, PAID |
| ComplianceDocumentType | COI, WSIB, AGREEMENT, HST, OTHER |
| AccessCredentialType | KEY, FOB, CODE |
| AccessCredentialStatus | ACTIVE, LOST, RETURNED |
| IncidentReportType | SAFETY, PROPERTY_DAMAGE, BIOHAZARD, LOST_KEY, OTHER |
| BillingCadence | Monthly |
| ContractStatus | Active, Paused, Ended |
| JobPricingModel | IncludedInContract, Fixed, Hourly, PerChecklist, PerVisit |
| BillingAdjustmentType | Charge, Discount, Credit |
| BillingAdjustmentStatus | Proposed, Approved, Applied, Voided |
| AdjustmentCategory | CREDIT, CHARGE |

---

*End of Data Model. Schema is source of truth; this document is for reference and onboarding.*
