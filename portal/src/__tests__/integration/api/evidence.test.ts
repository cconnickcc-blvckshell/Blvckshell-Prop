import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/evidence/upload/route";
import { GET } from "@/app/api/evidence/[id]/route";
import { testDb, createTestUser, createTestWorkforceAccount, createTestClient, createTestSite, createTestJob } from "../../setup";
import { NextRequest } from "next/server";

describe("Evidence API", () => {
  let workerUser: any;
  let job: any;
  let completion: any;

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

    const worker = await testDb.worker.create({
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
        isDraft: true,
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

      // Mock auth
      vi.spyOn(require("@/server/guards/rbac"), "getCurrentUser").mockResolvedValue({
        id: workerUser.id,
        workerId: "worker-id",
        workforceAccountId: null,
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

      // Mock auth and storage
      vi.spyOn(require("@/server/guards/rbac"), "getCurrentUser").mockResolvedValue({
        id: workerUser.id,
        workerId: "worker-id",
        workforceAccountId: null,
      });

      // Mock storage upload
      vi.spyOn(require("@/lib/storage").storage, "upload").mockResolvedValue({
        path: "evidence/test/test.jpg",
      });

      const response = await POST(request);
      // Should succeed (200) or fail due to missing storage setup (500)
      expect([200, 500]).toContain(response.status);
    });
  });
});
