import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { verifyCronRequest } from "@/lib/cron-auth";

describe("cron-auth", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it("fails closed when CRON_SECRET is missing", () => {
    delete process.env.CRON_SECRET;
    const req = new NextRequest("http://localhost/api/notifications/process", { method: "POST" });
    const result = verifyCronRequest(req);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(503);
  });

  it("fails closed when CRON_SECRET is blank", () => {
    process.env.CRON_SECRET = "   ";
    const req = new NextRequest("http://localhost/api/notifications/process", {
      method: "POST",
      headers: { authorization: "Bearer " },
    });
    const result = verifyCronRequest(req);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(503);
  });

  it("rejects a missing or wrong bearer token", () => {
    process.env.CRON_SECRET = "secret";
    const missing = new NextRequest("http://localhost/api/notifications/process", { method: "POST" });
    const wrong = new NextRequest("http://localhost/api/notifications/process", {
      method: "POST",
      headers: { authorization: "Bearer wrong" },
    });
    expect(verifyCronRequest(missing).ok).toBe(false);
    expect(verifyCronRequest(wrong).ok).toBe(false);
  });

  it("accepts a valid bearer token", () => {
    process.env.CRON_SECRET = "secret";
    const req = new NextRequest("http://localhost/api/notifications/process", {
      method: "POST",
      headers: { authorization: "Bearer secret" },
    });
    expect(verifyCronRequest(req).ok).toBe(true);
  });
});
