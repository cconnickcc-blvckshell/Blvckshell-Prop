import { describe, it, expect, beforeEach } from "vitest";
import { testDb, createTestUser, createTestClient, createTestSite } from "../setup";
import { createDraftInvoice, updateInvoiceStatus } from "@/server/actions/invoice-actions";

/**
 * Gold Standard T2: Invoice cannot be issued with zero line items.
 * Server action must reject Draft → Sent when line item count is 0.
 */
describe("Invoice status invariants", () => {
  let adminUser: Awaited<ReturnType<typeof createTestUser>>;
  let client: Awaited<ReturnType<typeof createTestClient>>;

  beforeEach(async () => {
    adminUser = await createTestUser({
      email: "admin-inv@test.com",
      role: "ADMIN",
    });
    client = await createTestClient();
  });

  it("rejects marking invoice as Sent when it has zero line items", async () => {
    const result = await createDraftInvoice(
      client.id,
      new Date("2026-01-01"),
      new Date("2026-01-31")
    );
    expect(result.success).toBe(true);
    expect(result.invoiceId).toBeTruthy();
    const invoiceId = result.invoiceId!;

    // Remove all line items (client may have no contracts, or we force zero for test)
    await testDb.invoiceLineItem.deleteMany({ where: { invoiceId } });

    const updateResult = await updateInvoiceStatus(invoiceId, "Sent");

    expect(updateResult.success).toBe(false);
    expect(updateResult.error).toContain("zero line items");
  });

  it("allows marking invoice as Sent when it has at least one line item", async () => {
    const result = await createDraftInvoice(
      client.id,
      new Date("2026-02-01"),
      new Date("2026-02-28")
    );
    expect(result.success).toBe(true);
    const invoiceId = result.invoiceId!;

    // Ensure at least one line item (createDraftInvoice may add contract base; if none, add one manually)
    const count = await testDb.invoiceLineItem.count({ where: { invoiceId } });
    if (count === 0) {
      const site = await createTestSite(client.id);
      await testDb.invoiceLineItem.create({
        data: {
          invoiceId,
          siteId: site.id,
          description: "Test line",
          qty: 1,
          unitPriceCents: 1000,
          amountCents: 1000,
        },
      });
    }

    const updateResult = await updateInvoiceStatus(invoiceId, "Sent");
    expect(updateResult.success).toBe(true);
  });
});
