import { describe, it, expect, beforeEach } from "vitest";
import { testDb, createTestUser, createTestWorkforceAccount, createTestClient, createTestSite, createTestJob } from "../../setup";
import { isAllowedJobTransition, transitionJob } from "@/lib/state-machine";
import type { SessionUser } from "@/server/guards/rbac";

describe("Job State Machine", () => {
  let adminUser: SessionUser;
  let workerUser: SessionUser;
  let job: any;

  beforeEach(async () => {
    const admin = await createTestUser({
      email: "admin@test.com",
      role: "ADMIN",
    });
    adminUser = { id: admin.id, name: admin.name, role: admin.role };

    const workforce = await createTestWorkforceAccount({
      type: "INTERNAL",
      displayName: "Test Workforce",
    });

    const workerDb = await createTestUser({
      email: "worker@test.com",
      role: "INTERNAL_WORKER",
      workforceAccountId: workforce.id,
    });

    const worker = await testDb.worker.create({
      data: {
        userId: workerDb.id,
        workforceAccountId: workforce.id,
      },
    });

    workerUser = {
      id: workerDb.id,
      name: workerDb.name,
      role: workerDb.role,
      workerId: worker.id,
      workforceAccountId: workforce.id,
    };

    const client = await createTestClient();
    const site = await createTestSite(client.id);

    job = await createTestJob({
      siteId: site.id,
      assignedWorkerId: worker.id,
      status: "SCHEDULED",
    });
  });

  describe("isAllowedJobTransition", () => {
    it("should allow SCHEDULED -> COMPLETED_PENDING_APPROVAL", () => {
      const allowed = isAllowedJobTransition("SCHEDULED", "COMPLETED_PENDING_APPROVAL");
      expect(allowed).toBe(true);
    });

    it("should allow COMPLETED_PENDING_APPROVAL -> APPROVED_PAYABLE", () => {
      const allowed = isAllowedJobTransition("COMPLETED_PENDING_APPROVAL", "APPROVED_PAYABLE");
      expect(allowed).toBe(true);
    });

    it("should allow COMPLETED_PENDING_APPROVAL -> SCHEDULED (rejection)", () => {
      const allowed = isAllowedJobTransition("COMPLETED_PENDING_APPROVAL", "SCHEDULED");
      expect(allowed).toBe(true);
    });

    it("should reject invalid transitions", () => {
      const allowed = isAllowedJobTransition("SCHEDULED", "PAID");
      expect(allowed).toBe(false);
    });

    it("should reject SCHEDULED -> APPROVED_PAYABLE", () => {
      const allowed = isAllowedJobTransition("SCHEDULED", "APPROVED_PAYABLE");
      expect(allowed).toBe(false);
    });
  });

  describe("transitionJob", () => {
    it("should transition job and create audit log", async () => {
      const result = await transitionJob(
        workerUser,
        job.id,
        "COMPLETED_PENDING_APPROVAL",
        {},
      );

      expect(result.success).toBe(true);

      const updatedJob = await testDb.job.findUnique({
        where: { id: job.id },
      });
      expect(updatedJob?.status).toBe("COMPLETED_PENDING_APPROVAL");

      const auditLog = await testDb.auditLog.findFirst({
        where: {
          entityType: "Job",
          entityId: job.id,
        },
      });
      expect(auditLog).toBeTruthy();
      expect(auditLog?.fromState).toBe("SCHEDULED");
      expect(auditLog?.toState).toBe("COMPLETED_PENDING_APPROVAL");
    });

    it("should reject invalid transition", async () => {
      const result = await transitionJob(
        adminUser,
        job.id,
        "PAID",
        {},
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid transition");
    });
  });
});
