import { prisma } from "@/lib/prisma";

/**
 * Invoice draft helpers used by admin actions, bulk invoicing, and job automation.
 * Not a "use server" module: these must not be callable from the client.
 * The exported admin actions in invoice-actions.ts call requireAdmin before using them.
 */

async function getNextInvoiceNumber(clientId: string): Promise<string> {
  const now = new Date();
  const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${clientId.slice(-6).toUpperCase()}`;
  const existing = await prisma.invoice.findMany({
    where: { clientId, invoiceNumber: { startsWith: prefix } },
    select: { invoiceNumber: true },
    orderBy: { invoiceNumber: "desc" },
    take: 1,
  });
  const seq = existing.length === 0 ? 1 : parseInt(existing[0].invoiceNumber.split("-").pop() ?? "0", 10) + 1;
  return `${prefix}-${seq}`;
}

/** Recompute subtotal/tax/total from line items and adjustments. Uses frozen taxRateBps from invoice. */
export async function recomputeInvoiceTotals(invoiceId: string) {
  const [invoice, lines, adjustments] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { taxRateBps: true },
    }),
    prisma.invoiceLineItem.aggregate({
      where: { invoiceId },
      _sum: { amountCents: true },
    }),
    prisma.billingAdjustment.findMany({
      where: { invoiceId, status: { in: ["Approved", "Applied"] } },
      select: { type: true, amountCents: true },
    }),
  ]);
  const linesTotal = lines._sum.amountCents ?? 0;
  let adjustmentsTotal = 0;
  for (const a of adjustments) {
    if (a.type === "Charge") adjustmentsTotal += a.amountCents;
    else adjustmentsTotal -= a.amountCents;
  }
  const subtotalCents = linesTotal + adjustmentsTotal;
  const taxRateBps = invoice?.taxRateBps ?? 1300;
  const taxCents = Math.round(subtotalCents * (taxRateBps / 10000));
  const totalCents = subtotalCents + taxCents;
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { subtotalCents, taxCents, totalCents },
  });
}

/** Add monthly base line items from active contracts. No auth and no revalidate. */
export async function applyContractBaseToDraft(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, status: "Draft" },
    select: { id: true, clientId: true, periodStart: true, periodEnd: true },
  });
  if (!invoice) return { success: false as const, error: "Invoice not found or not draft", added: 0 };

  const periodStart = invoice.periodStart;
  const periodEnd = invoice.periodEnd;

  const activeContracts = await prisma.contract.findMany({
    where: {
      clientOrganizationId: invoice.clientId,
      status: "Active",
      effectiveStart: { lte: periodEnd },
      OR: [
        { effectiveEnd: null },
        { effectiveEnd: { gte: periodStart } },
      ],
    },
    include: { site: { select: { name: true } } },
  });

  const existingContractIds = new Set(
    (
      await prisma.invoiceLineItem.findMany({
        where: { invoiceId, contractId: { not: null } },
        select: { contractId: true },
      })
    )
      .map((l) => l.contractId)
      .filter((id): id is string => id != null)
  );

  let added = 0;
  for (const contract of activeContracts) {
    if (existingContractIds.has(contract.id)) continue;
    await prisma.invoiceLineItem.create({
      data: {
        invoiceId,
        contractId: contract.id,
        siteId: contract.siteId,
        description: `Monthly base — ${contract.site.name}`,
        qty: 1,
        unitPriceCents: contract.monthlyBaseAmountCents,
        amountCents: contract.monthlyBaseAmountCents,
      },
    });
    existingContractIds.add(contract.id);
    added++;
  }

  if (added > 0) await recomputeInvoiceTotals(invoiceId);
  return { success: true as const, error: null, added };
}

/** Create a draft invoice (no audit, no revalidate). */
export async function createDraftInvoiceInternal(
  clientId: string,
  periodStart: Date,
  periodEnd: Date,
  createdById: string
): Promise<{ success: boolean; invoiceId: string | null; error: string | null }> {
  const client = await prisma.clientOrganization.findUnique({
    where: { id: clientId },
    select: { id: true },
  });
  if (!client) return { success: false, invoiceId: null, error: "Client not found" };

  const invoiceNumber = await getNextInvoiceNumber(clientId);
  const netTermsDays = 30;
  const dueAt = new Date(periodEnd);
  dueAt.setDate(dueAt.getDate() + netTermsDays);

  const invoice = await prisma.invoice.create({
    data: {
      clientId,
      invoiceNumber,
      periodStart,
      periodEnd,
      status: "Draft",
      dueAt,
      subtotalCents: 0,
      taxCents: 0,
      totalCents: 0,
      createdById,
    },
  });

  await applyContractBaseToDraft(invoice.id);
  return { success: true, invoiceId: invoice.id, error: null };
}

/** Add a job to a draft invoice and write audit (no RBAC/revalidate). */
export async function addJobToInvoiceInternal(
  actorUserId: string,
  invoiceId: string,
  jobId: string,
  metadata?: Record<string, unknown>
) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, status: "Draft" },
    select: { id: true, clientId: true },
  });
  if (!invoice) return { success: false, error: "Invoice not found or not draft" };

  const job = await prisma.job.findUnique({
    where: { id: jobId, invoiceId: null },
    select: {
      id: true,
      siteId: true,
      scheduledStart: true,
      payoutAmountCents: true,
      billableAmountCents: true,
      site: { select: { clientOrganizationId: true, name: true } },
    },
  });
  if (!job) return { success: false, error: "Job not found or already invoiced" };
  if (job.site.clientOrganizationId !== invoice.clientId) {
    return { success: false, error: "Job does not belong to this invoice client" };
  }

  const amountCents = job.billableAmountCents ?? job.payoutAmountCents;
  const description = `${job.site.name} — ${new Date(job.scheduledStart).toLocaleDateString()}`;

  await prisma.$transaction(async (tx) => {
    await tx.invoiceLineItem.create({
      data: {
        invoiceId,
        jobId: job.id,
        siteId: job.siteId,
        description,
        qty: 1,
        unitPriceCents: amountCents,
        amountCents,
      },
    });
    await tx.job.update({
      where: { id: jobId },
      data: { invoiceId },
    });
    await tx.auditLog.create({
      data: {
        actorUserId,
        entityType: "Invoice",
        entityId: invoiceId,
        fromState: null,
        toState: null,
        metadata: { action: "JobAddedByAutomation", jobId, ...metadata },
      },
    });
  });
  await recomputeInvoiceTotals(invoiceId);
  return { success: true, error: null };
}
