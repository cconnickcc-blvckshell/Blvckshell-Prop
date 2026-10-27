"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { canAssignJob } from "@/server/guards/compliance";

export async function createJob(formData: FormData) {
  const user = await requireAdmin();
  const siteId = formData.get("siteId") as string;
  const assignedWorkerId = formData.get("assignedWorkerId") as string;
  const scheduledStart = formData.get("scheduledStart") as string;
  const scheduledEnd = (formData.get("scheduledEnd") as string) || null;
  const payoutDollars = formData.get("payoutDollars") as string;
  const overrideReason = (formData.get("complianceOverrideReason") as string)?.trim() || "";

  if (!siteId || !assignedWorkerId || !scheduledStart) {
    return { error: "Site, assigned worker, and scheduled start are required." };
  }

  const cents = payoutDollars ? Math.round(parseFloat(payoutDollars) * 100) : 0;
  if (Number.isNaN(cents) || cents < 0) return { error: "Invalid payout amount." };

  const compliance = await canAssignJob({ workerId: assignedWorkerId });
  if (!compliance.compliant && !overrideReason) {
    const blocking = compliance.issues.filter((issue) => issue.severity === "BLOCKING").map((issue) => issue.message);
    return {
      error: `${blocking.join(". ")}. Enter an override reason to assign this job anyway.`,
    };
  }

  const start = new Date(scheduledStart);
  const end = scheduledEnd ? new Date(scheduledEnd) : new Date(start.getTime() + 60 * 60 * 1000);

  const job = await prisma.job.create({
    data: {
      siteId,
      assignedWorkerId,
      scheduledStart: start,
      scheduledEnd: end,
      payoutAmountCents: cents,
    },
  });

  if (!compliance.compliant) {
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        entityType: "Job",
        entityId: job.id,
        fromState: null,
        toState: "COMPLIANCE_OVERRIDE",
        metadata: {
          action: "compliance_override",
          reason: overrideReason,
          issues: compliance.issues.map((issue) => issue.code),
        },
      },
    });
  }

  revalidatePath("/admin/jobs");
  return { success: true };
}
