import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const OVERDUE_DAYS = 3;

/**
 * Flag jobs in COMPLETED_PENDING_APPROVAL that are older than OVERDUE_DAYS for approval reminder.
 * Sets approvalFlaggedAt; writes one audit entry per flagged job (non-invasive flag only).
 * Idempotent: jobs already with approvalFlaggedAt set are skipped.
 */
export async function flagOverdueApprovals(actorUserId: string): Promise<{
  flagged: string[];
  errors: string[];
}> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - OVERDUE_DAYS);

  const jobs = await prisma.job.findMany({
    where: {
      status: "COMPLETED_PENDING_APPROVAL",
      approvalFlaggedAt: null,
      scheduledStart: { lt: cutoff },
    },
    select: { id: true },
  });

  const flagged: string[] = [];
  const errors: string[] = [];

  for (const job of jobs) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.job.update({
          where: { id: job.id },
          data: { approvalFlaggedAt: new Date() },
        });
        await tx.auditLog.create({
          data: {
            actorUserId,
            entityType: "Job",
            entityId: job.id,
            fromState: null,
            toState: null,
            metadata: {
              action: "ApprovalFlagged",
              reason: "Overdue",
              overdueDays: OVERDUE_DAYS,
            } as Prisma.InputJsonValue,
          },
        });
      });
      flagged.push(job.id);
    } catch (e) {
      errors.push(job.id + ": " + (e instanceof Error ? e.message : "Unknown error"));
    }
  }

  return { flagged, errors };
}
