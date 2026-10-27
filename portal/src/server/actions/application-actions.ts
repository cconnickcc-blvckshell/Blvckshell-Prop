"use server";

import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { queueNotification } from "./notification-actions";
import * as bcrypt from "bcryptjs";
import { generateTempPassword } from "@/lib/temp-password";

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

  if (status === "APPROVED") {
    const existingUser = await prisma.user.findUnique({ where: { email: app.email } });
    if (existingUser) {
      return { ok: false, error: "A user with this email already exists." };
    }
  }

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
    const tempPassword = generateTempPassword();
    const passwordHash = bcrypt.hashSync(tempPassword, 10);

    let workforceAccountId: string;
    let role: "VENDOR_OWNER" | "VENDOR_WORKER" | "INTERNAL_WORKER";
    if (app.applicationType === "SUBCONTRACTOR" && app.companyName) {
      const existing = await prisma.workforceAccount.findFirst({
        where: { displayName: app.companyName, type: "VENDOR" },
      });
      if (existing) {
        workforceAccountId = existing.id;
        role = "VENDOR_WORKER";
      } else {
        const account = await prisma.workforceAccount.create({
          data: {
            type: "VENDOR",
            classification: "CONTRACTOR",
            allowedPaymentMethod: "EFT",
            displayName: app.companyName,
            primaryContactName: `${app.firstName} ${app.lastName}`,
            primaryContactEmail: app.email,
            primaryContactPhone: app.phone,
          },
        });
        workforceAccountId = account.id;
        role = "VENDOR_OWNER";
      }
    } else {
      let internal = await prisma.workforceAccount.findFirst({
        where: { type: "INTERNAL", displayName: "BLVCKSHELL Internal" },
      });
      if (!internal) {
        internal = await prisma.workforceAccount.create({
          data: {
            type: "INTERNAL",
            classification: "EMPLOYEE",
            allowedPaymentMethod: "PAYROLL",
            displayName: "BLVCKSHELL Internal",
            primaryContactName: "BLVCKSHELL",
            primaryContactEmail: "internal@blvckshell.com",
            primaryContactPhone: "",
          },
        });
      } else if (
        internal.classification !== "EMPLOYEE" ||
        internal.allowedPaymentMethod !== "PAYROLL"
      ) {
        internal = await prisma.workforceAccount.update({
          where: { id: internal.id },
          data: { classification: "EMPLOYEE", allowedPaymentMethod: "PAYROLL" },
        });
      }
      workforceAccountId = internal.id;
      role = "INTERNAL_WORKER";
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

    if (app.applicationType === "SUBCONTRACTOR") {
      await copyApplicationCompliance(app, workforceAccountId);
    }

    await queueNotification({
      channel: "SMS",
      templateKey: "application_approved",
      recipient: app.phone,
      payload: {
        name: app.firstName,
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
        tempPassword,
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

  const tempPassword = generateTempPassword();
  const passwordHash = bcrypt.hashSync(tempPassword, 10);

  const org = await prisma.clientOrganization.create({
    data: {
      name: signup.companyName,
      primaryContactName: signup.contactName,
      primaryContactEmail: signup.contactEmail,
      primaryContactPhone: signup.contactPhone,
    },
  });

  await prisma.user.create({
    data: {
      email: signup.contactEmail,
      passwordHash,
      role: "CLIENT",
      name: signup.contactName,
      phone: signup.contactPhone,
      clientOrganizationId: org.id,
    },
  });

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
      tempPassword,
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

async function copyApplicationCompliance(
  app: { coiDocPath: string | null; wsibDocPath: string | null },
  workforceAccountId: string,
) {
  const docs: { type: "COI" | "WSIB"; path: string | null }[] = [
    { type: "COI", path: app.coiDocPath },
    { type: "WSIB", path: app.wsibDocPath },
  ];
  for (const doc of docs) {
    if (!doc.path) continue;
    const existing = await prisma.complianceDocument.findFirst({
      where: { workforceAccountId, type: doc.type, storagePath: doc.path },
    });
    if (existing) continue;
    await prisma.complianceDocument.create({
      data: {
        workforceAccountId,
        type: doc.type,
        storagePath: doc.path,
        expiresAt: null,
      },
    });
  }
}
