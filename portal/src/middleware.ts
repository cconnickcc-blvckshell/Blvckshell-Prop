import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

/**
 * Middleware: Rate limiting only.
 * Route protection is handled by layout/server guards (requireAdmin, requireWorker) to avoid
 * redirect loops caused by getToken() returning null in Edge after login.
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Rate limiting for sensitive endpoints
  if (pathname.startsWith("/api/auth") || pathname === "/api/lead" || pathname.startsWith("/api/evidence/upload")) {
    const ip = getClientIP(request);
    const limit = pathname.startsWith("/api/auth") ? 5 : 10; // 5 login attempts, 10 for lead/upload
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const result = checkRateLimit(ip, limit, windowMs);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/auth/:path*",
    "/api/lead",
    "/api/evidence/upload",
  ],
};
