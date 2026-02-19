import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

/**
 * Middleware: Route protection + rate limiting
 * Defense-in-depth: Even if a layout/route is misconfigured, middleware blocks unauthorized access.
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

  // Public routes: marketing, login, API auth, health check
  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/api/health" ||
    pathname === "/login" ||
    pathname.startsWith("/(marketing)") ||
    (!pathname.startsWith("/admin") &&
      !pathname.startsWith("/jobs") &&
      !pathname.startsWith("/profile") &&
      !pathname.startsWith("/earnings") &&
      !pathname.startsWith("/vendor") &&
      pathname !== "/portal")
  ) {
    return NextResponse.next();
  }

  // Protected routes: require authentication
  const session = await auth();

  // Admin routes: require ADMIN role
  if (pathname.startsWith("/admin")) {
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Worker routes: require worker role (VENDOR_WORKER, INTERNAL_WORKER, or VENDOR_OWNER)
  if (
    pathname.startsWith("/jobs") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/earnings") ||
    pathname.startsWith("/vendor")
  ) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const role = session.user.role;
    if (
      role !== "VENDOR_WORKER" &&
      role !== "INTERNAL_WORKER" &&
      role !== "VENDOR_OWNER"
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Portal entry: redirect by role
  if (pathname === "/portal") {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const role = session.user.role;
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (
      role === "VENDOR_WORKER" ||
      role === "INTERNAL_WORKER" ||
      role === "VENDOR_OWNER"
    ) {
      return NextResponse.redirect(new URL("/jobs", request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/jobs/:path*",
    "/profile/:path*",
    "/earnings/:path*",
    "/vendor/:path*",
    "/portal",
  ],
};
