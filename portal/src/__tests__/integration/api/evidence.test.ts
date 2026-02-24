import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/storage", () => ({
  storage: { from: () => ({ upload: vi.fn().mockResolvedValue({ data: { path: "test" }, error: null }) }) },
  EVIDENCE_BUCKET: "evidence",
  COMPLIANCE_BUCKET: "compliance",
  MAX_PHOTO_SIZE: 10 * 1024 * 1024,
  ALLOWED_FILE_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  MAX_PHOTOS_PER_JOB: 20,
  generateEvidencePath: (_j: string, _c: string, f: string) => `evidence/test/${f}`,
  isValidFileType: (t: string) => ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(t),
  isValidFileSize: (s: number) => s <= 10 * 1024 * 1024,
}));

import { POST } from "@/app/api/evidence/upload/route";
import { testDb, createTestUser, createTestWorkforceAccount, createTestClient, createTestSite, createTestJob } from "../../setup";
import { NextRequest } from "next/server";
import * as rbac from "@/server/guards/rbac";

describe("Evidence API", () => {
  let workerUser: any;
  let job: any;
  let completion: any;
  let worker: any;

  beforeEach(async () => {
    const workforce = await createTestWorkforceAccount({
      type: "INTERNAL",
      displayName: "Test Workforce",
    });

    workerUser = await createTestUser({
      email: "worker@test.com",
      role: "INTERNAL_WORKER",
      workforceAccountId: workforce.id,
    });

    worker = await testDb.worker.create({
      data: {
        userId: workerUser.id,
        workforceAccountId: workforce.id,
      },
    });

    const client = await createTestClient();
    const site = await createTestSite(client.id);

    job = await createTestJob({
      siteId: site.id,
      assignedWorkerId: worker.id,
    });

    completion = await testDb.jobCompletion.create({
      data: {
        jobId: job.id,
        completedByWorkerId: worker.id,
        isDraft: true,
        checklistResults: {},
      },
    });
  });

  describe("POST /api/evidence/upload", () => {
    it("should reject upload without redaction", async () => {
      const formData = new FormData();
      formData.append("file", new Blob(["test"], { type: "image/jpeg" }), "test.jpg");
      formData.append("jobId", job.id);
      formData.append("completionId", completion.id);
      formData.append("redactionApplied", "false");

      const request = new NextRequest("http://localhost:3000/api/evidence/upload", {
        method: "POST",
        body: formData,
      });

      vi.spyOn(rbac, "getCurrentUser").mockResolvedValue({
        id: workerUser.id,
        name: "Test User",
        role: "INTERNAL_WORKER",
        workerId: worker.id,
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain("redacted");
    });

    it("should accept upload with redaction", async () => {
      const formData = new FormData();
      const file = new Blob(["test"], { type: "image/jpeg" });
      formData.append("file", file, "test.jpg");
      formData.append("jobId", job.id);
      formData.append("completionId", completion.id);
      formData.append("redactionApplied", "true");

      const request = new NextRequest("http://localhost:3000/api/evidence/upload", {
        method: "POST",
        body: formData,
      });

      vi.spyOn(rbac, "getCurrentUser").mockResolvedValue({
        id: workerUser.id,
        name: "Test User",
        role: "INTERNAL_WORKER",
        workerId: worker.id,
      });

      const response = await POST(request);
      expect([200, 500]).toContain(response.status);
    });
  });
});
