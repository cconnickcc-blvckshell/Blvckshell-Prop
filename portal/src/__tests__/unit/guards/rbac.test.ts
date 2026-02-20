import { describe, it, expect, beforeEach, vi } from "vitest";
import { testDb, createTestUser } from "../../setup";
import { requireAdmin, requireWorker, canAccessJob } from "@/server/guards/rbac";
import * as bcrypt from "bcryptjs";

describe("RBAC Guards", () => {
  describe("requireAdmin", () => {
    it("should allow admin user", async () => {
      const adminUser = await createTestUser({
        email: "admin@test.com",
        role: "ADMIN",
      });

      // Mock getCurrentUser
      vi.spyOn(require("@/server/guards/rbac"), "getCurrentUser").mockResolvedValue({
        id: adminUser.id,
        workerId: null,
        workforceAccountId: null,
      });

      const user = await requireAdmin();
      expect(user.id).toBe(adminUser.id);
    });

    it("should reject non-admin user", async () => {
      const workerUser = await createTestUser({
        email: "worker@test.com",
        role: "INTERNAL_WORKER",
      });

      vi.spyOn(require("@/server/guards/rbac"), "getCurrentUser").mockResolvedValue({
        id: workerUser.id,
        workerId: null,
        workforceAccountId: null,
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

      vi.spyOn(require("@/server/guards/rbac"), "getCurrentUser").mockResolvedValue({
        id: workerUser.id,
        workerId: "worker-id",
        workforceAccountId: null,
      });

      const user = await requireWorker();
      expect(user.id).toBe(workerUser.id);
    });

    it("should allow VENDOR_WORKER", async () => {
      const workerUser = await createTestUser({
        email: "vendor@test.com",
        role: "VENDOR_WORKER",
      });

      vi.spyOn(require("@/server/guards/rbac"), "getCurrentUser").mockResolvedValue({
        id: workerUser.id,
        workerId: "worker-id",
        workforceAccountId: "account-id",
      });

      const user = await requireWorker();
      expect(user.id).toBe(workerUser.id);
    });

    it("should reject ADMIN", async () => {
      const adminUser = await createTestUser({
        email: "admin@test.com",
        role: "ADMIN",
      });

      vi.spyOn(require("@/server/guards/rbac"), "getCurrentUser").mockResolvedValue({
        id: adminUser.id,
        workerId: null,
        workforceAccountId: null,
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

      const job = await testDb.job.create({
        data: {
          siteId: "site-id",
          status: "SCHEDULED",
          scheduledStart: new Date(),
          scheduledEnd: new Date(),
          pricingModel: "Fixed",
          priceCents: 5000,
        },
      });

      const canAccess = await canAccessJob({
        id: adminUser.id,
        workerId: null,
        workforceAccountId: null,
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

      const job = await testDb.job.create({
        data: {
          siteId: "site-id",
          assignedWorkerId: worker.id,
          status: "SCHEDULED",
          scheduledStart: new Date(),
          scheduledEnd: new Date(),
          pricingModel: "Fixed",
          priceCents: 5000,
        },
      });

      const canAccess = await canAccessJob({
        id: workerUser.id,
        workerId: worker.id,
        workforceAccountId: workforce.id,
      }, job.id);

      expect(canAccess).toBe(true);
    });

    it("should reject worker accessing unassigned job", async () => {
      const workerUser = await createTestUser({
        email: "worker@test.com",
        role: "INTERNAL_WORKER",
      });

      const job = await testDb.job.create({
        data: {
          siteId: "site-id",
          assignedWorkerId: "other-worker-id",
          status: "SCHEDULED",
          scheduledStart: new Date(),
          scheduledEnd: new Date(),
          pricingModel: "Fixed",
          priceCents: 5000,
        },
      });

      const canAccess = await canAccessJob({
        id: workerUser.id,
        workerId: "worker-id",
        workforceAccountId: null,
      }, job.id);

      expect(canAccess).toBe(false);
    });
  });
});
