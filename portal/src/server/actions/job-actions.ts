"use server";

import { requireWorker, requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { transitionJob } from "@/lib/state-machine";
import { jobCompletionSchema } from "@/lib/validations";
import { MAX_PHOTOS_PER_JOB } from "@/lib/storage";

/**
 * Save draft completion
 */
export async function saveDraft(input: {
  jobId: string;
  checklistResults: Record<string, { result: "PASS" | "FAIL" | "NA"; note?: string }>;
  notes?: string;
}) {
  const user = await requireWorker();

  // Validate input
  const validation = jobCompletionSchema.safeParse({
    jobId: input.jobId,
    checklistResults: input.checklistResults,
    notes: input.notes,
  });

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Invalid input",
    };
  }

  try {
    // Check job access
    const job = await prisma.job.findUnique({
      where: { id: input.jobId },
      select: {
        assignedWorkerId: true,
        status: true,
      },
    });

    if (!job) {
      return { success: false, error: "Job not found" };
    }

    if (job.assignedWorkerId !== user.workerId) {
      return { success: false, error: "Unauthorized" };
    }

    if (job.status !== "SCHEDULED" && job.status !== "COMPLETED_PENDING_APPROVAL") {
      return { success: false, error: "Job cannot be edited in current state" };
    }

    // Upsert draft completion
    await prisma.jobCompletion.upsert({
      where: { jobId: input.jobId },
      create: {
        jobId: input.jobId,
        completedByWorkerId: user.workerId!,
        checklistResults: input.checklistResults,
        notes: input.notes || null,
        isDraft: true,
      },
      update: {
        checklistResults: input.checklistResults,
        notes: input.notes || null,
        isDraft: true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error saving draft:", error);
    return { success: false, error: "Failed to save draft" };
  }
}

/**
 * Submit completion (out of draft)
 */
export async function submitCompletion(input: {
  jobId: string;
  checklistResults: Record<string, { result: "PASS" | "FAIL" | "NA"; note?: string }>;
  notes?: string;
}) {
  const user = await requireWorker();

  // Validate input
  const validation = jobCompletionSchema.safeParse({
    jobId: input.jobId,
    checklistResults: input.checklistResults,
    notes: input.notes,
  });

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Invalid input",
    };
  }

  try {
    // Check job access and get site requirements
    const job = await prisma.job.findUnique({
      where: { id: input.jobId },
      include: {
        site: {
          select: {
            requiredPhotoCount: true,
          },
        },
        completion: {
          include: {
            evidence: true,
          },
        },
      },
    });

    if (!job) {
      return { success: false, error: "Job not found" };
    }

    if (job.assignedWorkerId !== user.workerId) {
      return { success: false, error: "Unauthorized" };
    }

    if (job.status !== "SCHEDULED" && job.status !== "COMPLETED_PENDING_APPROVAL") {
      return { success: false, error: "Job cannot be submitted in current state" };
    }

    // Validate photo count
    const evidenceCount = job.completion?.evidence.length || 0;
    if (evidenceCount < job.site.requiredPhotoCount) {
      return {
        success: false,
        error: `Minimum ${job.site.requiredPhotoCount} photos required. You have ${evidenceCount}.`,
      };
    }

    if (evidenceCount > MAX_PHOTOS_PER_JOB) {
      return {
        success: false,
        error: `Maximum ${MAX_PHOTOS_PER_JOB} photos per job. You have ${evidenceCount}.`,
      };
    }

    // Update completion (out of draft) and transition job
    await prisma.$transaction(async (tx) => {
      // Update completion
      await tx.jobCompletion.upsert({
        where: { jobId: input.jobId },
        create: {
          jobId: input.jobId,
          completedByWorkerId: user.workerId!,
          checklistResults: input.checklistResults,
          notes: input.notes || null,
          isDraft: false,
        },
        update: {
          checklistResults: input.checklistResults,
          notes: input.notes || null,
          isDraft: false,
        },
      });

      // Transition job to COMPLETED_PENDING_APPROVAL
      await transitionJob(user, input.jobId, "COMPLETED_PENDING_APPROVAL");
    });

    return { success: true };
  } catch (error) {
    console.error("Error submitting completion:", error);
    return { success: false, error: "Failed to submit completion" };
  }
}

/**
 * Approve completion (Admin only)
 */
export async function approveCompletion(jobId: string) {
  const user = await requireAdmin();

  try {
    const result = await transitionJob(user, jobId, "APPROVED_PAYABLE");
    return result;
  } catch (error) {
    console.error("Error approving completion:", error);
    return { success: false, error: "Failed to approve completion" };
  }
}

/**
 * Reject completion (Admin only)
 */
export async function rejectCompletion(jobId: string, reason: string) {
  const user = await requireAdmin();

  try {
    const result = await transitionJob(user, jobId, "SCHEDULED", {
      rejectionReason: reason,
    });
    return result;
  } catch (error) {
    console.error("Error rejecting completion:", error);
    return { success: false, error: "Failed to reject completion" };
  }
}
