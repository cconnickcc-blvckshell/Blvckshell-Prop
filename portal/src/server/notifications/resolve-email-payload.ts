import { consumeDeliveryTokenForEmail } from "@/lib/account-activation";

const ACTIVATION_TEMPLATES = new Set(["application_approved", "client_approved"]);

/**
 * Builds send-time email payload. Activation URLs are resolved from token rows — never stored in outbox JSON.
 */
export async function resolveEmailPayloadForSend(
  templateKey: string,
  payload: Record<string, unknown>
): Promise<{ ok: true; payload: Record<string, unknown> } | { ok: false; error: string }> {
  if (!ACTIVATION_TEMPLATES.has(templateKey)) {
    return { ok: true, payload };
  }

  const activationTokenId = payload.activationTokenId;
  if (typeof activationTokenId !== "string" || !activationTokenId) {
    return { ok: false, error: "Missing activationTokenId in notification payload" };
  }

  const activationUrl = await consumeDeliveryTokenForEmail(activationTokenId);
  if (!activationUrl) {
    return { ok: false, error: "Activation token unavailable (expired, used, or already sent)" };
  }

  const { activationTokenId: _omit, userId: _u, ...rest } = payload;
  return { ok: true, payload: { ...rest, activationUrl } };
}
