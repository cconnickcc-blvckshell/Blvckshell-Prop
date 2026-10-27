import { describe, expect, it } from "vitest";
import { clientAddressFromHeaders } from "@/lib/rate-limit";

describe("clientAddressFromHeaders", () => {
  it("prefers x-real-ip over a caller-supplied forwarded list", () => {
    expect(clientAddressFromHeaders("1.1.1.1, 2.2.2.2", "203.0.113.9")).toBe("203.0.113.9");
  });

  it("uses the last forwarded hop when the platform did not set a real ip", () => {
    expect(clientAddressFromHeaders("1.1.1.1, 2.2.2.2", null)).toBe("2.2.2.2");
    expect(clientAddressFromHeaders(null, "   ")).toBe("unknown");
  });
});
