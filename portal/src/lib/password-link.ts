import { createHash, randomBytes } from "crypto";
import { hashSync } from "bcryptjs";

export const RESET_LINK_TTL_MS = 60 * 60 * 1000;
export const ADMIN_RESET_LINK_TTL_MS = 24 * 60 * 60 * 1000;
export const INVITE_LINK_TTL_MS = 72 * 60 * 60 * 1000;

const PASSWORD_PAYLOAD_KEYS = new Set([
  "temppassword",
  "password",
  "passwordhash",
  "newpassword",
  "currentpassword",
]);

export function isEmailDeliveryConfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return Boolean(env.SENDGRID_API_KEY?.trim());
}

/**
 * Public forgot-password stays closed unless both the explicit flag and
 * real email delivery are set. Requesting a reset must not change a password.
 */
export function isPublicPasswordResetEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.ALLOW_PUBLIC_PASSWORD_RESET === "true" && isEmailDeliveryConfigured(env);
}

export function createRawResetToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Hash of random bytes. The raw value is never returned or stored. */
export function unusablePasswordHash(): string {
  return hashSync(randomBytes(32).toString("base64url"), 10);
}

export function assertNoPasswordInPayload(payload: Record<string, unknown>): void {
  for (const key of Object.keys(payload)) {
    if (PASSWORD_PAYLOAD_KEYS.has(key.toLowerCase())) {
      throw new Error("Refusing to store a password in the notification outbox.");
    }
  }
}
