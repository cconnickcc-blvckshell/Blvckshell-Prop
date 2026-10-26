import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  verifyCronRequest,
  isEmailProviderConfigured,
  isSmsProviderConfigured,
} from "@/lib/cron-auth";

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

  it("rejects wrong bearer token", () => {
    process.env.CRON_SECRET = "secret";
    const req = new NextRequest("http://localhost/api/notifications/process", {
      method: "POST",
      headers: { authorization: "Bearer wrong" },
    });
    const result = verifyCronRequest(req);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  it("accepts valid bearer token", () => {
    process.env.CRON_SECRET = "secret";
    const req = new NextRequest("http://localhost/api/notifications/process", {
      method: "POST",
      headers: { authorization: "Bearer secret" },
    });
    expect(verifyCronRequest(req).ok).toBe(true);
  });

  it("detects email provider configuration", () => {
    delete process.env.SENDGRID_API_KEY;
    expect(isEmailProviderConfigured()).toBe(false);
    process.env.SENDGRID_API_KEY = "sg-test";
    expect(isEmailProviderConfigured()).toBe(true);
  });

  it("detects sms provider configuration", () => {
    delete process.env.TWILIO_ACCOUNT_SID;
    expect(isSmsProviderConfigured()).toBe(false);
    process.env.TWILIO_ACCOUNT_SID = "sid";
    process.env.TWILIO_AUTH_TOKEN = "token";
    process.env.TWILIO_FROM_NUMBER = "+15551234567";
    expect(isSmsProviderConfigured()).toBe(true);
  });
});
