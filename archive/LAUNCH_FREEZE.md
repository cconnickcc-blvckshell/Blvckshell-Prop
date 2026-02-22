# Launch Freeze Policy

**Effective:** When sign-off is given on LAUNCH_READINESS_GATE.md (Phase 4).  
**Purpose:** Keep the system trusted and auditable after launch. No silent changes.

---

## Rule

After launch freeze is in effect:

1. **Schema changes** — Not allowed without a Prisma migration, review, and deployment runbook. No ad-hoc SQL in production.
2. **UI changes** — Not allowed without review (design/UX or CTO). No "quick tweaks" that affect workflows or empty states.
3. **Logic changes** — Not allowed without tests (unit, integration, or E2E as appropriate). No "fix in prod" without a test that would have caught the bug.

**If it affects money, access, or evidence → it is in the audit envelope and must follow the above.**

---

## Process

- **Before changing schema:** Create migration, run in test DB, document in changelog; deploy with backup.
- **Before changing UI:** Get review; update any affected empty states or confirmations.
- **Before changing logic:** Add or update tests; ensure mandatory scenarios (Phase 2 checklist) still pass.

---

## Exceptions

- **Security or data-correction hotfixes:** Document in incident log; add test or migration as follow-up within one sprint.
- **Content-only (copy, images):** No freeze for marketing copy or non-workflow assets; keep tone consistent with authority language.

---

*Reference: LAUNCH_READINESS_GATE.md §6 (R7), LAUNCH_SPINE_90_DAY_PLAN.md §4.3*
