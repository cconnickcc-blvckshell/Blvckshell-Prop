import { NextRequest } from "next/server";

export type CronAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

/**
 * Cron endpoints fail closed when CRON_SECRET is missing or wrong.
 * Set CRON_SECRET in every deployed environment that runs the notification processor.
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
