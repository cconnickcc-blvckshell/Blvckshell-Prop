import { describe, expect, it } from "vitest";
import {
  changePasswordPageState,
  forgotPageState,
  loginPageState,
  parseInternalPath,
  publicOriginFrom,
  resetPageState,
  safeInternalPath,
  safeRedirectTarget,
  sanitizeRequestUrl,
  urlHasCredential,
} from "@/lib/safe-redirect";

const ORIGIN = "http://localhost:3000";

describe("parseInternalPath", () => {
  it("allows same-site paths", () => {
    expect(parseInternalPath("/admin/jobs")).toBe("/admin/jobs");
    expect(parseInternalPath("/portal")).toBe("/portal");
    expect(parseInternalPath("/jobs?date=2026-01-01")).toBe("/jobs?date=2026-01-01");
  });

  it("rejects absolute, protocol-relative, and backslash targets", () => {
    expect(parseInternalPath("//evil.com")).toBeNull();
    expect(parseInternalPath("https://evil.com")).toBeNull();
    expect(parseInternalPath("/\\evil.com")).toBeNull();
    expect(parseInternalPath("/%2f%2fevil.com")).toBeNull();
    expect(parseInternalPath("/%252F%252Fevil.com")).toBeNull();
    expect(parseInternalPath("/\\t/evil.com")).toBeNull();
    expect(parseInternalPath("/@evil.com")).toBeNull();
    expect(parseInternalPath("javascript:alert(1)")).toBeNull();
  });

  it("strips credential query keys and keeps the path", () => {
    expect(parseInternalPath("/login?password=secret&error=CredentialsSignin")).toBe(
      "/login?error=CredentialsSignin",
    );
    expect(parseInternalPath("/admin/jobs?nextPassword=hunter2&tab=open")).toBe("/admin/jobs?tab=open");
    expect(urlHasCredential("/login?email=a@b.co&password=secret")).toBe(true);
    expect(urlHasCredential("/portal")).toBe(false);
  });

  it("falls back when the value is not a path", () => {
    expect(safeInternalPath("https://evil.example/phish", "/portal")).toBe("/portal");
    expect(safeInternalPath("//evil.example", "/jobs")).toBe("/jobs");
  });
});

describe("safeRedirectTarget", () => {
  it("keeps same-origin paths and drops everything else", () => {
    expect(safeRedirectTarget("/jobs", ORIGIN)).toBe("/jobs");
    expect(safeRedirectTarget(`${ORIGIN}/admin/jobs`, ORIGIN)).toBe("/admin/jobs");
    expect(safeRedirectTarget("https://evil.example", ORIGIN)).toBe("/portal");
    expect(safeRedirectTarget("//evil.example", ORIGIN)).toBe("/portal");
    expect(safeRedirectTarget(`${ORIGIN}/login?password=secret&error=CredentialsSignin`, ORIGIN)).toBe(
      "/login?error=CredentialsSignin",
    );
  });
});

describe("auth page query cleanup", () => {
  it("cleans login once and then stays clean", () => {
    const url = new URL("http://localhost:3000/login?email=a@b.co&password=secret&callbackUrl=https://evil.example");
    expect(sanitizeRequestUrl(url)).toBe(true);
    expect(url.pathname + url.search).toBe("/login");
    expect(url.search).not.toContain("secret");
    expect(url.search).not.toContain("email");
    expect(sanitizeRequestUrl(url)).toBe(false);
  });

  it("preserves an internal callback and an allowlisted error", () => {
    const state = loginPageState({
      error: "CredentialsSignin",
      callbackUrl: "/jobs",
      password: "secret",
    });
    expect(state.changed).toBe(true);
    expect(state.href).toBe("/login?error=CredentialsSignin&callbackUrl=%2Fjobs");
    expect(state.callbackUrl).toBe("/jobs");
    expect(state.href).not.toContain("secret");
    const again = loginPageState({ error: "CredentialsSignin", callbackUrl: "/jobs" });
    expect(again.changed).toBe(false);
  });

  it("drops unknown login errors instead of rendering them", () => {
    const state = loginPageState({ error: "<script>" });
    expect(state.changed).toBe(true);
    expect(state.error).toBeNull();
    expect(state.href).toBe("/login");
  });

  it("uses the Host header instead of the bind address", () => {
    const headers = new Headers({ host: "localhost:3000" });
    expect(
      publicOriginFrom({ url: "http://0.0.0.0:3000/api/auth/login", headers }),
    ).toBe("http://localhost:3000");
    expect(
      publicOriginFrom({
        url: "http://0.0.0.0:3000/login",
        headers: new Headers({ host: "0.0.0.0:3000" }),
      }),
    ).toBe("http://localhost:3000");
  });

  it("keeps forgot and reset status codes without the submitted secret", () => {
    const forgot = forgotPageState({ status: "sent", email: "a@b.co", password: "secret" });
    expect(forgot.href).toBe("/forgot-password?status=sent");
    expect(forgot.href).not.toContain("secret");
    expect(forgot.href).not.toContain("a@b.co");

    const token = "abcdefghijklmnopqrstuvwxyz012345";
    const reset = resetPageState({ token, error: "mismatch", password: "secret" });
    expect(reset.token).toBe(token);
    expect(reset.error).toBe("mismatch");
    expect(reset.href).not.toContain("secret");

    const change = changePasswordPageState({ updated: "1", currentPassword: "secret" });
    expect(change.href).toBe("/account/password?updated=1");
    expect(change.updated).toBe(true);
  });
});
