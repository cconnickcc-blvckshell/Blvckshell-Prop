# Blvck Bible — Glossary and Conventions

**Purpose:** Definitions of terms and file-location conventions used across the Blvck Bible and codebase.  
**Update:** When introducing new domain terms or conventions.

---

## Glossary

| Term | Definition |
|------|------------|
| **Blvckshell** | Facilities execution and accountability operator (cleaning, turnovers, audits, light maintenance, facilities support) in Ontario. |
| **Portal** | The Next.js application (admin, worker, client, marketing) and its APIs/actions; the “internal audit and workflow system” of the business plan. |
| **Site** | A single building/location under a client organization; has jobs, contracts, checklists, and optional template. |
| **Job** | A scheduled work unit at a site; has status (SCHEDULED → COMPLETED_PENDING_APPROVAL → APPROVED_PAYABLE → PAID or CANCELLED), assignment (workforce account / worker), payout, and optional invoice link. |
| **ChecklistRun** | One execution of a checklist for a job; has items (ChecklistRunItem) and status (InProgress, Submitted, Approved, Rejected). Template snapshot stored at run creation. |
| **JobCompletion** | Single completion record per job; holds checklistResults (JSON), notes, and links to Evidence (photos). |
| **Evidence** | A photo or file attached to a JobCompletion; stored in evidence bucket; must have redactionApplied true on upload. |
| **Invoice** | Client-facing invoice; has line items (jobs, contract base, adjustments) and status (Draft, Sent, Paid, Void). |
| **PayoutBatch** | A batch of payouts for a period; contains PayoutLines per workforce account / job (or run). |
| **PayoutLine** | One line in a payout batch; links to job or checklist run; one per (batch, workforce account, job or run). |
| **Quote** | Pricing proposal for a site; has area lines, add-on lines, and versioned QuoteSnapshots (margin, revenue floor, gates). |
| **QuoteSnapshot** | Immutable snapshot row for a quote version; stores computed revenue, margin, gates, confidence. |
| **SitePerformanceSnapshot** | Per-site per-month finance snapshot (revenue, COGS, margin, AR buckets, recleans); OPEN or CLOSED. |
| **WorkforceAccount** | Internal or vendor “company”; has workers, jobs (assignment), and payouts. |
| **Worker** | Persona linked to User; has assigned jobs and completions. |
| **Guard** | RBAC function (e.g. requireAdmin, requireWorker, canAccessJob) that enforces who can perform an action or see an entity. |
| **SessionUser** | Typed session shape: id, name, role, workforceAccountId, workerId, clientOrganizationId. |
| **RevenueCategory** | Enum for invoice line and reporting: BASE_RECURRING, ADD_ON, OTHER. |
| **BillableStatus** | Job-level: Pending, Approved, Invoiced, Void. |
| **Gold standard** | Invariant or pattern that must be maintained (e.g. approval only with submitted checklist; template snapshot on run creation; evidence redaction attested). |

---

## File Location Conventions

| Concern | Location |
|---------|----------|
| Data model | prisma/schema.prisma |
| Migrations | prisma/migrations/ |
| Server actions | src/server/actions/*.ts |
| Form actions (admin) | src/app/admin/**/actions.ts |
| RBAC guards | src/server/guards/rbac.ts |
| State machines | src/lib/state-machine.ts |
| Quote engine | src/server/pricing/quote-engine.ts |
| Area presets | src/server/pricing/area-presets.ts |
| Site snapshot engine | src/server/finance/site-snapshot-engine.ts |
| Automation | src/server/automation/*.ts |
| Bulk operation impl | src/server/bulk-actions/*.ts |
| API routes | src/app/api/**/route.ts |
| Auth config | src/lib/auth.ts |
| Storage helpers | src/lib/storage.ts |
| Validations (Zod) | src/lib/validations.ts, src/lib/lead-schema.ts |
| Rate limit | src/lib/rate-limit.ts |
| Middleware | src/middleware.ts |
| Blvck Bible docs | Blvck_Bible/*.md (repo root) |

---

## Cross-References

- **Business plan:** Repo root `business-plan/` — margin policy, service tiers, pilot programs, LOC, risk.  
- **DECISIONS.md:** Product/tech decisions (e.g. job visibility when assignedWorkerId set; payout uniqueness).  
- **SECURITY.md / DATA_RETENTION.md:** Security and retention policy if present under portal/.  
- **SEED.md:** Seed data and dev setup if present.

---

## Naming Conventions

- **IDs:** CUID from Prisma (@default(cuid())).  
- **Money:** Always cents (Int) in DB and engines.  
- **Rates:** Cents per hour (Int) in pricing policy and quotes.  
- **Margin:** Basis points (bps) where used (e.g. targetMarginBps 2500 = 25%).  
- **Enums:** PascalCase in schema (e.g. JobStatus, InvoiceStatus).  
- **Tables:** PascalCase (Prisma); relations by convention (e.g. job.site, site.jobs).

---

*End of Glossary and Conventions.*
