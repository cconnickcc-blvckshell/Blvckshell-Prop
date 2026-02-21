import type { WorkOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canTransitionWorkOrder, transitionWorkOrder } from "@/lib/state-machine";
import type { SessionUser } from "@/server/guards/rbac";
import type { BulkPreviewResult, BulkResult } from "./index";

/**
 * Validate which work order IDs can transition to the target status.
 */
export async function validateBulkWorkOrderTransition(
  user: SessionUser,
  workOrderIds: string[],
  toStatus: WorkOrderStatus
): Promise<BulkPreviewResult> {
  const valid: BulkPreviewResult["valid"] = [];
  const invalid: BulkPreviewResult["invalid"] = [];

  const workOrders = await prisma.workOrder.findMany({
    where: { id: { in: workOrderIds } },
    select: { id: true, status: true },
  });
  const byId = new Map(workOrders.map((w) => [w.id, w]));

  for (const id of workOrderIds) {
    const wo = byId.get(id);
    if (!wo) {
      invalid.push({ id, currentState: "—", intendedAction: toStatus, error: "Work order not found" });
      continue;
    }
    const validation = canTransitionWorkOrder(user, wo.status as WorkOrderStatus, toStatus);
    if (!validation.allowed) {
      invalid.push({
        id,
        currentState: wo.status,
        intendedAction: toStatus,
        error: validation.error,
      });
      continue;
    }
    valid.push({ id, currentState: wo.status, intendedAction: toStatus });
  }

  return {
    valid,
    invalid,
    summary: `${valid.length} can transition to ${toStatus}, ${invalid.length} invalid`,
  };
}

/**
 * Execute bulk work order transition. Per-entity transition + per-entity audit (metadata includes bulkOperationId).
 */
export async function executeBulkWorkOrderTransition(
  user: SessionUser,
  workOrderIds: string[],
  toStatus: WorkOrderStatus,
  bulkOperationId: string
): Promise<BulkResult> {
  const succeeded: string[] = [];
  const failed: BulkResult["failed"] = [];

  for (const workOrderId of workOrderIds) {
    const result = await transitionWorkOrder(user, workOrderId, toStatus, { bulkOperationId });
    if (result.success) {
      succeeded.push(workOrderId);
    } else {
      failed.push({ id: workOrderId, code: "TRANSITION_FAILED", message: result.error ?? "Unknown error" });
    }
  }

  return { bulkOperationId, succeeded, failed };
}
