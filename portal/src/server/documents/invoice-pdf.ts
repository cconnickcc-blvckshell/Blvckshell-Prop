import { companyHstNumber } from "@/config/company-print";
import { prisma } from "@/lib/prisma";
import { buildInvoicePdfModel, type InvoicePdfModel } from "@/lib/pdf/models";
import { isPaymentTerms, paymentTermsLabel } from "@/server/invoices/payment-terms";

export async function loadInvoicePdfModel(invoiceId: string): Promise<InvoicePdfModel | null> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      invoiceNumber: true,
      status: true,
      issuedAt: true,
      dueAt: true,
      periodStart: true,
      periodEnd: true,
      paymentTerms: true,
      paymentTermsDays: true,
      subtotalCents: true,
      taxCents: true,
      taxRateBps: true,
      totalCents: true,
      client: {
        select: {
          name: true,
          primaryContactName: true,
          primaryContactEmail: true,
          primaryContactPhone: true,
        },
      },
      lineItems: {
        select: {
          description: true,
          qty: true,
          unitPriceCents: true,
          amountCents: true,
          site: { select: { name: true, address: true } },
        },
      },
      adjustments: {
        where: { status: { in: ["Approved", "Applied"] } },
        select: { type: true, amountCents: true, notes: true, reasonCode: true },
      },
      payments: {
        select: { status: true, amountCents: true },
      },
    },
  });
  if (!invoice) return null;
  const terms = isPaymentTerms(invoice.paymentTerms) ? invoice.paymentTerms : "NET_30";
  return buildInvoicePdfModel({
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    issuedAt: invoice.issuedAt,
    dueAt: invoice.dueAt,
    periodStart: invoice.periodStart,
    periodEnd: invoice.periodEnd,
    termsLabel: paymentTermsLabel(terms, invoice.paymentTermsDays),
    hstNumber: companyHstNumber(),
    clientName: invoice.client.name,
    contactName: invoice.client.primaryContactName,
    contactEmail: invoice.client.primaryContactEmail,
    contactPhone: invoice.client.primaryContactPhone,
    sites: invoice.lineItems.map((line) => line.site),
    lineItems: invoice.lineItems,
    adjustments: invoice.adjustments,
    payments: invoice.payments,
    subtotalCents: invoice.subtotalCents,
    taxCents: invoice.taxCents,
    taxRateBps: invoice.taxRateBps,
    totalCents: invoice.totalCents,
  });
}
