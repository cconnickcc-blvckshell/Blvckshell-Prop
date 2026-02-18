# CTO Status Report: Interactive Checklists + Billing Spine

**Plan:** `IMPLEMENTATION_PLAN_CHECKLIST_BILLING.md`  
**Directive:** `CURSOR_DIRECTIVE_CHECKLIST_BILLING.md`  
**Report date:** February 2026

---

## Executive summary

The **interactive checklist and billing spine** work is **substantially complete** for Phases 1–7. Workers complete checklists with item-level results and **in-app camera + manual redaction** for evidence (no file picker; server accepts only redacted uploads). Admins have job history, draft invoicing, invoice PDF and locking, and payout batches with pay statement PDFs. **Not yet implemented:** TimeEntry and payroll CSV (Phase 8) and targeted mobile UX polish (Phase 9). Optional: contract base on draft invoice, explicit DoD config, backfill script.

---

## Phase status

| Phase | Status | Notes |
|-------|--------|------|
| **1. Checklist run + item persistence** | ✅ Complete | ChecklistRun / ChecklistRunItem; create/get run, autosave items, submit; migration applied. |
| **2. Photo-at-item + Evidence metadata** | ✅ Complete | Evidence has checklistRunId, itemId, redaction fields; template parser has photoRequired/photoPointLabel; submit validation; per-item “Add photo”; blocking panel. |
| **3. In-app camera + redaction** | ✅ Complete | getUserMedia; manual redaction (draw or confirm none); no detection/redaction pipeline, no “upload redacted only” enforcement. Server rejects non-redacted. |
| **4. Client/Site job history + DoD** | ✅ Complete | Jobs list filtered by siteId; job detail shows run (status, items, evidence); breadcrumb client → site → job; blocking submit panel enforces DoD rules. |
| **5. Invoice + Contract + draft** | ✅ Complete | Contract, Invoice, InvoiceLineItem, BillingAdjustment, Job billing fields; draft invoice (client + period); add/remove jobs and adjustments; totals. |
| **6. Payout alignment + pay statement** | ✅ Complete | PayoutLine: description, siteId, checklistRunId; batch uses unpaid jobs only (one job per line); pay statement PDF per worker per batch; batch detail page. |
| **7. Invoice PDF + locking** | ✅ Complete | Invoice PDF (pdfkit); Mark as Sent/Paid; jobs locked (billableStatus = Invoiced) when invoice Sent/Paid. |
| **8. TimeEntry + payroll CSV** | ❌ Not started | No TimeEntry model or payroll export. |
| **9. Mobile UX polish + autosave** | ⚠️ Partial | Blocking panel and autosave in place; no dedicated mobile layout or progress %; tap targets and flow not explicitly tuned. |

---

## Delivered capabilities

- **Workers:** Open job → checklist run (create/get) → set PASS/FAIL/NA per item with notes/fail reason → **Take photo** (in-app camera, then draw redaction areas or confirm no sensitive content) → evidence stored with run/item and redaction metadata. Blocking reasons and save draft / submit.
- **Admins:** Client → site → “View jobs” (filtered) → job detail with run (status, items, evidence, who completed/approved). Create draft invoice (client + period), add/remove approved jobs and adjustments, Download PDF, Mark as Sent/Paid; jobs locked when invoice is Sent/Paid. Payouts: “Jobs ready” = unpaid approved only; create batch from period (unpaid only); batch detail with per-worker “Download PDF” pay statement; mark batch paid.
- **Data:** ChecklistRun + ChecklistRunItem; Evidence (run/item/redaction metadata); Invoice + line items + adjustments; Job (billableStatus, invoiceId, etc.); PayoutLine (description, siteId, checklistRunId). Migrations: checklist run, evidence item/redaction, billing (Contract/Invoice/Job/etc.), payout line fields.

---

## Gaps and deferred work

1. **Phase 3 (camera + redaction)**  
   - Required for “no unredacted originals stored” and in-app capture.  
   - Needs: getUserMedia, in-browser detection (e.g. MediaPipe), canvas redaction, upload of redacted blob only, server-side rejection of non-redacted uploads.  
   - **Recommendation:** Schedule as a focused sprint; consider manual-redact-only MVP if detection is deferred.

2. **Phase 8 (TimeEntry + payroll)**  
   - For hourly employees and payroll provider export.  
   - Needs: TimeEntry schema and lifecycle (e.g. from job closeout), pay-period report, CSV export.  
   - **Recommendation:** Implement when hourly payroll is in scope.

3. **Phase 9 (mobile polish)**  
   - Progress %, larger tap targets, one-handed flow, and explicit mobile layout not fully applied.  
   - **Recommendation:** Iterate with real device testing and design input.

4. **Optional / product**  
   - **Contract base on draft:** Contract exists; draft invoice does not auto-add “monthly base” line from Contract; can be added when needed.  
   - **Explicit DoD config:** Validation (required items, min photos, item photos) is hardcoded; storing DoD rules in template is optional.  
   - **Backfill:** One-time script to create ChecklistRun + items from existing JobCompletion `checklistResults` (and link Evidence to run) is not built; run on request if historical jobs need run records.

---

## Migrations and deployment

- Migrations in repo: `20260218160000_add_checklist_run_and_items`, `20260218170000_evidence_item_redaction`, `20260218180000_add_billing_invoice_contract`, `20260218190000_payout_line_description_site`.
- If migrations were applied manually (e.g. Supabase SQL Editor), sync Prisma history via `sync_after_manual.sql` (uncomment and run the relevant INSERT blocks) or `npx prisma migrate resolve --applied <migration_name>`.
- Use **direct DB URL** for `prisma migrate deploy` when pooler is used (e.g. `db:migrate:direct`), or run migration SQL manually and then sync.

---

## Recommended next steps (priority order)

### Priority 1 — Phase 3: Camera + redaction — **Implemented**

- **getUserMedia** used for capture (no file input for evidence).
- Only redacted blobs uploaded; server **rejects** uploads without `redactionApplied=true`.
- **Manual redact:** user draws rectangles over areas to redact, or confirms “No sensitive content”.
- Optional enhancement: add face/person detection (e.g. MediaPipe) for auto-redact.

### Priority 2 — Minimal mobile UX pass (not a redesign)

- Larger tap targets; progress % indicator; one-handed checklist flow; clear “what’s blocking submit” summary.
- Do **not** redesign themes or visuals yet.

### Priority 3 — Product decision: Contract base on draft invoice

- **Manual inclusion:** safer early, more control.
- **Auto-add monthly base from Contract when creating draft:** more automation.
- Decide explicitly so implementation doesn’t guess.

---

## Conclusion

Core checklist execution, job history, invoicing (draft → PDF → locking), and payouts (unpaid-only batches, pay statement PDF) are **implemented and usable**. Remaining work is **Phase 3** (in-app camera and redaction), **Phase 8** (TimeEntry and payroll CSV), and **Phase 9** (mobile polish); plus any product decisions on contract base, DoD config, and backfill.
