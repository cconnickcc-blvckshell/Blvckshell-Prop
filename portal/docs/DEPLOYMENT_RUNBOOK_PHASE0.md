# Phase 0 deployment runbook — BLVCKSHELL OS

**Do not enable new application code until the additive database migration has been applied successfully.**

## 1. Required environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Prisma / Postgres (pooler) |
| `DIRECT_URL` | Yes (Supabase) | Migrations |
| `NEXTAUTH_URL` | Yes | Canonical portal origin for activation links |
| `NEXTAUTH_SECRET` | Yes | Session crypto |
| `CRON_SECRET` | Yes (Phase 0+) | Bearer for `/api/notifications/process` and other cron routes — **503 if missing** |
| `SENDGRID_API_KEY` | Yes (activation) | Outbound activation / transactional email |
| `SENDGRID_FROM_EMAIL` | Yes | Verified sender |
| `PORTAL_PUBLIC_URL` | Optional | Fallback if `NEXTAUTH_URL` unset in non-prod |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Recommended | Activation rate limiting |
| Twilio (`TWILIO_*`) | **No** for Phase 0 | Email-only activation; SMS jobs fail closed if queued without Twilio |

## 2. Database migration timing

1. **Before deploy:** run `npm run db:migrate:deploy` (or Vercel build hook with migrate) against production.
2. Migrations (order):
   - `20261026100000_account_activation_tokens`
   - `20261026110000_provisioning_and_activation_delivery`
3. **Rollback:** Prisma migrations are forward-only. Recovery = restore DB snapshot or manual SQL to drop new columns/enums if absolutely necessary (avoid on prod without backup).
4. **Deploy order:** **Migration first → then app** so new code does not read missing columns.

## 3. Provider configuration

- SendGrid: verify domain/single sender; test from staging.
- Set `SENDGRID_FROM_EMAIL` to verified address.
- Confirm activation emails build links from `NEXTAUTH_URL` (staging vs production).

## 4. Scheduler authentication

- Vercel Cron (or external scheduler) must `POST /api/notifications/process` with header `Authorization: Bearer ${CRON_SECRET}`.
- Missing/wrong secret → 401/503; notifications stay `PENDING` or `FAILED` (visible in admin/DB).

## 5. Staging smoke tests

- [ ] Apply migrations on staging DB
- [ ] Approve test worker application → `provisionedUserId` set, `activationInviteStatus` → `QUEUED` → `SENT`
- [ ] Approve test client signup (same)
- [ ] Re-approve / **Resend activation** → no duplicate users
- [ ] Complete activation link → login works
- [ ] Existing seeded admin login unchanged
- [ ] Force SendGrid failure → `activationInviteStatus` = `FAILED`, account still exists, resend works

## 6. End-to-end activation

Employee and client paths: admin approve → email queue → cron send → `/activate-account` (referrer `no-referrer`) → set password → `/login`.

## 7. Existing-user login regression

Log in as ADMIN, CLIENT, and WORKER accounts created before Phase 0; verify session and RBAC unchanged.

## 8. Notification retry

- Re-run cron on `PENDING` rows after fixing SendGrid.
- For `FAILED` activation invites, use admin **Resend activation** (new token, no duplicate provisioning).
- Outbox payload stores `activationTokenId` only — URL resolved at send time.

## 9. Post-deployment monitoring

- Alert on notification outbox `FAILED` count
- Alert on `activationInviteStatus = FAILED` on applications/signups
- Log lines must not include activation query tokens (only notification IDs)
- Cron 401/503 rates

## Production approval checklist

- [ ] Migrations applied
- [ ] Env vars set (especially `CRON_SECRET`, `NEXTAUTH_URL`, SendGrid)
- [ ] Staging E2E activation passed
- [ ] Test results attached to PR (Postgres-backed CI green)
- [ ] Sign-off from product/security
