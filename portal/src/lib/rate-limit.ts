/**
 * Stateless rate limiting for Vercel serverless.
 * Uses a simple sliding window with IP-based tracking.
 * NOTE: In serverless, in-memory state is per-instance and ephemeral.
 * This provides basic protection but is NOT a hard guarantee.
 * For production hardening, migrate to Upstash Redis.
 */

const store = new Map<string, { count: number; resetAt: number }>();

const MAX_STORE_SIZE = 10000;

function cleanup() {
  const now = Date.now();
  if (store.size > MAX_STORE_SIZE) {
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
    if (store.size > MAX_STORE_SIZE) {
      const entries = Array.from(store.entries());
      entries.sort((a, b) => a[1].resetAt - b[1].resetAt);
      for (let i = 0; i < entries.length / 2; i++) {
        store.delete(entries[i][0]);
      }
    }
  }
}

export function checkRateLimit(
  ip: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanup();
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || entry.resetAt < now) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIP = request.headers.get("x-real-ip");
  if (realIP) return realIP;
  return "unknown";
}
