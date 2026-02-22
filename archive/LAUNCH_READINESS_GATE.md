# Launch Readiness Gate

**Purpose:** Sign-off that Blvckshell meets the launch definition. No caveats.  
**Use:** Complete the checklist; sign and date when all conditions are met.  
**Rule:** If any item is false, do not launch.

---

## 1. Launch Definition (Recertify)

### Website
| # | Condition | Met (Y/N) | Notes |
|---|-----------|-----------|--------|
| W1 | Zero placeholders | | |
| W2 | Zero ambiguity about scope, geography, process | | |
| W3 | Proof is visible (not just promised) | | |
| W4 | Risk handling is explicit | | |
| W5 | Language asserts authority, not intention | | |

### Portals
| # | Condition | Met (Y/N) | Notes |
|---|-----------|-----------|--------|
| P1 | Every role can complete core workflow without guidance | | |
| P2 | Every critical action is auditable | | |
| P3 | Evidence capture cannot silently fail | | |
| P4 | Money movement is traceable end-to-end | | |
| P5 | Empty states guide, not confuse | | |

**If any cell above is N → not launched.**

---

## 2. Invariants (Phase 0)

| # | Item | Met (Y/N) |
|---|------|-----------|
| I1 | Audit envelope spec exists; every money/access/evidence action listed | |
| I2 | Evidence pipeline: max photos, required count, redaction boolean, path immutable, delete only with audit | |
| I3 | Status machine frozen: transitions, roles, side effects documented | |

---

## 3. Portal Hardening (Phase 1)

| # | Item | Met (Y/N) |
|---|------|-----------|
| H1 | Admin: clients, sites, contracts, jobs, workforce, approve/reject, invoices, payouts, audit log | |
| H2 | Admin: every empty state has CTA; destructive actions confirmed; approve/reject → audit | |
| H3 | Worker: assigned jobs, checklist, evidence, submit, paystub/owed; no submit without evidence; no other worker’s job | |
| H4 | Worker: clear feedback when blocked; offline/slow handled (retry / no data loss or documented limit) | |
| H5 | Client portal (read-only): sites, job history, evidence, invoices, reports | |

---

## 4. Test Reality (Phase 2)

| # | Item | Met (Y/N) |
|---|------|-----------|
| T1 | Test env: dedicated test DB; NextAuth mocked or E2E; suites split (pure / DB / E2E) | |
| T2 | Evidence: max photos, reject missing, redaction, correct job/item — tests pass | |
| T3 | Job lifecycle: schedule→approve; reject→resubmit; missed→make-good — tests pass | |
| T4 | Money: invoice, adjustments, payout, audit trail — tests pass | |
| T5 | Abuse: rate limit, large uploads, wrong role, double submit — handled | |

---

## 5. Website Authority (Phase 3)

| # | Item | Met (Y/N) |
|---|------|-----------|
| A1 | One unifying sentence live; “new operator” trimmed; rules where appropriate | |
| A2 | Proof surfacing: sample report, checklist screenshot, evidence example | |
| A3 | “What happens when things go wrong” surfaced appropriately | |

---

## 6. Production Readiness (Phase 4)

| # | Item | Met (Y/N) |
|---|------|-----------|
| R1 | Backups verified | |
| R2 | Error logging visible | |
| R3 | Admin superuser documented | |
| R4 | Onboarding checklist (client + worker) written | |
| R5 | Manual fallback (portal down) documented | |
| R6 | Soft launch done: 1 fake client, 10–20 jobs, invoices, audit review | |
| R7 | Launch freeze in effect: schema+migration, UI+review, logic+tests | |

---

## 7. Sign-Off

I certify that the above conditions have been met and that Blvckshell is launched per the 90-day launch spine. No known caveats that would prevent onboarding a real PM, surviving a first dispute, or showing the system to an investor.

**Name:** _________________________  
**Role:** _________________________  
**Date:** _________________________

---

*Reference: LAUNCH_SPINE_90_DAY_PLAN.md, 90_DAY_WEEK_BY_WEEK_CHECKLIST.md*
