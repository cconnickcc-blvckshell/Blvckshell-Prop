import { describe, it, expect, vi, beforeEach } from "vitest";
import { testDb, createTestUser, isDbReachable } from "../setup";
import { provisionWorkerApplication } from "@/server/provisioning/application-provisioning";

vi.mock("@/server/actions/notification-actions", () => ({
  queueNotification: vi.fn(async () => ({ id: "notif-test-1" })),
}));

import { queueNotification } from "@/server/actions/notification-actions";

describe("provisionWorkerApplication", () => {
  beforeEach(() => {
    vi.mocked(queueNotification).mockClear();
  });

  async function seedApplication(email: string) {
    const admin = await createTestUser({ email: `admin-${email}`, role: "ADMIN" });
    const app = await testDb.workerApplication.create({
      data: {
        email,
        firstName: "Test",
        lastName: "Worker",
        phone: "519-000-0000",
        city: "London",
        applicationType: "INDIVIDUAL",
        availableDays: ["MON"],
        status: "SUBMITTED",
      },
    });
    return { admin, app };
  }

  it("provisions user and worker in one transaction", async () => {
    if (!isDbReachable()) return;
    const email = "provision-new@test.com";
    const { admin, app } = await seedApplication(email);

    const result = await provisionWorkerApplication({
      applicationId: app.id,
      reviewerUserId: admin.id,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const refreshed = await testDb.workerApplication.findUnique({ where: { id: app.id } });
    expect(refreshed?.status).toBe("APPROVED");
    expect(refreshed?.provisionedUserId).toBe(result.userId);
    expect(refreshed?.activationInviteStatus).toBe("QUEUED");

    const worker = await testDb.worker.findFirst({ where: { userId: result.userId } });
    expect(worker).toBeTruthy();
    expect(queueNotification).toHaveBeenCalledTimes(1);
    const call = vi.mocked(queueNotification).mock.calls[0][0];
    expect(call.templateKey).toBe("application_approved");
    expect(call.payload).toMatchObject({ activationTokenId: expect.any(String) });
    expect(call.payload).not.toHaveProperty("activationUrl");
  });

  it("is idempotent on repeated approval (resend only)", async () => {
    if (!isDbReachable()) return;
    const email = "provision-idem@test.com";
    const { admin, app } = await seedApplication(email);

    const first = await provisionWorkerApplication({
      applicationId: app.id,
      reviewerUserId: admin.id,
    });
    expect(first.ok).toBe(true);

    const second = await provisionWorkerApplication({
      applicationId: app.id,
      reviewerUserId: admin.id,
    });
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.alreadyProvisioned).toBe(true);
    }

    const userCount = await testDb.user.count({ where: { email } });
    expect(userCount).toBe(1);
    expect(queueNotification).toHaveBeenCalledTimes(2);
  });

  it("reports queue failure without rolling back provisioned account", async () => {
    if (!isDbReachable()) return;
    vi.mocked(queueNotification).mockRejectedValueOnce(new Error("outbox down"));
    const email = "provision-queue-fail@test.com";
    const { admin, app } = await seedApplication(email);

    const result = await provisionWorkerApplication({
      applicationId: app.id,
      reviewerUserId: admin.id,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("QUEUE_FAILED");

    const refreshed = await testDb.workerApplication.findUnique({ where: { id: app.id } });
    expect(refreshed?.provisionedUserId).toBeTruthy();
    expect(refreshed?.activationInviteStatus).toBe("FAILED");
  });
});
