# POL_03: Privacy Photo Handling and Data

**Policy Version:** 1.0  
**Date:** February 16, 2026  
**Purpose:** Define privacy requirements for photos, data handling, storage, and retention. Ensures compliance with privacy laws (PIPEDA, Ontario privacy requirements).

---

## Photo Privacy Requirements

### What NOT to Capture

**Prohibited in photos:**

1. **Resident faces:**
   - Do not photograph residents or visitors
   - If unavoidable, blur faces in post-processing
   - Prefer angles that avoid people

2. **Unit doors with visible numbers:**
   - Avoid photographing unit doors with visible numbers (if avoidable)
   - If necessary, crop or blur unit numbers
   - Focus on common areas, not unit identification

3. **Personal belongings:**
   - Do not photograph personal items
   - Focus on cleaning completion, not personal property

4. **Sensitive information:**
   - Do not photograph documents, mail, or personal information
   - Do not photograph access codes or keys

---

### What TO Capture

**Required in photos:**

1. **Cleaning completion:**
   - Clean floors (no debris, streaks)
   - Empty, clean bins
   - Clean surfaces (no smudges, dust)
   - Overall area views (showing completion)

2. **Evidence of work:**
   - Before/after (for add-ons)
   - Specific areas per checklist requirements
   - Mandatory photo items (per checklist)

---

## Photo Storage and Access

### Storage Location

**Photos stored in:**
- Supabase Storage bucket: `evidence`
- Path pattern: `evidence/{jobId}/{completionId}/{timestamp}-{uuid}.{ext}`
- Server-only access (no client direct bucket access)

**Access control:**
- Workers: Can view own job photos only
- Admin: Can view all photos
- Vendor owners: Can view photos for jobs assigned to their WorkforceAccount
- No public access

---

### Photo Access Rules

**Who can access photos:**

1. **Worker who took photos:**
   - Can view photos for jobs they completed
   - Can download photos (for own records)

2. **Admin:**
   - Can view all photos
   - Can download photos
   - Can delete photos (with audit log)

3. **Vendor owner:**
   - Can view photos for jobs assigned to their WorkforceAccount
   - Cannot view photos for other accounts

4. **Client:**
   - **NO client access** (Phase 1)
   - Photos are internal evidence only
   - Future: May add client portal with photo access (Phase 2+)

---

## Data Retention

### Retention Period

**Evidence photos:**
- **Retention:** 90 days default (per DECISIONS)
- **Purge process:** Manual purge after 90 days (documented in DATA_RETENTION.md)
- **Exception:** Photos may be retained longer if:
  - Related to incident report
  - Related to dispute or audit
  - Client requests retention (with written authorization)

**Audit logs:**
- **Retention:** 7 years minimum (compliance requirement)
- **Purge process:** Manual purge after 7 years (documented in DATA_RETENTION.md)

**Job records:**
- **Retention:** 7 years minimum (compliance requirement)
- **Purge process:** Manual purge after 7 years (documented in DATA_RETENTION.md)

---

### Purge Process

**Before purging:**

1. **Verify retention period met:**
   - Photos: 90 days old
   - Audit logs: 7 years old
   - Job records: 7 years old

2. **Check for exceptions:**
   - Related to incident report? (retain longer)
   - Related to dispute? (retain until resolved)
   - Client authorization? (retain per authorization)

3. **Document purge:**
   - What was purged (photos, logs, records)
   - When purged
   - Who authorized purge
   - Audit log entry created

**Purge execution:**
- Admin-only action
- Audit logged
- Irreversible (ensure backup if needed)

---

## Data Handling

### Data Collection

**What data we collect:**

1. **Worker data:**
   - Name, email, phone, role
   - WorkforceAccount assignment
   - Job assignments and completions

2. **Job data:**
   - Site, scheduled time, status
   - Checklist answers
   - Photo evidence
   - Notes and incident reports

3. **Site data:**
   - Site name, address, access instructions
   - Checklist templates
   - Required photo counts

**Purpose:** Operations, quality assurance, compliance, audit trail

---

### Data Use

**How data is used:**

1. **Operations:**
   - Job assignment and completion
   - Quality assurance
   - Worker performance tracking

2. **Compliance:**
   - Audit trail
   - Incident reporting
   - Regulatory compliance

3. **Billing:**
   - Payout calculation
   - Invoice generation

**Data NOT used for:**
- Marketing (without consent)
- Sharing with third parties (except as required by law)
- Unauthorized purposes

---

### Data Sharing

**Who data is shared with:**

1. **Internal:**
   - Admin (full access)
   - Workers (own data only)
   - Vendor owners (own account data only)

2. **External:**
   - **NO client access** (Phase 1)
   - **NO third-party sharing** (except as required by law)
   - Future: May add client portal (Phase 2+)

**Legal requirements:**
- May share with law enforcement if required by law
- May share with regulatory authorities if required
- Will notify affected parties if data breach occurs

---

## Privacy Compliance

### PIPEDA Compliance (Canada)

**Privacy principles:**

1. **Accountability:** Company responsible for data protection
2. **Identifying purposes:** Data collected for operations only
3. **Consent:** Implied consent for operational data collection
4. **Limiting collection:** Collect only necessary data
5. **Limiting use:** Use data only for stated purposes
6. **Accuracy:** Keep data accurate and up-to-date
7. **Safeguards:** Protect data with security measures
8. **Openness:** Privacy policy available (see Privacy page)
9. **Individual access:** Workers can access own data
10. **Challenging compliance:** Process for privacy complaints

---

### Ontario Privacy Requirements

**Additional requirements:**

- **Breach notification:** Notify affected parties if data breach occurs
- **Data minimization:** Collect only necessary data
- **Retention limits:** Retain data only as long as needed
- **Access rights:** Workers can request access to own data

---

## Photo Deletion Requests

### Worker Requests

**If worker requests photo deletion:**

1. **Verify request:**
   - Worker requesting deletion of own photos
   - Reason for request

2. **Admin decision:**
   - If photos not required for compliance/audit: Delete
   - If photos required for compliance/audit: Retain (explain reason)

3. **Deletion process:**
   - Admin deletes photos from storage
   - Updates database records
   - Audit log entry created

---

### Client Requests

**If client requests photo deletion:**

1. **Verify request:**
   - Client authorized to request
   - Reason for request

2. **Admin decision:**
   - If photos not required for compliance/audit: Delete
   - If photos required for compliance/audit: Retain (explain reason)

3. **Deletion process:**
   - Admin deletes photos from storage
   - Updates database records
   - Audit log entry created

**Note:** Phase 1 has no client portal, so client requests come via property management contact.

---

## Data Security

### Security Measures

**Data protected by:**

1. **Access control:**
   - Server-side RBAC (workers see only own data)
   - Admin-only access to sensitive data
   - No client direct database access

2. **Storage security:**
   - Supabase Storage (encrypted at rest)
   - Server-only access (no client bucket access)
   - Secure file paths (UUID-based, not predictable)

3. **Transmission security:**
   - HTTPS for all data transmission
   - Encrypted connections

4. **Authentication:**
   - Password hashed with bcrypt
   - Session management with timeout
   - Rate limiting on auth endpoints

---

## References

- Photo requirements: SOP_03 (Completion Proof and Submission)
- Data retention: DATA_RETENTION.md
- Privacy policy: Marketing site Privacy page
- Storage security: DECISIONS §3.1 #16 (Supabase Storage security)

---

**This policy ensures privacy compliance. Photos and data are handled securely and retained only as long as necessary.**
