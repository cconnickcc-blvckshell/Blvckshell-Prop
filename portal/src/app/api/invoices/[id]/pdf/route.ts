import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: { select: { name: true } },
      lineItems: { include: { site: { select: { name: true } } } },
      adjustments: { where: { status: { in: ["Approved", "Applied"] } } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  // Header
  doc.fontSize(20).font("Helvetica-Bold").text("BLVCKSHELL", { align: "left" });
  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica").text("Invoice", { align: "left" });
  doc.moveDown(1);

  doc.font("Helvetica");
  doc.fontSize(12).text(`Invoice #${invoice.invoiceNumber}`, { continued: false });
  doc.fontSize(10).text(`Client: ${invoice.client.name}`);
  doc.text(
    `Period: ${invoice.periodStart.toLocaleDateString()} – ${invoice.periodEnd.toLocaleDateString()}`
  );
  if (invoice.dueAt) {
    doc.text(`Due date: ${invoice.dueAt.toLocaleDateString()}`);
  }
  doc.moveDown(1.5);

  // Line items table
  const tableTop = doc.y;
  const colDesc = 50;
  const colQty = 320;
  const colUnit = 380;
  const colAmount = 450;
  const rowHeight = 22;

  doc.fontSize(9).font("Helvetica-Bold");
  doc.text("Description", colDesc, tableTop);
  doc.text("Qty", colQty, tableTop);
  doc.text("Unit price", colUnit, tableTop);
  doc.text("Amount", colAmount, tableTop);
  doc.moveTo(50, tableTop + rowHeight).lineTo(550, tableTop + rowHeight).stroke();
  doc.font("Helvetica");

  let y = tableTop + rowHeight + 6;
  for (const line of invoice.lineItems) {
    doc.fontSize(9).text(line.description.slice(0, 50), colDesc, y, { width: 260 });
    doc.text(String(line.qty), colQty, y);
    doc.text(`$${(line.unitPriceCents / 100).toFixed(2)}`, colUnit, y);
    doc.text(`$${(line.amountCents / 100).toFixed(2)}`, colAmount, y);
    y += rowHeight;
  }

  // Adjustments
  for (const adj of invoice.adjustments) {
    const label = `${adj.type}: ${adj.notes || adj.reasonCode || ""}`.trim();
    const amt = adj.type === "Charge" ? adj.amountCents : -adj.amountCents;
    doc.text(label.slice(0, 40), colDesc, y, { width: 260 });
    doc.text(`$${(amt / 100).toFixed(2)}`, colAmount, y);
    y += rowHeight;
  }

  y += 10;
  doc.moveTo(50, y).lineTo(550, y).stroke();
  y += 12;

  doc.font("Helvetica");
  doc.text("Subtotal:", colUnit, y);
  doc.text(`$${(invoice.subtotalCents / 100).toFixed(2)}`, colAmount, y);
  y += rowHeight;
  // D2: Ontario HST 13%
  if (invoice.taxCents > 0) {
    doc.text("HST (13%):", colUnit, y);
    doc.text(`$${(invoice.taxCents / 100).toFixed(2)}`, colAmount, y);
    y += rowHeight;
  }
  doc.font("Helvetica-Bold");
  doc.text("Total:", colUnit, y);
  doc.text(`$${(invoice.totalCents / 100).toFixed(2)}`, colAmount, y);

  doc.moveDown(2);
  doc.font("Helvetica").fontSize(9).text("Payment terms: Net 30", 50, doc.y);
  if (invoice.notes) {
    doc.moveDown(0.5).text(`Notes: ${invoice.notes}`, 50, doc.y, { width: 500 });
  }

  doc.end();
  const buffer = await done;

  return new NextResponse(buffer as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
    },
  });
}
