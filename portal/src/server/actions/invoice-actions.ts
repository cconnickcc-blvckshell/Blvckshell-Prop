"use server";

import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { BillingAdjustmentType } from "@prisma/client";

/** Uninvoiced approved jobs for a client (and optional site) in a period */
export async function getUninvoicedApprovedJobs(
  clientId: string,
  periodStart: Date,
  periodEnd: Date,
  siteId?: string
) {
  await requireAdmin();
  const jobs = await prisma.job.findMany({
    where: {
      site: { clientOrganizationId: clientId },
      ...(siteId ? { siteId } : {}),
      status: "APPROVED_PAYABLE",
      invoiceId: null,
      OR: [
        { billableStatus: null },
        { billableStatus: "Pending" },
        { billableStatus: "Approved" },
      ],
      scheduledStart: { gte: periodStart, lte: periodEnd },
    },
    include: {
      site: { select: { name: true, id: true } },
      completion: { select: { completedAt: true } },
    },
    orderBy: { scheduledStart: "asc" },
  });
  return jobs;
}

/** Next invoice number for client: INV-YYYYMM-{shortId}-{seq} */
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

/** Create a draft invoice for client + period. Auto-adds monthly base from active contracts per D1. */
export async function createDraftInvoice(
  clientId: string,
  periodStart: Date,
  periodEnd: Date
) {
  const user = await requireAdmin();
  const client = await prisma.clientOrganization.findUnique({
    where: { id: clientId },
    select: { id: true },
  });
  if (!client) return { success: false, error: "Client not found", invoiceId: null };

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
      createdById: user.id,
    },
  });

  // D1: Auto-add monthly base from active contracts
  await addContractBaseToInvoice(invoice.id);

  revalidatePath("/admin/invoices");
  revalidatePath("/admin/clients");
  return { success: true, error: null, invoiceId: invoice.id };
}

/** Get invoice with line items, adjustments, and related jobs */
export async function getInvoiceWithDetails(invoiceId: string) {
  await requireAdmin();
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      client: { select: { name: true, id: true } },
      createdBy: { select: { name: true } },
      lineItems: {
        include: {
          site: { select: { name: true } },
        },
      },
      adjustments: { where: { status: { in: ["Proposed", "Approved", "Applied"] } } },
      jobs: { select: { id: true, siteId: true, scheduledStart: true } },
    },
  });
  return invoice;
}

/** Add a job as a line item to the invoice (Draft only). Uses billableAmountCents or payoutAmountCents. */
export async function addJobToInvoice(invoiceId: string, jobId: string) {
  await requireAdmin();
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, status: "Draft" },
    select: { id: true, clientId: true },
  });
  if (!invoice) return { success: false, error: "Invoice not found or not draft" };

  const job = await prisma.job.findUnique({
    where: { id: jobId, invoiceId: null },
    include: { site: { select: { clientOrganizationId: true, name: true } } },
  });
  if (!job) return { success: false, error: "Job not found or already invoiced" };
  if (job.site.clientOrganizationId !== invoice.clientId) {
    return { success: false, error: "Job does not belong to this invoice client" };
  }

  const amountCents = job.billableAmountCents ?? job.payoutAmountCents;
  const description = `${job.site.name} — ${new Date(job.scheduledStart).toLocaleDateString()}`;

  await prisma.invoiceLineItem.create({
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
  await prisma.job.update({
    where: { id: jobId },
    data: { invoiceId },
  });
  await recomputeInvoiceTotals(invoiceId);
  revalidatePath(`/admin/invoices/${invoiceId}`);
  revalidatePath("/admin/invoices");
  return { success: true, error: null };
}

/** Remove job line item and unlink job from invoice */
export async function removeJobFromInvoice(invoiceId: string, jobId: string) {
  await requireAdmin();
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, status: "Draft" },
    select: { id: true },
  });
  if (!invoice) return { success: false, error: "Invoice not found or not draft" };

  const line = await prisma.invoiceLineItem.findFirst({
    where: { invoiceId, jobId },
  });
  if (!line) return { success: false, error: "Job not on this invoice" };

  await prisma.invoiceLineItem.delete({ where: { id: line.id } });
  await prisma.job.update({
    where: { id: jobId },
    data: { invoiceId: null },
  });
  await recomputeInvoiceTotals(invoiceId);
  revalidatePath(`/admin/invoices/${invoiceId}`);
  revalidatePath("/admin/invoices");
  return { success: true, error: null };
}

/** Add a billing adjustment to the invoice (Draft only) */
export async function addBillingAdjustment(
  invoiceId: string,
  type: BillingAdjustmentType,
  amountCents: number,
  options?: { notes?: string; reasonCode?: string; siteId?: string; jobId?: string }
) {
  const user = await requireAdmin();
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, status: "Draft" },
    select: { id: true },
  });
  if (!invoice) return { success: false, error: "Invoice not found or not draft" };

  await prisma.billingAdjustment.create({
    data: {
      invoiceId,
      type,
      amountCents,
      notes: options?.notes,
      reasonCode: options?.reasonCode,
      siteId: options?.siteId,
      jobId: options?.jobId,
      status: "Approved",
      createdById: user.id,
    },
  });
  await recomputeInvoiceTotals(invoiceId);
  revalidatePath(`/admin/invoices/${invoiceId}`);
  return { success: true, error: null };
}

/** Add monthly base line items from active contracts for this invoice's client and period (Draft only). Skips contracts already on the invoice. */
export async function addContractBaseToInvoice(invoiceId: string) {
  await requireAdmin();
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, status: "Draft" },
    select: { id: true, clientId: true, periodStart: true, periodEnd: true },
  });
  if (!invoice) return { success: false, error: "Invoice not found or not draft" };

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
  revalidatePath(`/admin/invoices/${invoiceId}`);
  revalidatePath("/admin/invoices");
  return { success: true, error: null, added };
}

/** Recompute subtotal/tax/total from line items and adjustments. D2: Ontario HST 13% */
async function recomputeInvoiceTotals(invoiceId: string) {
  const [lines, adjustments] = await Promise.all([
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
    else adjustmentsTotal -= a.amountCents; // Discount, Credit
  }
  const subtotalCents = linesTotal + adjustmentsTotal;
  // D2: Ontario HST 13% (0.13) - hardcoded for v1
  const taxRate = 0.13;
  const taxCents = Math.round(subtotalCents * taxRate);
  const totalCents = subtotalCents + taxCents;
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { subtotalCents, taxCents, totalCents },
  });
}

/** List invoices for admin (optional client filter) */
export async function listInvoices(clientId?: string) {
  await requireAdmin();
  const invoices = await prisma.invoice.findMany({
    where: clientId ? { clientId } : undefined,
    include: {
      client: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return invoices;
}

/** Update invoice status (Draft → Sent, Sent → Paid). When Sent or Paid, locks all related jobs (billableStatus = Invoiced). */
export async function updateInvoiceStatus(
  invoiceId: string,
  newStatus: "Sent" | "Paid"
) {
  const user = await requireAdmin();
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, status: true, clientId: true },
  });
  if (!invoice) return { success: false, error: "Invoice not found" };
  if (newStatus === "Sent" && invoice.status !== "Draft") {
    return { success: false, error: "Only draft invoices can be marked Sent" };
  }
  if (newStatus === "Paid" && invoice.status !== "Sent") {
    return { success: false, error: "Only sent invoices can be marked Paid" };
  }

  const updateData: { status: "Sent" | "Paid"; issuedAt?: Date } = { status: newStatus };
  if (newStatus === "Sent") {
    updateData.issuedAt = new Date();
  }

  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({
      where: { id: invoiceId },
      data: updateData,
    });
    await tx.job.updateMany({
      where: { invoiceId },
      data: { billableStatus: "Invoiced" },
    });
    // Audit log: invoice status change
    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        actorWorkerId: user.workerId ?? null,
        actorWorkforceAccountId: user.workforceAccountId ?? null,
        entityType: "Invoice",
        entityId: invoiceId,
        fromState: invoice.status,
        toState: newStatus,
        metadata: {},
      },
    });
  });

  revalidatePath(`/admin/invoices/${invoiceId}`);
  revalidatePath("/admin/invoices");
  revalidatePath("/admin/clients");
  return { success: true, error: null };
}
