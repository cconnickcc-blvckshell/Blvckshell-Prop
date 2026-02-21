import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/server/guards/rbac";
import type { BulkPreviewResult, BulkResult } from "./index";
import type { Prisma } from "@prisma/client";

/**
 * Validate: only unresolved incidents can be marked resolved.
 */
export async function validateBulkResolveIncidents(
  user: SessionUser,
  incidentIds: string[],
  _resolutionNotes: string
): Promise<BulkPreviewResult> {
  const valid: BulkPreviewResult["valid"] = [];
  const invalid: BulkPreviewResult["invalid"] = [];

  const incidents = await prisma.incidentReport.findMany({
    where: { id: { in: incidentIds } },
    select: { id: true, resolvedAt: true },
  });
  const byId = new Map(incidents.map((i) => [i.id, i]));

  for (const id of incidentIds) {
    const inc = byId.get(id);
    if (!inc) {
      invalid.push({ id, currentState: "—", intendedAction: "mark_resolved", error: "Incident not found" });
      continue;
    }
    if (inc.resolvedAt != null) {
      invalid.push({
        id,
        currentState: "Resolved",
        intendedAction: "mark_resolved",
        error: "Already resolved",
      });
      continue;
    }
    valid.push({ id, currentState: "Unresolved", intendedAction: "mark_resolved" });
  }

  return {
    valid,
    invalid,
    summary: `${valid.length} can be marked resolved, ${invalid.length} invalid`,
  };
}

/**
 * Execute: update each incident with resolvedAt and resolutionNotes; write one audit per incident.
 */
export async function executeBulkResolveIncidents(
  user: SessionUser,
  incidentIds: string[],
  resolutionNotes: string,
  bulkOperationId: string
): Promise<BulkResult> {
  const succeeded: string[] = [];
  const failed: BulkResult["failed"] = [];

  const incidents = await prisma.incidentReport.findMany({
    where: { id: { in: incidentIds }, resolvedAt: null },
    select: { id: true },
  });
  const resolvableIds = new Set(incidents.map((i) => i.id));

  for (const id of incidentIds) {
    if (!resolvableIds.has(id)) {
      failed.push({ id, code: "ALREADY_RESOLVED", message: "Incident not found or already resolved" });
      continue;
    }
    try {
      await prisma.$transaction(async (tx) => {
        await tx.incidentReport.update({
          where: { id },
          data: { resolvedAt: new Date(), resolutionNotes: resolutionNotes.trim() || null },
        });
        await tx.auditLog.create({
          data: {
            actorUserId: user.id,
            entityType: "IncidentReport",
            entityId: id,
            fromState: "Unresolved",
            toState: "Resolved",
            metadata: { bulkOperationId, action: "MarkedResolved", resolutionNotes } as Prisma.InputJsonValue,
          },
        });
      });
      succeeded.push(id);
    } catch (e) {
      failed.push({ id, code: "UPDATE_FAILED", message: e instanceof Error ? e.message : "Unknown error" });
    }
  }

  return { bulkOperationId, succeeded, failed };
}
