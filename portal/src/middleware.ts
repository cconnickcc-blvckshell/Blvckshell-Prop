import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { publicOriginFrom, safeInternalPath, sanitizeRequestUrl } from "@/lib/safe-redirect";
import { authorizationDecision, routeAccess } from "@/lib/route-access";

/**
 * Credential query stripping, login rate limits, and role gates.
 * Role checks read the JWT only. Database lookups stay in the Node layouts
 * so this file does not pull Prisma onto the edge runtime.
 */
export async function middleware(request: NextRequest) {
  const cleaned = request.nextUrl.clone();
  if (sanitizeRequestUrl(cleaned)) {
    const response = NextResponse.redirect(
      new URL(`${cleaned.pathname}${cleaned.search}`, publicOriginFrom(request)),
      303,
    );
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  }

  const pathname = request.nextUrl.pathname;
  const method = request.method;

  const isAuthPost =
    method === "POST" &&
    (pathname.startsWith("/api/auth/callback") ||
      pathname === "/api/auth/login" ||
      pathname === "/api/auth/forgot-password" ||
      pathname === "/api/auth/reset-password");
  const isLeadPost = method === "POST" && pathname === "/api/lead";
  const isApplicationPost =
    method === "POST" &&
    (pathname === "/api/applications/client" || pathname === "/api/applications/worker");
  const isEvidenceUpload = pathname.startsWith("/api/evidence/upload");

  if (isAuthPost || isLeadPost || isApplicationPost || isEvidenceUpload) {
    const ip = getClientIP(request);
    const limit = isAuthPost ? 10 : 30;
    const windowMs = 15 * 60 * 1000;
    const result = await checkRateLimit(ip, limit, windowMs);

    if (!result.allowed) {
      if (isAuthPost) {
        const loginUrl = new URL("/login", publicOriginFrom(request));
        loginUrl.searchParams.set("error", "RateLimit");
        const response = NextResponse.redirect(loginUrl, 303);
        response.headers.set("Cache-Control", "no-store");
        return response;
      }

      return NextResponse.json(
        { error: "Too many requests. Please wait a few minutes and try again." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          },
        },
      );
    }
  }

  if (routeAccess(pathname) !== "public") {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: publicOriginFrom(request).startsWith("https:"),
    });
    const decision = authorizationDecision({
      pathname,
      role: typeof token?.role === "string" ? token.role : undefined,
      clientOrganizationId:
        typeof token?.clientOrganizationId === "string" ? token.clientOrganizationId : undefined,
    });

    if (decision === "login") {
      const loginUrl = new URL("/login", publicOriginFrom(request));
      loginUrl.searchParams.set(
        "callbackUrl",
        safeInternalPath(`${pathname}${request.nextUrl.search}`, "/portal"),
      );
      const response = NextResponse.redirect(loginUrl, 303);
      response.headers.set("Cache-Control", "no-store");
      return response;
    }
    if (decision === "home") {
      return NextResponse.redirect(new URL("/", publicOriginFrom(request)), 303);
    }
    if (decision === "unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (decision === "forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml|webmanifest|woff2?)$).*)",
  ],
};
