/**
 * Role gates that match the existing layouts.
 * ADMIN and FOUNDER share the admin shell. Worker roles share the worker shell.
 * VENDOR_OWNER is the only role that may open /vendor.
 */

const ADMIN_ROLES = new Set(["ADMIN", "FOUNDER"]);
const WORKER_ROLES = new Set(["INTERNAL_WORKER", "VENDOR_WORKER", "VENDOR_OWNER"]);
const KNOWN_ROLES = new Set([...ADMIN_ROLES, ...WORKER_ROLES, "CLIENT"]);

export type RouteAccess =
  | "public"
  | "admin"
  | "client"
  | "worker"
  | "vendor"
  | "account"
  | "session"
  | "api-session";

export type AccessDecision = "allow" | "login" | "home" | "unauthorized" | "forbidden";

export function routeAccess(pathname: string): RouteAccess {
  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/api/lead" ||
    pathname === "/api/health" ||
    pathname.startsWith("/api/applications") ||
    pathname === "/api/stripe/webhook" ||
    pathname === "/api/notifications/process"
  ) {
    return "public";
  }
  if (
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/reports") ||
    pathname.startsWith("/api/payouts")
  ) {
    return "admin";
  }
  if (pathname.startsWith("/api/worker")) return "worker";
  if (pathname.startsWith("/api/")) return "api-session";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/client")) return "client";
  if (pathname.startsWith("/vendor")) return "vendor";
  if (
    pathname === "/jobs" ||
    pathname.startsWith("/jobs/") ||
    pathname === "/schedule" ||
    pathname.startsWith("/schedule/") ||
    pathname === "/map" ||
    pathname.startsWith("/map/") ||
    pathname === "/earnings" ||
    pathname.startsWith("/earnings/") ||
    pathname === "/profile" ||
    pathname.startsWith("/profile/")
  ) {
    return "worker";
  }
  if (pathname === "/account" || pathname.startsWith("/account/")) return "account";
  if (pathname === "/portal" || pathname.startsWith("/portal/")) return "session";
  return "public";
}

function roleFits(access: RouteAccess, role: string, clientOrganizationId?: string): boolean {
  if (!KNOWN_ROLES.has(role)) return false;
  switch (access) {
    case "public":
      return true;
    case "admin":
      return ADMIN_ROLES.has(role);
    case "client":
      return role === "CLIENT" && Boolean(clientOrganizationId);
    case "worker":
      return WORKER_ROLES.has(role);
    case "vendor":
      return role === "VENDOR_OWNER";
    case "account":
    case "session":
    case "api-session":
      return true;
    default:
      return false;
  }
}

export function authorizationDecision(input: {
  pathname: string;
  role?: string;
  clientOrganizationId?: string;
}): AccessDecision {
  const access = routeAccess(input.pathname);
  if (access === "public") return "allow";

  const api = input.pathname.startsWith("/api/");
  if (!input.role) return api ? "unauthorized" : "login";
  if (roleFits(access, input.role, input.clientOrganizationId)) return "allow";
  return api ? "forbidden" : "home";
}
