import PDFDocument from "pdfkit";
import { companyPrint, companyPrintView } from "@/config/company-print";
import { CONTENT_WIDTH, PRINT } from "@/config/print-tokens";
import { formatIssueMonth } from "@/lib/pdf/format";
import { registerBrandFonts } from "@/lib/pdf/fonts";
import { drawLogo, drawWatermarkCrest } from "@/lib/pdf/logo-draw";
import type { PdfDoc } from "@/lib/pdf/types";

export type BrandMeta = {
  title: string;
  slot: string;
  docCode: string;
  rev: string;
  issued: Date;
  classification: string;
  scopeLine: string;
};

const metas = new WeakMap<PdfDoc, BrandMeta>();

function fitSize(doc: PdfDoc, text: string, font: string, size: number, width: number, min = 6.5): number {
  let next = size;
  doc.font(font).fontSize(next);
  while (next > min && doc.widthOfString(text) > width) {
    next -= 0.5;
    doc.fontSize(next);
  }
  return next;
}

function drawLetterhead(doc: PdfDoc): void {
  const meta = metas.get(doc);
  if (!meta) return;
  const company = companyPrintView();
  const saved = {
    top: doc.page.margins.top,
    bottom: doc.page.margins.bottom,
    left: doc.page.margins.left,
    right: doc.page.margins.right,
  };
  doc.page.margins.top = 0;
  doc.page.margins.bottom = 0;

  const crestWidth = PRINT.page.width * 0.62;
  const crestHeight = crestWidth * (411 / 418);
  const bleed = 0.33;
  doc.save();
  doc.rect(0, 0, PRINT.page.width, PRINT.footerRuleY).clip();
  drawWatermarkCrest(
    doc,
    PRINT.page.width - crestWidth * (1 - bleed),
    PRINT.page.height - crestHeight * (1 - bleed),
    crestWidth
  );
  doc.restore();

  drawLogo(doc, 42, 28, 322);

  const ruleX = 382;
  const contactX = 394;
  const contactW = PRINT.page.width - PRINT.marginX - contactX;
  doc.save();
  doc.rect(ruleX, 32, 1.25, 62).fill(PRINT.gold);
  doc.restore();

  const nameSize = fitSize(doc, company.legalNameCaps, "Lato-Bold", 9, contactW);
  doc.font("Lato-Bold").fontSize(nameSize).fillColor(PRINT.ink);
  doc.text(company.legalNameCaps, contactX, 32, { width: contactW, height: 12, lineBreak: false });

  const regionSize = fitSize(doc, company.serviceAreaCaps, "Lato", 7.5, contactW);
  doc.font("Lato").fontSize(regionSize).fillColor(PRINT.body);
  doc.text(company.serviceAreaCaps, contactX, 48, { width: contactW, height: 11, lineBreak: false });
  doc.text(company.phone, contactX, 60, { width: contactW, height: 11, lineBreak: false });
  doc.font("Lato").fontSize(7.5).fillColor(PRINT.body);
  doc.text(company.webCaps, contactX, 72, { width: contactW, height: 11, lineBreak: false });

  doc.save();
  doc.moveTo(PRINT.marginX, 108).lineTo(PRINT.page.width - PRINT.marginX, 108).lineWidth(0.75).strokeColor(PRINT.gold).stroke();
  doc.restore();

  doc.font("Lato").fontSize(6.5).fillColor(PRINT.body);
  doc.text(company.lineCaps, PRINT.marginX, 114, {
    width: CONTENT_WIDTH * 0.62,
    height: 10,
    lineBreak: false,
    characterSpacing: 0.3,
  });
  doc.font("Lato-Bold").fontSize(6.5).fillColor(PRINT.goldDeep);
  doc.text(company.taglineCaps, PRINT.marginX, 114, {
    width: CONTENT_WIDTH,
    height: 10,
    align: "right",
    lineBreak: false,
    characterSpacing: 0.3,
  });

  const titleWidth = CONTENT_WIDTH * 0.48;
  const titleSize = fitSize(doc, meta.title, "Lato-Black", 22, titleWidth, 14);
  doc.font("Lato-Black").fontSize(titleSize).fillColor(PRINT.ink);
  doc.text(meta.title, PRINT.marginX, 132, { width: titleWidth, height: 26, lineBreak: false });

  const slotSize = fitSize(doc, meta.slot, "Lato-Bold", 8, CONTENT_WIDTH * 0.5, 6.5);
  doc.font("Lato-Bold").fontSize(slotSize).fillColor(PRINT.gold);
  doc.text(meta.slot, PRINT.marginX, 144, {
    width: CONTENT_WIDTH,
    height: 12,
    align: "right",
    lineBreak: false,
    characterSpacing: 0.4,
  });

  doc.save();
  doc.moveTo(PRINT.marginX, 164).lineTo(PRINT.page.width - PRINT.marginX, 164).lineWidth(0.75).strokeColor(PRINT.gold).stroke();
  doc.restore();

  doc.page.margins.top = saved.top;
  doc.page.margins.bottom = saved.bottom;
  doc.page.margins.left = saved.left;
  doc.page.margins.right = saved.right;
  doc.x = PRINT.marginX;
  doc.y = PRINT.contentTop;
}

function drawFooter(doc: PdfDoc, meta: BrandMeta, pageNumber: number, pageCount: number): void {
  const company = companyPrintView();
  const savedBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  doc.save();
  doc.moveTo(PRINT.marginX, PRINT.footerRuleY)
    .lineTo(PRINT.page.width - PRINT.marginX, PRINT.footerRuleY)
    .lineWidth(0.75)
    .strokeColor(PRINT.gold)
    .stroke();
  doc.font("Lato").fontSize(7).fillColor(PRINT.body);
  doc.text(meta.scopeLine, PRINT.marginX, 738, { width: CONTENT_WIDTH, height: 10, lineBreak: false });
  doc.text(company.footerLeftCaps, PRINT.marginX, 752, {
    width: CONTENT_WIDTH * 0.62,
    height: 10,
    lineBreak: false,
    characterSpacing: 0.3,
  });
  doc.font("Lato-Bold").fontSize(7).fillColor(PRINT.goldDeep);
  doc.text(company.footerRightCaps, PRINT.marginX, 752, {
    width: CONTENT_WIDTH,
    height: 10,
    align: "right",
    lineBreak: false,
    characterSpacing: 0.3,
  });
  const idLine = `${meta.docCode} · Rev ${meta.rev} · ${formatIssueMonth(meta.issued)} · ${pageNumber} / ${pageCount}`;
  doc.font("Lato").fontSize(6.5).fillColor(PRINT.body);
  doc.text(idLine, PRINT.marginX, 766, { width: CONTENT_WIDTH * 0.72, height: 10, lineBreak: false });
  doc.text(meta.classification, PRINT.marginX, 766, {
    width: CONTENT_WIDTH,
    height: 10,
    align: "right",
    lineBreak: false,
  });
  doc.restore();
  doc.page.margins.bottom = savedBottom;
}

export function createBrandedDoc(
  meta: BrandMeta,
  options?: { compress?: boolean }
): { doc: PdfDoc; done: Promise<Buffer> } {
  const doc = new PDFDocument({
    size: "LETTER",
    compress: options?.compress !== false,
    bufferPages: true,
    autoFirstPage: true,
    margins: {
      top: PRINT.contentTop,
      bottom: PRINT.page.height - PRINT.contentBottom,
      left: PRINT.marginX,
      right: PRINT.marginX,
    },
    info: {
      Title: meta.title,
      Author: companyPrint.legalName,
      Creator: "Blvckshell Portal",
    },
  });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) => reject(err));
  });
  registerBrandFonts(doc);
  metas.set(doc, meta);
  doc.on("pageAdded", () => drawLetterhead(doc));
  drawLetterhead(doc);
  return { doc, done };
}

export async function finalizeBrandedDoc(doc: PdfDoc, done: Promise<Buffer>): Promise<Buffer> {
  const meta = metas.get(doc);
  if (!meta) throw new Error("Missing print metadata");
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    drawFooter(doc, meta, i + 1, range.count);
  }
  doc.end();
  return done;
}

export function ensureSpace(doc: PdfDoc, height: number): void {
  const room = PRINT.contentBottom - PRINT.contentTop;
  const needed = Math.min(height, room);
  if (doc.y + needed > PRINT.contentBottom + 0.5) {
    doc.addPage();
  }
}
