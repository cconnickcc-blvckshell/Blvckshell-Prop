import { describe, it, expect, beforeEach, vi } from "vitest";
import { testDb, createTestUser, createTestWorkforceAccount, createTestClient, createTestSite } from "../../setup";
import {
  createDraftInvoice,
  getInvoiceWithDetails,
  addJobToInvoice,
  updateInvoiceStatus,
  listInvoices,
} from "@/server/actions/invoice-actions";
import * as rbac from "@/server/guards/rbac";

describe("invoice-actions", () => {
  let adminUser: any;
  let client: any;
  let job: any;

  beforeEach(async () => {
    adminUser = await createTestUser({
      email: "admin@test.com",
      role: "ADMIN",
    });

    vi.spyOn(rbac, "requireAdmin").mockResolvedValue({
      id: adminUser.id,
      name: "Test User",
      role: "ADMIN",
    } as never);

    const workforce = await createTestWorkforceAccount({
      type: "INTERNAL",
      displayName: "Invoice WF",
    });

    const workerUser = await createTestUser({
      email: "worker-inv@test.com",
      role: "INTERNAL_WORKER",
      workforceAccountId: workforce.id,
    });

    const worker = await testDb.worker.create({
      data: { userId: workerUser.id, workforceAccountId: workforce.id },
    });

    client = await createTestClient();
    const site = await createTestSite(client.id);

    job = await testDb.job.create({
      data: {
        siteId: site.id,
        status: "APPROVED_PAYABLE",
        scheduledStart: new Date(),
        scheduledEnd: new Date(Date.now() + 3600000),
        payoutAmountCents: 5000,
        assignedWorkerId: worker.id,
      },
    });
  });

  describe("createDraftInvoice", () => {
    it("should create draft invoice successfully", async () => {
      const result = await createDraftInvoice(
        client.id,
        new Date("2026-01-01"),
        new Date("2026-01-31")
      );

      expect(result.success).toBe(true);
      expect(result.invoiceId).toBeTruthy();

      const invoice = await testDb.invoice.findUnique({
        where: { id: result.invoiceId },
      });
      expect(invoice?.status).toBe("Draft");
    });
  });

  describe("addJobToInvoice", () => {
    it("should add job to invoice", async () => {
      const invoiceResult = await createDraftInvoice(
        client.id,
        new Date("2026-01-01"),
        new Date("2026-01-31")
      );

      const result = await addJobToInvoice(invoiceResult.invoiceId!, job.id);

      expect(result.success).toBe(true);

      const lineItem = await testDb.invoiceLineItem.findFirst({
        where: { invoiceId: invoiceResult.invoiceId, jobId: job.id },
      });
      expect(lineItem).toBeTruthy();
      expect(lineItem?.jobId).toBe(job.id);
    });
  });

  describe("updateInvoiceStatus", () => {
    it("should update invoice status and create audit log", async () => {
      const invoiceResult = await createDraftInvoice(
        client.id,
        new Date("2026-01-01"),
        new Date("2026-01-31")
      );
      await addJobToInvoice(invoiceResult.invoiceId!, job.id);

      const result = await updateInvoiceStatus(invoiceResult.invoiceId!, "Sent");

      expect(result.success).toBe(true);

      const invoice = await testDb.invoice.findUnique({
        where: { id: invoiceResult.invoiceId },
      });
      expect(invoice?.status).toBe("Sent");

      const auditLog = await testDb.auditLog.findFirst({
        where: {
          entityType: "Invoice",
          entityId: invoiceResult.invoiceId,
          toState: "Sent",
        },
      });
      expect(auditLog).toBeTruthy();
    });
  });
});
