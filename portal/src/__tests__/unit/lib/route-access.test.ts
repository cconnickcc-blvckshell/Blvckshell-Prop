import { describe, expect, it } from "vitest";
import { authorizationDecision, routeAccess } from "@/lib/route-access";

const ROLES = ["ADMIN", "FOUNDER", "CLIENT", "INTERNAL_WORKER", "VENDOR_WORKER", "VENDOR_OWNER"] as const;

describe("route access", () => {
  it("leaves marketing and auth endpoints public", () => {
    expect(routeAccess("/")).toBe("public");
    expect(routeAccess("/contact")).toBe("public");
    expect(routeAccess("/api/auth/login")).toBe("public");
    expect(routeAccess("/api/stripe/webhook")).toBe("public");
    expect(routeAccess("/api/lead")).toBe("public");
  });

  it("sends anonymous visitors to login or 401", () => {
    expect(authorizationDecision({ pathname: "/admin/jobs" })).toBe("login");
    expect(authorizationDecision({ pathname: "/jobs" })).toBe("login");
    expect(authorizationDecision({ pathname: "/api/jobs/abc/evidence" })).toBe("unauthorized");
  });

  it("matches each role to its shell", () => {
    const pages: Record<(typeof ROLES)[number], { allow: string; deny: string }> = {
      ADMIN: { allow: "/admin/jobs", deny: "/client" },
      FOUNDER: { allow: "/admin/payouts", deny: "/vendor/jobs" },
      CLIENT: { allow: "/client/invoices", deny: "/admin" },
      INTERNAL_WORKER: { allow: "/jobs", deny: "/admin" },
      VENDOR_WORKER: { allow: "/schedule", deny: "/vendor/team" },
      VENDOR_OWNER: { allow: "/vendor/jobs", deny: "/admin/jobs" },
    };

    for (const role of ROLES) {
      const org = role === "CLIENT" ? "org-1" : undefined;
      expect(authorizationDecision({ pathname: pages[role].allow, role, clientOrganizationId: org })).toBe("allow");
      expect(authorizationDecision({ pathname: pages[role].deny, role, clientOrganizationId: org })).toBe("home");
    }

    expect(authorizationDecision({ pathname: "/client", role: "CLIENT" })).toBe("home");
    expect(authorizationDecision({ pathname: "/jobs", role: "VENDOR_OWNER" })).toBe("allow");
    expect(authorizationDecision({ pathname: "/account/password", role: "CLIENT", clientOrganizationId: "org-1" })).toBe(
      "allow",
    );
    expect(authorizationDecision({ pathname: "/api/admin/export/jobs", role: "FOUNDER" })).toBe("allow");
    expect(authorizationDecision({ pathname: "/api/admin/export/jobs", role: "CLIENT", clientOrganizationId: "org-1" })).toBe(
      "forbidden",
    );
    expect(authorizationDecision({ pathname: "/api/payouts/batch/x/statement", role: "ADMIN" })).toBe("allow");
    expect(authorizationDecision({ pathname: "/api/worker/profile", role: "INTERNAL_WORKER" })).toBe("allow");
    expect(authorizationDecision({ pathname: "/api/worker/profile", role: "ADMIN" })).toBe("forbidden");
  });
});
