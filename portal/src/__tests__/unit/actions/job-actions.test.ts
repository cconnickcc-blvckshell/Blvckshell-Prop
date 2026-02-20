import { describe, it, expect, beforeEach, vi } from "vitest";
import { testDb, createTestUser, createTestWorkforceAccount, createTestClient, createTestSite, createTestJob } from "../../setup";
import { saveDraft, submitCompletion, approveCompletion, rejectCompletion } from "@/server/actions/job-actions";
import * as bcrypt from "bcryptjs";

describe("job-actions", () => {
  let workerUser: any;
  let adminUser: any;
  let job: any;
  let worker: any;

  beforeEach(async () => {
    // Create workforce
    const workforce = await createTestWorkforceAccount({
      type: "INTERNAL",
      displayName: "Test Workforce",
    });

    // Create worker user
    workerUser = await createTestUser({
      email: "worker@test.com",
      password: "test123456",
      role: "INTERNAL_WORKER",
      workforceAccountId: workforce.id,
    });

    worker = await testDb.worker.create({
      data: {
        userId: workerUser.id,
        workforceAccountId: workforce.id,
      },
    });

    // Create admin user
    adminUser = await createTestUser({
      email: "admin@test.com",
      password: "test123456",
      role: "ADMIN",
    });

    // Create client and site
    const client = await createTestClient();
    const site = await createTestSite(client.id);

    // Create job
    job = await createTestJob({
      siteId: site.id,
      assignedWorkerId: worker.id,
      status: "SCHEDULED",
    });
  });

  describe("saveDraft", () => {
    it("should save draft completion successfully", async () => {
      const result = await saveDraft({
        jobId: job.id,
        checklistResults: {
          "item1": { result: "PASS", note: "Clean" },
          "item2": { result: "FAIL", note: "Needs attention" },
        },
        notes: "Test draft",
      });

      expect(result.success).toBe(true);

      // Verify draft was saved
      const completion = await testDb.jobCompletion.findFirst({
        where: { jobId: job.id },
      });
      expect(completion).toBeTruthy();
      expect(completion?.isDraft).toBe(true);
    });

    it("should reject unauthorized access", async () => {
      // Create another worker
      const otherWorker = await testDb.user.create({
        data: {
          email: "other@test.com",
          passwordHash: bcrypt.hashSync("test123456", 10),
          role: "INTERNAL_WORKER",
          name: "Other Worker",
        },
      });

      // Mock requireWorker to return other worker
      const originalRequireWorker = require("@/server/guards/rbac").requireWorker;
      vi.spyOn(require("@/server/guards/rbac"), "requireWorker").mockResolvedValue({
        id: otherWorker.id,
        workerId: null,
        workforceAccountId: null,
      });

      const result = await saveDraft({
        jobId: job.id,
        checklistResults: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });

    it("should validate input schema", async () => {
      const result = await saveDraft({
        jobId: "",
        checklistResults: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe("submitCompletion", () => {
    it("should submit completion and transition job status", async () => {
      // First save draft
      await saveDraft({
        jobId: job.id,
        checklistResults: { "item1": { result: "PASS" } },
      });

      const result = await submitCompletion({
        jobId: job.id,
        checklistResults: { "item1": { result: "PASS" } },
      });

      expect(result.success).toBe(true);

      // Verify job status changed
      const updatedJob = await testDb.job.findUnique({
        where: { id: job.id },
      });
      expect(updatedJob?.status).toBe("COMPLETED_PENDING_APPROVAL");

      // Verify audit log created
      const auditLog = await testDb.auditLog.findFirst({
        where: {
          entityType: "Job",
          entityId: job.id,
        },
      });
      expect(auditLog).toBeTruthy();
      expect(auditLog?.toState).toBe("COMPLETED_PENDING_APPROVAL");
    });

    it("should require minimum photos", async () => {
      const result = await submitCompletion({
        jobId: job.id,
        checklistResults: { "item1": { result: "PASS" } },
      });

      // Should fail if not enough photos
      expect(result.success).toBe(false);
      expect(result.error).toContain("photo");
    });
  });

  describe("approveCompletion", () => {
    it("should approve completion and transition to APPROVED_PAYABLE", async () => {
      // Submit completion first
      await saveDraft({
        jobId: job.id,
        checklistResults: { "item1": { result: "PASS" } },
      });

      await submitCompletion({
        jobId: job.id,
        checklistResults: { "item1": { result: "PASS" } },
      });

      // Mock requireAdmin
      vi.spyOn(require("@/server/guards/rbac"), "requireAdmin").mockResolvedValue({
        id: adminUser.id,
        workerId: null,
        workforceAccountId: null,
      });

      const result = await approveCompletion({
        jobId: job.id,
      });

      expect(result.success).toBe(true);

      const updatedJob = await testDb.job.findUnique({
        where: { id: job.id },
      });
      expect(updatedJob?.status).toBe("APPROVED_PAYABLE");
    });
  });

  describe("rejectCompletion", () => {
    it("should reject completion and transition back to SCHEDULED", async () => {
      // Submit completion first
      await saveDraft({
        jobId: job.id,
        checklistResults: { "item1": { result: "PASS" } },
      });

      await submitCompletion({
        jobId: job.id,
        checklistResults: { "item1": { result: "PASS" } },
      });

      // Mock requireAdmin
      vi.spyOn(require("@/server/guards/rbac"), "requireAdmin").mockResolvedValue({
        id: adminUser.id,
        workerId: null,
        workforceAccountId: null,
      });

      const result = await rejectCompletion({
        jobId: job.id,
        rejectionReason: "Missing required photos",
      });

      expect(result.success).toBe(true);

      const updatedJob = await testDb.job.findUnique({
        where: { id: job.id },
      });
      expect(updatedJob?.status).toBe("SCHEDULED");
    });
  });
});
