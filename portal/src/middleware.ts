import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/api/lead" ||
    pathname.startsWith("/api/evidence/upload")
  ) {
    const ip = getClientIP(request);
    const limit = pathname.startsWith("/api/auth") ? 20 : 30;
    const windowMs = 15 * 60 * 1000;
    const result = checkRateLimit(ip, limit, windowMs);

    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a few minutes and try again." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", String(limit));
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    response.headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/:path*", "/api/lead", "/api/evidence/upload"],
};
