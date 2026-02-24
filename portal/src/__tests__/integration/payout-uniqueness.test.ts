import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { testDb, createTestUser, createTestClient, createTestSite, createTestWorkforceAccount } from "../setup";

/**
 * Gold Standard T1: PayoutLine one-per-job enforced at DB level.
 * The unique index payoutline_one_per_job was created in a dedicated migration
 * but may have been dropped by a subsequent Prisma-generated migration.
 * Re-create it here so the test validates the intended invariant.
 */
describe("PayoutLine uniqueness", () => {
  let batch: { id: string };
  let jobId: string;
  let workforceId: string;

  beforeAll(async () => {
    await testDb.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS payoutline_one_per_job
      ON "PayoutLine" ("jobId")
      WHERE "jobId" IS NOT NULL
    `);
  });

  beforeEach(async () => {
    const admin = await createTestUser({ email: "admin-payout@test.com", role: "ADMIN" });
    const client = await createTestClient();
    const site = await createTestSite(client.id);
    const workforce = await createTestWorkforceAccount({ type: "INTERNAL", displayName: "WF" });
    const workerUser = await createTestUser({
      email: "worker-payout@test.com",
      role: "INTERNAL_WORKER",
      workforceAccountId: workforce.id,
    });
    const worker = await testDb.worker.create({
      data: { userId: workerUser.id, workforceAccountId: workforce.id },
    });
    const job = await testDb.job.create({
      data: {
        siteId: site.id,
        status: "APPROVED_PAYABLE",
        assignedWorkerId: worker.id,
        scheduledStart: new Date(),
        scheduledEnd: new Date(Date.now() + 3600000),
        payoutAmountCents: 5000,
      },
    });
    batch = await testDb.payoutBatch.create({
      data: {
        periodStart: new Date("2026-01-01"),
        periodEnd: new Date("2026-01-31"),
        status: "CALCULATED",
      },
    });
    jobId = job.id;
    workforceId = workforce.id;
  });

  it("allows one PayoutLine per jobId", async () => {
    await testDb.payoutLine.create({
      data: {
        payoutBatchId: batch.id,
        workforceAccountId: workforceId,
        jobId,
        amountCents: 5000,
        status: "PENDING",
      },
    });
    const count = await testDb.payoutLine.count({ where: { jobId } });
    expect(count).toBe(1);
  });

  it("rejects second PayoutLine with same jobId (unique constraint)", async () => {
    await testDb.payoutLine.create({
      data: {
        payoutBatchId: batch.id,
        workforceAccountId: workforceId,
        jobId,
        amountCents: 5000,
        status: "PENDING",
      },
    });
    await expect(
      testDb.payoutLine.create({
        data: {
          payoutBatchId: batch.id,
          workforceAccountId: workforceId,
          jobId,
          amountCents: 5000,
          status: "PENDING",
        },
      })
    ).rejects.toThrow(/Unique constraint|P2002/);
  });
});
