# Evidence Pipeline Invariants (Locked)

**Phase 0.2 — Existential. Treat like payments.**  
**No change without updating this doc and tests.**

---

## 1. Max photos per job

- **Constant:** `MAX_PHOTOS_PER_JOB = 20` (see `src/lib/storage.ts`)
- **Enforcement:** `upload-actions.ts` counts existing evidence for the job’s completion; rejects upload if `currentCount >= MAX_PHOTOS_PER_JOB`
- **Invariant:** At no time may a job have more than 20 evidence records (per job completion scope). DB has no unique constraint; enforcement is application-only.

---

## 2. Required photos before submission

- **Source of truth:** `Site.requiredPhotoCount` (default 4)
- **Enforcement:** `job-actions.ts` `submitCompletion()` must reject if evidence count for that completion < job’s site `requiredPhotoCount`
- **Invariant:** Worker cannot transition job to COMPLETED_PENDING_APPROVAL without at least `requiredPhotoCount` photos for that completion.

---

## 3. Redaction flags are booleans

- **Rule:** Server accepts only redaction having been applied. No string coercion bugs.
- **Implementation:** API receives FormData; `redactionApplied` is string. Check: `formData.get("redactionApplied") === "true"` → treat as true; otherwise false. Upload rejected if not true.
- **Invariant:** `uploadEvidence()` and `/api/evidence/upload` both require `redactionApplied === true` (strict); no other value counts as “redacted”.

---

## 4. Storage path format is immutable

- **Pattern:** `evidence/{jobId}/{completionId}/{timestamp}-{uuid}.{ext}`
- **Function:** `generateEvidencePath(jobId, completionId, filename)` in `src/lib/storage.ts`
- **Invariant:** All evidence uploads use this function; no ad-hoc paths. Ext from filename; timestamp and uuid ensure uniqueness.

---

## 5. Evidence cannot be deleted without audit log

- **Rule:** Any evidence delete (if implemented) must write an AuditLog entry before removal (entityType=Evidence, entityId, action=delete, metadata with jobId, completionId, actor).
- **Current state:** No delete endpoint in scope; when added, enforce audit-before-delete.

---

## 6. File type and size

- **Types:** `ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]`
- **Max size:** `MAX_PHOTO_SIZE = 10 * 1024 * 1024` (10MB)
- **Enforcement:** `isValidFileType()`, `isValidFileSize()` in `storage.ts`; called in `uploadEvidence()` and route.

---

*After launch: any change to limits or rules requires update here + tests (see EVIDENCE_PIPELINE_TEST_PLAN.md).*
