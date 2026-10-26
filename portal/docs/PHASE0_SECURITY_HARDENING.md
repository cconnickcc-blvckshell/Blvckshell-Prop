# Phase 0 — Security hardening log

**Branch:** `feat/blvckshell-os-phase0-1-foundation`  
**Baseline `main`:** `269df93` (includes public phone fix)

| # | Item | Change | Tests |
|---|------|--------|-------|
| 1 | Git baseline | Audit doc committed; feature branch from `main` | — |
| 2 | Notification cron | `verifyCronRequest` — **503** if `CRON_SECRET` missing; **401** if wrong | `cron-auth.test.ts` |
| 3 | Fake SENT removed | EMAIL/SMS without provider → **FAILED**, stays auditable | `cron-auth.test.ts` |
| 4 | FOUNDER/ADMIN | `isStaffAdmin` for access + job transitions; founder-only pricing unchanged | `matrix.test.ts`, `rbac.test.ts` |
| 5 | Account activation | 72h token links; no plaintext temp passwords in email | `templates.test.ts` |
| 6 | Email XSS | `escapeHtml` on HTML templates | `html-escape.test.ts`, `templates.test.ts` |
| 7 | Worker E2E | `data-testid="checklist-item"`; button labels aligned | `job-completion.spec.ts` (requires Playwright + seed) |

**Production action required:** Set `CRON_SECRET`, SendGrid, and Twilio on Vercel before expecting notifications to send.

**Not changed:** WSIB/insurance marketing copy (`compliance/page.tsx`).
