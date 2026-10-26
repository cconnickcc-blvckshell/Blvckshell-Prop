import crypto from "crypto";
import * as bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Tx = Prisma.TransactionClient;

const ACTIVATION_TTL_HOURS = 72;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Authoritative public portal origin for activation links. */
export function getPortalBaseUrl(): string {
  const url =
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.PORTAL_PUBLIC_URL?.trim() ||
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");
  if (!url) {
    throw new Error("NEXTAUTH_URL (or PORTAL_PUBLIC_URL) must be set for activation links");
  }
  return url.replace(/\/$/, "");
}

export function buildActivationUrl(plainToken: string): string {
  return `${getPortalBaseUrl()}/activate-account?token=${encodeURIComponent(plainToken)}`;
}

/** Placeholder password until activation completes. */
export function generateUnusablePasswordHash(): string {
  return bcrypt.hashSync(crypto.randomBytes(32).toString("hex"), 10);
}

export type CreatedActivationToken = {
  tokenId: string;
  /** For email processor only — do not log or return to browsers. */
  plainToken: string;
};

export async function issueActivationTokenInTransaction(
  tx: Tx,
  userId: string
): Promise<CreatedActivationToken> {
  const plain = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(plain);
  const expiresAt = new Date(Date.now() + ACTIVATION_TTL_HOURS * 60 * 60 * 1000);

  await tx.accountActivationToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date(), deliveryTokenPlain: null },
  });

  const record = await tx.accountActivationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      deliveryTokenPlain: plain,
    },
  });

  return { tokenId: record.id, plainToken: plain };
}

/** Issue a new activation token; invalidates prior unused tokens for the user. */
export async function createAccountActivationToken(
  userId: string
): Promise<CreatedActivationToken> {
  return prisma.$transaction((tx) => issueActivationTokenInTransaction(tx, userId));
}

/** Resolve URL at send time; clears delivery secret from DB after read. */
export async function consumeDeliveryTokenForEmail(
  activationTokenId: string
): Promise<string | null> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.accountActivationToken.findUnique({
      where: { id: activationTokenId },
    });
    if (!row || row.usedAt || row.expiresAt < new Date() || !row.deliveryTokenPlain) {
      return null;
    }
    const plain = row.deliveryTokenPlain;
    await tx.accountActivationToken.update({
      where: { id: row.id },
      data: { deliveryTokenPlain: null },
    });
    return buildActivationUrl(plain);
  });
}

export async function activateAccountWithToken(
  plainToken: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!plainToken || newPassword.length < 10) {
    return { ok: false, error: "Invalid token or password too short (min 10 characters)." };
  }

  const tokenHash = hashToken(plainToken);

  try {
    await prisma.$transaction(async (tx) => {
      const record = await tx.accountActivationToken.findUnique({
        where: { tokenHash },
      });
      if (!record) {
        throw new Error("INVALID");
      }
      if (record.usedAt) {
        throw new Error("USED");
      }
      if (record.expiresAt < new Date()) {
        throw new Error("EXPIRED");
      }

      const claimed = await tx.accountActivationToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: new Date(), deliveryTokenPlain: null },
      });
      if (claimed.count !== 1) {
        throw new Error("USED");
      }

      const passwordHash = bcrypt.hashSync(newPassword, 10);
      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      });

      await tx.accountActivationToken.updateMany({
        where: { userId: record.userId, usedAt: null },
        data: { usedAt: new Date(), deliveryTokenPlain: null },
      });
    });
    return { ok: true };
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    if (code === "EXPIRED") {
      return { ok: false, error: "Activation link has expired. Request a new invitation from BLVCKSHELL." };
    }
    if (code === "USED") {
      return { ok: false, error: "Activation link is invalid or already used." };
    }
    return { ok: false, error: "Activation link is invalid or already used." };
  }
}
