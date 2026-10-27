import { describe, expect, it } from "vitest";
import {
  assertNoPasswordInPayload,
  hashResetToken,
  isEmailDeliveryConfigured,
  isPublicPasswordResetEnabled,
} from "@/lib/password-link";

describe("public password reset gate", () => {
  it("stays closed when the flag is missing", () => {
    expect(isPublicPasswordResetEnabled({ SENDGRID_API_KEY: "sg-key" })).toBe(false);
  });

  it("stays closed when email delivery is not configured", () => {
    expect(
      isPublicPasswordResetEnabled({
        ALLOW_PUBLIC_PASSWORD_RESET: "true",
        SENDGRID_API_KEY: "  ",
      }),
    ).toBe(false);
  });

  it("opens only when the flag is exactly true and SendGrid is configured", () => {
    expect(isEmailDeliveryConfigured({ SENDGRID_API_KEY: "sg-key" })).toBe(true);
    expect(
      isPublicPasswordResetEnabled({
        ALLOW_PUBLIC_PASSWORD_RESET: "true",
        SENDGRID_API_KEY: "sg-key",
      }),
    ).toBe(true);
    expect(
      isPublicPasswordResetEnabled({
        ALLOW_PUBLIC_PASSWORD_RESET: "yes",
        SENDGRID_API_KEY: "sg-key",
      }),
    ).toBe(false);
  });
});

describe("reset token hash", () => {
  it("stores a digest, not the raw token", () => {
    const hash = hashResetToken("raw-token-value");
    expect(hash).not.toContain("raw-token-value");
    expect(hash).toBe(hashResetToken("raw-token-value"));
    expect(hashResetToken("other-token")).not.toBe(hash);
  });
});

describe("notification payload guard", () => {
  it("rejects plaintext password fields", () => {
    expect(() => assertNoPasswordInPayload({ tempPassword: "secret" })).toThrow(/password/i);
    expect(() => assertNoPasswordInPayload({ passwordHash: "hash" })).toThrow(/password/i);
  });

  it("allows a set-password link", () => {
    expect(() =>
      assertNoPasswordInPayload({
        name: "Chris",
        setPasswordUrl: "https://www.blvckshell.com/reset-password?token=abc",
      }),
    ).not.toThrow();
  });
});
