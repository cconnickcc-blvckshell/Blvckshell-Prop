import { describe, it, expect, beforeEach, vi } from "vitest";
import { testDb, createTestUser, createTestClient, createTestSite, createTestWorkforceAccount } from "../setup";
import { transitionJob } from "@/lib/state-machine";
import * as rbac from "@/server/guards/rbac";
import type { SessionUser } from "@/server/guards/rbac";

/**
 * Gold Standard T3: Job approval requires a submitted checklist run.
 * transitionJob to APPROVED_PAYABLE must fail when no submitted run exists.
 */
describe("Job approval requires submitted run", () => {
  let adminSession: SessionUser;
  let client: Awaited<ReturnType<typeof createTestClient>>;
  let site: Awaited<ReturnType<typeof createTestSite>>;
  let workforce: Awaited<ReturnType<typeof createTestWorkforceAccount>>;
  let worker: { id: string };

  beforeEach(async () => {
    const adminUser = await createTestUser({
      email: "admin-approval@test.com",
      role: "ADMIN",
    });
    adminSession = {
      id: adminUser.id,
      name: adminUser.name,
      role: adminUser.role,
    };

    // Mock requireAdmin for ensureJobOnDraftInvoice automation triggered after approval
    vi.spyOn(rbac, "requireAdmin").mockResolvedValue(adminSession as never);

    client = await createTestClient();
    site = await createTestSite(client.id);
    workforce = await createTestWorkforceAccount({ type: "INTERNAL", displayName: "WF" });
    const workerUser = await createTestUser({
      email: "worker-approval@test.com",
      role: "INTERNAL_WORKER",
      workforceAccountId: workforce.id,
    });
    worker = await testDb.worker.create({
      data: { userId: workerUser.id, workforceAccountId: workforce.id },
    });
  });

  async function createJobWithStatus(status: "COMPLETED_PENDING_APPROVAL" | "SCHEDULED") {
    return await testDb.job.create({
      data: {
        siteId: site.id,
        status,
        assignedWorkerId: worker.id,
        scheduledStart: new Date(),
        scheduledEnd: new Date(Date.now() + 3600000),
        payoutAmountCents: 5000,
      },
    });
  }

  it("rejects approval when job has no checklist run", async () => {
    const job = await createJobWithStatus("COMPLETED_PENDING_APPROVAL");

    const result = await transitionJob(adminSession, job.id, "APPROVED_PAYABLE");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/submitted checklist run|checklist run/i);
  });

  it("rejects approval when run exists but is not submitted", async () => {
    const job = await createJobWithStatus("COMPLETED_PENDING_APPROVAL");
    const template = await testDb.checklistTemplate.create({
      data: {
        siteId: site.id,
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
        status: "InProgress",
        completedByWorkerId: worker.id,
      },
    });

    const result = await transitionJob(adminSession, job.id, "APPROVED_PAYABLE");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/submitted checklist run|checklist run/i);
  });

  it("allows approval when job has a submitted run", async () => {
    const job = await createJobWithStatus("COMPLETED_PENDING_APPROVAL");
    const template = await testDb.checklistTemplate.create({
      data: {
        siteId: site.id,
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

    const result = await transitionJob(adminSession, job.id, "APPROVED_PAYABLE");

    expect(result.success).toBe(true);
  });
});
