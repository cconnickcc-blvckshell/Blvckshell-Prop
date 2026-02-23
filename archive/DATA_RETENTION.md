# BLVCKSHELL Portal — Data Retention

**Purpose:** Evidence retention and purge process for the Workforce Operations Portal. Aligns with DECISIONS #11 and ops-binder policies (e.g. POL_03, client contracts).

---

## 1. Retention Periods

| Data | Default retention | Notes |
|------|-------------------|--------|
| **Job completion evidence (photos)** | **90 days** | After 90 days from completion date, evidence is eligible for purge. Client contracts and POL_03 reference 90 days. |
| **Audit logs** | Retain | No automatic purge; manual process if ever required (see §3). |
| **Compliance documents** | Per legal/contract | COI, WSIB, agreements; purge only per documented process (e.g. 7 years where applicable). |

---

## 2. Evidence (Photo) Purge Process

**Scope:** Files in Supabase Storage under the evidence path (e.g. `evidence/{jobId}/{completionId}/...`) and any DB references if applicable.

**Default rule:** Photos older than **90 days** (from the related job completion date) may be purged.

**Process:**

1. **Identify candidates:** List completion records (and their evidence objects) where the completion’s `createdAt` (or job’s `scheduledStart`/completion date) is older than 90 days.
2. **Verify retention period:** Confirm 90 days have elapsed; optionally confirm no legal hold or client request for longer retention.
3. **Delete from Storage:** Remove objects from Supabase Storage for those completions (server-only; use service role).
4. **Update records (if any):** If the DB stores evidence file keys or URLs, mark as purged or remove in the same run.
5. **Log:** Record purge run (date, scope, count of objects removed) for compliance (e.g. in audit log or ops log).

**Exceptions:**

- Client (or contract) may require longer retention; retain until that period expires.
- Legal or insurance hold: do not purge until released.

---

## 3. Other Data

- **Audit logs:** No automatic purge. If a manual purge is ever required (e.g. after many years), document the process and retention window here.
- **User/worker/org data:** Deactivation is preferred over hard delete (soft-deactivate). Hard delete only per policy; RESTRICT and cascade rules in schema protect auditable entities.

---

## 4. Configuration

- **Evidence retention days:** 90 (default). Should be configurable in one place (e.g. env or constant); document that location in README or DECISIONS if added.

---

*Last updated: February 2026. Align with DECISIONS.md and POL_03.*
