import { NextResponse } from "next/server";
import { safeInternalPath, safeRedirectTarget, urlHasCredential, LOGIN_ERROR_CODES } from "@/lib/safe-redirect";
import { logError } from "@/lib/logger";

export function seeOther(request: Request, path: string): NextResponse {
  const safePath =
    path.startsWith("/") && !path.startsWith("//") && !urlHasCredential(path)
      ? path
      : "/login?error=CredentialsSignin";
  const response = NextResponse.redirect(new URL(safePath, request.url), 303);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

/** Modern browsers send these on a form POST. Older no-JS clients may omit them. */
export function rejectCrossSite(request: Request): NextResponse | null {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return seeOther(request, "/login?error=method");
  }
  const origin = request.headers.get("origin");
  if (!origin) return null;
  try {
    if (new URL(origin).origin !== new URL(request.url).origin) {
      return seeOther(request, "/login?error=method");
    }
  } catch {
    return seeOther(request, "/login?error=method");
  }
  return null;
}

export function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

export function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
  );
}

/** Failure redirects keep an allowlisted error code and nothing else. */
export function loginResultPath(destination: unknown, requestOrigin: string, fallback: string): string {
  const target = safeRedirectTarget(
    typeof destination === "string" ? destination : fallback,
    requestOrigin,
    fallback,
  );
  if (urlHasCredential(target)) return "/login?error=CredentialsSignin";
  try {
    const url = new URL(target, requestOrigin);
    if (url.pathname !== "/login") return `${url.pathname}${url.search}`;
    const error = url.searchParams.get("error");
    if (error && LOGIN_ERROR_CODES.has(error)) return `/login?error=${error}`;
    return "/login?error=CredentialsSignin";
  } catch {
    return safeInternalPath(fallback, "/portal");
  }
}

export function logAuthFailure(where: string): void {
  logError("auth_failed", { where });
}
