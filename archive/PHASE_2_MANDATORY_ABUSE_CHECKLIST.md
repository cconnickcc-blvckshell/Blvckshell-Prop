# Phase 2: Mandatory Scenarios & Abuse Tests — Checklist

**Objective:** Every mandatory scenario has a passing test; abuse and failure cases are defined and either tested or explicitly documented.

**Reference:** LAUNCH_SPINE_90_DAY_PLAN.md §2.2, §2.3; EVIDENCE_PIPELINE_TEST_PLAN.md; 90_DAY_WEEK_BY_WEEK_CHECKLIST.md (Weeks 6–7).

---

## 1. Mandatory test scenarios (must pass before launch)

### Evidence

| Scenario | Expected | Current coverage / notes |
|---------|----------|---------------------------|
| Upload max photos | Success up to MAX_PHOTOS_PER_JOB (20) | Enforced in `upload-actions.ts`; integration test in EVIDENCE_PIPELINE_TEST_PLAN |
| Reject missing photos | submitCompletion returns error when count < requiredPhotoCount | `job-actions.ts` submitCompletion; `JobDetailClient` blocks submit; E2E `job-completion.spec.ts` "should show error for missing required photos" |
| Redaction applied | Only redacted uploads accepted | `upload-actions.ts` checks redactionApplied; EVIDENCE_PIPELINE_TEST_PLAN §1 |
| Evidence tied to correct job/item | Evidence linked to completion and optional itemId | DB schema + upload-actions; integration test |

**Actions:** Run E2E evidence/job-completion when DB and app available; add integration test for upload validation when NextAuth is mocked or test DB is used.

### Job lifecycle

| Scenario | Expected | Current coverage / notes |
|----------|----------|---------------------------|
| Schedule → assign → submit → approve | Full transition to APPROVED_PAYABLE | Pure state-machine tests; job-transitions.test.ts (DB); E2E job-completion |
| Reject → resubmit | COMPLETED_PENDING_APPROVAL → SCHEDULED → resubmit | State machine allows SCHEDULED from COMPLETED_PENDING_APPROVAL; job-actions rejectCompletion |
| Missed job → make-good | Make-good job created when applicable | Logic in admin/job actions; document or add test |

**Actions:** Ensure job-transitions.test.ts runs when TEST_DATABASE_URL is set; E2E covers happy path.

### Money

| Scenario | Expected | Current coverage / notes |
|----------|----------|---------------------------|
| Job approved → invoice | Job can be added to invoice; billableStatus | invoice-actions; admin invoice workflow E2E |
| Adjustments applied | BillingAdjustment applied to invoice | invoice-actions; PDF route |
| Payout calculated; audit trail | Payout batch + lines; AuditLog entries | payout-actions; state-machine and job-actions write AuditLog |

**Actions:** E2E admin/invoice-workflow.spec.ts; verify audit log entries in manual or integration test.

---

## 2. Abuse & failure tests

| Test | Requirement | Current implementation / notes |
|------|-------------|-------------------------------|
| **Rapid submissions** | Rate limit holds | No app-level rate limit on submit yet; consider middleware or action throttle (document as post-launch or implement). |
| **Large image uploads** | Reject or limit | `MAX_PHOTO_SIZE` (10MB) and `isValidFileSize()` in storage.ts; upload-actions validate size. Add integration test when test env is stable. |
| **Invalid role access** | 403 / no data leak | requireAdmin, requireWorker, requireClient, canAccessJob, canAccessInvoice enforce role; evidence API uses canAccessJob. E2E or API test with wrong role. |
| **Double submit** | Idempotent or blocked | submitCompletion transitions to COMPLETED_PENDING_APPROVAL; second submit same job would hit "Job cannot be submitted in current state". State machine + job-actions enforce. |

**Actions:**
- Document rate limiting as optional for launch or add a simple throttle.
- Confirm upload size and file type are validated in upload API (done in upload-actions).
- Add one integration or E2E test that asserts 403 for worker accessing another worker’s job and client accessing another org’s invoice (or document as manual check).
- Double submit: already blocked by status; add a unit test that submitCompletion after transition returns error if desired.

---

## 3. Summary

- **Pure unit:** State machine transitions — covered; run in CI without DB.
- **DB integration:** job-transitions, lead API — need TEST_DATABASE_URL; add CLIENT to test helpers where needed.
- **E2E:** Admin invoice workflow, worker job completion (including missing photos) — run when app + DB available.
- **Abuse:** Upload size and role checks are implemented; rate limit and explicit abuse tests are documented or to be added.

**If any mandatory scenario fails in a test run → no launch.** Use this checklist to sign off each item before launch.
