"use server";

import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { transitionJob } from "@/lib/state-machine";

/**
 * Create a payout batch from all jobs in APPROVED_PAYABLE status.
 * Optionally filter by scheduledStart within [periodStart, periodEnd].
 * Creates one PayoutLine per job (workforce = assignedWorkforceAccount or assignedWorker's account).
 */
export async function createPayoutBatch(input: {
  periodStart: string; // ISO date
  periodEnd: string;   // ISO date
}) {
  const user = await requireAdmin();

  const start = new Date(input.periodStart);
  const end = new Date(input.periodEnd);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return { success: false, error: "Invalid period dates" };
  }

  const jobs = await prisma.job.findMany({
    where: {
      status: "APPROVED_PAYABLE",
      scheduledStart: { gte: start, lte: end },
    },
    include: {
      assignedWorkforceAccount: { select: { id: true } },
      assignedWorker: {
        include: { workforceAccount: { select: { id: true } } },
      },
    },
  });

  if (jobs.length === 0) {
    return { success: false, error: "No approved jobs in this period" };
  }

  // Resolve workforceAccountId for each job (required for PayoutLine)
  const lines: { jobId: string; workforceAccountId: string; amountCents: number }[] = [];
  for (const job of jobs) {
    const workforceAccountId =
      job.assignedWorkforceAccountId ??
      job.assignedWorker?.workforceAccount.id;
    if (!workforceAccountId) continue;
    lines.push({
      jobId: job.id,
      workforceAccountId,
      amountCents: job.payoutAmountCents,
    });
  }

  if (lines.length === 0) {
    return { success: false, error: "No jobs with valid workforce account" };
  }

  try {
    const batch = await prisma.payoutBatch.create({
      data: {
        periodStart: start,
        periodEnd: end,
        status: "CALCULATED",
        payoutLines: {
          create: lines.map((l) => ({
            workforceAccountId: l.workforceAccountId,
            jobId: l.jobId,
            amountCents: l.amountCents,
            status: "PENDING",
          })),
        },
      },
      include: { payoutLines: true },
    });
    return { success: true, batchId: batch.id };
  } catch (e) {
    console.error("createPayoutBatch:", e);
    return { success: false, error: "Failed to create batch" };
  }
}

/**
 * Mark a payout batch as PAID: transition all linked jobs to PAID, update batch and lines.
 */
export async function markPayoutBatchPaid(batchId: string) {
  const user = await requireAdmin();

  const batch = await prisma.payoutBatch.findUnique({
    where: { id: batchId },
    include: { payoutLines: true },
  });

  if (!batch) {
    return { success: false, error: "Batch not found" };
  }
  if (batch.status === "PAID") {
    return { success: false, error: "Batch already marked paid" };
  }

  const jobIds = batch.payoutLines
    .map((l) => l.jobId)
    .filter((id): id is string => id != null);

  for (const jobId of jobIds) {
    const result = await transitionJob(user, jobId, "PAID");
    if (!result.success) {
      return { success: false, error: `Job ${jobId}: ${result.error}` };
    }
  }

  await prisma.$transaction([
    prisma.payoutBatch.update({
      where: { id: batchId },
      data: { status: "PAID" },
    }),
    prisma.payoutLine.updateMany({
      where: { payoutBatchId: batchId },
      data: { status: "PAID" },
    }),
  ]);

  return { success: true };
}
