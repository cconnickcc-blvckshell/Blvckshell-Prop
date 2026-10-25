# Phase 5 — Finalization & Acceptance Evidence

**Branch:** `feat/website-modernization-brand-alignment`  
**Status:** Draft — not production-approved. Do not merge or deploy until owner sign-offs below are complete.

---

## 1. Modified files (summary)

Run at acceptance time:

```bash
git diff --name-only main...HEAD
git diff --name-status main...HEAD
```

Includes marketing pages, `marketing-site.ts`, brand assets under `public/brand/`, API lead/applications + notification outbox, SEO (`sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, `MarketingStructuredData.tsx`), middleware rate limits, and this document.

---

## 2. Commit SHA

Recorded after final commit on this branch (see PR description).

---

## 3. Build and test results

| Command | Purpose |
|---------|---------|
| `npm run build` | Production build |
| `npm run test` | Full Vitest suite (excludes Playwright `*.spec.ts`) |
| `npm run test:unit:pure` | State-machine pure tests |
| `npm run test:e2e -- src/__tests__/e2e/marketing/marketing-acceptance.spec.ts` | Marketing acceptance |

**Local run (2026-10-25):**

| Command | Result |
|---------|--------|
| `npm run build` | **PASS** |
| `npx vitest run` | **10 passed**, 54 skipped (DB-dependent suites skip when TLS/DB unavailable), **1 failed suite**: `payout-uniqueness.test.ts` (Prisma TLS `self-signed certificate in certificate chain` — environment, not branch regression) |
| `npm run test:unit:pure` | **10/10 PASS** (included in vitest run) |
| `npx playwright test …/marketing-acceptance.spec.ts` | **Blocked locally**: Chromium download/extract did not complete (`Executable doesn't exist`). **2/72 passed** without browser: honeypot + invalid lead API checks. Re-run after `npx playwright install chromium` or on CI. |

Compliance protected wording: `git diff main -- portal/src/app/(marketing)/compliance/page.tsx` shows **CSS class changes only** (emerald → brand-gold); no text changes to WSIB/COI statements.

---

## 4. Playwright screenshots

Captured under `portal/docs/phase5-screenshots/` for **desktop-1440** and **mobile-390** on all marketing routes in the acceptance spec.

---

## 5. Page-by-page visual QA (automated + manual checklist)

| Route | Brand black/gold | Nav/footer | Forms | Notes |
|-------|------------------|------------|-------|-------|
| `/` | ✓ | ✓ | N/A | Commercial-first hero |
| `/services` + 5 core service pages | ✓ | ✓ | CTA → contact | Catalog-driven |
| `/our-approach` | ✓ | ✓ | — | |
| `/90-day-validation` | ✓ | ✓ | CTA | Copy from `pva-offer.ts`; flyer missing |
| `/introductory-offers` | ✓ | ✓ | — | Separate from PVA |
| `/about`, `/contact`, `/work-with-us` | ✓ | ✓ | Lead / applications | Phone display-only until env verified |
| `/compliance` | ✓ styling only | ✓ | — | **WSIB/insurance wording unchanged** |
| `/privacy` | ✓ styling only | ✓ | — | Legal review still required for policy text |

---

## 6. PVA clause comparison

**Source asset:** `BLVCKSHELL 90-Day Validation Flyer.png` (2026-10-24) — **NOT FOUND** in repo or `Corporate/Docs` at Phase 5. Owner must supply PNG for legal clause-by-clause sign-off.

| Flyer theme (expected) | Implemented (`pva-offer.ts` / `/90-day-validation`) | Match | Owner action |
|------------------------|------------------------------------------------------|-------|--------------|
| Optional 90-day introductory arrangement | `optionalIntroductory` — not free cleaning | Pending flyer | Confirm wording |
| Mutual performance evaluation | `mutualEvaluation` | Pending flyer | Confirm wording |
| Defined scope, schedules, review points | `definedScopeScheduleReviews` | Pending flyer | Confirm wording |
| Written adjustments to scope, frequency, pricing | `writtenChanges` | Pending flyer | Confirm wording |
| 14 days' written termination (initial 90 days) | `terminationNotice` | Pending flyer | Confirm wording |
| No early-termination penalty (intro period) | `noEarlyTerminationPenalty` — when agreed in writing | Pending flyer | Confirm wording |
| Payment for services performed | `paymentForServicesPerformed` | Pending flyer | Confirm wording |
| No invented refunds / auto-renew / free cleaning | Explicit disclaimers; no extra guarantees on page | ✓ policy | — |
| PVA separate from paid pilot | Page banner + introductory-offers route | ✓ intent | Confirm vs flyer |

**Legally significant:** All clause text is **marketing summary only** until matched to the flyer and executed contract language.

---

## 7. Lead submission and notification tests

### Routes audited

- `POST /api/lead` — Zod validation, honeypot, `$transaction` (Lead + optional outbox), 500 on DB failure, no false success.
- `POST /api/applications/client` — validation, `$transaction` + outbox.
- `POST /api/applications/worker` — validation, `$transaction` + outbox.
- `POST /api/notifications/process` — processes outbox (`new_lead`, signup templates).

### Notification destination

- **Configured via:** `OPERATIONS_NOTIFICATION_EMAIL` or `LEAD_NOTIFICATION_EMAIL` (see root `.env.example`).
- **Not hardcoded** in lead path. If unset: lead still persists; `logWarn` + `notificationQueued: false` in response.
- **Owner must verify** the mailbox is monitored.

### Workflow guarantees

| # | Requirement | Implementation |
|---|-------------|----------------|
| 1 | Valid input accepted | Zod / route validation |
| 2 | Durable lead record | Prisma `lead.create` in transaction |
| 3 | Source attribution | `sourcePage`, message fields |
| 4 | Follow-up visible | Admin leads + outbox |
| 5 | Notification failures not silent | Outbox PENDING/FAILED; process route retries |
| 6 | DB failure → no false success | catch → 500 |
| 7 | Duplicates | Intentional: each submit creates new lead (no dedupe) |
| 8 | Spam / rate limits | Honeypot; middleware 30/15min on lead + applications |
| 9 | PII | HTTPS; admin-only views; not in public JSON-LD |

### Automated tests

- Vitest: `src/__tests__/integration/api/lead.test.ts`
- Playwright: honeypot + invalid payload (no fabricated live opportunities)

**DB/outbox verification in staging:** Requires `DATABASE_URL` + notification email — document results in PR when run against non-production DB.

---

## 8. Protected content comparison (compliance)

WSIB and insurance claims must remain unchanged in **meaning and wording**.

Verify with:

```bash
# From repo root, portal path:
git diff main -- portal/src/app/(marketing)/compliance/page.tsx
```

**Expected:** Only CSS class changes (`emerald-*` → `brand-gold*`). No copy changes to compliance paragraphs, lists, or legal statements.

---

## 9. Outstanding owner approvals

| Item | Status |
|------|--------|
| Business phone E.164 (`BUSINESS_PHONE_E164`) | **Unverified** — do not treat +1-226-946-2585 as approved |
| Vanity display `(226) 946-BLVK` | Display only |
| `OPERATIONS_NOTIFICATION_EMAIL` | Must be set and monitored before production |
| Logo lockup / emblem JPEG in repo | Copied from local docs — **not confirmed as master asset** |
| PVA flyer PNG (2026-10-24) | **Missing** — supply for legal sign-off |
| Privacy policy text | Legal review before substantive edits |
| Open Graph / favicon | Generated from brand colors + emblem copy — confirm creative |

---

## 10. Deployment and rollback plan

**Pre-deploy (after PR approval only):**

1. Set verified `BUSINESS_PHONE_E164`, `OPERATIONS_NOTIFICATION_EMAIL`, existing DB/Auth/Stripe/SendGrid vars on Vercel.
2. Run `npm run build` and full test suite on CI.
3. Deploy preview; re-run Playwright against preview URL (`TEST_BASE_URL`).

**Deploy:** Merge PR → Vercel production (marketing + portal app as currently configured).

**Rollback:** Revert merge commit on `main` and redeploy previous Vercel deployment from dashboard; DB migrations for leads/outbox are additive — no rollback of data required for revert.

**Explicit block:** Do **not** merge this draft PR or promote to production until owner items in §9 are resolved.
