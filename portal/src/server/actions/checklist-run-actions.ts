"use server";

import { requireWorker } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { transitionJob } from "@/lib/state-machine";
import { revalidatePath } from "next/cache";
import { MAX_PHOTOS_PER_JOB } from "@/lib/storage";

export type ChecklistRunItemResult = "PASS" | "FAIL" | "NA";

/**
 * Create or get the active checklist run for a job.
 * If none exists (or only Submitted/Approved/Rejected), creates a new run and ensures JobCompletion exists for evidence.
 */
export async function createOrGetChecklistRun(jobId: string) {
  const user = await requireWorker();
  if (!user.workerId) {
    return { success: false, error: "Worker identity required", run: null, runItems: {} };
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      site: {
        include: {
          checklistTemplates: {
            where: { isActive: true },
            orderBy: { version: "desc" },
            take: 1,
          },
        },
      },
      completion: { include: { evidence: true } },
      checklistRuns: {
        where: { status: "InProgress" },
        orderBy: { updatedAt: "desc" },
        take: 1,
        include: { items: true },
      },
    },
  });

  if (!job) return { success: false, error: "Job not found", run: null, runItems: {} };
  if (job.assignedWorkerId !== user.workerId) {
    return { success: false, error: "Unauthorized", run: null, runItems: {} };
  }
  if (job.status !== "SCHEDULED" && job.status !== "COMPLETED_PENDING_APPROVAL") {
    return { success: false, error: "Job not in editable state", run: null, runItems: {} };
  }

  const template = job.site.checklistTemplates[0];
  if (!template) return { success: false, error: "No checklist template for site", run: null, runItems: {} };

  const templateItems = (template.items as Array<{ itemId: string; label: string; required?: boolean }>) || [];

  // Use existing in-progress run if any
  const existingRun = job.checklistRuns[0];
  if (existingRun) {
    const runItemsMap: Record<string, { result: ChecklistRunItemResult; failReason?: string; note?: string }> = {};
    for (const ri of existingRun.items) {
      runItemsMap[ri.itemId] = {
        result: ri.result as ChecklistRunItemResult,
        failReason: ri.failReason ?? undefined,
        note: ri.note ?? undefined,
      };
    }
    return {
      success: true,
      error: null,
      run: {
        id: existingRun.id,
        status: existingRun.status,
        templateVersion: existingRun.templateVersion,
      },
      runItems: runItemsMap,
    };
  }

  // Create new run and ensure JobCompletion exists for evidence
  const run = await prisma.$transaction(async (tx) => {
    const newRun = await tx.checklistRun.create({
      data: {
        jobId,
        checklistTemplateId: template.id,
        templateVersion: template.version,
        status: "InProgress",
        completedByWorkerId: user.workerId!,
      },
    });

    // Ensure JobCompletion exists (draft) so evidence upload has a target
    await tx.jobCompletion.upsert({
      where: { jobId },
      create: {
        jobId,
        completedByWorkerId: user.workerId!,
        checklistResults: {},
        isDraft: true,
      },
      update: {},
    });

    return newRun;
  });

  return {
    success: true,
    error: null,
    run: { id: run.id, status: run.status, templateVersion: run.templateVersion },
    runItems: {},
  };
}

/**
 * Save a single checklist run item (autosave). Syncs run state to JobCompletion.checklistResults for backward compat.
 */
export async function saveChecklistRunItem(
  runId: string,
  itemId: string,
  result: ChecklistRunItemResult,
  options?: { failReason?: string; note?: string }
) {
  const user = await requireWorker();
  if (!user.workerId) return { success: false, error: "Worker identity required" };

  const run = await prisma.checklistRun.findUnique({
    where: { id: runId },
    include: { items: true, job: { select: { id: true, assignedWorkerId: true, status: true } } },
  });

  if (!run) return { success: false, error: "Run not found" };
  if (run.job.assignedWorkerId !== user.workerId) return { success: false, error: "Unauthorized" };
  if (run.status !== "InProgress") return { success: false, error: "Run is not in progress" };
  if (run.job.status !== "SCHEDULED" && run.job.status !== "COMPLETED_PENDING_APPROVAL") {
    return { success: false, error: "Job not editable" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.checklistRunItem.upsert({
      where: {
        checklistRunId_itemId: { checklistRunId: runId, itemId },
      },
      create: {
        checklistRunId: runId,
        itemId,
        result,
        failReason: options?.failReason ?? null,
        note: options?.note ?? null,
        completedAt: new Date(),
        completedByWorkerId: user.workerId,
      },
      update: {
        result,
        failReason: options?.failReason ?? null,
        note: options?.note ?? null,
        completedAt: new Date(),
        completedByWorkerId: user.workerId,
      },
    });

    // Sync all run items to JobCompletion.checklistResults (re-fetch to include the one we just saved)
    const allRunItems = await tx.checklistRunItem.findMany({
      where: { checklistRunId: runId },
    });
    const checklistResults = Object.fromEntries(
      allRunItems.map((i) => [i.itemId, { result: i.result, note: i.note ?? undefined }])
    );
    await tx.jobCompletion.update({
      where: { jobId: run.job.id },
      data: { checklistResults: checklistResults as object },
    });
  });

  revalidatePath(`/jobs/${run.job.id}`);
  return { success: true, error: null };
}

/**
 * Submit the checklist run: validate required items + photo count, set run status Submitted, update JobCompletion, transition job.
 */
export async function submitChecklistRun(runId: string) {
  const user = await requireWorker();
  if (!user.workerId) return { success: false, error: "Worker identity required" };

  const run = await prisma.checklistRun.findUnique({
    where: { id: runId },
    include: {
      items: true,
      checklistTemplate: true,
      job: {
        include: {
          site: { select: { requiredPhotoCount: true } },
          completion: { include: { evidence: true } },
        },
      },
    },
  });

  if (!run) return { success: false, error: "Run not found" };
  if (run.job.assignedWorkerId !== user.workerId) return { success: false, error: "Unauthorized" };
  if (run.status !== "InProgress") return { success: false, error: "Run already submitted" };
  if (run.job.status !== "SCHEDULED" && run.job.status !== "COMPLETED_PENDING_APPROVAL") {
    return { success: false, error: "Job not in submittable state" };
  }

  const templateItems = (run.checklistTemplate.items as Array<{
    itemId: string;
    label: string;
    required?: boolean;
    photoRequired?: boolean;
  }>) || [];
  const requiredItemIds = templateItems.filter((i) => i.required).map((i) => i.itemId);
  const photoRequiredItemIds = templateItems.filter((i) => i.photoRequired).map((i) => i.itemId);
  const runItemByKey = Object.fromEntries(run.items.map((i) => [i.itemId, i]));

  for (const itemId of requiredItemIds) {
    const ri = runItemByKey[itemId];
    if (!ri || !ri.result) {
      return { success: false, error: `Required item ${itemId} is not completed` };
    }
  }

  const evidence = run.job.completion?.evidence ?? [];
  const evidenceCount = evidence.length;

  if (evidenceCount < run.job.site.requiredPhotoCount) {
    return {
      success: false,
      error: `Minimum ${run.job.site.requiredPhotoCount} photos required. You have ${evidenceCount}.`,
    };
  }
  if (evidenceCount > MAX_PHOTOS_PER_JOB) {
    return { success: false, error: `Maximum ${MAX_PHOTOS_PER_JOB} photos allowed. You have ${evidenceCount}.` };
  }

  // Phase 2: require at least one photo per item that has photoRequired
  const evidenceItemIds = new Set(evidence.map((e) => e.itemId).filter(Boolean));
  for (const itemId of photoRequiredItemIds) {
    if (!evidenceItemIds.has(itemId)) {
      return {
        success: false,
        error: `Item ${itemId} requires at least one photo. Add a photo for that item.`,
      };
    }
  }

  const checklistResults = Object.fromEntries(
    run.items.map((i) => [i.itemId, { result: i.result, note: i.note ?? undefined }])
  );

  await prisma.$transaction(async (tx) => {
    await tx.checklistRun.update({
      where: { id: runId },
      data: { status: "Submitted", submittedAt: new Date() },
    });
    await tx.jobCompletion.upsert({
      where: { jobId: run.job.id },
      create: {
        jobId: run.job.id,
        completedByWorkerId: user.workerId!,
        checklistResults: checklistResults as object,
        isDraft: false,
      },
      update: {
        checklistResults: checklistResults as object,
        isDraft: false,
      },
    });
    await transitionJob(user, run.job.id, "COMPLETED_PENDING_APPROVAL");
  });

  revalidatePath(`/jobs/${run.job.id}`);
  revalidatePath("/jobs");
  return { success: true, error: null };
}
