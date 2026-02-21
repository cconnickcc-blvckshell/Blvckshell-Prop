# 90-Day Launch Spine — Execution Plan

**Goal (locked):** Blvckshell launches with a production-ready website and fully operational Admin, Client, Employee, and Subcontractor portals — hardened, auditable, and boringly reliable.

**Success means:** You could onboard a real PM tomorrow; survive your first dispute; show this to an investor without caveats.

**No fluff. No optional work. This is the launch spine.**

---

## Launch Definition (Non-Negotiable)

### Website
- Zero placeholders
- Zero ambiguity about scope, geography, and process
- Proof is visible (not promised)
- Risk handling is explicit
- Language asserts authority, not intention

### Portals
- Every role can complete their core workflow without guidance
- Every critical action is auditable
- Evidence capture cannot silently fail
- Money movement is traceable end-to-end
- Empty states guide, not confuse

**If any of the above is false → not launched.**

---

## Phase 0 (Week 1): Lock Invariants — Foundational, No UI

**Objective:** Prevent future rework and silent failures.

### 0.1 Define the Audit Envelope (MANDATORY)
- **Deliverable:** 1–2 page spec. Every action that MUST produce an audit log:
  - **Job:** create, assign, modify, start, submit, approve, reject, cancel, make-good
  - **Evidence:** upload, delete, redact
  - **Invoice:** generate, edit, issue, void, mark paid
  - **Payout:** calculate, approve, customize, release, mark paid
  - **Access credentials:** issue, return, mark lost
  - **Contract:** create, pause, end, modify
  - **Site & workforce edits**
- **Rule:** If it affects money, access, or evidence → it is logged. No exceptions.

### 0.2 Evidence Pipeline Invariants
- Document and enforce:
  - Max photos required per job
  - Required photos before submission
  - Redaction flags are booleans (no string coercion bugs)
  - Storage path format is immutable
  - Evidence cannot be deleted without audit log
- Treat like payments. Existential.

### 0.3 Status Machine Lock
- Freeze: allowed transitions, who can perform them, side effects (audit, notifications).
- After this phase: no state changes without updating this spec.

---

## Phase 1 (Weeks 2–4): Portal Hardening — No New Features

**Objective:** Make existing workflows unbreakable.

### 1.1 Admin Portal (P0)
Admin must: create clients, sites, contracts; schedule jobs, customize tasks per location; assign or replace workforce; review submissions; approve/reject jobs with reason; generate invoices & payroll/subcontractor payments; review audit log.
- **Hard:** Every empty state has a CTA; every destructive action requires confirmation; every approval/rejection writes an audit entry.

### 1.2 Employee / Subcontractor Portal (P0)
Worker must: see assigned jobs; check in; complete checklist; upload required evidence; submit completion; see paystub/owed moneys.
- **Hard:** Cannot submit without required evidence; cannot submit another worker’s job; clear feedback when blocked; offline/slow network handled (retry, not data loss).

### 1.3 Client Portal (READ-ONLY, CRITICAL)
Client must: view sites; view job history; view evidence; view invoices; download reports.
- No write actions at launch. Reduces disputes, raises trust, justifies premium, makes sales easier.

---

## Phase 2 (Weeks 5–7): Test Reality, Not Theory

**Objective:** Prove the system survives real conditions.

### 2.1 Test Environment Fix
- Dedicated test DB (local or Supabase test project)
- Mock NextAuth for unit tests
- Split: pure logic | DB integration | E2E (Playwright)

### 2.2 Mandatory Test Scenarios (must pass)
- **Evidence:** Upload max photos; reject missing photos; redaction applied; evidence tied to correct job/checklist item.
- **Job lifecycle:** Schedule → assign → submit → approve; reject → resubmit; missed job → make-good created.
- **Money:** Job approved → invoice; adjustments; payout calculated; audit trail intact.
- **If any fail → no launch.**

### 2.3 Abuse & Failure Tests
- Rapid submissions (rate limit); large image uploads; invalid role access; double submits. Trust software → abuse expected.

---

## Phase 3 (Weeks 8–10): Website Authority Pass

**Objective:** Sound like the standard, not a candidate.

### 3.1 Authority Language (surgical)
- Remove repeated “new operator” language
- Replace explanations with rules where appropriate
- Add ONE unifying sentence: *“Blvckshell exists to eliminate ambiguity and liability from facilities operations.”*
- No rewriting. No marketing fluff.

### 3.2 Proof Surfacing
- Sample report download; checklist screenshot; anonymized evidence gallery. Do not say “available upon request” if you can show it.

### 3.3 Risk Page Visibility
- Surface “What happens when things go wrong” higher. Conversion asset, not disclaimer.

---

## Phase 4 (Weeks 11–12): Launch Readiness & Freeze

**Objective:** Ship with confidence.

### 4.1 Production Readiness Checklist
- Backups verified; error logging visible; admin superuser documented; onboarding checklist written; manual fallback (what if portal is down?).

### 4.2 Soft Launch
- Onboard 1 internal “fake client”; run 10–20 fake jobs; generate invoices; review audit logs. Fix only blockers.

### 4.3 Launch Freeze
- No schema changes without migration; no UI changes without review; no logic changes without tests. This is how systems stay trusted.

---

## What NOT To Do (90 Days)

- ❌ No new features
- ❌ No AI
- ❌ No analytics rabbit holes
- ❌ No redesigns
- ❌ No “we’ll fix it later”

Everything either supports **launch correctness** or it waits.

---

*Supporting docs: `90_DAY_WEEK_BY_WEEK_CHECKLIST.md`, `LAUNCH_READINESS_GATE.md`, `PHASE_1_FILE_LEVEL_TASKS.md`.*
