import crypto from "crypto";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const ACTIVATION_TTL_HOURS = 72;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getPortalBaseUrl(): string {
  return (process.env.NEXTAUTH_URL ?? "https://www.blvckshell.com").replace(/\/$/, "");
}

/** Placeholder password until activation completes. */
export function generateUnusablePasswordHash(): string {
  return bcrypt.hashSync(crypto.randomBytes(32).toString("hex"), 10);
}

/**
 * Create a one-time activation link (plain token only in URL/email, hash stored).
 */
export async function createAccountActivationLink(userId: string): Promise<string> {
  const plain = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(plain);
  const expiresAt = new Date(Date.now() + ACTIVATION_TTL_HOURS * 60 * 60 * 1000);

  await prisma.accountActivationToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return `${getPortalBaseUrl()}/activate-account?token=${encodeURIComponent(plain)}`;
}

export async function activateAccountWithToken(
  plainToken: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!plainToken || newPassword.length < 10) {
    return { ok: false, error: "Invalid token or password too short (min 10 characters)." };
  }

  const tokenHash = hashToken(plainToken);
  const record = await prisma.accountActivationToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.usedAt) {
    return { ok: false, error: "Activation link is invalid or already used." };
  }
  if (record.expiresAt < new Date()) {
    return { ok: false, error: "Activation link has expired. Contact BLVCKSHELL for a new link." };
  }

  const passwordHash = bcrypt.hashSync(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.accountActivationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true };
}
