/**
 * Pure unit tests for job state transition rules.
 * No DB or app imports - runs without DATABASE_URL.
 */
import { describe, it, expect } from "vitest";

type JobStatus =
  | "SCHEDULED"
  | "COMPLETED_PENDING_APPROVAL"
  | "APPROVED_PAYABLE"
  | "PAID"
  | "CANCELLED";

const ALLOWED_JOB_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  SCHEDULED: ["COMPLETED_PENDING_APPROVAL", "CANCELLED"],
  COMPLETED_PENDING_APPROVAL: ["APPROVED_PAYABLE", "SCHEDULED", "CANCELLED"],
  APPROVED_PAYABLE: ["PAID"],
  PAID: [],
  CANCELLED: [],
};

function isAllowed(from: JobStatus, to: JobStatus): boolean {
  return ALLOWED_JOB_TRANSITIONS[from]?.includes(to) ?? false;
}

describe("Job state transitions (pure)", () => {
  it("allows SCHEDULED -> COMPLETED_PENDING_APPROVAL", () => {
    expect(isAllowed("SCHEDULED", "COMPLETED_PENDING_APPROVAL")).toBe(true);
  });

  it("allows SCHEDULED -> CANCELLED", () => {
    expect(isAllowed("SCHEDULED", "CANCELLED")).toBe(true);
  });

  it("allows COMPLETED_PENDING_APPROVAL -> APPROVED_PAYABLE", () => {
    expect(isAllowed("COMPLETED_PENDING_APPROVAL", "APPROVED_PAYABLE")).toBe(true);
  });

  it("allows COMPLETED_PENDING_APPROVAL -> SCHEDULED (rejection)", () => {
    expect(isAllowed("COMPLETED_PENDING_APPROVAL", "SCHEDULED")).toBe(true);
  });

  it("allows COMPLETED_PENDING_APPROVAL -> CANCELLED", () => {
    expect(isAllowed("COMPLETED_PENDING_APPROVAL", "CANCELLED")).toBe(true);
  });

  it("allows APPROVED_PAYABLE -> PAID", () => {
    expect(isAllowed("APPROVED_PAYABLE", "PAID")).toBe(true);
  });

  it("rejects SCHEDULED -> PAID", () => {
    expect(isAllowed("SCHEDULED", "PAID")).toBe(false);
  });

  it("rejects SCHEDULED -> APPROVED_PAYABLE", () => {
    expect(isAllowed("SCHEDULED", "APPROVED_PAYABLE")).toBe(false);
  });

  it("rejects PAID -> any", () => {
    expect(isAllowed("PAID", "SCHEDULED")).toBe(false);
    expect(isAllowed("PAID", "COMPLETED_PENDING_APPROVAL")).toBe(false);
  });

  it("rejects CANCELLED -> any", () => {
    expect(isAllowed("CANCELLED", "SCHEDULED")).toBe(false);
  });
});
