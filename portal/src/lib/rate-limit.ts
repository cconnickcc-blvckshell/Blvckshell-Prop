/**
 * Rate limiting with optional Upstash Redis backend.
 * Falls back to in-memory if UPSTASH_REDIS_REST_URL is not set.
 */

const memStore = new Map<string, { count: number; resetAt: number }>();

async function checkRedisRateLimit(
  ip: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return checkMemoryRateLimit(ip, limit, windowMs);
  }

  try {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({ url, token });

    const key = `rl:${ip}`;
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.pexpire(key, windowMs);
    }

    const ttl = await redis.pttl(key);
    const resetAt = Date.now() + (ttl > 0 ? ttl : windowMs);

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetAt,
    };
  } catch {
    return checkMemoryRateLimit(ip, limit, windowMs);
  }
}

function checkMemoryRateLimit(
  ip: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();

  if (memStore.size > 10000) {
    for (const [key, entry] of memStore.entries()) {
      if (entry.resetAt < now) memStore.delete(key);
    }
  }

  const entry = memStore.get(ip);

  if (!entry || entry.resetAt < now) {
    memStore.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

export const checkRateLimit = checkRedisRateLimit;

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIP = request.headers.get("x-real-ip");
  if (realIP) return realIP;
  return "unknown";
}
