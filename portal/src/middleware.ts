import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

/**
 * Middleware: Rate limiting for credential submission only.
 *
 * CRITICAL: Do NOT rate-limit NextAuth's internal GET routes:
 *   /api/auth/providers — fetched on every login page load
 *   /api/auth/csrf — fetched before every sign-in/sign-out
 *   /api/auth/session — fetched on every page for session check
 *   /api/auth/error — redirect target on auth failures
 *
 * Only rate-limit the actual login attempt (POST to /api/auth/callback).
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // Only rate-limit actual credential submissions (POST), not NextAuth internal GETs
  const isAuthPost =
    method === "POST" && pathname.startsWith("/api/auth/callback");
  const isLeadPost = method === "POST" && pathname === "/api/lead";
  const isEvidenceUpload = pathname.startsWith("/api/evidence/upload");

  if (isAuthPost || isLeadPost || isEvidenceUpload) {
    const ip = getClientIP(request);
    const limit = isAuthPost ? 10 : 30; // 10 login attempts, 30 for others
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const result = await checkRateLimit(ip, limit, windowMs);

    if (!result.allowed) {
      // For auth POST, redirect to login with error instead of raw JSON
      if (isAuthPost) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("error", "RateLimit");
        return NextResponse.redirect(loginUrl);
      }

      return NextResponse.json(
        { error: "Too many requests. Please wait a few minutes and try again." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/auth/callback/:path*",
    "/api/lead",
    "/api/evidence/upload",
  ],
};
