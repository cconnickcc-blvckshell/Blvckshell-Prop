import { CONTENT_WIDTH, PRINT } from "@/config/print-tokens";
import { ensureSpace } from "@/lib/pdf/letterhead";
import type { PdfDoc } from "@/lib/pdf/types";

export function sectionHeading(doc: PdfDoc, label: string, options?: { rule?: boolean }): void {
  const rule = options?.rule === true;
  ensureSpace(doc, rule ? 30 : 22);
  const y = doc.y;
  doc.font("Lato-Bold").fontSize(8.5).fillColor(PRINT.gold);
  doc.text(label.toUpperCase(), PRINT.marginX, y, {
    width: CONTENT_WIDTH,
    height: 12,
    lineBreak: false,
    characterSpacing: 0.6,
  });
  if (rule) {
    const ruleY = y + 14;
    doc.save();
    doc.moveTo(PRINT.marginX, ruleY)
      .lineTo(PRINT.marginX + CONTENT_WIDTH, ruleY)
      .lineWidth(0.9)
      .strokeColor(PRINT.gold)
      .stroke();
    doc.restore();
    doc.y = ruleY + 8;
    return;
  }
  doc.y = y + 16;
}

export function bodyText(doc: PdfDoc, text: string, size = 9): void {
  doc.font("Lato").fontSize(size).fillColor(PRINT.ink);
  const height = doc.heightOfString(text, { width: CONTENT_WIDTH });
  ensureSpace(doc, height + 8);
  const y = doc.y;
  doc.text(text, PRINT.marginX, y, { width: CONTENT_WIDTH });
  doc.y = y + height + 8;
}

export function kvGrid(
  doc: PdfDoc,
  pairs: { label: string; value: string }[],
  columns = 2
): void {
  const colW = CONTENT_WIDTH / columns;
  const rowH = 32;
  const rowCount = Math.ceil(pairs.length / columns);
  const height = rowCount * rowH + 8;
  ensureSpace(doc, height + 8);
  const y0 = doc.y;
  doc.save();
  doc.rect(PRINT.marginX, y0, CONTENT_WIDTH, height).fill(PRINT.panel);
  doc.restore();
  pairs.forEach((pair, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = PRINT.marginX + col * colW + 8;
    const y = y0 + 6 + row * rowH;
    doc.font("Lato-Bold").fontSize(6.5).fillColor(PRINT.body);
    doc.text(pair.label.toUpperCase(), x, y, {
      width: colW - 16,
      height: 9,
      lineBreak: false,
      characterSpacing: 0.4,
    });
    doc.font("Lato").fontSize(9).fillColor(PRINT.ink);
    doc.text(pair.value || "—", x, y + 11, {
      width: colW - 16,
      height: 12,
      lineBreak: false,
      ellipsis: true,
    });
  });
  doc.y = y0 + height + 10;
}

export function rightLabel(doc: PdfDoc, text: string): void {
  const y = doc.y;
  doc.font("Lato").fontSize(7).fillColor(PRINT.body);
  doc.text(text, PRINT.marginX, y, {
    width: CONTENT_WIDTH,
    height: 10,
    align: "right",
    lineBreak: false,
    characterSpacing: 0.4,
  });
  doc.y = y + 14;
}

export type TotalLine = { label: string; value: string };

export function totalsBlock(doc: PdfDoc, lines: TotalLine[], balance: TotalLine): void {
  const height = lines.length * 16 + 44;
  ensureSpace(doc, height);
  const x = PRINT.page.width - PRINT.marginX - 230;
  let y = doc.y;
  for (const line of lines) {
    doc.font("Lato").fontSize(9).fillColor(PRINT.body);
    doc.text(line.label, x, y, { width: 110, height: 12, lineBreak: false });
    doc.font("Lato").fontSize(9).fillColor(PRINT.ink);
    doc.text(line.value, x + 110, y, { width: 120, height: 12, align: "right", lineBreak: false });
    y += 16;
  }
  y += 4;
  doc.save();
  doc.rect(x, y, 230, 28).fill(PRINT.panel);
  doc.rect(x, y, 3, 28).fill(PRINT.gold);
  doc.restore();
  doc.font("Lato-Bold").fontSize(8).fillColor(PRINT.ink);
  doc.text(balance.label.toUpperCase(), x + 12, y + 9, {
    width: 100,
    height: 12,
    lineBreak: false,
    characterSpacing: 0.4,
  });
  doc.font("Lato-Black").fontSize(11).fillColor(PRINT.ink);
  doc.text(balance.value, x + 100, y + 7, { width: 120, height: 14, align: "right", lineBreak: false });
  doc.y = y + 40;
}

export function checkboxRow(doc: PdfDoc, items: { label: string; checked: boolean }[]): void {
  ensureSpace(doc, 18);
  const y = doc.y;
  const colW = CONTENT_WIDTH / Math.max(1, items.length);
  items.forEach((item, index) => {
    const x = PRINT.marginX + index * colW;
    doc.save();
    doc.lineWidth(0.9).strokeColor(PRINT.gold).rect(x, y, 8, 8).stroke();
    if (item.checked) {
      doc.moveTo(x + 1.6, y + 4)
        .lineTo(x + 3.3, y + 6.5)
        .lineTo(x + 6.6, y + 1.7)
        .lineWidth(1.2)
        .strokeColor(PRINT.ink)
        .stroke();
    }
    doc.restore();
    doc.font("Lato").fontSize(8).fillColor(PRINT.ink);
    doc.text(item.label, x + 12, y - 1, { width: colW - 16, height: 12, lineBreak: false });
  });
  doc.y = y + 18;
}

export function signOffColumns(
  doc: PdfDoc,
  left: { title: string; lines: string[] },
  right: { title: string; lines: string[] }
): void {
  ensureSpace(doc, 118);
  const y0 = doc.y;
  const gap = 14;
  const colW = (CONTENT_WIDTH - gap) / 2;
  [left, right].forEach((column, index) => {
    const x = PRINT.marginX + index * (colW + gap);
    doc.save();
    doc.lineWidth(0.6).strokeColor(PRINT.rule).rect(x, y0, colW, 104).stroke();
    doc.restore();
    doc.font("Lato-Bold").fontSize(7.5).fillColor(PRINT.gold);
    doc.text(column.title.toUpperCase(), x + 8, y0 + 8, {
      width: colW - 16,
      height: 10,
      lineBreak: false,
      characterSpacing: 0.4,
    });
    column.lines.slice(0, 4).forEach((line, lineIndex) => {
      doc.font("Lato").fontSize(8).fillColor(PRINT.ink);
      doc.text(line, x + 8, y0 + 24 + lineIndex * 12, {
        width: colW - 16,
        height: 11,
        lineBreak: false,
        ellipsis: true,
      });
    });
    doc.font("Lato").fontSize(7).fillColor(PRINT.body);
    doc.text("Signature", x + 8, y0 + 76, { width: 48, height: 9, lineBreak: false });
    doc.save();
    doc.moveTo(x + 56, y0 + 84).lineTo(x + colW - 10, y0 + 84).lineWidth(0.6).strokeColor(PRINT.rule).stroke();
    doc.restore();
    doc.font("Lato").fontSize(7).fillColor(PRINT.body);
    doc.text("Date", x + 8, y0 + 88, { width: 48, height: 9, lineBreak: false });
  });
  doc.y = y0 + 116;
}
