import { JobStatus, WorkOrderStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { SessionUser } from "@/server/guards/rbac";

// ============================================================================
// Job State Machine
// ============================================================================

const ALLOWED_JOB_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  SCHEDULED: ["COMPLETED_PENDING_APPROVAL", "CANCELLED"],
  COMPLETED_PENDING_APPROVAL: ["APPROVED_PAYABLE", "SCHEDULED", "CANCELLED"],
  APPROVED_PAYABLE: ["PAID"],
  PAID: [], // Terminal state
  CANCELLED: [], // Terminal state
};

/**
 * Check if job transition is allowed
 */
export function isAllowedJobTransition(from: JobStatus, to: JobStatus): boolean {
  return ALLOWED_JOB_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Validate job transition based on role
 */
export function canTransitionJob(
  user: SessionUser,
  from: JobStatus,
  to: JobStatus
): { allowed: boolean; error?: string } {
  // Check if transition is allowed
  if (!isAllowedJobTransition(from, to)) {
    return {
      allowed: false,
      error: `Invalid transition: Cannot move Job from ${from} to ${to}`,
    };
  }

  // Terminal states cannot be transitioned from
  if (from === "PAID" || from === "CANCELLED") {
    return {
      allowed: false,
      error: `Invalid transition: ${from} is a terminal state`,
    };
  }

  // Role-based checks
  if (to === "COMPLETED_PENDING_APPROVAL") {
    // Only workers can submit completion
    if (user.role !== "VENDOR_WORKER" && user.role !== "INTERNAL_WORKER") {
      return {
        allowed: false,
        error: "Only workers can submit job completion",
      };
    }
  }

  if (to === "APPROVED_PAYABLE" || to === "SCHEDULED" || to === "CANCELLED") {
    // Only admin can approve/reject/cancel
    if (user.role !== "ADMIN") {
      return {
        allowed: false,
        error: "Only admin can approve, reject, or cancel jobs",
      };
    }
  }

  if (to === "PAID") {
    // Only admin can mark paid (via payout batch)
    if (user.role !== "ADMIN") {
      return {
        allowed: false,
        error: "Only admin can mark jobs as paid",
      };
    }
  }

  return { allowed: true };
}

/**
 * Transition job state with audit log
 */
export async function transitionJob(
  user: SessionUser,
  jobId: string,
  toState: JobStatus,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { status: true },
  });

  if (!job) {
    return { success: false, error: "Job not found" };
  }

  const validation = canTransitionJob(user, job.status, toState);
  if (!validation.allowed) {
    return { success: false, error: validation.error };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Update job status
      await tx.job.update({
        where: { id: jobId },
        data: { status: toState },
      });

      // Write audit log
      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          actorWorkerId: user.workerId ?? null,
          actorWorkforceAccountId: user.workforceAccountId ?? null,
          entityType: "Job",
          entityId: jobId,
          fromState: job.status,
          toState,
          metadata: (metadata ?? {}) as Prisma.InputJsonValue,
        },
      });
    });

    // A3: After APPROVED_PAYABLE, ensure job is on a draft invoice (idempotent, audited)
    if (toState === "APPROVED_PAYABLE") {
      const { ensureJobOnDraftInvoice } = await import("@/server/automation/ensureJobOnDraftInvoice");
      await ensureJobOnDraftInvoice(user, jobId);
    }

    return { success: true };
  } catch (error) {
    console.error("Error transitioning job:", error);
    return { success: false, error: "Failed to transition job" };
  }
}

// ============================================================================
// WorkOrder State Machine
// ============================================================================

const ALLOWED_WORKORDER_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  REQUESTED: ["APPROVED"],
  APPROVED: ["ASSIGNED"],
  ASSIGNED: ["COMPLETED"],
  COMPLETED: ["INVOICED"],
  INVOICED: ["PAID"],
  PAID: [], // Terminal state
};

/**
 * Check if work order transition is allowed
 */
export function isAllowedWorkOrderTransition(
  from: WorkOrderStatus,
  to: WorkOrderStatus
): boolean {
  return ALLOWED_WORKORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Validate work order transition based on role
 */
export function canTransitionWorkOrder(
  user: SessionUser,
  from: WorkOrderStatus,
  to: WorkOrderStatus
): { allowed: boolean; error?: string } {
  if (!isAllowedWorkOrderTransition(from, to)) {
    return {
      allowed: false,
      error: `Invalid transition: Cannot move WorkOrder from ${from} to ${to}`,
    };
  }

  // Most transitions require admin
  if (
    to === "APPROVED" ||
    to === "ASSIGNED" ||
    to === "INVOICED" ||
    to === "PAID"
  ) {
    if (user.role !== "ADMIN") {
      return {
        allowed: false,
        error: "Only admin can perform this transition",
      };
    }
  }

  // Workers can complete assigned work orders
  if (to === "COMPLETED") {
    if (
      user.role !== "VENDOR_WORKER" &&
      user.role !== "INTERNAL_WORKER" &&
      user.role !== "ADMIN"
    ) {
      return {
        allowed: false,
        error: "Only workers or admin can complete work orders",
      };
    }
  }

  return { allowed: true };
}

/**
 * Transition work order state with audit log
 */
export async function transitionWorkOrder(
  user: SessionUser,
  workOrderId: string,
  toState: WorkOrderStatus,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    select: { status: true },
  });

  if (!workOrder) {
    return { success: false, error: "Work order not found" };
  }

  const validation = canTransitionWorkOrder(user, workOrder.status, toState);
  if (!validation.allowed) {
    return { success: false, error: validation.error };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Update work order status
      await tx.workOrder.update({
        where: { id: workOrderId },
        data: { status: toState },
      });

      // Write audit log
      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          actorWorkerId: user.workerId ?? null,
          actorWorkforceAccountId: user.workforceAccountId ?? null,
          entityType: "WorkOrder",
          entityId: workOrderId,
          fromState: workOrder.status,
          toState,
          metadata: (metadata ?? {}) as Prisma.InputJsonValue,
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Error transitioning work order:", error);
    return { success: false, error: "Failed to transition work order" };
  }
}
