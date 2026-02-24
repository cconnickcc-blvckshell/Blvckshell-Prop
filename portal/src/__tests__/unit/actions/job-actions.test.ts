import { describe, it, expect, beforeEach, vi } from "vitest";
import { testDb, createTestUser, createTestWorkforceAccount, createTestClient, createTestSite, createTestJob } from "../../setup";
import { saveDraft, submitCompletion, approveCompletion, rejectCompletion } from "@/server/actions/job-actions";
import * as rbac from "@/server/guards/rbac";
import * as bcrypt from "bcryptjs";

describe("job-actions", () => {
  let workerUser: any;
  let adminUser: any;
  let worker: any;
  let site: any;

  beforeEach(async () => {
    const workforce = await createTestWorkforceAccount({
      type: "INTERNAL",
      displayName: "Test Workforce",
    });

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

    adminUser = await createTestUser({
      email: "admin@test.com",
      password: "test123456",
      role: "ADMIN",
    });

    const client = await createTestClient();
    site = await createTestSite(client.id);

    vi.spyOn(rbac, "requireWorker").mockResolvedValue({
      id: workerUser.id,
      name: "Test User",
      role: "INTERNAL_WORKER",
      workerId: worker.id,
      workforceAccountId: worker.workforceAccountId,
    } as never);
  });

  describe("saveDraft", () => {
    it("should save draft completion successfully", async () => {
      const job = await createTestJob({
        siteId: site.id,
        assignedWorkerId: worker.id,
        status: "SCHEDULED",
      });

      const result = await saveDraft({
        jobId: job.id,
        checklistResults: {
          "item1": { result: "PASS", note: "Clean" },
          "item2": { result: "FAIL", note: "Needs attention" },
        },
        notes: "Test draft",
      });

      expect(result.success).toBe(true);

      const completion = await testDb.jobCompletion.findFirst({
        where: { jobId: job.id },
      });
      expect(completion).toBeTruthy();
      expect(completion?.isDraft).toBe(true);
    });

    it("should reject unauthorized access", async () => {
      const job = await createTestJob({
        siteId: site.id,
        assignedWorkerId: worker.id,
        status: "SCHEDULED",
      });

      const otherWorker = await testDb.user.create({
        data: {
          email: "other@test.com",
          passwordHash: bcrypt.hashSync("test123456", 10),
          role: "INTERNAL_WORKER",
          name: "Other Worker",
        },
      });

      vi.spyOn(rbac, "requireWorker").mockResolvedValue({
        id: otherWorker.id,
        name: "Other Worker",
        role: "INTERNAL_WORKER",
      } as never);

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
      // Use site with requiredPhotoCount = 0 so submission passes without evidence
      const testSite = await testDb.site.create({
        data: {
          clientOrganizationId: (await createTestClient()).id,
          name: "No-Photo Site",
          address: "123 Test St",
          requiredPhotoCount: 0,
          suppliesProvidedBy: "COMPANY",
        },
      });

      const job = await createTestJob({
        siteId: testSite.id,
        assignedWorkerId: worker.id,
        status: "SCHEDULED",
      });

      await saveDraft({
        jobId: job.id,
        checklistResults: { "item1": { result: "PASS" } },
      });

      const result = await submitCompletion({
        jobId: job.id,
        checklistResults: { "item1": { result: "PASS" } },
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
      expect(auditLog?.toState).toBe("COMPLETED_PENDING_APPROVAL");
    });

    it("should require minimum photos", async () => {
      const job = await createTestJob({
        siteId: site.id,
        assignedWorkerId: worker.id,
        status: "SCHEDULED",
      });

      const result = await submitCompletion({
        jobId: job.id,
        checklistResults: { "item1": { result: "PASS" } },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("photo");
    });
  });

  describe("approveCompletion", () => {
    it("should approve completion and transition to APPROVED_PAYABLE", async () => {
      const testClient = await createTestClient();
      const testSite = await testDb.site.create({
        data: {
          clientOrganizationId: testClient.id,
          name: "Approve Site",
          address: "123 Test St",
          requiredPhotoCount: 0,
          suppliesProvidedBy: "COMPANY",
        },
      });

      const job = await createTestJob({
        siteId: testSite.id,
        assignedWorkerId: worker.id,
        status: "SCHEDULED",
      });

      await saveDraft({
        jobId: job.id,
        checklistResults: { "item1": { result: "PASS" } },
      });

      await submitCompletion({
        jobId: job.id,
        checklistResults: { "item1": { result: "PASS" } },
      });

      // Create a submitted checklist run (required for approval)
      const template = await testDb.checklistTemplate.create({
        data: {
          siteId: testSite.id,
          version: 1,
          isActive: true,
          items: [{ itemId: "1", label: "Item 1", required: true }],
        },
      });
      await testDb.checklistRun.create({
        data: {
          jobId: job.id,
          checklistTemplateId: template.id,
          templateVersion: 1,
          status: "Submitted",
          submittedAt: new Date(),
          completedByWorkerId: worker.id,
        },
      });

      vi.spyOn(rbac, "requireAdmin").mockResolvedValue({
        id: adminUser.id,
        name: "Test User",
        role: "ADMIN",
      } as never);

      const result = await approveCompletion(job.id);

      expect(result.success).toBe(true);

      const updatedJob = await testDb.job.findUnique({
        where: { id: job.id },
      });
      expect(updatedJob?.status).toBe("APPROVED_PAYABLE");
    });
  });

  describe("rejectCompletion", () => {
    it("should reject completion and transition back to SCHEDULED", async () => {
      const testClient = await createTestClient();
      const testSite = await testDb.site.create({
        data: {
          clientOrganizationId: testClient.id,
          name: "Reject Site",
          address: "123 Test St",
          requiredPhotoCount: 0,
          suppliesProvidedBy: "COMPANY",
        },
      });

      const job = await createTestJob({
        siteId: testSite.id,
        assignedWorkerId: worker.id,
        status: "SCHEDULED",
      });

      await saveDraft({
        jobId: job.id,
        checklistResults: { "item1": { result: "PASS" } },
      });

      await submitCompletion({
        jobId: job.id,
        checklistResults: { "item1": { result: "PASS" } },
      });

      vi.spyOn(rbac, "requireAdmin").mockResolvedValue({
        id: adminUser.id,
        name: "Test User",
        role: "ADMIN",
      } as never);

      const result = await rejectCompletion(job.id, "Missing required photos");

      expect(result.success).toBe(true);

      const updatedJob = await testDb.job.findUnique({
        where: { id: job.id },
      });
      expect(updatedJob?.status).toBe("SCHEDULED");
    });
  });
});
