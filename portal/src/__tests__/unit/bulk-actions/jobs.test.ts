import { describe, it, expect, beforeEach } from "vitest";
import { testDb, createTestUser, createTestWorkforceAccount, createTestClient, createTestSite } from "../../setup";
import { validateBulkJobAction, executeBulkJobAction } from "@/server/bulk-actions/jobs";
import type { SessionUser } from "@/server/guards/rbac";

describe("Bulk job actions", () => {
  let adminUser: SessionUser;
  let clientId: string;
  let siteId: string;
  let jobIdPending: string;
  let jobIdScheduled: string;

  beforeEach(async () => {
    const admin = await createTestUser({ email: "admin-bulk@test.com", role: "ADMIN" });
    adminUser = { id: admin.id, role: admin.role, email: admin.email } as SessionUser;

    const client = await createTestClient();
    clientId = client.id;
    const site = await createTestSite(clientId);
    siteId = site.id;

    const job1 = await testDb.job.create({
      data: {
        siteId,
        status: "COMPLETED_PENDING_APPROVAL",
        scheduledStart: new Date(),
        scheduledEnd: new Date(Date.now() + 3600000),
        payoutAmountCents: 5000,
      },
    });
    jobIdPending = job1.id;

    const job2 = await testDb.job.create({
      data: {
        siteId,
        status: "SCHEDULED",
        scheduledStart: new Date(),
        scheduledEnd: new Date(Date.now() + 3600000),
        payoutAmountCents: 5000,
      },
    });
    jobIdScheduled = job2.id;
  });

  describe("validateBulkJobAction", () => {
    it("rejects jobs not in allowed state for approve", async () => {
      const preview = await validateBulkJobAction(
        adminUser,
        [jobIdScheduled],
        "approve",
        {}
      );
      expect(preview.valid.length).toBe(0);
      expect(preview.invalid.length).toBe(1);
      expect(preview.invalid[0].error).toContain("COMPLETED_PENDING_APPROVAL");
    });

    it("requires shared reason for reject and cancel", async () => {
      const preview = await validateBulkJobAction(
        adminUser,
        [jobIdPending],
        "reject",
        {}
      );
      expect(preview.invalid.some((i) => i.error?.includes("Reason"))).toBe(true);
    });

    it("returns valid items when job in correct state and reason provided", async () => {
      const preview = await validateBulkJobAction(
        adminUser,
        [jobIdPending],
        "approve",
        {}
      );
      expect(preview.valid.length).toBe(1);
      expect(preview.valid[0].id).toBe(jobIdPending);
    });
  });

  describe("executeBulkJobAction", () => {
    it("produces one audit log per succeeded job with bulkOperationId", async () => {
      const bulkOpId = "test-bulk-op-id-" + Date.now();
      const result = await executeBulkJobAction(
        adminUser,
        [jobIdPending],
        "approve",
        bulkOpId,
        {}
      );
      expect(result.succeeded).toContain(jobIdPending);
      expect(result.bulkOperationId).toBe(bulkOpId);

      const logs = await testDb.auditLog.findMany({
        where: { entityType: "Job", entityId: jobIdPending },
      });
      expect(logs.length).toBeGreaterThanOrEqual(1);
      const withBulk = logs.find((l) => (l.metadata as Record<string, unknown>)?.bulkOperationId === bulkOpId);
      expect(withBulk).toBeTruthy();
    });
  });
});
