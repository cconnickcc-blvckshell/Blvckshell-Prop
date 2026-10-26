import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export async function assertActivationRateLimit(): Promise<{ ok: true } | { ok: false; error: string }> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    "unknown";
  const result = await checkRateLimit(`activation:${ip}`, MAX_ATTEMPTS, WINDOW_MS);
  if (!result.allowed) {
    return { ok: false, error: "Too many activation attempts. Try again later." };
  }
  return { ok: true };
}
