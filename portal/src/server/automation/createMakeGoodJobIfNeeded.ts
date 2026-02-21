import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/server/guards/rbac";
import type { Prisma } from "@prisma/client";

/**
 * When a job is marked missed (isMissed=true), create a linked make-good job if one does not exist.
 * Idempotent: if job.makeGoodJobId is already set, no-op.
 * Creates a new Job in SCHEDULED, same site, with makeGoodJobId pointing to the original.
 * Writes audit for both original (metadata: MakeGoodCreated) and new job (entityType Job, fromState null, toState SCHEDULED).
 */
export async function createMakeGoodJobIfNeeded(
  actor: SessionUser,
  originalJobId: string
): Promise<{ created: boolean; makeGoodJobId?: string; error?: string }> {
  const original = await prisma.job.findUnique({
    where: { id: originalJobId },
    select: {
      id: true,
      makeGoodJobId: true,
      isMissed: true,
      siteId: true,
      scheduledStart: true,
      scheduledEnd: true,
      payoutAmountCents: true,
      pricingModel: true,
      billableAmountCents: true,
    },
  });

  if (!original) return { created: false, error: "Job not found" };
  if (!original.isMissed) return { created: false, error: "Job is not marked missed" };
  if (original.makeGoodJobId != null) return { created: false }; // idempotent: make-good already exists

  // Default: schedule make-good 7 days after original scheduled start
  const offsetMs = 7 * 24 * 60 * 60 * 1000;
  const newStart = new Date(original.scheduledStart.getTime() + offsetMs);
  const newEnd = original.scheduledEnd
    ? new Date(original.scheduledEnd.getTime() + offsetMs)
    : null;

  const makeGood = await prisma.job.create({
    data: {
      siteId: original.siteId,
      scheduledStart: newStart,
      scheduledEnd: newEnd,
      status: "SCHEDULED",
      payoutAmountCents: original.payoutAmountCents,
      pricingModel: original.pricingModel,
      billableAmountCents: original.billableAmountCents,
      makeGoodJobId: originalJobId,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: actor.id,
      entityType: "Job",
      entityId: originalJobId,
      fromState: "CANCELLED",
      toState: "CANCELLED",
      metadata: {
        action: "MakeGoodCreated",
        makeGoodJobId: makeGood.id,
        reason: "isMissed",
      } as Prisma.InputJsonValue,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: actor.id,
      entityType: "Job",
      entityId: makeGood.id,
      fromState: null,
      toState: "SCHEDULED",
      metadata: {
        action: "MakeGoodJobCreated",
        originalJobId,
        reason: "isMissed",
      } as Prisma.InputJsonValue,
    },
  });

  return { created: true, makeGoodJobId: makeGood.id };
}
