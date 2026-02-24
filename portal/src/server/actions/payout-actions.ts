"use server";

import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { transitionJob } from "@/lib/state-machine";

/**
 * Create a payout batch from unpaid APPROVED_PAYABLE jobs in the period.
 * Excludes jobs that already have a PayoutLine (one job = at most one payout line).
 * Sets description (site + date), siteId, and checklistRunId on each line.
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

  // Job IDs already on any payout line (rule: job appears in at most one line)
  const existingLineJobIds = await prisma.payoutLine.findMany({
    where: { jobId: { not: null } },
    select: { jobId: true },
  });
  const paidJobIds = new Set(
    existingLineJobIds.map((l) => l.jobId).filter((id): id is string => id != null)
  );

  const jobs = await prisma.job.findMany({
    where: {
      status: "APPROVED_PAYABLE",
      scheduledStart: { gte: start, lte: end },
      id: { notIn: paidJobIds.size > 0 ? Array.from(paidJobIds) : undefined },
    },
    select: {
      id: true,
      scheduledStart: true,
      payoutAmountCents: true,
      assignedWorkforceAccountId: true,
      assignedWorkerId: true,
      site: { select: { name: true, id: true } },
      assignedWorkforceAccount: { select: { id: true } },
      assignedWorker: {
        select: { workforceAccount: { select: { id: true } } },
      },
      checklistRuns: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { id: true },
      },
    },
  });

  if (jobs.length === 0) {
    return {
      success: false,
      error: paidJobIds.size > 0
        ? "No additional approved jobs in this period (all are already on a payout)"
        : "No approved jobs in this period",
    };
  }

  const lines: {
    jobId: string;
    workforceAccountId: string;
    amountCents: number;
    description: string;
    siteId: string;
    checklistRunId: string | null;
  }[] = [];
  for (const job of jobs) {
    const workforceAccountId =
      job.assignedWorkforceAccountId ??
      job.assignedWorker?.workforceAccount.id;
    if (!workforceAccountId) continue;
    const description = `${job.site.name} — ${new Date(job.scheduledStart).toLocaleDateString()}`;
    lines.push({
      jobId: job.id,
      workforceAccountId,
      amountCents: job.payoutAmountCents,
      description,
      siteId: job.site.id,
      checklistRunId: job.checklistRuns[0]?.id ?? null,
    });
  }

  if (lines.length === 0) {
    return { success: false, error: "No jobs with valid workforce account" };
  }

  try {
    const batch = await prisma.$transaction(async (tx) => {
      const batch = await tx.payoutBatch.create({
        data: {
          periodStart: start,
          periodEnd: end,
          status: "CALCULATED",
          payoutLines: {
            create: lines.map((l) => ({
              workforceAccountId: l.workforceAccountId,
              jobId: l.jobId,
              amountCents: l.amountCents,
              description: l.description,
              siteId: l.siteId,
              checklistRunId: l.checklistRunId,
              status: "PENDING",
            })),
          },
        },
        include: { payoutLines: true },
      });
      // Audit log: payout batch creation
      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          actorWorkerId: user.workerId ?? null,
          actorWorkforceAccountId: user.workforceAccountId ?? null,
          entityType: "PayoutBatch",
          entityId: batch.id,
          fromState: null,
          toState: "CALCULATED",
          metadata: {
            periodStart: start.toISOString(),
            periodEnd: end.toISOString(),
            lineCount: lines.length,
            totalCents: lines.reduce((sum, l) => sum + l.amountCents, 0),
          },
        },
      });
      return batch;
    });
    return { success: true, batchId: batch.id };
  } catch (e: unknown) {
    console.error("createPayoutBatch:", e);
    // Gold Standard: DB unique index payoutline_one_per_job; surface clear error if violated (e.g. race).
    const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : "";
    if (code === "P2002") {
      return { success: false, error: "One or more jobs are already on another payout batch. Please refresh and try again." };
    }
    return { success: false, error: "Failed to create batch" };
  }
}

/**
 * Mark a payout batch as PAID: transition all linked jobs to PAID, update batch and lines.
 * Fully atomic: all job transitions + batch/line updates in a single transaction.
 */
export async function markPayoutBatchPaid(batchId: string) {
  const user = await requireAdmin();

  const batch = await prisma.payoutBatch.findUnique({
    where: { id: batchId },
    include: {
      payoutLines: {
        include: {
          workforceAccount: { select: { complianceSuspended: true, classification: true } },
        },
      },
    },
  });

  if (!batch) {
    return { success: false, error: "Batch not found" };
  }
  if (batch.status === "PAID") {
    return { success: false, error: "Batch already marked paid" };
  }

  // Pre-flight: block payout if any workforce account is compliance-suspended
  const suspendedAccounts = batch.payoutLines.filter(
    (l) => l.workforceAccount.complianceSuspended
  );
  if (suspendedAccounts.length > 0) {
    return {
      success: false,
      error: `Payout blocked: ${suspendedAccounts.length} line(s) have compliance-suspended workforce accounts. Resolve compliance issues first.`,
    };
  }

  const jobIds = batch.payoutLines
    .map((l) => l.jobId)
    .filter((id): id is string => id != null);

  try {
    await prisma.$transaction(async (tx) => {
      // Transition all jobs to PAID within the transaction
      for (const jobId of jobIds) {
        const job = await tx.job.findUnique({
          where: { id: jobId },
          select: { status: true },
        });
        if (!job) throw new Error(`Job ${jobId} not found`);
        if (job.status !== "APPROVED_PAYABLE") {
          throw new Error(`Job ${jobId}: cannot transition from ${job.status} to PAID`);
        }
        await tx.job.update({
          where: { id: jobId },
          data: { status: "PAID" },
        });
        await tx.auditLog.create({
          data: {
            actorUserId: user.id,
            actorWorkerId: user.workerId ?? null,
            actorWorkforceAccountId: user.workforceAccountId ?? null,
            entityType: "Job",
            entityId: jobId,
            fromState: "APPROVED_PAYABLE",
            toState: "PAID",
            metadata: { payoutBatchId: batchId },
          },
        });
      }

      await tx.payoutBatch.update({
        where: { id: batchId },
        data: { status: "PAID" },
      });
      await tx.payoutLine.updateMany({
        where: { payoutBatchId: batchId },
        data: { status: "PAID" },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          actorWorkerId: user.workerId ?? null,
          actorWorkforceAccountId: user.workforceAccountId ?? null,
          entityType: "PayoutBatch",
          entityId: batchId,
          fromState: batch.status,
          toState: "PAID",
          metadata: { jobCount: jobIds.length },
        },
      });
    });

    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to finalize payout batch";
    return { success: false, error: msg };
  }
}
