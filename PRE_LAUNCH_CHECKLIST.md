# Pre-Launch Compliance Checklist

**Purpose:** Final verification before production launch.  
**Status:** Complete all items before go-live.

---

## Security & Access Control

- [ ] **Middleware protection:** Verify `/admin/**`, `/jobs/**`, `/vendor/**` routes are protected by middleware
- [ ] **Rate limiting:** Verify login (5/15min), lead submit (10/15min), evidence upload (10/15min) are enforced
- [ ] **RBAC:** Test all roles (ADMIN, VENDOR_OWNER, VENDOR_WORKER, INTERNAL_WORKER) have correct access
- [ ] **Session timeout:** Verify 24h session timeout is enforced
- [ ] **Password hashing:** Verify bcrypt is used (salt rounds ≥ 10)

---

## Billing & Tax

- [ ] **Monthly base auto-add:** Verify draft invoices auto-add monthly base from active contracts (D1)
- [ ] **Tax calculation:** Verify Ontario HST 13% is computed correctly on all invoices
- [ ] **Invoice PDF:** Verify PDF shows Subtotal, HST (13%), Total correctly
- [ ] **Invoice locking:** Verify jobs are locked (`billableStatus = Invoiced`) when invoice is Sent/Paid
- [ ] **Audit trail:** Verify base removal requires audit note and is logged

---

## Evidence & Privacy

- [ ] **Camera-only capture:** Verify no file picker exists; only "Take photo" path works
- [ ] **Redaction enforcement:** Verify server rejects uploads without `redactionApplied === true`
- [ ] **Retention script:** Verify evidence retention script runs (90 days default)
- [ ] **Evidence access:** Verify evidence is only accessible to authorized users (assigned worker, admin)

---

## Vendor Visibility (D4)

- [ ] **Vendor earnings page:** Verify `/vendor/earnings` shows payout totals by period
- [ ] **No per-worker breakdown:** Verify vendor owners do NOT see per-worker earnings
- [ ] **Job list:** Verify vendor owners see job list (read-only, no pricing)

---

## Operational

- [ ] **Environment variables:** Verify all required env vars are set (DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- [ ] **Database migrations:** Verify all migrations are applied
- [ ] **Supabase Storage:** Verify buckets exist and are configured correctly
- [ ] **Error handling:** Verify error pages (404, 500) exist and don't leak stack traces in production
- [ ] **Logging:** Verify audit logs are written for all state transitions

---

## Documentation

- [ ] **AUTHORITATIVE_DECISIONS.md:** Review and confirm all decisions are locked
- [ ] **OPERATIONAL_PRIVACY_APPENDIX.md:** Review and confirm policies are documented
- [ ] **SECURITY.md:** Review and confirm security practices are documented
- [ ] **README.md:** Verify setup instructions are accurate

---

## Testing

- [ ] **Login flow:** Test login with valid/invalid credentials
- [ ] **Job completion:** Test worker completes job with checklist and evidence
- [ ] **Invoice creation:** Test admin creates draft invoice, adds jobs, marks Sent/Paid
- [ ] **Payout batch:** Test admin creates payout batch and marks paid
- [ ] **Vendor earnings:** Test vendor owner views payout totals

---

*Complete all items before production launch. Document any exceptions.*
