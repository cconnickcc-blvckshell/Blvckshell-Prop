# Blvck Bible — Storage and Evidence

**Purpose:** In-depth record of storage buckets, paths, evidence rules, and compliance document handling.  
**Source:** `portal/src/lib/storage.ts`, `portal/src/server/actions/upload-actions.ts`, Evidence model.  
**Update:** When bucket names, path schema, or limits change.

---

## Storage Provider

**Provider:** Supabase Storage.  
**Config:** Storage client and bucket names in env (e.g. NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or anon key as appropriate).  
**File:** `src/lib/storage.ts` — exports `storage`, bucket constants, path generators, and validators.

---

## Buckets

| Bucket | Purpose |
|--------|---------|
| evidence | Job completion photos; one folder per job or per completion; path includes jobId, completionId, and filename. |
| compliance | Workforce compliance documents (COI, WSIB, etc.); path by workforceAccountId and type. |

**Constants (typical):** EVIDENCE_BUCKET = "evidence", COMPLIANCE_BUCKET = "compliance".

---

## Evidence

### Path Generation

**Function:** generateEvidencePath(jobId, completionId, fileType, itemId?, checklistRunId?): string  
**Purpose:** Build storage path for one evidence file. Ensures no collision (e.g. unique filename with cuid or timestamp).  
**Usage:** Called from uploadEvidence before uploading to Supabase and when writing Evidence.storagePath.

### Validation

- **File type:** ALLOWED_FILE_TYPES (e.g. image/jpeg, image/jpg, image/png, image/webp). isValidFileType(mimeType): boolean.  
- **File size:** MAX_PHOTO_SIZE (e.g. 10 MB). isValidFileSize(size): boolean.  
- **Count:** MAX_PHOTOS_PER_JOB (e.g. 20). Enforced in upload flow (count Evidence per job or per completion before allowing new upload).  

### Evidence Record

**Model:** Evidence (see 01_Data_Model).  
**Required for upload (API):** redactionApplied must be true (evidence must be captured and redacted in-app; “Take photo” flow).  
**Gold standard:** redactionAttestedAt, redactionAttestedByUserId optional but recommended when redaction is applied.  
**Links:** jobCompletionId (required); checklistRunId, itemId optional for item-level evidence.

### Upload Flow

1. API receives FormData (file, jobId, completionId, redactionApplied, ...).  
2. Validate redactionApplied === true; validate file type/size.  
3. Load JobCompletion (and optionally verify worker or admin).  
4. Check photo count per job/completion < MAX_PHOTOS_PER_JOB.  
5. generateEvidencePath(...).  
6. Upload file to Supabase evidence bucket.  
7. Create Evidence row with storagePath, fileType, redactionApplied, redactionType, jobCompletionId, checklistRunId?, itemId?.  
**See:** 02_APIs (POST /api/evidence/upload), upload-actions.uploadEvidence.

---

## Compliance Documents

**Function:** generateCompliancePath(workforceAccountId, type, filename): string  
**Purpose:** Build storage path for compliance upload (COI, WSIB, etc.).  
**Usage:** When uploading ComplianceDocument; store path in ComplianceDocument.storagePath.  
**Model:** ComplianceDocument (workforceAccountId, type, storagePath, expiresAt).  
**Bucket:** compliance.

---

## Retention and Deletion

**Script (if present):** `scripts/evidence-retention.ts` or similar — may implement retention policy (e.g. delete evidence older than X months) and optionally soft-delete or redact Evidence records.  
**Policy:** Document retention policy in DECISIONS.md or SECURITY.md; reference here.  
**Data retention:** See portal/DATA_RETENTION.md if it exists.

---

## Summary Table

| Item | Value / rule |
|------|---------------|
| Evidence bucket | evidence |
| Compliance bucket | compliance |
| Max photo size | 10 MB (MAX_PHOTO_SIZE) |
| Allowed evidence types | image/jpeg, image/jpg, image/png, image/webp |
| Max photos per job | 20 (MAX_PHOTOS_PER_JOB) |
| Redaction | Required (redactionApplied true) for upload |
| Paths | generateEvidencePath, generateCompliancePath |

---

*End of Storage and Evidence.*
