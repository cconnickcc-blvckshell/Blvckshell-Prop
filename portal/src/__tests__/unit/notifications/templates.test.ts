import { describe, it, expect } from "vitest";
import { getEmailHtml } from "@/server/notifications/templates";

describe("notification email templates", () => {
  it("escapes HTML in new_lead payload", () => {
    const html = getEmailHtml("new_lead", {
      name: '<img src=x onerror=alert(1)>',
      email: "test@example.com",
      leadId: "lead-1",
    });
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("uses activation link instead of plaintext password", () => {
    const html = getEmailHtml("application_approved", {
      activationUrl: "https://example.com/activate-account?token=abc",
      name: "Alex",
    });
    expect(html).toContain("Activate your account");
    expect(html).not.toContain("temporary password");
  });
});
