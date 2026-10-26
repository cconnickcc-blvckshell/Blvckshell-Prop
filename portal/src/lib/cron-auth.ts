import { NextRequest } from "next/server";

export type CronAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

/**
 * Cron endpoints fail closed when CRON_SECRET is missing or wrong.
 * Set CRON_SECRET in all deployed environments (including preview if cron runs there).
 */
export function verifyCronRequest(req: NextRequest): CronAuthResult {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return {
      ok: false,
      status: 503,
      error: "CRON_SECRET is not configured; notification processor disabled",
    };
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return { ok: true };
}

/** True when email can be sent via SendGrid. */
export function isEmailProviderConfigured(): boolean {
  return Boolean(process.env.SENDGRID_API_KEY?.trim());
}

/** True when SMS can be sent via Twilio. */
export function isSmsProviderConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_FROM_NUMBER?.trim()
  );
}
