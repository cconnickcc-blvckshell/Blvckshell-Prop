import { describe, it, expect, beforeEach } from "vitest";
import { testDb, createTestUser, createTestWorkforceAccount, createTestClient, createTestSite, createTestJob } from "../../setup";
import { isAllowedJobTransition, transitionJob } from "@/lib/state-machine";

describe("Job State Machine", () => {
  let adminUser: any;
  let workerUser: any;
  let job: any;

  beforeEach(async () => {
    adminUser = await createTestUser({
      email: "admin@test.com",
      role: "ADMIN",
    });

    const workforce = await createTestWorkforceAccount({
      type: "INTERNAL",
      displayName: "Test Workforce",
    });

    workerUser = await createTestUser({
      email: "worker@test.com",
      role: "INTERNAL_WORKER",
      workforceAccountId: workforce.id,
    });

    const worker = await testDb.worker.create({
      data: {
        userId: workerUser.id,
        workforceAccountId: workforce.id,
      },
    });

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
      const result = await transitionJob({
        jobId: job.id,
        toState: "COMPLETED_PENDING_APPROVAL",
        actorUserId: workerUser.id,
        actorWorkerId: "worker-id",
        metadata: {},
      });

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
      const result = await transitionJob({
        jobId: job.id,
        toState: "PAID",
        actorUserId: adminUser.id,
        metadata: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not allowed");
    });
  });
});
