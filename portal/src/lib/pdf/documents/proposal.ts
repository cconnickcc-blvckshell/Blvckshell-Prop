import { bodyText, kvGrid, sectionHeading, signOffColumns, totalsBlock } from "@/lib/pdf/blocks";
import { companyPrintView } from "@/config/company-print";
import { formatCad } from "@/lib/pdf/format";
import { createBrandedDoc, finalizeBrandedDoc } from "@/lib/pdf/letterhead";
import type { ProposalModel } from "@/lib/pdf/models";
import { drawTable } from "@/lib/pdf/table";

export async function renderProposalPdf(
  model: ProposalModel,
  options?: { compress?: boolean }
): Promise<Buffer> {
  const company = companyPrintView();
  const { doc, done } = createBrandedDoc(
    {
      title: "PROPOSAL",
      slot: company.serviceAreaCaps,
      docCode: "SAL-001",
      rev: "1.0",
      issued: model.issued,
      classification: model.draft ? "DRAFT" : "CLIENT-FACING",
      scopeLine: "Client proposal.",
    },
    options
  );

  kvGrid(doc, [
    { label: "Prepared for", value: model.clientName },
    { label: "Site", value: model.siteName },
    { label: "Contact", value: model.contactName },
    { label: "Address", value: model.siteAddress },
    { label: "Email", value: model.contactEmail },
    { label: "Visits", value: `${model.visitsPerWeek} per week` },
    { label: "Valid until", value: model.validUntilLabel },
    { label: "Service area", value: company.serviceArea },
  ]);

  if (model.expired) {
    bodyText(doc, "This proposal is past its valid-until date.");
  }

  sectionHeading(doc, "Scope");
  drawTable(
    doc,
    [
      { header: "AREA", width: 160 },
      { header: "SCOPE", width: 368 },
    ],
    model.areas.length > 0
      ? model.areas.map((area) => [area.area, area.detail])
      : [["Scope", "As agreed for this site"]]
  );

  if (model.addOns.length > 0) {
    sectionHeading(doc, "Add-ons");
    drawTable(
      doc,
      [
        { header: "ITEM", width: 400 },
        { header: "AMOUNT", width: 128, align: "right" },
      ],
      model.addOns.map((line) => [line.name, formatCad(line.priceCents)])
    );
  }

  sectionHeading(doc, "Price");
  totalsBlock(doc, [], {
    label: "Monthly amount",
    value: formatCad(model.monthlyAmountCents),
  });
  bodyText(doc, "Price is the monthly amount for the scope listed above.");

  sectionHeading(doc, "Acceptance");
  signOffColumns(
    doc,
    { title: company.legalName, lines: ["Prepared for acceptance", model.siteName] },
    { title: "Client", lines: [model.clientName, model.contactName || ""] }
  );

  return finalizeBrandedDoc(doc, done);
}
