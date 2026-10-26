import { describe, it, expect } from "vitest";
import {
  isStaffAdmin,
  isFounderFinancialAuthority,
  isOperationsAdmin,
} from "@/server/permissions";

describe("permission matrix", () => {
  it("treats ADMIN and FOUNDER as staff admin", () => {
    expect(isStaffAdmin("ADMIN")).toBe(true);
    expect(isStaffAdmin("FOUNDER")).toBe(true);
    expect(isStaffAdmin("CLIENT")).toBe(false);
  });

  it("restricts founder-only financial authority to FOUNDER", () => {
    expect(isFounderFinancialAuthority("FOUNDER")).toBe(true);
    expect(isFounderFinancialAuthority("ADMIN")).toBe(false);
  });

  it("aligns operations admin with staff admin", () => {
    expect(isOperationsAdmin("FOUNDER")).toBe(true);
    expect(isOperationsAdmin("VENDOR_WORKER")).toBe(false);
  });
});
