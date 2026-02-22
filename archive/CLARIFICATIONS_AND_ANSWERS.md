# Clarifications and Answers (CTO / Program Report follow-up)

**Purpose:** Resolve Phase 3 inconsistency, answer Q1–Q12 for next-sprint planning and Cursor directives.  
**Date:** February 2026

---

## Critical inconsistency resolved (Q1)

**Code audit result:** **A) Camera + redaction is working end-to-end** in the current codebase.

- **EvidenceCameraCapture** implements: getUserMedia → capture to canvas → redact step (draw rectangles or “No sensitive content”) → `onDone(blob, redactionType)` with blob from canvas (redacted or original when “No sensitive content”).
- **Worker UI:** Only “Take photo” path; no file picker. JobDetailClient sends `redactionApplied: "true"` and `redactionType` with every upload.
- **Server:** `api/evidence/upload/route.ts` and `server/actions/upload-actions.ts` both require `redactionApplied === true`; otherwise 400 with “Evidence must be captured and redacted in-app. Use Take photo.”

**Caveat:** Enforcement is **client-declared**. The server does not verify that the image was actually redacted; a determined user could POST a file with `redactionApplied=true` without using the in-app camera. For normal use and privacy posture (“no unredacted originals stored”), the only UI path is camera → redact → upload.

**Doc fix applied:** CTO Status Report “Gaps” section was updated so Phase 3 is no longer listed as “not started”; it now states that manual camera + redaction is shipped and optional future work is auto-detect/blur.

---

## Answers (Q1–Q12)

**Q1:** **A) Camera + redaction is working end-to-end.** Manual redaction only; server rejects non-redacted uploads. Enforcement is client-declared (see above).

**Q2:** **Recommended: add middleware now** for `/admin/*` and worker routes as a hard requirement. The report’s “no middleware” is accurate; adding it reduces blast radius if a layout/route is misconfigured. If you explicitly accept the risk, you can defer and document that decision.

**Q3:** **Deployment target:** Vercel (confirmed in README, VERCEL.md, login page comment). **Redis/Upstash:** Not present in repo (no Upstash/Redis env or packages). Options: (1) Edge middleware throttling (e.g. Vercel Edge with simple in-memory or header-based limits for login/lead/upload), (2) add Vercel KV or Upstash and do API-level token bucket, (3) IP + account-based limits once you have a store. Easiest short-term: edge middleware for login + lead + evidence upload with conservative limits.

**Q4:** **From code:** Single org (BLVCKSHELL) with many ClientOrganizations and Sites; no tenant_id or multi-tenant isolation in schema. **Decision required:** Is “tenant” = this single org only, or do you plan true multi-tenant (multiple cleaning companies on same platform)? That drives whether tenant IDs need to be strict everywhere and how invoice/payout numbers are scoped.

**Q5:** **Currently:** No tax logic in invoice line items or PDF. **Decision required:** Are you charging HST/GST from day 1? If yes: which province(s) first (e.g. Ontario only), and do any clients have exemptions? This affects line item tax and PDF correctness.

**Q6:** **Currently:** No retention policy or delete-on-request workflow in code. **Decision required:** Target retention (e.g. 30/90/180 days default), longer for dispute-flagged jobs, and whether you support delete-on-request (product + compliance).

**Q7:** **Evidence retention** — same as Q6; no policy in code. **Decision required:** Retention target and dispute/delete rules.

**Q8:** **TimeEntry + payroll CSV:** Not started (no TimeEntry model). **Decision required:** For employees, which model? (A) True clock-in/out per job, (B) Duration entry on job closeout, (C) Fixed per-shift/pay-period (no per-job time). This sets the TimeEntry contract and approval flow.

**Q9:** **Checklist templates source:** **Markdown is the authoritative source.** Admin does not create/edit template content in the UI. `getAvailableChecklistTemplates()` in `checklist-parser.ts` reads markdown files; admin assigns a template (by slug/id) to a site via ChecklistManager. Single source of truth = markdown in `content/docs/` (or equivalent). Avoid mixing DB-stored template body with markdown to prevent drift.

**Q10:** **Job approval gate:** **Yes.** State machine requires admin approval before a job becomes payable/invoiceable. Job must be in `APPROVED_PAYABLE` to be added to draft invoice and to appear in “jobs ready” for payout. This is enforced in code and is the intended policy.

**Q11:** **Evidence redaction type:** **Manual redaction only in current v1** (draw rects or “No sensitive content”). Auto-detect/blur is not implemented; web feasibility varies by device. **Decision required:** Is manual acceptable as v1 for release, or must auto-detect/blur be in scope before release? If v1 = manual only, document that and consider auto as a later enhancement.

**Q12:** **Vendor owner visibility:** **Currently:** Vendor owners see **all jobs** completed by their workforce (Vendor Jobs page: list by `assignedWorkforceAccountId`) with site, assigned worker, status — **read-only, no pricing**. They do **not** see payouts breakdown per worker or per batch; that’s admin-only (payout batch detail + pay statement PDF). **Decision required:** Should vendor owners see per-worker earnings and/or payout breakdown (e.g. summary by period), or keep current “job list only” visibility?

---

## Immediate recommendations (from your list)

1. **Phase 3 inconsistency** — Resolved: code and CTO doc aligned; Phase 3 = complete (manual camera + redaction); enforcement is client-declared.
2. **Middleware + rate limiting** — Add before scaling; middleware for admin/worker routes; edge or API-level limits for login, lead, evidence upload (see Q3).
3. **Billing policy** — Lock: auto-add monthly base vs manual (currently manual via “Add monthly base from contracts”); tax rules (Q5).
4. **Retention policy** — Decide and document (Q6–Q7).
5. **Deeper UX polish** — After the above.

---

*Next step: once you confirm any decisions above (Q4–Q8, Q11–Q12, and billing/tax), a tightened next-sprint plan and exact Cursor directives can be produced.*
