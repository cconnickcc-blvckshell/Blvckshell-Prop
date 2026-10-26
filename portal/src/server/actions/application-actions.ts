"use server";

import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { queueNotification } from "./notification-actions";
import {
  createAccountActivationLink,
  generateUnusablePasswordHash,
} from "@/lib/account-activation";

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

  await prisma.workerApplication.update({
    where: { id: applicationId },
    data: {
      status,
      reviewedAt: new Date(),
      reviewedById: user.id,
      rejectionReason: options?.rejectionReason,
      adminNotes: options?.adminNotes,
    },
  });

  if (status === "APPROVED") {
    const passwordHash = generateUnusablePasswordHash();

    const accountType =
      app.applicationType === "SUBCONTRACTOR" ? "VENDOR" : "INTERNAL";
    const role =
      app.applicationType === "SUBCONTRACTOR"
        ? "VENDOR_WORKER"
        : "INTERNAL_WORKER";

    let workforceAccountId: string;
    if (app.applicationType === "SUBCONTRACTOR" && app.companyName) {
      const existing = await prisma.workforceAccount.findFirst({
        where: { displayName: app.companyName, type: "VENDOR" },
      });
      if (existing) {
        workforceAccountId = existing.id;
      } else {
        const account = await prisma.workforceAccount.create({
          data: {
            type: accountType as "VENDOR",
            displayName: app.companyName,
            primaryContactName: `${app.firstName} ${app.lastName}`,
            primaryContactEmail: app.email,
            primaryContactPhone: app.phone,
          },
        });
        workforceAccountId = account.id;
      }
    } else {
      let internal = await prisma.workforceAccount.findFirst({
        where: { type: "INTERNAL", displayName: "BLVCKSHELL Internal" },
      });
      if (!internal) {
        internal = await prisma.workforceAccount.create({
          data: {
            type: "INTERNAL",
            displayName: "BLVCKSHELL Internal",
            primaryContactName: "BLVCKSHELL",
            primaryContactEmail: "internal@blvckshell.com",
            primaryContactPhone: "",
          },
        });
      }
      workforceAccountId = internal.id;
    }

    const newUser = await prisma.user.create({
      data: {
        email: app.email,
        passwordHash,
        role,
        name: `${app.firstName} ${app.lastName}`,
        phone: app.phone,
        workforceAccountId,
      },
    });

    await prisma.worker.create({
      data: {
        userId: newUser.id,
        workforceAccountId,
        availabilityNotes: `Available: ${app.availableDays.join(", ")} | Shift: ${app.availableShift ?? "flexible"}`,
      },
    });

    const activationUrl = await createAccountActivationLink(newUser.id);

    await queueNotification({
      channel: "SMS",
      templateKey: "application_approved",
      recipient: app.phone,
      payload: {
        name: app.firstName,
        activationUrl,
        portalUrl: process.env.NEXTAUTH_URL ?? "https://www.blvckshell.com",
      },
      relatedEntityType: "WorkerApplication",
      relatedEntityId: applicationId,
    }).catch(() => {});

    await queueNotification({
      channel: "EMAIL",
      templateKey: "application_approved",
      recipient: app.email,
      payload: {
        name: app.firstName,
        activationUrl,
        portalUrl: process.env.NEXTAUTH_URL ?? "https://www.blvckshell.com",
      },
      relatedEntityType: "WorkerApplication",
      relatedEntityId: applicationId,
    }).catch(() => {});
  }

  if (status === "REJECTED") {
    await queueNotification({
      channel: "EMAIL",
      templateKey: "application_rejected",
      recipient: app.email,
      payload: { name: app.firstName, reason: options?.rejectionReason },
      relatedEntityType: "WorkerApplication",
      relatedEntityId: applicationId,
    }).catch(() => {});
  }

  revalidatePath("/admin/applications");
  return { ok: true };
}

export async function approveClientSignup(signupId: string) {
  await requireAdmin();

  const signup = await prisma.clientSignupRequest.findUnique({
    where: { id: signupId },
  });
  if (!signup) return { ok: false, error: "Not found" };

  const passwordHash = generateUnusablePasswordHash();

  const org = await prisma.clientOrganization.create({
    data: {
      name: signup.companyName,
      primaryContactName: signup.contactName,
      primaryContactEmail: signup.contactEmail,
      primaryContactPhone: signup.contactPhone,
    },
  });

  const clientUser = await prisma.user.create({
    data: {
      email: signup.contactEmail,
      passwordHash,
      role: "CLIENT",
      name: signup.contactName,
      phone: signup.contactPhone,
      clientOrganizationId: org.id,
    },
  });

  const activationUrl = await createAccountActivationLink(clientUser.id);

  await prisma.clientSignupRequest.update({
    where: { id: signupId },
    data: {
      status: "APPROVED",
      reviewedAt: new Date(),
      reviewedById: (await requireAdmin()).id,
    },
  });

  await queueNotification({
    channel: "EMAIL",
    templateKey: "client_approved",
    recipient: signup.contactEmail,
    payload: {
      name: signup.contactName,
      companyName: signup.companyName,
      activationUrl,
      portalUrl: process.env.NEXTAUTH_URL,
    },
    relatedEntityType: "ClientSignupRequest",
    relatedEntityId: signupId,
  }).catch(() => {});

  revalidatePath("/admin/applications");
  return { ok: true };
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

