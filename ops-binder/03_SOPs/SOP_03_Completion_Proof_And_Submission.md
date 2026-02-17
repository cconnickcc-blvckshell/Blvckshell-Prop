# SOP_03: Completion Proof and Submission

**SOP Version:** 1.0  
**Date:** February 16, 2026  
**Purpose:** Exact procedures for taking photos, labeling evidence, uploading, and submitting job completion. Ensures audit-safe proof collection.

---

## Photo Evidence Requirements

### Minimum Photo Count

**Per site (configurable, default 4):**
- Each site has `requiredPhotoCount` (typically 4)
- Must meet or exceed this count to submit completion
- Cannot exceed photo cap (20 per job)

**Per area (per checklist):**
- See checklist templates (CL_01 through CL_08) for area-specific minimums
- Mandatory photo items must be captured (e.g., floor, bins)

---

## Photo Taking Procedure

### Before Taking Photos

**Step 1.1:** Complete cleaning task for that area  
**Step 1.2:** Verify area meets "definition of done":
- No visible debris, streaks, or residue
- Bins emptied (if applicable)
- Surfaces clean

**Step 1.3:** Ensure good lighting:
- Use flash if needed
- Avoid shadows that obscure completion

---

### Photo Composition

**Step 2.1:** Frame photo to show completion:
- **Floor photos:** Show clean floor, no debris or streaks
- **Bin photos:** Show empty, clean bins
- **Surface photos:** Show clean surfaces, no smudges
- **Overall photos:** Show entire area clean

**Step 2.2:** Avoid capturing:
- Resident faces (if possible)
- Unit doors with visible numbers (if avoidable)
- Personal belongings
- Other workers (unless necessary)

**Step 2.3:** Take multiple angles if needed:
- Close-up for detail
- Wide shot for context

---

### Photo Labeling and Organization

**Step 3.1:** Photos are automatically timestamped by device  
**Step 3.2:** Portal will organize photos by:
- Job ID
- Completion ID
- Timestamp
- Upload order

**Step 3.3:** No manual labeling required (portal handles organization)

**Photo path pattern:** `evidence/{jobId}/{completionId}/{timestamp}-{uuid}.{ext}`

---

## Upload Procedure

### During Job (Draft Save)

**Step 4.1:** As you complete each area:
- Complete checklist items
- Take required photos
- Upload photos immediately (don't wait until end)

**Step 4.2:** Save draft periodically:
- After each area completed
- If taking break
- If upload fails (retry, then save draft)

**Step 4.3:** Draft includes:
- Checklist answers completed so far
- Photos uploaded so far
- Can resume later if interrupted

---

### Upload Validation

**Before upload, verify:**
- [ ] File type: jpg, jpeg, png, or webp
- [ ] File size: ≤ 10MB per photo
- [ ] Photo count: Will not exceed 20 per job after upload
- [ ] Photo quality: Clear and shows completion

**If validation fails:**
- Resize/compress photo if too large
- Convert to allowed format if needed
- Retry upload

---

### Upload Retry

**If upload fails:**

**Step 5.1:** Check connection (WiFi or mobile data)  
**Step 5.2:** Retry upload (up to 3 attempts)  
**Step 5.3:** If still fails:
- Save draft (checklist + photos uploaded so far)
- Contact admin if persistent issue
- Resume later when connection stable

**Step 5.4:** Do not lose work — draft save preserves progress

---

## Completion Submission

### Pre-Submission Checklist

**Before submitting completion, verify:**

- [ ] **All checklist items answered:**
  - Every item marked PASS / FAIL / NA
  - No TBD or incomplete items
  - Notes added where needed (FAIL items, maintenance issues)

- [ ] **Minimum photo count met:**
  - Site's `requiredPhotoCount` met (e.g., 4)
  - Mandatory photo items captured (per checklist)
  - Total photos ≤ 20 (photo cap)

- [ ] **All areas completed:**
  - All areas in checklist template completed
  - No areas skipped

- [ ] **Draft saved:**
  - Current progress saved (in case submission fails)

---

### Submission Process

**Step 6.1:** Review completion summary:
- Checklist items: X answered, Y PASS, Z FAIL
- Photos: X uploaded, Y required minimum
- Notes: X notes added

**Step 6.2:** If any requirement not met:
- Complete missing items
- Take additional photos if needed
- Add notes where needed
- Do not submit until complete

**Step 6.3:** Submit completion:
- Tap "Submit Completion" button
- Confirm submission
- Wait for confirmation (job status: COMPLETED_PENDING_APPROVAL)

**Step 6.4:** Verify submission successful:
- Job status changed to COMPLETED_PENDING_APPROVAL
- Confirmation message received
- If submission fails, retry or contact admin

---

### Post-Submission

**Step 7.1:** Job status: COMPLETED_PENDING_APPROVAL  
**Step 7.2:** Admin will review:
- Checklist answers
- Photo evidence
- Notes

**Step 7.3:** Admin decision:
- **Approve:** Job → APPROVED_PAYABLE (ready for payout)
- **Reject:** Job → SCHEDULED (worker can resubmit after corrections)

**Step 7.4:** If rejected:
- Review rejection reason
- Make corrections
- Resubmit completion

---

## Time Stamping Expectations

**Automatic timestamps:**
- Photos: Device timestamp (EXIF data)
- Completion: Server timestamp on submission
- Draft saves: Server timestamp on save

**No manual timestamps required** — system handles all timing.

---

## What Happens If Missing Photos

### During Submission

**If minimum photo count not met:**
- Submission rejected with error: "Minimum photo count not met. Required: X, Uploaded: Y"
- Take additional photos
- Resubmit

**If mandatory photo items missing:**
- Submission rejected with error: "Mandatory photo items missing: [list]"
- Take missing photos
- Resubmit

---

### After Submission (Admin Review)

**If admin finds photos insufficient:**
- Admin rejects completion
- Rejection reason: "Insufficient photo evidence: [details]"
- Job → SCHEDULED
- Worker takes additional photos and resubmits

---

## Draft Completion Save/Resume

### Saving Draft

**When to save draft:**
- After completing each area
- Before taking break
- If upload fails
- Before leaving site (if not submitting immediately)

**Draft includes:**
- Checklist answers completed so far
- Photos uploaded so far
- Notes added so far

**Draft status:** JobCompletion with DRAFT status (or JobCompletionDraft table per DECISIONS)

---

### Resuming Draft

**Step 8.1:** Open job in portal  
**Step 8.2:** Load draft (if exists)  
**Step 8.3:** Continue from where left off:
- Complete remaining checklist items
- Take remaining photos
- Upload photos
- Submit when complete

**Step 8.4:** Draft persists until:
- Completion submitted (draft becomes final)
- Job cancelled
- Draft manually deleted (admin only)

---

## Decision Tree: Common Issues

### Issue: Photo Upload Fails
→ **Retry upload** → **If fails, save draft** → **Resume later** → **Contact admin if persistent**

### Issue: Minimum Photo Count Not Met
→ **Take additional photos** → **Upload** → **Resubmit**

### Issue: Checklist Item Cannot Be Completed
→ **Mark FAIL** → **Add note explaining reason** → **Contact admin if critical** → **Submit with FAIL item**

### Issue: Submission Fails
→ **Check connection** → **Retry submission** → **If fails, save draft** → **Contact admin**

### Issue: Forgot to Take Photo for Area
→ **Return to area** → **Take photo** → **Upload** → **Resubmit**

---

## References

- Checklist templates: CL_01 through CL_08 (photo requirements per area)
- Site photo requirements: Schedule D (QA and Evidence Requirements)
- Photo cap: 20 per job (DECISIONS §3.4)
- Draft completion: DECISIONS §3.2 (JobCompletion with DRAFT status)

---

**This SOP ensures audit-safe completion proof. Follow it exactly for every job submission.**
