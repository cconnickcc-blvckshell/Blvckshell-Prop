"use server";

import { requireWorker } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function checkIn(jobId: string) {
  const user = await requireWorker();

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { status: true, assignedWorkerId: true, checkedInAt: true },
  });

  if (!job) return { success: false, error: "Job not found" };
  if (job.assignedWorkerId !== user.workerId) return { success: false, error: "Not your job" };
  if (job.status !== "SCHEDULED") return { success: false, error: "Job must be SCHEDULED" };
  if (job.checkedInAt) return { success: false, error: "Already checked in" };

  await prisma.job.update({
    where: { id: jobId },
    data: { checkedInAt: new Date(), startedAt: new Date() },
  });

  revalidatePath(`/jobs/${jobId}`);
  return { success: true };
}

export async function checkOut(jobId: string) {
  const user = await requireWorker();

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { status: true, assignedWorkerId: true, checkedInAt: true, checkedOutAt: true },
  });

  if (!job) return { success: false, error: "Job not found" };
  if (job.assignedWorkerId !== user.workerId) return { success: false, error: "Not your job" };
  if (!job.checkedInAt) return { success: false, error: "Must check in first" };
  if (job.checkedOutAt) return { success: false, error: "Already checked out" };

  const checkedInAt = new Date(job.checkedInAt);
  const now = new Date();
  const durationMinutes = Math.round((now.getTime() - checkedInAt.getTime()) / 60000);

  await prisma.job.update({
    where: { id: jobId },
    data: {
      checkedOutAt: now,
      endedAt: now,
      actualDurationMinutes: durationMinutes,
    },
  });

  revalidatePath(`/jobs/${jobId}`);
  return { success: true };
}
