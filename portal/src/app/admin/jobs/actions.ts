"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";

export async function createJob(formData: FormData) {
  await requireAdmin();
  const siteId = formData.get("siteId") as string;
  const assignedWorkerId = formData.get("assignedWorkerId") as string;
  const scheduledStart = formData.get("scheduledStart") as string;
  const scheduledEnd = (formData.get("scheduledEnd") as string) || null;
  const payoutDollars = formData.get("payoutDollars") as string;

  if (!siteId || !assignedWorkerId || !scheduledStart) {
    return { error: "Site, assigned worker, and scheduled start are required." };
  }

  const cents = payoutDollars ? Math.round(parseFloat(payoutDollars) * 100) : 0;
  if (Number.isNaN(cents) || cents < 0) return { error: "Invalid payout amount." };

  const start = new Date(scheduledStart);
  const end = scheduledEnd ? new Date(scheduledEnd) : new Date(start.getTime() + 60 * 60 * 1000);

  await prisma.job.create({
    data: {
      siteId,
      assignedWorkerId,
      scheduledStart: start,
      scheduledEnd: end,
      payoutAmountCents: cents,
    },
  });

  revalidatePath("/admin/jobs");
  return { success: true };
}
