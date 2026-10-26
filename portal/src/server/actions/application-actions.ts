"use server";

import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { queueNotification } from "./notification-actions";
import {
  provisionWorkerApplication,
  provisionClientSignup,
  resendWorkerActivationEmail,
  resendClientActivationEmail,
} from "@/server/provisioning/application-provisioning";

export async function listWorkerApplications() {
  await requireAdmin();
  return prisma.workerApplication.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listClientSignups() {
  await requireAdmin();
  return prisma.clientSignupRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function updateApplicationStatus(
  applicationId: string,
  status: "UNDER_REVIEW" | "APPROVED" | "REJECTED",
  options?: { rejectionReason?: string; adminNotes?: string }
) {
  const user = await requireAdmin();

  const app = await prisma.workerApplication.findUnique({
    where: { id: applicationId },
  });
  if (!app) return { ok: false, error: "Application not found" };

  if (status === "UNDER_REVIEW") {
    await prisma.workerApplication.update({
      where: { id: applicationId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedById: user.id,
        adminNotes: options?.adminNotes,
      },
    });
    revalidatePath("/admin/applications");
    return { ok: true };
  }

  if (status === "APPROVED") {
    const result = await provisionWorkerApplication({
      applicationId,
      reviewerUserId: user.id,
    });
    revalidatePath("/admin/applications");
    if (!result.ok) return result;
    return {
      ok: true,
      provisioned: true,
      userId: result.userId,
      activationInviteStatus: result.activationInviteStatus,
      emailNotificationId: result.emailNotificationId,
      alreadyProvisioned: result.alreadyProvisioned,
      warning: result.warning,
    };
  }

  if (status === "REJECTED") {
    await prisma.workerApplication.update({
      where: { id: applicationId },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedById: user.id,
        rejectionReason: options?.rejectionReason,
        adminNotes: options?.adminNotes,
      },
    });
    try {
      await queueNotification({
        channel: "EMAIL",
        templateKey: "application_rejected",
        recipient: app.email,
        payload: { name: app.firstName, reason: options?.rejectionReason },
        relatedEntityType: "WorkerApplication",
        relatedEntityId: applicationId,
      });
    } catch (e) {
      revalidatePath("/admin/applications");
      return {
        ok: true,
        warning: "Application rejected but rejection email failed to queue.",
        detail: e instanceof Error ? e.message : "queue error",
      };
    }
  }

  revalidatePath("/admin/applications");
  return { ok: true };
}

export async function approveClientSignup(signupId: string) {
  const user = await requireAdmin();
  const result = await provisionClientSignup({
    signupId,
    reviewerUserId: user.id,
  });
  revalidatePath("/admin/applications");
  if (!result.ok) return result;
  return {
    ok: true,
    provisioned: true,
    userId: result.userId,
    activationInviteStatus: result.activationInviteStatus,
    emailNotificationId: result.emailNotificationId,
    alreadyProvisioned: result.alreadyProvisioned,
    warning: result.warning,
  };
}

export async function resendWorkerActivationInvitation(applicationId: string) {
  await requireAdmin();
  const result = await resendWorkerActivationEmail(applicationId);
  revalidatePath("/admin/applications");
  return result;
}

export async function resendClientActivationInvitation(signupId: string) {
  await requireAdmin();
  const result = await resendClientActivationEmail(signupId);
  revalidatePath("/admin/applications");
  return result;
}

export async function rejectClientSignup(signupId: string, reason?: string) {
  const user = await requireAdmin();
  await prisma.clientSignupRequest.update({
    where: { id: signupId },
    data: {
      status: "REJECTED",
      reviewedAt: new Date(),
      reviewedById: user.id,
    },
  });
  revalidatePath("/admin/applications");
  return { ok: true };
}
