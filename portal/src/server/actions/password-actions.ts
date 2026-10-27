"use server";

import { headers } from "next/headers";
import * as bcrypt from "bcryptjs";
import { requireAdmin, requireAuth } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { passwordSchema } from "@/lib/validations";
import { queueNotification } from "@/server/notifications/outbox";
import { checkRateLimit, clientAddressFromHeaders } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";
import {
  ADMIN_RESET_LINK_TTL_MS,
  INVITE_LINK_TTL_MS,
  RESET_LINK_TTL_MS,
  createRawResetToken,
  hashResetToken,
  isEmailDeliveryConfigured,
  isPublicPasswordResetEnabled,
} from "@/lib/password-link";

const PUBLIC_RESET_UNAVAILABLE =
  "Password reset by email is unavailable. Contact an admin.";

const GENERIC_RESET =
  "If an account exists for that email, a one-time set-password link is on its way. Your current password is unchanged.";

function portalUrl(): string {
  return process.env.NEXTAUTH_URL ?? "https://www.blvckshell.com";
}

function clientIp(): string {
  const headerList = headers();
  return clientAddressFromHeaders(headerList.get("x-forwarded-for"), headerList.get("x-real-ip"));
}

async function invalidateUnusedLinks(userId: string): Promise<void> {
  await prisma.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });
}

/**
 * Create a hashed one-time link and queue an email. Does not change passwordHash.
 * The raw token is not returned to the caller. Nothing is queued when email delivery is off.
 */
async function queueSetPasswordLink(input: {
  userId: string;
  email: string;
  name: string;
  phone?: string | null;
  purpose: "INVITE" | "RESET";
  templateKey: "account_invite" | "password_reset" | "application_approved" | "client_approved";
  ttlMs: number;
  extraPayload?: Record<string, unknown>;
}): Promise<boolean> {
  if (!isEmailDeliveryConfigured()) return false;

  const rawToken = createRawResetToken();
  const expiresAt = new Date(Date.now() + input.ttlMs);
  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.updateMany({
      where: { userId: input.userId, usedAt: null },
      data: { usedAt: new Date() },
    });
    await tx.passwordResetToken.create({
      data: {
        userId: input.userId,
        tokenHash: hashResetToken(rawToken),
        purpose: input.purpose,
        expiresAt,
      },
    });
  });

  const setPasswordUrl = `${portalUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
  const emailPayload = {
    name: input.name,
    portalUrl: portalUrl(),
    setPasswordUrl,
    expiresAt: expiresAt.toISOString(),
    ...(input.extraPayload ?? {}),
  };

  try {
    await queueNotification({
      channel: "EMAIL",
      templateKey: input.templateKey,
      recipient: input.email,
      payload: emailPayload,
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
    logError(error, { where: "password-link-email", entityType: "User", entityId: input.userId });
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
  if (!isEmailDeliveryConfigured()) {
    return {
      ok: false as const,
      error: "Email delivery is not configured, so no reset link was sent. The password was not changed.",
    };
  }

  const sent = await queueSetPasswordLink({
    userId: account.id,
    email: account.email,
    name: account.name,
    phone: account.phone,
    purpose: "RESET",
    templateKey: "password_reset",
    ttlMs: ADMIN_RESET_LINK_TTL_MS,
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      entityType: "User",
      entityId: account.id,
      fromState: null,
      toState: "PASSWORD_RESET_LINK",
      metadata: { action: "password_reset_link", emailQueued: sent },
    },
  });

  if (!sent) {
    return { ok: false as const, error: "Could not queue the reset link. The password was not changed." };
  }
  return {
    ok: true as const,
    message: `A one-time set-password link was queued for ${account.email}. Their current password is unchanged until they use the link.`,
  };
}

export async function requestPasswordReset(email: string) {
  if (!isPublicPasswordResetEnabled()) {
    return { ok: false as const, unavailable: true as const, message: PUBLIC_RESET_UNAVAILABLE };
  }

  const limit = await checkRateLimit(`pwreset:${clientIp()}`, 5, 15 * 60 * 1000);
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
    await queueSetPasswordLink({
      userId: account.id,
      email: account.email,
      name: account.name,
      phone: account.phone,
      purpose: "RESET",
      templateKey: "password_reset",
      ttlMs: RESET_LINK_TTL_MS,
    });
  }

  return { ok: true as const, message: GENERIC_RESET };
}

export async function completePasswordReset(token: string, nextPassword: string) {
  const limit = await checkRateLimit(`pwset:${clientIp()}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) {
    return { ok: false as const, error: "Too many attempts. Wait a few minutes and try again." };
  }

  const parsed = passwordSchema.safeParse(nextPassword);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues.map((issue) => issue.message).join(". ") };
  }

  const raw = token.trim();
  if (raw.length < 20) {
    return { ok: false as const, error: "This link is invalid or has expired." };
  }

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(raw) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) {
    return { ok: false as const, error: "This link is invalid or has expired." };
  }

  const passwordHash = bcrypt.hashSync(parsed.data, 10);
  const consumed = await prisma.$transaction(async (tx) => {
    const updated = await tx.passwordResetToken.updateMany({
      where: { id: row.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (updated.count !== 1) return false;
    await tx.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    });
    await tx.passwordResetToken.updateMany({
      where: { userId: row.userId, usedAt: null },
      data: { usedAt: new Date() },
    });
    return true;
  });
  if (!consumed) {
    return { ok: false as const, error: "This link is invalid or has expired." };
  }

  return { ok: true as const, message: "Password updated. You can sign in with it now." };
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
  try {
    await invalidateUnusedLinks(account.id);
  } catch (error) {
    logError(error, { where: "invalidate-reset-links", entityType: "User", entityId: account.id });
  }
  return { ok: true as const, message: "Password updated." };
}

export async function inviteUserWithSetPasswordLink(input: {
  userId: string;
  email: string;
  name: string;
  phone?: string | null;
  templateKey?: "account_invite" | "application_approved" | "client_approved";
  extraPayload?: Record<string, unknown>;
}): Promise<boolean> {
  await requireAdmin();
  return queueSetPasswordLink({
    ...input,
    purpose: "INVITE",
    templateKey: input.templateKey ?? "account_invite",
    ttlMs: INVITE_LINK_TTL_MS,
  });
}
