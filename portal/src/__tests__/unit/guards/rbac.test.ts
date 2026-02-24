import { describe, it, expect, beforeEach, vi } from "vitest";
import { testDb, createTestUser, createTestClient, createTestSite } from "../../setup";

const { mockAuth } = vi.hoisted(() => {
  return { mockAuth: vi.fn() };
});

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

import { requireAdmin, requireWorker, canAccessJob } from "@/server/guards/rbac";

describe("RBAC Guards", () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  describe("requireAdmin", () => {
    it("should allow admin user", async () => {
      const adminUser = await createTestUser({
        email: "admin@test.com",
        role: "ADMIN",
      });

      mockAuth.mockResolvedValue({
        user: {
          id: adminUser.id,
          name: "Test User",
          role: "ADMIN",
        },
      });

      const user = await requireAdmin();
      expect(user.id).toBe(adminUser.id);
    });

    it("should reject non-admin user", async () => {
      const workerUser = await createTestUser({
        email: "worker@test.com",
        role: "INTERNAL_WORKER",
      });

      mockAuth.mockResolvedValue({
        user: {
          id: workerUser.id,
          name: "Test User",
          role: "INTERNAL_WORKER",
          workerId: "worker-id",
        },
      });

      await expect(requireAdmin()).rejects.toThrow();
    });
  });

  describe("requireWorker", () => {
    it("should allow INTERNAL_WORKER", async () => {
      const workerUser = await createTestUser({
        email: "worker@test.com",
        role: "INTERNAL_WORKER",
      });

      mockAuth.mockResolvedValue({
        user: {
          id: workerUser.id,
          name: "Test User",
          role: "INTERNAL_WORKER",
          workerId: "worker-id",
        },
      });

      const user = await requireWorker();
      expect(user.id).toBe(workerUser.id);
    });

    it("should allow VENDOR_WORKER", async () => {
      const workerUser = await createTestUser({
        email: "vendor@test.com",
        role: "VENDOR_WORKER",
      });

      mockAuth.mockResolvedValue({
        user: {
          id: workerUser.id,
          name: "Test User",
          role: "VENDOR_WORKER",
          workerId: "worker-id",
          workforceAccountId: "account-id",
        },
      });

      const user = await requireWorker();
      expect(user.id).toBe(workerUser.id);
    });

    it("should reject ADMIN", async () => {
      const adminUser = await createTestUser({
        email: "admin@test.com",
        role: "ADMIN",
      });

      mockAuth.mockResolvedValue({
        user: {
          id: adminUser.id,
          name: "Test User",
          role: "ADMIN",
        },
      });

      await expect(requireWorker()).rejects.toThrow();
    });
  });

  describe("canAccessJob", () => {
    it("should allow admin to access any job", async () => {
      const adminUser = await createTestUser({
        email: "admin@test.com",
        role: "ADMIN",
      });

      const client = await createTestClient();
      const site = await createTestSite(client.id);

      const workforce = await testDb.workforceAccount.create({
        data: {
          type: "INTERNAL",
          displayName: "Test WF",
          primaryContactName: "Test",
          primaryContactEmail: "wf@test.com",
          primaryContactPhone: "555-0100",
        },
      });

      const job = await testDb.job.create({
        data: {
          siteId: site.id,
          status: "SCHEDULED",
          scheduledStart: new Date(),
          scheduledEnd: new Date(),
          payoutAmountCents: 5000,
          assignedWorkforceAccountId: workforce.id,
        },
      });

      const canAccess = await canAccessJob({
        id: adminUser.id,
        name: "Test User",
        role: "ADMIN",
      }, job.id);

      expect(canAccess).toBe(true);
    });

    it("should allow worker to access assigned job", async () => {
      const workforce = await testDb.workforceAccount.create({
        data: {
          type: "INTERNAL",
          displayName: "Test",
          primaryContactName: "Test",
          primaryContactEmail: "test@test.com",
          primaryContactPhone: "555-0100",
        },
      });

      const workerUser = await createTestUser({
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

      const job = await testDb.job.create({
        data: {
          siteId: site.id,
          assignedWorkerId: worker.id,
          status: "SCHEDULED",
          scheduledStart: new Date(),
          scheduledEnd: new Date(),
          payoutAmountCents: 5000,
        },
      });

      const canAccess = await canAccessJob({
        id: workerUser.id,
        name: "Test User",
        role: "INTERNAL_WORKER",
        workerId: worker.id,
        workforceAccountId: workforce.id,
      }, job.id);

      expect(canAccess).toBe(true);
    });

    it("should reject worker accessing unassigned job", async () => {
      const workforce = await testDb.workforceAccount.create({
        data: {
          type: "INTERNAL",
          displayName: "Test",
          primaryContactName: "Test",
          primaryContactEmail: "test@test.com",
          primaryContactPhone: "555-0100",
        },
      });

      const workerUser = await createTestUser({
        email: "worker@test.com",
        role: "INTERNAL_WORKER",
        workforceAccountId: workforce.id,
      });

      const otherWorkerUser = await createTestUser({
        email: "other-worker@test.com",
        role: "INTERNAL_WORKER",
        workforceAccountId: workforce.id,
      });

      const worker = await testDb.worker.create({
        data: { userId: workerUser.id, workforceAccountId: workforce.id },
      });

      const otherWorker = await testDb.worker.create({
        data: { userId: otherWorkerUser.id, workforceAccountId: workforce.id },
      });

      const client = await createTestClient();
      const site = await createTestSite(client.id);

      const job = await testDb.job.create({
        data: {
          siteId: site.id,
          assignedWorkerId: otherWorker.id,
          status: "SCHEDULED",
          scheduledStart: new Date(),
          scheduledEnd: new Date(),
          payoutAmountCents: 5000,
        },
      });

      const canAccess = await canAccessJob({
        id: workerUser.id,
        name: "Test User",
        role: "INTERNAL_WORKER",
        workerId: worker.id,
      }, job.id);

      expect(canAccess).toBe(false);
    });
  });
});
