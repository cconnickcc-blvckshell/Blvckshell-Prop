import type { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  generateUnusablePasswordHash,
  issueActivationTokenInTransaction,
  createAccountActivationToken,
} from "@/lib/account-activation";
import { queueNotification } from "@/server/actions/notification-actions";

export type ProvisionResult =
  | {
      ok: true;
      userId: string;
      alreadyProvisioned: boolean;
      activationTokenId: string;
      emailNotificationId: string;
      activationInviteStatus: "QUEUED";
      warning?: string;
    }
  | { ok: false; error: string; code: "NOT_FOUND" | "CONFLICT" | "INVALID_STATE" | "QUEUE_FAILED" };

type Tx = Prisma.TransactionClient;

async function resolveWorkforceAccountId(
  tx: Tx,
  applicationType: string,
  companyName: string | null,
  firstName: string,
  lastName: string,
  email: string,
  phone: string
): Promise<string> {
  if (applicationType === "SUBCONTRACTOR" && companyName) {
    const existing = await tx.workforceAccount.findFirst({
      where: { displayName: companyName, type: "VENDOR" },
    });
    if (existing) return existing.id;
    const account = await tx.workforceAccount.create({
      data: {
        type: "VENDOR",
        displayName: companyName,
        primaryContactName: `${firstName} ${lastName}`,
        primaryContactEmail: email,
        primaryContactPhone: phone,
      },
    });
    return account.id;
  }
  let internal = await tx.workforceAccount.findFirst({
    where: { type: "INTERNAL", displayName: "BLVCKSHELL Internal" },
  });
  if (!internal) {
    internal = await tx.workforceAccount.create({
      data: {
        type: "INTERNAL",
        displayName: "BLVCKSHELL Internal",
        primaryContactName: "BLVCKSHELL",
        primaryContactEmail: "internal@blvckshell.com",
        primaryContactPhone: "",
      },
    });
  }
  return internal.id;
}

async function queueActivationEmail(opts: {
  entityType: string;
  entityId: string;
  recipientEmail: string;
  templateKey: string;
  payload: Record<string, unknown>;
  onQueued: () => Promise<void>;
}): Promise<{ ok: true; notificationId: string } | { ok: false; error: string }> {
  try {
    const row = await queueNotification({
      channel: "EMAIL",
      templateKey: opts.templateKey,
      recipient: opts.recipientEmail,
      payload: opts.payload,
      relatedEntityType: opts.entityType,
      relatedEntityId: opts.entityId,
    });
    await opts.onQueued();
    return { ok: true, notificationId: row.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to queue email" };
  }
}

export async function provisionWorkerApplication(params: {
  applicationId: string;
  reviewerUserId: string;
}): Promise<ProvisionResult> {
  const app = await prisma.workerApplication.findUnique({
    where: { id: params.applicationId },
  });
  if (!app) return { ok: false, error: "Application not found", code: "NOT_FOUND" };

  if (app.status === "APPROVED" && app.provisionedUserId) {
    return resendWorkerActivationInvite(app.id, app.provisionedUserId, app.email, app.firstName);
  }

  if (app.status === "APPROVED" && !app.provisionedUserId) {
    return { ok: false, error: "Application approved but not provisioned — contact support", code: "INVALID_STATE" };
  }

  if (app.status !== "SUBMITTED" && app.status !== "UNDER_REVIEW") {
    return { ok: false, error: `Cannot approve application in status ${app.status}`, code: "INVALID_STATE" };
  }

  const emailNorm = app.email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (existingUser) {
    return {
      ok: false,
      error: `An account already exists for ${app.email}. Link or reset manually.`,
      code: "CONFLICT",
    };
  }

  const role: UserRole =
    app.applicationType === "SUBCONTRACTOR" ? "VENDOR_WORKER" : "INTERNAL_WORKER";

  const { userId, activationTokenId } = await prisma.$transaction(async (tx) => {
    const workforceAccountId = await resolveWorkforceAccountId(
      tx,
      app.applicationType,
      app.companyName,
      app.firstName,
      app.lastName,
      app.email,
      app.phone
    );

    const newUser = await tx.user.create({
      data: {
        email: emailNorm,
        passwordHash: generateUnusablePasswordHash(),
        role,
        name: `${app.firstName} ${app.lastName}`,
        phone: app.phone,
        workforceAccountId,
      },
    });

    await tx.worker.create({
      data: {
        userId: newUser.id,
        workforceAccountId,
        availabilityNotes: `Available: ${app.availableDays.join(", ")} | Shift: ${app.availableShift ?? "flexible"}`,
      },
    });

    const { tokenId } = await issueActivationTokenInTransaction(tx, newUser.id);

    await tx.workerApplication.update({
      where: { id: app.id },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedById: params.reviewerUserId,
        provisionedUserId: newUser.id,
        activationInviteStatus: "PENDING",
      },
    });

    return { userId: newUser.id, activationTokenId: tokenId };
  });

  const queued = await queueActivationEmail({
    entityType: "WorkerApplication",
    entityId: app.id,
    recipientEmail: emailNorm,
    templateKey: "application_approved",
    payload: { name: app.firstName, activationTokenId, userId },
    onQueued: async () => {
      await prisma.workerApplication.update({
        where: { id: app.id },
        data: { activationInviteStatus: "QUEUED" },
      });
    },
  });

  if (!queued.ok) {
    await prisma.workerApplication.update({
      where: { id: app.id },
      data: { activationInviteStatus: "FAILED" },
    });
    return {
      ok: false,
      error: `Account created but activation email failed to queue: ${queued.error}. Use Resend activation from admin.`,
      code: "QUEUE_FAILED",
    };
  }

  return {
    ok: true,
    userId,
    alreadyProvisioned: false,
    activationTokenId,
    emailNotificationId: queued.notificationId,
    activationInviteStatus: "QUEUED",
  };
}

export async function provisionClientSignup(params: {
  signupId: string;
  reviewerUserId: string;
}): Promise<ProvisionResult> {
  const signup = await prisma.clientSignupRequest.findUnique({
    where: { id: params.signupId },
  });
  if (!signup) return { ok: false, error: "Not found", code: "NOT_FOUND" };

  if (signup.status === "APPROVED" && signup.provisionedUserId) {
    return resendClientActivationInvite(
      signup.id,
      signup.provisionedUserId,
      signup.contactEmail,
      signup.contactName,
      signup.companyName
    );
  }

  if (signup.status !== "SUBMITTED" && signup.status !== "UNDER_REVIEW") {
    return { ok: false, error: `Cannot approve signup in status ${signup.status}`, code: "INVALID_STATE" };
  }

  const emailNorm = signup.contactEmail.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (existingUser) {
    return { ok: false, error: `An account already exists for ${signup.contactEmail}.`, code: "CONFLICT" };
  }

  const { userId, activationTokenId } = await prisma.$transaction(async (tx) => {
    const org = await tx.clientOrganization.create({
      data: {
        name: signup.companyName,
        primaryContactName: signup.contactName,
        primaryContactEmail: signup.contactEmail,
        primaryContactPhone: signup.contactPhone,
      },
    });

    const newUser = await tx.user.create({
      data: {
        email: emailNorm,
        passwordHash: generateUnusablePasswordHash(),
        role: "CLIENT",
        name: signup.contactName,
        phone: signup.contactPhone,
        clientOrganizationId: org.id,
      },
    });

    const { tokenId } = await issueActivationTokenInTransaction(tx, newUser.id);

    await tx.clientSignupRequest.update({
      where: { id: signup.id },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedById: params.reviewerUserId,
        provisionedUserId: newUser.id,
        provisionedOrganizationId: org.id,
        activationInviteStatus: "PENDING",
      },
    });

    return { userId: newUser.id, activationTokenId: tokenId };
  });

  const queued = await queueActivationEmail({
    entityType: "ClientSignupRequest",
    entityId: signup.id,
    recipientEmail: emailNorm,
    templateKey: "client_approved",
    payload: {
      name: signup.contactName,
      companyName: signup.companyName,
      activationTokenId,
      userId,
    },
    onQueued: async () => {
      await prisma.clientSignupRequest.update({
        where: { id: signup.id },
        data: { activationInviteStatus: "QUEUED" },
      });
    },
  });

  if (!queued.ok) {
    await prisma.clientSignupRequest.update({
      where: { id: signup.id },
      data: { activationInviteStatus: "FAILED" },
    });
    return {
      ok: false,
      error: `Account created but activation email failed to queue: ${queued.error}. Use Resend activation from admin.`,
      code: "QUEUE_FAILED",
    };
  }

  return {
    ok: true,
    userId,
    alreadyProvisioned: false,
    activationTokenId,
    emailNotificationId: queued.notificationId,
    activationInviteStatus: "QUEUED",
  };
}

async function resendWorkerActivationInvite(
  applicationId: string,
  userId: string,
  email: string,
  firstName: string
): Promise<ProvisionResult> {
  const { tokenId } = await createAccountActivationToken(userId);
  const queued = await queueActivationEmail({
    entityType: "WorkerApplication",
    entityId: applicationId,
    recipientEmail: email.trim().toLowerCase(),
    templateKey: "application_approved",
    payload: { name: firstName, activationTokenId: tokenId, userId },
    onQueued: async () => {
      await prisma.workerApplication.update({
        where: { id: applicationId },
        data: { activationInviteStatus: "QUEUED" },
      });
    },
  });
  if (!queued.ok) {
    await prisma.workerApplication.update({
      where: { id: applicationId },
      data: { activationInviteStatus: "FAILED" },
    });
    return { ok: false, error: queued.error, code: "QUEUE_FAILED" };
  }
  return {
    ok: true,
    userId,
    alreadyProvisioned: true,
    activationTokenId: tokenId,
    emailNotificationId: queued.notificationId,
    activationInviteStatus: "QUEUED",
    warning: "Account already provisioned; activation email re-queued.",
  };
}

async function resendClientActivationInvite(
  signupId: string,
  userId: string,
  email: string,
  contactName: string,
  companyName: string
): Promise<ProvisionResult> {
  const { tokenId } = await createAccountActivationToken(userId);
  const queued = await queueActivationEmail({
    entityType: "ClientSignupRequest",
    entityId: signupId,
    recipientEmail: email.trim().toLowerCase(),
    templateKey: "client_approved",
    payload: { name: contactName, companyName, activationTokenId: tokenId, userId },
    onQueued: async () => {
      await prisma.clientSignupRequest.update({
        where: { id: signupId },
        data: { activationInviteStatus: "QUEUED" },
      });
    },
  });
  if (!queued.ok) {
    await prisma.clientSignupRequest.update({
      where: { id: signupId },
      data: { activationInviteStatus: "FAILED" },
    });
    return { ok: false, error: queued.error, code: "QUEUE_FAILED" };
  }
  return {
    ok: true,
    userId,
    alreadyProvisioned: true,
    activationTokenId: tokenId,
    emailNotificationId: queued.notificationId,
    activationInviteStatus: "QUEUED",
    warning: "Account already provisioned; activation email re-queued.",
  };
}

export async function resendWorkerActivationEmail(applicationId: string) {
  const app = await prisma.workerApplication.findUnique({ where: { id: applicationId } });
  if (!app?.provisionedUserId) {
    return { ok: false as const, error: "Application not provisioned" };
  }
  return resendWorkerActivationInvite(app.id, app.provisionedUserId, app.email, app.firstName);
}

export async function resendClientActivationEmail(signupId: string) {
  const signup = await prisma.clientSignupRequest.findUnique({ where: { id: signupId } });
  if (!signup?.provisionedUserId) {
    return { ok: false as const, error: "Signup not provisioned" };
  }
  return resendClientActivationInvite(
    signup.id,
    signup.provisionedUserId,
    signup.contactEmail,
    signup.contactName,
    signup.companyName
  );
}

export async function markActivationInviteSent(entityType: string, entityId: string) {
  if (entityType === "WorkerApplication") {
    await prisma.workerApplication.update({
      where: { id: entityId },
      data: { activationInviteStatus: "SENT" },
    });
  } else if (entityType === "ClientSignupRequest") {
    await prisma.clientSignupRequest.update({
      where: { id: entityId },
      data: { activationInviteStatus: "SENT" },
    });
  }
}

export async function markActivationInviteFailed(entityType: string, entityId: string) {
  if (entityType === "WorkerApplication") {
    await prisma.workerApplication.update({
      where: { id: entityId },
      data: { activationInviteStatus: "FAILED" },
    });
  } else if (entityType === "ClientSignupRequest") {
    await prisma.clientSignupRequest.update({
      where: { id: entityId },
      data: { activationInviteStatus: "FAILED" },
    });
  }
}
