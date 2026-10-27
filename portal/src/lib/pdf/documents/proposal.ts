import { bodyText, kvGrid, sectionHeading, totalsBlock } from "@/lib/pdf/blocks";
import { companyPrintView } from "@/config/company-print";
import { CONTENT_WIDTH, PRINT } from "@/config/print-tokens";
import { formatCad, hstLabel } from "@/lib/pdf/format";
import { createBrandedDoc, ensureSpace, finalizeBrandedDoc } from "@/lib/pdf/letterhead";
import { proposalSectionBody, type ProposalModel } from "@/lib/pdf/models";
import type { ProposalSectionKey } from "@/lib/pdf/proposal-sections";
import { drawTable } from "@/lib/pdf/table";
import type { PdfDoc } from "@/lib/pdf/types";

function narrative(doc: PdfDoc, model: ProposalModel, key: ProposalSectionKey): void {
  const section = proposalSectionBody(model, key);
  sectionHeading(doc, section.title);
  const paragraphs = section.body.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  for (const paragraph of paragraphs.length > 0 ? paragraphs : ["—"]) {
    bodyText(doc, paragraph);
  }
}

function nextPage(doc: PdfDoc): void {
  doc.addPage();
}

function drawCover(doc: PdfDoc, model: ProposalModel): void {
  const company = companyPrintView();
  doc.font("Lato-Bold").fontSize(8).fillColor(PRINT.goldDeep);
  doc.text("PREPARED FOR", PRINT.marginX, doc.y, {
    width: CONTENT_WIDTH,
    height: 12,
    lineBreak: false,
    characterSpacing: 0.6,
  });
  doc.y += 18;
  doc.font("Lato-Black").fontSize(20).fillColor(PRINT.ink);
  const nameHeight = doc.heightOfString(model.clientName, { width: CONTENT_WIDTH });
  doc.text(model.clientName, PRINT.marginX, doc.y, { width: CONTENT_WIDTH });
  doc.y += nameHeight + 6;
  doc.font("Lato").fontSize(12).fillColor(PRINT.body);
  doc.text(model.siteName, PRINT.marginX, doc.y, { width: CONTENT_WIDTH });
  doc.moveDown(0.3);
  doc.font("Lato").fontSize(10).fillColor(PRINT.body);
  doc.text(model.siteAddress || "—", { width: CONTENT_WIDTH });
  doc.moveDown(1.4);

  kvGrid(doc, [
    { label: "Proposal reference", value: model.reference || "—" },
    { label: "Date", value: model.dateLabel },
    { label: "Valid for", value: `${model.validityDays} days` },
    { label: "Valid until", value: model.validUntilLabel },
  ]);

  kvGrid(doc, [
    { label: "Client", value: model.clientName },
    { label: "Prepared by", value: company.legalName },
    { label: "Contact", value: model.contactName || "—" },
    { label: "Phone", value: company.phone },
    { label: "Email", value: model.contactEmail || "—" },
    { label: "Web", value: company.web },
  ]);

  if (model.expired) {
    bodyText(doc, "This proposal is past its valid-until date.");
  }
}

function drawProperty(doc: PdfDoc, model: ProposalModel): void {
  sectionHeading(doc, "Property");
  const pairs = [
    { label: "Client", value: model.clientName },
    { label: "Site", value: model.siteName },
    { label: "Address", value: model.siteAddress || "—" },
    { label: "Contact", value: model.contactName || "—" },
    { label: "Email", value: model.contactEmail || "—" },
    { label: "Phone", value: model.contactPhone || "—" },
    { label: "Visits", value: `${model.visitsPerWeek} per week` },
  ];
  if (model.serviceWindow) pairs.push({ label: "Service window", value: model.serviceWindow });
  if (model.suppliesLabel) pairs.push({ label: "Supplies", value: model.suppliesLabel });
  if (model.unitsLabel) pairs.push({ label: "Occupied units", value: model.unitsLabel });
  kvGrid(doc, pairs);
}

function drawSchedule(doc: PdfDoc, model: ProposalModel): void {
  sectionHeading(doc, "Service schedule");
  bodyText(doc, "Frequency for this site.");
  const rows: string[][] = [
    ["Recurring common-area cleaning", `${model.visitsPerWeek}× per week`],
  ];
  for (const line of model.addOns) {
    rows.push([line.name, "Included in this proposal"]);
  }
  rows.push(["Unit turnovers", "Quoted separately, as required"]);
  rows.push(["Post-construction final cleaning", "Quoted separately, as required"]);
  drawTable(
    doc,
    [
      { header: "SERVICE", width: 340 },
      { header: "FREQUENCY", width: 188 },
    ],
    rows
  );
}

function drawScope(doc: PdfDoc, model: ProposalModel): void {
  sectionHeading(doc, "Scope of work");
  bodyText(doc, "These areas are included in each scheduled visit.");
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
}

function drawPricing(doc: PdfDoc, model: ProposalModel): void {
  sectionHeading(doc, "Pricing");
  bodyText(doc, "HST is shown separately. Amounts are in CAD.");
  if (model.addOns.length > 0) {
    drawTable(
      doc,
      [
        { header: "ADD-ON", width: 400 },
        { header: "AMOUNT", width: 128, align: "right" },
      ],
      model.addOns.map((line) => [line.name, formatCad(line.priceCents)])
    );
  }
  const lines = [{ label: "Monthly amount", value: formatCad(model.monthlyAmountCents) }];
  if (model.addOns.length > 0) {
    lines.push({ label: "Add-ons", value: formatCad(model.addOnTotalCents) });
  }
  lines.push({ label: hstLabel(model.taxRateBps), value: formatCad(model.taxCents) });
  totalsBlock(doc, lines, { label: "Total", value: formatCad(model.totalCents) });
}

function acceptanceColumns(doc: PdfDoc, leftTitle: string, rightTitle: string): void {
  ensureSpace(doc, 150);
  const y0 = doc.y;
  const gap = 14;
  const colW = (CONTENT_WIDTH - gap) / 2;
  const fields = ["Name", "Title", "Signature", "Date"];
  [leftTitle, rightTitle].forEach((title, index) => {
    const x = PRINT.marginX + index * (colW + gap);
    doc.save();
    doc.lineWidth(0.6).strokeColor(PRINT.rule).rect(x, y0, colW, 136).stroke();
    doc.restore();
    doc.font("Lato-Bold").fontSize(7.5).fillColor(PRINT.gold);
    doc.text(title.toUpperCase(), x + 8, y0 + 8, {
      width: colW - 16,
      height: 11,
      lineBreak: false,
      characterSpacing: 0.4,
    });
    fields.forEach((field, fieldIndex) => {
      const y = y0 + 28 + fieldIndex * 26;
      doc.font("Lato").fontSize(7).fillColor(PRINT.body);
      doc.text(field, x + 8, y, { width: 52, height: 9, lineBreak: false });
      doc.save();
      doc.moveTo(x + 62, y + 8).lineTo(x + colW - 10, y + 8).lineWidth(0.6).strokeColor(PRINT.rule).stroke();
      doc.restore();
    });
  });
  doc.y = y0 + 148;
}

export async function renderProposalPdf(
  model: ProposalModel,
  options?: { compress?: boolean }
): Promise<Buffer> {
  const company = companyPrintView();
  const { doc, done } = createBrandedDoc(
    {
      title: "PROPOSAL",
      slot: model.siteName.toUpperCase(),
      docCode: model.reference || "SAL-001",
      rev: "1.0",
      issued: model.issued,
      classification: model.draft ? "DRAFT" : "CLIENT-FACING",
      scopeLine: "Client proposal.",
    },
    options
  );

  drawCover(doc, model);

  nextPage(doc);
  narrative(doc, model, "introduction");

  nextPage(doc);
  narrative(doc, model, "about");

  nextPage(doc);
  drawProperty(doc, model);

  nextPage(doc);
  drawSchedule(doc, model);

  nextPage(doc);
  drawScope(doc, model);

  nextPage(doc);
  narrative(doc, model, "included");
  narrative(doc, model, "excluded");

  nextPage(doc);
  narrative(doc, model, "quality");

  nextPage(doc);
  drawPricing(doc, model);

  nextPage(doc);
  narrative(doc, model, "turnover");
  narrative(doc, model, "post_construction");

  nextPage(doc);
  narrative(doc, model, "assumptions");
  narrative(doc, model, "change_control");

  nextPage(doc);
  narrative(doc, model, "terms");
  kvGrid(doc, [
    { label: "Payment terms", value: model.termsLabel },
    { label: "Due date", value: "Counted from the invoice date" },
  ]);
  narrative(doc, model, "acceptance");
  acceptanceColumns(doc, company.legalName, model.clientName);

  return finalizeBrandedDoc(doc, done);
}
