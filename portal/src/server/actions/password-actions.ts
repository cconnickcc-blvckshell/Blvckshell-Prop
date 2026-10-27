"use server";

import { headers } from "next/headers";
import * as bcrypt from "bcryptjs";
import { requireAdmin, requireAuth } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { passwordSchema } from "@/lib/validations";
import { generateTempPassword } from "@/lib/temp-password";
import { queueNotification } from "@/server/actions/notification-actions";
import { checkRateLimit } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";

const GENERIC_RESET =
  "If an account exists for that email, a temporary password is on its way. It is not shown here.";

function portalUrl(): string {
  return process.env.NEXTAUTH_URL ?? "https://www.blvckshell.com";
}

async function emailTempPassword(input: {
  userId: string;
  email: string;
  name: string;
  templateKey: "account_invite" | "password_reset";
  phone?: string | null;
}): Promise<boolean> {
  const tempPassword = generateTempPassword();
  const passwordHash = bcrypt.hashSync(tempPassword, 10);
  await prisma.user.update({
    where: { id: input.userId },
    data: { passwordHash },
  });

  const payload = {
    name: input.name,
    tempPassword,
    portalUrl: portalUrl(),
  };

  try {
    await queueNotification({
      channel: "EMAIL",
      templateKey: input.templateKey,
      recipient: input.email,
      payload,
      relatedEntityType: "User",
      relatedEntityId: input.userId,
    });
    if (input.phone) {
      await queueNotification({
        channel: "SMS",
        templateKey: input.templateKey,
        recipient: input.phone,
        payload: { name: input.name, portalUrl: portalUrl() },
        relatedEntityType: "User",
        relatedEntityId: input.userId,
      });
    }
    return true;
  } catch (error) {
    logError(error, { where: "password-email", entityType: "User", entityId: input.userId });
    return false;
  }
}

export async function sendUserPasswordReset(userId: string) {
  const admin = await requireAdmin();
  const account = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, phone: true, isActive: true },
  });
  if (!account || !account.isActive) {
    return { ok: false as const, error: "User not found." };
  }

  const sent = await emailTempPassword({
    userId: account.id,
    email: account.email,
    name: account.name,
    phone: account.phone,
    templateKey: "password_reset",
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      entityType: "User",
      entityId: account.id,
      fromState: null,
      toState: "PASSWORD_RESET",
      metadata: { action: "password_reset", emailQueued: sent },
    },
  });

  if (!sent) {
    return { ok: false as const, error: "Could not queue the reset email. Try again." };
  }
  return { ok: true as const, message: `Reset email queued for ${account.email}. The password is not shown here.` };
}

export async function requestPasswordReset(email: string) {
  const headerList = headers();
  const forwarded = headerList.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";
  const limit = await checkRateLimit(`pwreset:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return { ok: true as const, message: GENERIC_RESET };
  }

  const normalized = email.trim().toLowerCase();
  const account = normalized
    ? await prisma.user.findUnique({
        where: { email: normalized },
        select: { id: true, email: true, name: true, phone: true, isActive: true },
      })
    : null;

  if (account?.isActive) {
    await emailTempPassword({
      userId: account.id,
      email: account.email,
      name: account.name,
      phone: account.phone,
      templateKey: "password_reset",
    });
  }

  return { ok: true as const, message: GENERIC_RESET };
}

export async function changeOwnPassword(currentPassword: string, nextPassword: string) {
  const session = await requireAuth();
  const parsed = passwordSchema.safeParse(nextPassword);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues.map((issue) => issue.message).join(". ") };
  }

  const account = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, passwordHash: true },
  });
  if (!account || !bcrypt.compareSync(currentPassword, account.passwordHash)) {
    return { ok: false as const, error: "Current password is incorrect." };
  }

  await prisma.user.update({
    where: { id: account.id },
    data: { passwordHash: bcrypt.hashSync(parsed.data, 10) },
  });
  return { ok: true as const, message: "Password updated." };
}

export async function inviteUserWithTempPassword(input: {
  userId: string;
  email: string;
  name: string;
  phone?: string | null;
}): Promise<boolean> {
  await requireAdmin();
  return emailTempPassword({ ...input, templateKey: "account_invite" });
}
