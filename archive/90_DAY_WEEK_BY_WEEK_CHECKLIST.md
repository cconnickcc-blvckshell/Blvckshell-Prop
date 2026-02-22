# 90-Day Launch — Week-by-Week Checklist

**Use:** Paste into Jira/Linear/Notion. Each item is a discrete task.  
**Goal:** Launch spine execution; no scope creep.

---

## WEEK 1 — Phase 0: Lock Invariants

### Audit envelope
- [ ] **0.1.1** Write audit envelope spec (1–2 pages): list every action that must log
- [ ] **0.1.2** Include: Job (create, assign, modify, start, submit, approve, reject, cancel, make-good)
- [ ] **0.1.3** Include: Evidence (upload, delete, redact)
- [ ] **0.1.4** Include: Invoice (generate, edit, issue, void, mark paid)
- [ ] **0.1.5** Include: Payout (calculate, approve, customize, release, mark paid)
- [ ] **0.1.6** Include: Access credentials (issue, return, mark lost)
- [ ] **0.1.7** Include: Contract (create, pause, end, modify)
- [ ] **0.1.8** Include: Site & workforce edits
- [ ] **0.1.9** Publish rule: "If it affects money, access, or evidence → logged"
- [ ] **0.1.10** Cross-check codebase: mark implemented vs gap; create tickets for gaps

### Evidence pipeline
- [ ] **0.2.1** Document max photos per job (constant + where used)
- [ ] **0.2.2** Document required photos before submission rule
- [ ] **0.2.3** Confirm redaction is boolean (no string coercion); add test
- [ ] **0.2.4** Document storage path format; make immutable
- [ ] **0.2.5** Rule: evidence delete only with audit log; implement or ticket

### Status machine
- [ ] **0.3.1** Freeze allowed transitions in one doc/spec
- [ ] **0.3.2** Document who can perform each transition
- [ ] **0.3.3** Document side effects (audit, notifications) per transition
- [ ] **0.3.4** Add process rule: no state changes without spec update

---

## WEEKS 2–4 — Phase 1: Portal Hardening

### Week 2 — Admin portal (P0)
- [ ] **1.1.1** Admin: create clients, sites, contracts — verify E2E
- [ ] **1.1.2** Admin: schedule jobs, customize tasks per location — verify
- [ ] **1.1.3** Admin: assign or replace workforce — verify
- [ ] **1.1.4** Admin: review submissions — verify
- [ ] **1.1.5** Admin: approve/reject jobs with reason — verify + audit entry
- [ ] **1.1.6** Admin: generate invoices & payroll/subcontractor payments — verify
- [ ] **1.1.7** Admin: review audit log — page exists and is usable
- [ ] **1.1.8** Every empty state has a CTA — audit all admin pages
- [ ] **1.1.9** Every destructive action has confirmation — audit and add where missing

### Week 3 — Employee / Subcontractor portal (P0)
- [ ] **1.2.1** Worker: see assigned jobs — verify
- [ ] **1.2.2** Worker: check-in (if applicable) — verify or N/A
- [ ] **1.2.3** Worker: complete checklist — verify
- [ ] **1.2.4** Worker: upload required evidence — verify
- [ ] **1.2.5** Worker: submit completion — verify
- [ ] **1.2.6** Worker: see paystub/owed moneys — verify
- [ ] **1.2.7** Cannot submit without required evidence — enforce + test
- [ ] **1.2.8** Cannot submit another worker’s job — enforce + test
- [ ] **1.2.9** Clear feedback when submission blocked — copy + UI
- [ ] **1.2.10** Offline/slow: retry, no data loss — design + implement or document limitation

### Week 4 — Client portal (read-only)
- [ ] **1.3.1** Client portal: route/layout and auth (client role or token)
- [ ] **1.3.2** Client: view sites — page + API or data
- [ ] **1.3.3** Client: view job history — page + data
- [ ] **1.3.4** Client: view evidence — page + secure access
- [ ] **1.3.5** Client: view invoices — page + data
- [ ] **1.3.6** Client: download reports — export or PDF
- [ ] **1.3.7** No write actions; read-only enforced

---

## WEEKS 5–7 — Phase 2: Test Reality

### Week 5 — Test environment
- [ ] **2.1.1** Dedicated test DB (local or Supabase test project)
- [ ] **2.1.2** Mock NextAuth for unit tests (or equivalent)
- [ ] **2.1.3** Split suites: pure logic | DB integration | E2E
- [ ] **2.1.4** CI: run pure + DB integration on commit; E2E on schedule or tag

### Week 6 — Mandatory scenarios
- [ ] **2.2.1** Evidence: upload max photos — test passes
- [ ] **2.2.2** Evidence: reject missing photos — test passes
- [ ] **2.2.3** Evidence: redaction applied correctly — test passes
- [ ] **2.2.4** Evidence: tied to correct job/checklist item — test passes
- [ ] **2.2.5** Job: schedule → assign → submit → approve — test passes
- [ ] **2.2.6** Job: reject → resubmit — test passes
- [ ] **2.2.7** Job: missed → make-good created — test passes
- [ ] **2.2.8** Money: job approved → invoice — test passes
- [ ] **2.2.9** Money: adjustments applied — test passes
- [ ] **2.2.10** Money: payout calculated; audit trail intact — test passes

### Week 7 — Abuse & failure
- [ ] **2.3.1** Rapid submissions — rate limit holds
- [ ] **2.3.2** Large image uploads — handled (reject or limit)
- [ ] **2.3.3** Invalid role access — 403 / no data leak
- [ ] **2.3.4** Double submit — idempotent or blocked

---

## WEEKS 8–10 — Phase 3: Website Authority

### Week 8 — Authority language
- [ ] **3.1.1** Remove repeated "new operator" (already reduced; final pass)
- [ ] **3.1.2** Replace key explanations with rules (surgical)
- [ ] **3.1.3** Add one unifying sentence to hero/above-fold
- [ ] **3.1.4** No marketing fluff; no full rewrite

### Week 9 — Proof surfacing
- [ ] **3.2.1** Sample report download — link + asset
- [ ] **3.2.2** Checklist screenshot — add to site
- [ ] **3.2.3** Anonymized evidence gallery or 1–2 examples
- [ ] **3.2.4** Remove "available upon request" where proof is shown

### Week 10 — Risk visibility
- [ ] **3.3.1** Surface "What happens when things go wrong" higher (nav or homepage)
- [ ] **3.3.2** Treat as conversion asset in copy/placement

---

## WEEKS 11–12 — Phase 4: Launch Readiness & Freeze

### Week 11 — Production readiness
- [ ] **4.1.1** Backups verified (procedure + one test restore)
- [ ] **4.1.2** Error logging visible (where, how to check)
- [ ] **4.1.3** Admin superuser documented (who, how to recover)
- [ ] **4.1.4** Onboarding checklist written (client + worker)
- [ ] **4.1.5** Manual fallback documented (portal down: what to do)

### Week 12 — Soft launch & freeze
- [ ] **4.2.1** Onboard 1 internal "fake client"
- [ ] **4.2.2** Run 10–20 fake jobs E2E
- [ ] **4.2.3** Generate invoices; review audit logs
- [ ] **4.2.4** Fix only blockers; no nice-to-haves
- [ ] **4.3.1** Launch freeze: schema only with migration; UI with review; logic with tests
- [ ] **4.3.2** Sign Launch Readiness Gate (see LAUNCH_READINESS_GATE.md)

---

## Summary counts (for tracking)

| Phase   | Weeks | Task blocks |
|---------|-------|-------------|
| Phase 0 | 1     | 0.1.x, 0.2.x, 0.3.x |
| Phase 1 | 2–4   | 1.1.x, 1.2.x, 1.3.x |
| Phase 2 | 5–7   | 2.1.x, 2.2.x, 2.3.x |
| Phase 3 | 8–10  | 3.1.x, 3.2.x, 3.3.x |
| Phase 4 | 11–12 | 4.1.x, 4.2.x, 4.3.x |

**Total:** ~70 discrete checkboxes. Use as-is or map to your tool’s epics/stories.
