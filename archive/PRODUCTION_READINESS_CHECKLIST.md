# Production Readiness Checklist (Phase 4)

**Use with:** LAUNCH_READINESS_GATE.md §6 (R1–R7). Complete each item before sign-off.

---

## R1. Backups verified

- [ ] Database (Supabase/Postgres): automated backups enabled and retention set.
- [ ] Restore tested at least once (e.g. to staging or local).
- [ ] Evidence storage (Supabase Storage): bucket backup or replication documented.

---

## R2. Error logging visible

- [ ] Server errors (e.g. uncaught exceptions, 5xx) logged to a visible destination (Vercel logs, Sentry, or equivalent).
- [ ] Critical paths (job transition, invoice, payout, evidence upload) log failures with context (job ID, user ID, no secrets).
- [ ] Someone is designated to check logs on a schedule or alert.

---

## R3. Admin superuser documented

- [ ] At least one admin user exists and is documented (e.g. in a secure runbook or 1Password).
- [ ] Password reset / account recovery process documented.
- [ ] Role and permissions: ADMIN can access audit log, invoices, payouts, workforce; no shared admin credentials.

---

## R4. Onboarding checklist (client + worker) written

- [ ] **Client onboarding:** Steps to create client org, sites, contracts; invite client portal user (create User with role CLIENT and clientOrganizationId); share login and /client URL.
- [ ] **Worker onboarding:** Steps to create workforce account, add worker, assign to job; worker logs in at /login and sees /jobs.
- [ ] Document stored where ops/PM can follow (Notion, Confluence, or README in repo).

---

## R5. Manual fallback (portal down) documented

- [ ] What to do if the portal is unavailable: who to contact, how to communicate with clients/workers (email, phone).
- [ ] Any manual workarounds (e.g. record job completion offline, backfill when portal is back) documented.
- [ ] Escalation path for prolonged outage.

---

## R6. Soft launch done

- [ ] One internal or “fake” client onboarded.
- [ ] 10–20 jobs run through full lifecycle (schedule → assign → complete → approve → invoice).
- [ ] Invoices generated and PDFs checked.
- [ ] Audit log reviewed for correct entity types, actors, and transitions.
- [ ] Blockers found during soft launch fixed; no known data or workflow breaks.

---

## R7. Launch freeze in effect

- [ ] LAUNCH_FREEZE.md read and acknowledged by whoever deploys or changes code.
- [ ] Process in place: schema → migration + review; UI → review; logic → tests.

---

*After all items are checked and LAUNCH_READINESS_GATE.md is signed, launch freeze is in effect per LAUNCH_FREEZE.md.*
