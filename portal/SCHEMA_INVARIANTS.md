# Schema invariants (enforced in application code)

Prisma and PostgreSQL cannot express every business rule. These invariants must be enforced in **server-side guards and creation/update flows** and covered by tests.

---

## 1. User role and workforceAccountId

- **Rule:**  
  - If `User.role` is `VENDOR_OWNER` or `VENDOR_WORKER`, then `workforceAccountId` **must** be set and must reference a `VENDOR` WorkforceAccount.  
  - If `User.role` is `INTERNAL_WORKER`, then `workforceAccountId` **must** be set and must reference the single INTERNAL WorkforceAccount.  
  - If `User.role` is `ADMIN`, then `workforceAccountId` is typically null (admin is not tied to a workforce account).

- **Enforcement:**  
  - On user create/update: validate the (role, workforceAccountId) combination.  
  - Refuse invalid combos in API and server actions (e.g. VENDOR_WORKER with null workforceAccountId, or INTERNAL_WORKER with a VENDOR account).  
  - Add unit tests that assert these combinations are rejected.

---

## 2. Job assignment (DB-backed)

- **Rule:** Exactly one of `Job.assignedWorkforceAccountId` or `Job.assignedWorkerId` must be set.  
- **Enforcement:** Enforced by DB constraint `job_assignment_oneof` (see `prisma/raw_production_constraints.sql`). Application code should still ensure this when creating/updating jobs.

---

## 3. SiteAssignment (DB-backed)

- **Rule:** Exactly one of `SiteAssignment.workforceAccountId` or `SiteAssignment.workerId` must be set.  
- **Enforcement:** Enforced by DB constraint `siteassignment_assignment_oneof`. Application code should ensure this when creating/updating site assignments.

---

## 4. ChecklistTemplate “one active per site” (DB-backed)

- **Rule:** At most one `ChecklistTemplate` per site with `isActive = true`.  
- **Enforcement:** Enforced by partial unique index `checklisttemplate_one_active_per_site`. When activating a template, deactivate the previous active one in the same transaction.

---

## 5. AccessCredential CODE vs KEY/FOB (DB-backed)

- **Rule:** For `type = CODE`, store only `identifierHash` (and optionally `identifierHint`); never store plain code. For `type` KEY/FOB, `identifier` is the physical id description.  
- **Enforcement:** DB constraint `accesscredential_identifier_rule` (see `raw_production_constraints.sql`). Creation/update logic must hash CODE values and set `identifierHash`/`identifierHint` only.
