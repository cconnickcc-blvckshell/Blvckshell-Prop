import { describe, it, expect, beforeEach } from "vitest";
import { testDb, createTestUser, createTestClient, createTestSite, createTestJob } from "../../setup";
import {
  createDraftInvoice,
  getInvoiceWithDetails,
  addJobToInvoice,
  updateInvoiceStatus,
  listInvoices,
} from "@/server/actions/invoice-actions";

describe("invoice-actions", () => {
  let adminUser: any;
  let client: any;
  let job: any;

  beforeEach(async () => {
    adminUser = await createTestUser({
      email: "admin@test.com",
      role: "ADMIN",
    });

    client = await createTestClient();
    const site = await createTestSite(client.id);

    job = await createTestJob({
      siteId: site.id,
      status: "APPROVED_PAYABLE",
    });
  });

  describe("createDraftInvoice", () => {
    it("should create draft invoice successfully", async () => {
      const result = await createDraftInvoice({
        clientOrganizationId: client.id,
        periodStart: new Date("2026-01-01"),
        periodEnd: new Date("2026-01-31"),
      });

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
      const invoiceResult = await createDraftInvoice({
        clientOrganizationId: client.id,
        periodStart: new Date("2026-01-01"),
        periodEnd: new Date("2026-01-31"),
      });

      const result = await addJobToInvoice({
        invoiceId: invoiceResult.invoiceId!,
        jobId: job.id,
      });

      expect(result.success).toBe(true);

      const lineItem = await testDb.invoiceLineItem.findFirst({
        where: { invoiceId: invoiceResult.invoiceId },
      });
      expect(lineItem).toBeTruthy();
      expect(lineItem?.jobId).toBe(job.id);
    });
  });

  describe("updateInvoiceStatus", () => {
    it("should update invoice status and create audit log", async () => {
      const invoiceResult = await createDraftInvoice({
        clientOrganizationId: client.id,
        periodStart: new Date("2026-01-01"),
        periodEnd: new Date("2026-01-31"),
      });

      const result = await updateInvoiceStatus({
        invoiceId: invoiceResult.invoiceId!,
        status: "Sent",
      });

      expect(result.success).toBe(true);

      const invoice = await testDb.invoice.findUnique({
        where: { id: invoiceResult.invoiceId },
      });
      expect(invoice?.status).toBe("Sent");

      // Verify audit log
      const auditLog = await testDb.auditLog.findFirst({
        where: {
          entityType: "Invoice",
          entityId: invoiceResult.invoiceId,
        },
      });
      expect(auditLog).toBeTruthy();
      expect(auditLog?.toState).toBe("Sent");
    });
  });
});
