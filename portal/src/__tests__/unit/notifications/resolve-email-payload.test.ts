import { describe, it, expect, vi } from "vitest";
import { resolveEmailPayloadForSend } from "@/server/notifications/resolve-email-payload";

vi.mock("@/lib/account-activation", () => ({
  consumeDeliveryTokenForEmail: vi.fn(async (id: string) =>
    id === "tok-1" ? "https://portal.example/activate-account?token=secret" : null
  ),
}));

describe("resolveEmailPayloadForSend", () => {
  it("strips activationTokenId from outbox-facing send payload", async () => {
    const result = await resolveEmailPayloadForSend("application_approved", {
      name: "Alex",
      activationTokenId: "tok-1",
      userId: "user-1",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.activationUrl).toContain("activate-account");
    expect(result.payload).not.toHaveProperty("activationTokenId");
    expect(result.payload).not.toHaveProperty("userId");
  });

  it("fails when token cannot be resolved", async () => {
    const result = await resolveEmailPayloadForSend("client_approved", {
      activationTokenId: "missing",
    });
    expect(result.ok).toBe(false);
  });
});
