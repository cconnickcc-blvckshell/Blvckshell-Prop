import { CONTENT_WIDTH, PRINT } from "@/config/print-tokens";
import type { PdfDoc } from "@/lib/pdf/types";

export type TableColumn = {
  header: string;
  width: number;
  align?: "left" | "center" | "right";
};

function scaledColumns(columns: TableColumn[]): TableColumn[] {
  const sum = columns.reduce((total, column) => total + column.width, 0) || 1;
  const factor = CONTENT_WIDTH / sum;
  return columns.map((column) => ({ ...column, width: column.width * factor }));
}

function rowHeight(doc: PdfDoc, columns: TableColumn[], cells: string[]): number {
  let height = 26;
  columns.forEach((column, index) => {
    const text = cells[index] ?? "";
    if (!text) return;
    doc.font("Lato").fontSize(8.5);
    const measured = doc.heightOfString(text, { width: column.width - 12 });
    height = Math.max(height, measured + 12);
  });
  const max = PRINT.contentBottom - PRINT.contentTop - 22;
  return Math.min(height, Math.max(26, max));
}

function drawHeader(doc: PdfDoc, columns: TableColumn[], style: "ink" | "light"): void {
  const y = doc.y;
  const headerFill = style === "light" ? PRINT.lightHead : PRINT.ink;
  const headerText = style === "light" ? PRINT.ink : PRINT.white;
  doc.save();
  doc.rect(PRINT.marginX, y, CONTENT_WIDTH, 18).fill(headerFill);
  let x = PRINT.marginX;
  columns.forEach((column) => {
    doc.font("Lato-Bold").fontSize(7).fillColor(headerText);
    doc.text(column.header, x + 6, y + 5, {
      width: column.width - 12,
      height: 10,
      align: column.align ?? "left",
      lineBreak: false,
      characterSpacing: 0.45,
    });
    x += column.width;
  });
  doc.restore();
  doc.y = y + 18;
}

/**
 * Data table that keeps each row intact and repeats the header after a page break.
 */
export function drawTable(
  doc: PdfDoc,
  columns: TableColumn[],
  rows: string[][],
  options?: { header?: "ink" | "light" }
): void {
  const cols = scaledColumns(columns);
  const header = options?.header ?? "ink";
  const paintHeader = () => drawHeader(doc, cols, header);
  paintHeader();

  rows.forEach((cells, index) => {
    const height = rowHeight(doc, cols, cells);
    if (doc.y + height > PRINT.contentBottom) {
      doc.addPage();
      paintHeader();
    }
    const y = doc.y;
    doc.save();
    doc.rect(PRINT.marginX, y, CONTENT_WIDTH, height).fill(header === "ink" && index % 2 === 1 ? PRINT.row : PRINT.white);
    doc.restore();
    let x = PRINT.marginX;
    cols.forEach((column, cellIndex) => {
      doc.font("Lato").fontSize(8.5).fillColor(PRINT.ink);
      doc.text(cells[cellIndex] ?? "", x + 6, y + 6, {
        width: column.width - 12,
        height: height - 10,
        align: column.align ?? "left",
      });
      x += column.width;
    });
    doc.save();
    doc.moveTo(PRINT.marginX, y + height)
      .lineTo(PRINT.marginX + CONTENT_WIDTH, y + height)
      .lineWidth(0.4)
      .strokeColor(PRINT.rule)
      .stroke();
    let ruleX = PRINT.marginX;
    cols.forEach((column, columnIndex) => {
      ruleX += column.width;
      if (columnIndex < cols.length - 1) {
        doc.moveTo(ruleX, y).lineTo(ruleX, y + height).lineWidth(0.4).strokeColor(PRINT.rule).stroke();
      }
    });
    doc.restore();
    doc.x = PRINT.marginX;
    doc.y = y + height;
  });
  doc.y += 8;
}
