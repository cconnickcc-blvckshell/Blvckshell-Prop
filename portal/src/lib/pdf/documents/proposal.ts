import fs from "fs";
import { bodyText, kvGrid, sectionHeading, totalsBlock } from "@/lib/pdf/blocks";
import { companyPrintView, type CompanyPrintView } from "@/config/company-print";
import { CONTENT_WIDTH, PRINT } from "@/config/print-tokens";
import { formatCad, hstLabel } from "@/lib/pdf/format";
import { createBrandedDoc, ensureSpace, finalizeBrandedDoc } from "@/lib/pdf/letterhead";
import { proposalSectionBody, type ProposalModel } from "@/lib/pdf/models";
import type { ProposalSectionKey } from "@/lib/pdf/proposal-sections";
import { drawTable } from "@/lib/pdf/table";
import type { PdfDoc } from "@/lib/pdf/types";

function narrative(doc: PdfDoc, model: ProposalModel, key: ProposalSectionKey): void {
  const section = proposalSectionBody(model, key);
  sectionHeading(doc, section.title, { rule: true });
  const paragraphs = section.body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  for (const paragraph of paragraphs.length > 0 ? paragraphs : ["—"]) {
    bodyText(doc, paragraph);
  }
}

function drawCover(doc: PdfDoc, model: ProposalModel, company: CompanyPrintView): void {
  doc.font("Lato-Bold").fontSize(8).fillColor(PRINT.goldDeep);
  doc.text("PREPARED FOR", PRINT.marginX, doc.y, {
    width: CONTENT_WIDTH,
    height: 12,
    lineBreak: false,
    characterSpacing: 0.6,
  });
  doc.y += 16;
  doc.font("Lato-Black").fontSize(20).fillColor(PRINT.ink);
  const nameHeight = doc.heightOfString(model.clientName, { width: CONTENT_WIDTH });
  doc.text(model.clientName, PRINT.marginX, doc.y, { width: CONTENT_WIDTH });
  doc.y += nameHeight + 4;
  doc.font("Lato").fontSize(12).fillColor(PRINT.body);
  doc.text(model.siteName, PRINT.marginX, doc.y, { width: CONTENT_WIDTH });
  doc.moveDown(0.25);
  doc.font("Lato").fontSize(10).fillColor(PRINT.body);
  doc.text(model.siteAddress || "—", { width: CONTENT_WIDTH });
  doc.moveDown(1);

  kvGrid(doc, [
    { label: "Proposal reference", value: model.reference || "—" },
    { label: "Date", value: model.dateLabel },
    { label: "Valid for", value: `${model.validityDays} days` },
    { label: "Valid until", value: model.validUntilLabel },
  ]);

  doc.font("Lato-Bold").fontSize(8).fillColor(PRINT.goldDeep);
  doc.text("PREPARED BY", PRINT.marginX, doc.y, {
    width: CONTENT_WIDTH,
    height: 12,
    lineBreak: false,
    characterSpacing: 0.6,
  });
  doc.y += 14;
  const lines = [
    company.signerName,
    company.signerTitle,
    company.legalName,
    company.phone,
    company.websiteLabel,
  ];
  for (const line of lines) {
    doc.font("Lato").fontSize(10).fillColor(PRINT.ink);
    doc.text(line, PRINT.marginX, doc.y, { width: CONTENT_WIDTH, height: 14, lineBreak: false });
    doc.y += 14;
  }
  doc.y += 8;

  if (model.expired) {
    bodyText(doc, "This proposal is past its valid-until date.");
  }
}

function drawSignature(doc: PdfDoc, company: CompanyPrintView): void {
  ensureSpace(doc, 78);
  const x = PRINT.marginX;
  let y = doc.y + 6;
  if (company.signatureImagePath && fs.existsSync(company.signatureImagePath)) {
    try {
      doc.image(company.signatureImagePath, x, y, { fit: [180, 36] });
      y += 40;
    } catch {
      y += 18;
    }
  } else {
    y += 18;
  }
  doc.save();
  doc.moveTo(x, y).lineTo(x + 200, y).lineWidth(0.7).strokeColor(PRINT.ink).stroke();
  doc.restore();
  doc.font("Lato").fontSize(10).fillColor(PRINT.ink);
  doc.text(company.signerName, x, y + 6, { width: 240, height: 13, lineBreak: false });
  doc.font("Lato").fontSize(9).fillColor(PRINT.body);
  doc.text(company.signerTitle, x, y + 20, { width: 240, height: 12, lineBreak: false });
  doc.y = y + 38;
}

function drawLetter(doc: PdfDoc, model: ProposalModel, company: CompanyPrintView): void {
  const section = proposalSectionBody(model, "cover_letter");
  sectionHeading(doc, section.title, { rule: true });
  bodyText(doc, `Dear ${model.contactName || "Client"},`);
  const paragraphs = section.body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  for (const paragraph of paragraphs.length > 0 ? paragraphs : ["—"]) {
    bodyText(doc, paragraph);
  }
  bodyText(doc, "Sincerely,");
  drawSignature(doc, company);
}

function areaBar(doc: PdfDoc, title: string, detail: string): void {
  ensureSpace(doc, 64);
  const y = doc.y;
  doc.save();
  doc.rect(PRINT.marginX, y, CONTENT_WIDTH, 18).fill(PRINT.ink);
  doc.restore();
  doc.font("Lato-Bold").fontSize(8).fillColor(PRINT.white);
  doc.text(title.toUpperCase(), PRINT.marginX + 6, y + 5, {
    width: CONTENT_WIDTH - 12,
    height: 11,
    lineBreak: false,
    characterSpacing: 0.4,
  });
  doc.y = y + 22;
  if (detail) {
    doc.font("Lato").fontSize(8).fillColor(PRINT.body);
    doc.text(detail, PRINT.marginX, doc.y, { width: CONTENT_WIDTH, height: 12, lineBreak: false });
    doc.y += 14;
  }
}

function drawScope(doc: PdfDoc, model: ProposalModel): void {
  sectionHeading(doc, "Scope of work", { rule: true });
  const areas = model.areas.length > 0 ? model.areas : [];
  if (areas.length === 0) {
    bodyText(doc, "Scope follows the areas on this quote.");
    return;
  }
  for (const area of areas) {
    areaBar(doc, area.area, area.detail);
    drawTable(
      doc,
      [
        { header: "TASK DESCRIPTION", width: 390 },
        { header: "FREQUENCY", width: 138 },
      ],
      area.tasks.length > 0 ? area.tasks.map((task) => [task.description, task.frequency]) : [["—", "—"]]
    );
  }
}

function drawPricing(doc: PdfDoc, model: ProposalModel): void {
  narrative(doc, model, "pricing");
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

  drawCover(doc, model, company);
  doc.addPage();
  drawLetter(doc, model, company);
  doc.addPage();
  narrative(doc, model, "our_team");
  drawScope(doc, model);
  drawPricing(doc, model);
  narrative(doc, model, "included");
  narrative(doc, model, "special_services");
  bodyText(doc, "Priced on request.");
  narrative(doc, model, "quality");
  narrative(doc, model, "safety");
  narrative(doc, model, "equipment");
  narrative(doc, model, "invoicing");
  kvGrid(doc, [
    { label: "Payment terms", value: model.termsLabel },
    { label: "Due date", value: "Counted from the invoice date" },
  ]);
  narrative(doc, model, "term");
  doc.addPage();
  narrative(doc, model, "acceptance");
  acceptanceColumns(doc, company.legalName, model.clientName);

  return finalizeBrandedDoc(doc, done);
}
