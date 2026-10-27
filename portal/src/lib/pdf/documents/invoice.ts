import { companyPrintView } from "@/config/company-print";
import { bodyText, kvGrid, rightLabel, sectionHeading, totalsBlock } from "@/lib/pdf/blocks";
import { formatCad, hstLabel } from "@/lib/pdf/format";
import { createBrandedDoc, finalizeBrandedDoc } from "@/lib/pdf/letterhead";
import type { InvoicePdfModel } from "@/lib/pdf/models";
import { drawTable } from "@/lib/pdf/table";

const SERVICE_LINE = "COMMERCIAL CLEANING / FACILITIES SUPPORT";

export async function renderInvoicePdf(
  model: InvoicePdfModel,
  options?: { compress?: boolean }
): Promise<Buffer> {
  const company = companyPrintView();
  const { doc, done } = createBrandedDoc(
    {
      title: "INVOICE",
      slot: SERVICE_LINE,
      docCode: "FIN-INV-001",
      rev: "1.0",
      issued: model.issued,
      classification: model.draft ? "DRAFT" : "CLIENT-FACING",
      scopeLine: "Agreed scope only.",
    },
    options
  );

  kvGrid(doc, [
    { label: "Bill to", value: model.clientName },
    { label: "Invoice", value: model.invoiceNumber },
    { label: "Contact", value: model.contactName },
    { label: "Invoice date", value: model.invoiceDateLabel },
    { label: "Email", value: model.contactEmail },
    { label: "Due", value: model.dueLabel },
    { label: "Phone", value: model.contactPhone },
    { label: "Terms", value: model.termsLabel },
  ]);

  sectionHeading(doc, "Service location");
  if (model.sites.length === 0) {
    bodyText(doc, "Service location is on the line items.");
  } else {
    for (const site of model.sites) {
      bodyText(doc, site.address ? `${site.name} — ${site.address}` : site.name);
    }
  }

  sectionHeading(doc, "Services rendered");
  bodyText(doc, `Period ${model.periodLabel}`, 8);
  rightLabel(doc, "ALL AMOUNTS IN CAD");
  drawTable(
    doc,
    [
      { header: "DESCRIPTION / SITE AREA", width: 320 },
      { header: "QTY", width: 48, align: "center" },
      { header: "RATE", width: 80, align: "right" },
      { header: "AMOUNT", width: 80, align: "right" },
    ],
    model.lines.length > 0 ? model.lines : [["No line items", "", "", ""]]
  );

  totalsBlock(
    doc,
    [
      { label: "Subtotal", value: formatCad(model.subtotalCents) },
      { label: hstLabel(model.taxRateBps), value: formatCad(model.taxCents) },
      { label: "Payments", value: formatCad(model.paymentsCents) },
    ],
    { label: "Balance due", value: formatCad(model.balanceCents) }
  );
  bodyText(doc, `HST ${company.hstNumber}`, 8);

  return finalizeBrandedDoc(doc, done);
}
