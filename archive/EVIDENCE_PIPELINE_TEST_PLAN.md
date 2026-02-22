# Evidence Pipeline Test Plan

**Purpose:** Define comprehensive testing requirements for the evidence upload pipeline. This is **P0** because evidence integrity is the core brand promise.

**Generated:** February 2026  
**Status:** Must be implemented before production scale

---

## Core Principle

**Evidence capture must be boringly correct. Every failure mode must be tested.**

---

## 1. Unit Tests (Required)

### Upload Validation

**Test:** `uploadEvidence()` function validation

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| Valid upload | File < 10MB, jpg, redactionApplied=true | Success |
| Invalid file type | File type = application/pdf | Error: "Invalid file type" |
| File too large | File size = 11MB | Error: "File too large" |
| Missing redaction | redactionApplied=false or missing | Error: "Evidence must be captured and redacted in-app" |
| Redaction string handling | redactionApplied="true" (string) | Success (correctly converts to boolean) |
| Exceeds photo limit | Job already has MAX_PHOTOS_PER_JOB photos | Error: "Maximum X photos per job reached" |
| Invalid job ID | jobId = "invalid" | Error: "Job not found" or "Unauthorized" |
| Unauthorized access | Worker tries to upload for unassigned job | Error: "Unauthorized" |

### File Type Validation

**Test:** `isValidFileType()` function

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| Valid types | image/jpeg, image/jpg, image/png, image/webp | true |
| Invalid types | application/pdf, text/plain, image/gif | false |
| Case sensitivity | IMAGE/JPEG, Image/Jpeg | Should handle (implementation-dependent) |

### File Size Validation

**Test:** `isValidFileSize()` function

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| Valid size | 5MB | true |
| Valid size | 10MB (exact limit) | true |
| Invalid size | 10MB + 1 byte | false |
| Edge case | 0 bytes | false (or true, document decision) |

### Photo Count Enforcement

**Test:** Per-job photo limit

| Test Case | Scenario | Expected Result |
|-----------|----------|-----------------|
| Under limit | Job has 5 photos, limit is 20 | Success |
| At limit | Job has 20 photos, limit is 20 | Error: "Maximum 20 photos per job reached" |
| Over limit | Job has 21 photos (shouldn't happen) | Error: "Maximum 20 photos per job reached" |

---

## 2. Integration Tests (Required)

### Upload Flow End-to-End

**Test:** Complete upload pipeline

1. **Setup:** Create job, assign to worker, create completion
2. **Upload:** POST to `/api/evidence/upload` with valid file
3. **Verify:**
   - File stored in Supabase Storage at correct path
   - Evidence record created in database
   - Evidence linked to completion
   - Photo count incremented
   - Worker can access evidence via `/api/evidence/[id]`

### Redaction Enforcement

**Test:** Redaction requirement enforcement

1. **Attempt upload without redaction:** `redactionApplied=false`
2. **Expected:** Route rejects with 400 error
3. **Attempt upload with redaction:** `redactionApplied="true"`
4. **Expected:** Upload succeeds

### Access Control

**Test:** Evidence access permissions

1. **Worker A uploads evidence for Job 1**
2. **Worker B attempts to access:** GET `/api/evidence/[id]`
3. **Expected:** 403 Forbidden (if Worker B not assigned to Job 1)
4. **Admin attempts to access:** GET `/api/evidence/[id]`
5. **Expected:** 200 OK (admin can access all)

### Storage Path Generation

**Test:** `generateEvidencePath()` function

| Test Case | Input | Expected Pattern |
|-----------|-------|------------------|
| Valid path | jobId, completionId, filename | `evidence/{jobId}/{completionId}/{timestamp}-{uuid}.{ext}` |
| Path uniqueness | Multiple uploads same job | Different timestamps/UUIDs |
| Special characters | Filename with spaces/special chars | Sanitized/handled correctly |

---

## 3. Invariant Tests (Required)

### Photo Count Invariant

**Invariant:** `COUNT(Evidence WHERE jobCompletion.jobId = X) <= MAX_PHOTOS_PER_JOB`

**Test:**
1. Upload photos up to limit
2. Attempt one more upload
3. Verify count never exceeds limit
4. Verify database constraint (if exists)

### Evidence-Completion Link Invariant

**Invariant:** Every Evidence record must link to a valid JobCompletion

**Test:**
1. Create evidence record
2. Verify `jobCompletionId` exists
3. Verify `jobCompletion.jobId` matches evidence's job

### Storage Consistency Invariant

**Invariant:** Every Evidence record must have corresponding file in storage

**Test:**
1. Upload evidence
2. Verify file exists at `storagePath` in Supabase Storage
3. Verify file can be downloaded
4. Verify file content matches uploaded file

---

## 4. Error Handling Tests

### Network Failures

**Test:** Storage upload failures

1. Simulate Supabase Storage failure
2. Expected: Error logged, user receives clear error message
3. Expected: No partial evidence record created

### Concurrent Uploads

**Test:** Multiple workers uploading simultaneously

1. Worker A and Worker B upload to same job concurrently
2. Expected: Both succeed if under limit
3. Expected: Photo count accurate after both complete
4. Expected: No race condition causing count to exceed limit

### Partial Failures

**Test:** Database success, storage failure (or vice versa)

1. Simulate storage failure after DB insert
2. Expected: Transaction rollback or cleanup
3. Expected: No orphaned records

---

## 5. Performance Tests

### Upload Performance

**Test:** Large file uploads

| File Size | Expected Time | Notes |
|-----------|---------------|-------|
| 1MB | < 2s | Baseline |
| 5MB | < 5s | Typical |
| 10MB (max) | < 10s | Edge case |

### Concurrent Uploads

**Test:** Multiple simultaneous uploads

- 5 concurrent uploads: All succeed
- 10 concurrent uploads: All succeed
- 20 concurrent uploads: System remains responsive

---

## 6. Security Tests

### File Type Spoofing

**Test:** Malicious file uploads

| Attack | Input | Expected Result |
|--------|-------|-----------------|
| Renamed executable | malicious.exe renamed to photo.jpg | Rejected (MIME type check) |
| Double extension | photo.jpg.exe | Rejected (file extension validation) |
| Content-type mismatch | PDF with Content-Type: image/jpeg | Rejected (server-side validation) |

### Path Traversal

**Test:** Storage path injection

| Attack | Input | Expected Result |
|--------|-------|-----------------|
| Path traversal | `../../../etc/passwd` in filename | Sanitized (path stays within evidence bucket) |
| Absolute path | `/root/secret` in filename | Sanitized |

### Access Control Bypass

**Test:** Unauthorized evidence access

| Attack | Input | Expected Result |
|--------|-------|-----------------|
| Direct storage URL | Worker guesses storage path | 403 Forbidden (access via API only) |
| Evidence ID enumeration | Worker tries random evidence IDs | 403 Forbidden (access control check) |

---

## 7. Monitoring & Alerting

### Metrics to Track

- Upload success rate (target: > 99%)
- Upload failure reasons (by type)
- Average upload time
- Storage errors (Supabase failures)
- Photo count violations (attempts to exceed limit)
- Access control failures (unauthorized access attempts)

### Alerts

- Upload failure rate > 5% in 5 minutes
- Storage errors > 10 in 5 minutes
- Photo count violations > 3 in 1 hour (possible bug)
- Access control failures > 20 in 5 minutes (possible attack)

---

## Test Implementation Priority

### P0 (Must have before production)

- [ ] Unit tests: Upload validation (file type, size, redaction)
- [ ] Unit tests: Photo count enforcement
- [ ] Integration test: Complete upload flow
- [ ] Integration test: Redaction enforcement
- [ ] Integration test: Access control
- [ ] Invariant test: Photo count invariant
- [ ] Security test: File type spoofing
- [ ] Security test: Access control bypass

### P1 (Next sprint)

- [ ] Unit tests: File type/size edge cases
- [ ] Integration test: Storage path generation
- [ ] Invariant test: Evidence-completion link
- [ ] Invariant test: Storage consistency
- [ ] Error handling: Network failures
- [ ] Error handling: Concurrent uploads
- [ ] Performance test: Large file uploads

### P2 (Future)

- [ ] Performance test: Concurrent uploads (stress test)
- [ ] Security test: Path traversal
- [ ] Monitoring: Metrics dashboard
- [ ] Monitoring: Alerting setup

---

## Test Files Structure

```
portal/src/__tests__/
  evidence/
    upload-validation.test.ts      # Unit: validation functions
    photo-count.test.ts            # Unit: photo count logic
    upload-integration.test.ts     # Integration: full flow
    access-control.test.ts         # Integration: permissions
    invariants.test.ts             # Invariant checks
    security.test.ts               # Security tests
    performance.test.ts            # Performance tests
```

---

## Notes

- **Test data:** Use test Supabase project for integration tests
- **Cleanup:** All test uploads must be cleaned up after tests
- **Isolation:** Each test must be independent (no shared state)
- **Coverage target:** > 90% for evidence upload code paths
- **CI/CD:** All tests must pass before deployment

---

**This document defines the minimum test coverage required for evidence pipeline correctness. Evidence integrity is non-negotiable.**
