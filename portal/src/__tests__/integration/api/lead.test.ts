import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "@/app/api/lead/route";
import { testDb } from "../../setup";

describe("POST /api/lead", () => {
  beforeEach(async () => {
    await testDb.lead.deleteMany();
  });

  it("should create lead successfully", async () => {
    const request = new Request("http://localhost:3000/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Lead",
        email: "lead@test.com",
        phone: "555-0100",
        message: "Test message",
        sourcePage: "/contact",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.ok).toBe(true);

    // Verify lead was created
    const lead = await testDb.lead.findFirst({
      where: { email: "lead@test.com" },
    });
    expect(lead).toBeTruthy();
    expect(lead?.name).toBe("Test Lead");
  });

  it("should reject invalid email", async () => {
    const request = new Request("http://localhost:3000/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Lead",
        email: "invalid-email",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBeTruthy();
  });

  it("should handle honeypot field", async () => {
    const request = new Request("http://localhost:3000/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Spam Bot",
        email: "spam@test.com",
        website: "http://spam.com", // honeypot
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.ok).toBe(true);

    // Verify lead was NOT created
    const lead = await testDb.lead.findFirst({
      where: { email: "spam@test.com" },
    });
    expect(lead).toBeNull();
  });
});
