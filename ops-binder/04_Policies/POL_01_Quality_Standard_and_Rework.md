# POL_01: Quality Standard and Rework

**Policy Version:** 1.0  
**Date:** February 16, 2026  
**Purpose:** Define quality standards, pass/fail thresholds, rework procedures, and credit policies. Ensures consistent quality and accountability.

---

## Quality Standard: Definition of "Done"

### Pass Criteria

A job is considered **PASS** when:

1. **All required checklist items marked PASS:**
   - No FAIL items (unless documented reason)
   - All required items completed
   - No TBD or incomplete items

2. **Visual standards met:**
   - No visible debris, streaks, smudges, or residue
   - Floors clean (no debris, streaks, residue)
   - Surfaces clean (no dust, smudges, fingerprints)
   - Bins emptied and clean (if applicable)
   - No unpleasant odors

3. **Photo evidence sufficient:**
   - Minimum photo count met (per site)
   - Mandatory photo items captured
   - Photos clear and show completion

4. **No safety hazards:**
   - Area safe for residents/visitors
   - No maintenance issues that pose risk

---

## Fail Criteria

A job is considered **FAIL** (requires rework) when:

1. **Checklist items marked FAIL:**
   - Required items not completed
   - Items completed but not meeting standard
   - Missing mandatory photo items

2. **Visual standards not met:**
   - Visible debris, streaks, smudges, or residue
   - Bins not emptied or visibly dirty
   - Unpleasant odors present
   - Areas skipped or not cleaned

3. **Photo evidence insufficient:**
   - Minimum photo count not met
   - Mandatory photo items missing
   - Photos unclear or don't show completion

4. **Safety or compliance issues:**
   - Safety hazards not reported
   - Maintenance issues not documented

---

## Rework Assignment

### When Rework Required

**Admin decision:**
- Admin reviews completion (status: COMPLETED_PENDING_APPROVAL)
- Admin identifies deficiencies
- Admin rejects completion (status: COMPLETED_PENDING_APPROVAL → SCHEDULED)
- Rejection reason stored in audit log

**Rework assignment:**
- Same worker who submitted completion (preferred)
- Or different worker from same WorkforceAccount
- Or different WorkforceAccount (if same worker repeatedly fails)

---

### Rework Procedure

**Step 1:** Admin rejects completion:
- Rejection reason: Specific deficiencies (e.g., "Missing required photos for garbage room")
- Job status: SCHEDULED (worker can resubmit)

**Step 2:** Worker receives notification:
- Rejection reason visible
- Job appears in worker's job list again

**Step 3:** Worker corrects deficiencies:
- Addresses rejection reason
- Completes missing items
- Takes additional photos if needed
- Resubmits completion

**Step 4:** Admin reviews resubmission:
- Approves if deficiencies corrected
- Rejects again if still deficient (with new reason)

---

## When Workers Are Removed from Site

### Removal Triggers

**Worker removed from site if:**

1. **Repeated failures:**
   - 3+ consecutive rejections on same site
   - Pattern of incomplete or substandard work

2. **Serious quality issues:**
   - Gross negligence (areas completely skipped)
   - Safety violations
   - Non-compliance with SOPs

3. **Conduct violations:**
   - Solicitation of residents
   - Unprofessional behavior
   - Violation of site rules

**Removal process:**
- Admin removes worker from site assignment
- Worker no longer receives jobs for that site
- Alternative worker assigned
- Documented in audit log

---

## Credit and Reclean Policy

### When Credits Issued

**Credits issued to client if:**

1. **Service not performed:**
   - Job cancelled by company (not client)
   - Job missed (no-show by worker)
   - Job incomplete (areas skipped, not corrected)

2. **Service below standard:**
   - Repeated failures not corrected
   - Client complaint validated
   - Quality audit identifies deficiencies

**Credit amount:**
- Per job: Full job amount if not performed
- Partial credit: Pro-rated if partially performed
- Per site Schedule A or credit policy addendum

---

### Reclean Authorization

**Reclean required if:**

1. **Client complaint:**
   - Client reports area not cleaned
   - Admin validates complaint
   - Reclean authorized

2. **Quality audit:**
   - Admin inspection identifies deficiencies
   - Reclean authorized

**Reclean procedure:**
- Admin creates reclean work order
- Worker assigned (may be different worker)
- Reclean completed per standard procedure
- No additional charge to client
- Documented in audit log

---

## Recordkeeping

### Quality Records

**Admin maintains records:**

1. **Completion history:**
   - All completions (approved and rejected)
   - Rejection reasons
   - Resubmission history

2. **Worker performance:**
   - Pass/fail rate per worker
   - Rejection reasons per worker
   - Site removal history

3. **Site quality:**
   - Client complaints per site
   - Reclean frequency per site
   - Credit history per site

**Records stored in:**
- Portal database (JobCompletion, Approval, AuditLog)
- QA forms (QA_01 Site Inspection, QA_03 Reclean Authorization)

---

## Decision Tree: Quality Issues

### Issue: Checklist Item Marked FAIL
→ **Admin reviews** → **If valid, reject completion** → **Worker corrects** → **Resubmit**

### Issue: Client Complains About Quality
→ **Admin validates complaint** → **If valid, authorize reclean** → **No charge to client** → **Document**

### Issue: Repeated Failures by Worker
→ **Admin reviews pattern** → **If 3+ consecutive failures, remove worker from site** → **Assign alternative worker**

### Issue: Areas Skipped
→ **Admin rejects completion** → **Worker completes missing areas** → **Resubmit** → **If repeated, remove worker**

---

## References

- Quality standards: Per checklist templates (CL_01 through CL_08)
- Reclean authorization: QA_03 (Reclean Authorization Form)
- Site inspection: QA_01 (Site Inspection Form)
- Credit policy: Schedule 08 (Credit and Reclean Policy Addendum)

---

**This policy ensures consistent quality standards. Pass/fail thresholds are clear; rework and credits are documented and auditable.**
