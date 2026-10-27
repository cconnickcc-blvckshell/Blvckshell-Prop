"use server";

import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { BillingAdjustmentType } from "@prisma/client";
import type { AdjustmentCategory } from "@prisma/client";
import { queueNotification } from "@/server/notifications/outbox";
import {
  addJobToInvoiceInternal,
  applyContractBaseToDraft,
  createDraftInvoiceInternal,
  recomputeInvoiceTotals,
} from "@/server/invoices/draft-invoice";
import { dueAtFromInvoiceDate, isPaymentTerms, type PaymentTermsCode } from "@/server/invoices/payment-terms";

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
    select: {
      id: true,
      scheduledStart: true,
      site: { select: { name: true, id: true } },
      completion: { select: { completedAt: true } },
    },
    orderBy: { scheduledStart: "asc" },
  });
  return jobs;
}

/** Create a draft invoice for client + period. Auto-adds monthly base from active contracts per D1. */
export async function createDraftInvoice(
  clientId: string,
  periodStart: Date,
  periodEnd: Date
) {
  const user = await requireAdmin();
  const result = await createDraftInvoiceInternal(clientId, periodStart, periodEnd, user.id);
  revalidatePath("/admin/invoices");
  revalidatePath("/admin/clients");
  return result.success
    ? { success: true, error: null, invoiceId: result.invoiceId }
    : { success: false, error: result.error, invoiceId: null };
}

/** Get invoice with line items, adjustments, and related jobs. Uses explicit select so it works before Category A migration. */
export async function getInvoiceWithDetails(invoiceId: string) {
  await requireAdmin();
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      clientId: true,
      invoiceNumber: true,
      periodStart: true,
      periodEnd: true,
      status: true,
      issuedAt: true,
      dueAt: true,
      paymentTerms: true,
      paymentTermsDays: true,
      notes: true,
      subtotalCents: true,
      taxCents: true,
      totalCents: true,
      createdById: true,
      createdAt: true,
      updatedAt: true,
      client: { select: { name: true, id: true } },
      createdBy: { select: { name: true } },
      lineItems: {
        select: {
          id: true,
          invoiceId: true,
          jobId: true,
          checklistRunId: true,
          contractId: true,
          description: true,
          qty: true,
          unitPriceCents: true,
          amountCents: true,
          siteId: true,
          site: { select: { name: true } },
        },
      },
      adjustments: {
        where: { status: { in: ["Proposed", "Approved", "Applied"] } },
        select: {
          id: true,
          invoiceId: true,
          siteId: true,
          jobId: true,
          type: true,
          amountCents: true,
          reasonCode: true,
          notes: true,
          createdById: true,
          createdAt: true,
          status: true,
          evidencePhotoIds: true,
        },
      },
      jobs: { select: { id: true, siteId: true, scheduledStart: true } },
    },
  });
  return invoice;
}

/** Add a job as a line item to the invoice (Draft only). Uses billableAmountCents or payoutAmountCents. */
export async function addJobToInvoice(invoiceId: string, jobId: string) {
  const user = await requireAdmin();
  const result = await addJobToInvoiceInternal(user.id, invoiceId, jobId);
  if (result.success) {
    revalidatePath(`/admin/invoices/${invoiceId}`);
    revalidatePath("/admin/invoices");
  }
  return result;
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

/** Add a billing adjustment to the invoice (Draft only). siteId required (per-site attribution). */
export async function addBillingAdjustment(
  invoiceId: string,
  type: BillingAdjustmentType,
  amountCents: number,
  options: { siteId: string; notes?: string; reasonCode?: string; jobId?: string }
) {
  const user = await requireAdmin();
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, status: "Draft" },
    select: { id: true },
  });
  if (!invoice) return { success: false, error: "Invoice not found or not draft" };

  const adjustmentCategory: AdjustmentCategory = type === "Credit" ? "CREDIT" : "CHARGE";

  await prisma.billingAdjustment.create({
    data: {
      invoiceId,
      siteId: options.siteId,
      type,
      adjustmentCategory,
      amountCents,
      notes: options?.notes,
      reasonCode: options?.reasonCode,
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
  const result = await applyContractBaseToDraft(invoiceId);
  if (result.success) {
    revalidatePath(`/admin/invoices/${invoiceId}`);
    revalidatePath("/admin/invoices");
  }
  return result;
}

/** List invoices for admin (optional client filter). Uses explicit select so it works before Category A migration. */
export async function listInvoices(clientId?: string) {
  await requireAdmin();
  const invoices = await prisma.invoice.findMany({
    where: clientId ? { clientId } : undefined,
    select: {
      id: true,
      clientId: true,
      invoiceNumber: true,
      periodStart: true,
      periodEnd: true,
      status: true,
      issuedAt: true,
      dueAt: true,
      notes: true,
      subtotalCents: true,
      taxCents: true,
      totalCents: true,
      createdById: true,
      createdAt: true,
      updatedAt: true,
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
    select: { id: true, status: true, clientId: true, paymentTermsDays: true },
  });
  if (!invoice) return { success: false, error: "Invoice not found" };
  if (newStatus === "Sent" && invoice.status !== "Draft") {
    return { success: false, error: "Only draft invoices can be marked Sent" };
  }
  if (newStatus === "Paid" && invoice.status !== "Sent") {
    return { success: false, error: "Only sent invoices can be marked Paid" };
  }

  // Gold Standard: Cannot issue invoice with zero line items.
  if (newStatus === "Sent") {
    const lineItemCount = await prisma.invoiceLineItem.count({
      where: { invoiceId },
    });
    if (lineItemCount === 0) {
      return {
        success: false,
        error: "Cannot issue invoice with zero line items. Add jobs or contract base first.",
      };
    }
  }

  const updateData: { status: "Sent" | "Paid"; issuedAt?: Date; dueAt?: Date } = { status: newStatus };
  if (newStatus === "Sent") {
    const issuedAt = new Date();
    updateData.issuedAt = issuedAt;
    updateData.dueAt = dueAtFromInvoiceDate(issuedAt, invoice.paymentTermsDays);
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

  // Queue notification on invoice sent
  if (newStatus === "Sent") {
    const client = await prisma.clientOrganization.findUnique({
      where: { id: invoice.clientId },
      select: { primaryContactEmail: true, name: true },
    });
    if (client) {
      await queueNotification({
        channel: "EMAIL",
        templateKey: "invoice_sent",
        recipient: client.primaryContactEmail,
        payload: { invoiceId, clientName: client.name },
        relatedEntityType: "Invoice",
        relatedEntityId: invoiceId,
      }).catch(() => {});
    }
  }

  revalidatePath(`/admin/invoices/${invoiceId}`);
  revalidatePath("/admin/invoices");
  revalidatePath("/admin/clients");
  return { success: true, error: null };
}

/** Set payment terms on a draft. Due date is provisional until the invoice is sent. */
export async function updateInvoicePaymentTerms(invoiceId: string, terms: PaymentTermsCode) {
  await requireAdmin();
  if (!isPaymentTerms(terms)) return { success: false, error: "Unknown payment terms" };
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, status: "Draft" },
    select: { id: true, paymentTerms: true, paymentTermsDays: true },
  });
  if (!invoice) return { success: false, error: "Invoice not found or not draft" };

  let days = 30;
  if (terms === "DUE_ON_COMPLETION") {
    days = 0;
  } else if (invoice.paymentTerms === "NET_30" && invoice.paymentTermsDays > 0) {
    days = invoice.paymentTermsDays;
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      paymentTerms: terms,
      paymentTermsDays: days,
      dueAt: dueAtFromInvoiceDate(new Date(), days),
    },
  });
  revalidatePath(`/admin/invoices/${invoiceId}`);
  return { success: true, error: null };
}
