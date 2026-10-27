import { prisma } from "@/lib/prisma";
import { toPrintJpeg } from "@/lib/pdf/images";
import { buildVisitRecord, type VisitRecordModel } from "@/lib/pdf/models";
import type { VisitPhoto } from "@/lib/pdf/documents/visit-record";

export type LoadedVisitRecord = {
  model: VisitRecordModel;
  photos: VisitPhoto[];
};

async function jpegFromStorage(storagePath: string): Promise<Buffer | null> {
  const { storage } = await import("@/lib/storage");
  const { data, error } = await storage.from("evidence").download(storagePath);
  if (error || !data) return null;
  const raw = Buffer.from(await data.arrayBuffer());
  return toPrintJpeg(raw);
}

export async function loadVisitRecord(jobId: string): Promise<LoadedVisitRecord | null> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      scheduledStart: true,
      status: true,
      isReclean: true,
      checkedInAt: true,
      checkedOutAt: true,
      site: {
        select: {
          name: true,
          address: true,
          clientOrganization: { select: { name: true } },
        },
      },
      assignedWorker: { select: { user: { select: { name: true } } } },
      completion: {
        select: {
          notes: true,
          completedByWorker: { select: { user: { select: { name: true } } } },
        },
      },
      checklistRuns: {
        orderBy: { updatedAt: "desc" },
        select: {
          status: true,
          submittedAt: true,
          approvedAt: true,
          approvedById: true,
          templateSnapshot: true,
          completedByWorker: { select: { user: { select: { name: true } } } },
          items: {
            select: { itemId: true, result: true, failReason: true, note: true },
          },
          evidence: {
            select: {
              storagePath: true,
              itemId: true,
              uploadedAt: true,
              redactionApplied: true,
              redactionAttestedAt: true,
            },
          },
        },
      },
    },
  });
  if (!job) return null;

  const approverIds = [
    ...new Set(
      job.checklistRuns
        .map((run) => run.approvedById)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    ),
  ];
  const approvers =
    approverIds.length === 0
      ? []
      : await prisma.user.findMany({
          where: { id: { in: approverIds } },
          select: { id: true, name: true },
        });
  const approverById = new Map(approvers.map((user) => [user.id, user.name]));
  const approvingRun = job.checklistRuns.find((run) => run.approvedById && approverById.has(run.approvedById));

  const workerName =
    job.completion?.completedByWorker.user.name ||
    job.checklistRuns.find((run) => run.completedByWorker.user.name)?.completedByWorker.user.name ||
    job.assignedWorker?.user.name ||
    null;

  const built = buildVisitRecord({
    siteName: job.site.name,
    siteAddress: job.site.address,
    clientName: job.site.clientOrganization.name,
    scheduledStart: job.scheduledStart,
    status: job.status,
    isReclean: job.isReclean,
    checkedInAt: job.checkedInAt,
    checkedOutAt: job.checkedOutAt,
    workerName,
    approverName: approvingRun?.approvedById ? approverById.get(approvingRun.approvedById) ?? null : null,
    notes: job.completion?.notes ?? null,
    runs: job.checklistRuns,
  });

  const photos: VisitPhoto[] = [];
  for (const ref of built.photoRefs) {
    try {
      const jpeg = await jpegFromStorage(ref.storagePath);
      if (jpeg) photos.push({ jpeg, caption: ref.caption });
    } catch {
      // Skip a photo that cannot be converted. The record still prints.
    }
  }

  return { model: built.model, photos };
}
