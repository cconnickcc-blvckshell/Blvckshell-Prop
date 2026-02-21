import type { JobStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canTransitionJob, transitionJob } from "@/lib/state-machine";
import type { SessionUser } from "@/server/guards/rbac";
import type { BulkPreviewResult, BulkResult } from "./index";

export type BulkJobAction = "approve" | "reject" | "cancel";

const ACTION_TO_STATE: Record<BulkJobAction, JobStatus> = {
  approve: "APPROVED_PAYABLE",
  reject: "SCHEDULED",
  cancel: "CANCELLED",
};

const ALLOWED_FROM: Record<BulkJobAction, JobStatus[]> = {
  approve: ["COMPLETED_PENDING_APPROVAL"],
  reject: ["COMPLETED_PENDING_APPROVAL"],
  cancel: ["SCHEDULED"],
};

/**
 * Validate which job IDs can receive the bulk action (server-side, for preview).
 */
export async function validateBulkJobAction(
  user: SessionUser,
  jobIds: string[],
  action: BulkJobAction,
  options: { sharedReason?: string }
): Promise<BulkPreviewResult> {
  const valid: BulkPreviewResult["valid"] = [];
  const invalid: BulkPreviewResult["invalid"] = [];

  const allowedFrom = ALLOWED_FROM[action];
  const toState = ACTION_TO_STATE[action];

  const jobs = await prisma.job.findMany({
    where: { id: { in: jobIds } },
    select: { id: true, status: true },
  });

  const jobById = new Map(jobs.map((j) => [j.id, j]));

  for (const id of jobIds) {
    const job = jobById.get(id);
    if (!job) {
      invalid.push({
        id,
        currentState: "—",
        intendedAction: action,
        error: "Job not found",
      });
      continue;
    }
    if (!allowedFrom.includes(job.status as JobStatus)) {
      invalid.push({
        id,
        currentState: job.status,
        intendedAction: action,
        error: `Job must be in ${allowedFrom.join(" or ")}`,
      });
      continue;
    }
    const validation = canTransitionJob(user, job.status as JobStatus, toState);
    if (!validation.allowed) {
      invalid.push({
        id,
        currentState: job.status,
        intendedAction: action,
        error: validation.error,
      });
      continue;
    }
    if ((action === "reject" || action === "cancel") && !options.sharedReason?.trim()) {
      invalid.push({
        id,
        currentState: job.status,
        intendedAction: action,
        error: "Reason is required for reject/cancel",
      });
      continue;
    }
    valid.push({
      id,
      currentState: job.status,
      intendedAction: action,
    });
  }

  return {
    valid,
    invalid,
    summary: `${valid.length} can be ${action}ed, ${invalid.length} invalid`,
  };
}

/**
 * Execute bulk job action. Per-entity transition + per-entity audit (metadata includes bulkOperationId).
 * Partial failure: succeed where valid, return failed for the rest.
 */
export async function executeBulkJobAction(
  user: SessionUser,
  jobIds: string[],
  action: BulkJobAction,
  bulkOperationId: string,
  options: { sharedReason?: string }
): Promise<BulkResult> {
  const toState = ACTION_TO_STATE[action];
  const succeeded: string[] = [];
  const failed: BulkResult["failed"] = [];

  for (const jobId of jobIds) {
    const metadata: Record<string, unknown> = { bulkOperationId };
    if (action === "reject" && options.sharedReason) {
      metadata.rejectionReason = options.sharedReason;
    }
    if (action === "cancel" && options.sharedReason) {
      metadata.cancelReason = options.sharedReason;
    }
    const result = await transitionJob(user, jobId, toState, metadata);
    if (result.success) {
      succeeded.push(jobId);
    } else {
      failed.push({ id: jobId, code: "TRANSITION_FAILED", message: result.error ?? "Unknown error" });
    }
  }

  return { bulkOperationId, succeeded, failed };
}
