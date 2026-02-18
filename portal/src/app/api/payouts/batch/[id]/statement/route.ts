import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";

/** GET /api/payouts/batch/[id]/statement?workforceAccountId=... - Pay statement PDF for one worker in a batch (admin only). */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: batchId } = await context.params;
  const workforceAccountId = request.nextUrl.searchParams.get("workforceAccountId");
  if (!workforceAccountId) {
    return NextResponse.json(
      { error: "workforceAccountId required" },
      { status: 400 }
    );
  }

  const batch = await prisma.payoutBatch.findUnique({
    where: { id: batchId },
    include: {
      payoutLines: {
        where: { workforceAccountId },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }
  if (batch.payoutLines.length === 0) {
    return NextResponse.json(
      { error: "No lines for this worker in this batch" },
      { status: 404 }
    );
  }

  const account = await prisma.workforceAccount.findUnique({
    where: { id: workforceAccountId },
    select: { displayName: true },
  });
  const payeeName = account?.displayName ?? "Worker";

  const totalCents = batch.payoutLines.reduce((sum, l) => sum + l.amountCents, 0);

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  doc.fontSize(20).font("Helvetica-Bold").text("BLVCKSHELL", { align: "left" });
  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica").text("Pay Statement", { align: "left" });
  doc.moveDown(1);

  doc.font("Helvetica");
  doc.fontSize(12).text(`Payee: ${payeeName}`, { continued: false });
  doc.fontSize(10).text(
    `Period: ${batch.periodStart.toLocaleDateString()} – ${batch.periodEnd.toLocaleDateString()}`
  );
  doc.moveDown(1.5);

  const tableTop = doc.y;
  const colDesc = 50;
  const colAmount = 450;
  const rowHeight = 22;

  doc.fontSize(9).font("Helvetica-Bold");
  doc.text("Description", colDesc, tableTop);
  doc.text("Amount", colAmount, tableTop);
  doc.moveTo(50, tableTop + rowHeight).lineTo(550, tableTop + rowHeight).stroke();
  doc.font("Helvetica");

  let y = tableTop + rowHeight + 6;
  for (const line of batch.payoutLines) {
    doc.fontSize(9).text(line.description ?? `Job ${line.jobId ?? "—"}`, colDesc, y, { width: 400 });
    doc.text(`$${(line.amountCents / 100).toFixed(2)}`, colAmount, y);
    y += rowHeight;
  }

  y += 10;
  doc.moveTo(50, y).lineTo(550, y).stroke();
  y += 12;
  doc.font("Helvetica-Bold");
  doc.text("Total", colDesc, y);
  doc.text(`$${(totalCents / 100).toFixed(2)}`, colAmount, y);

  doc.end();
  const buffer = await done;

  const filename = `pay-statement-${batchId.slice(-6)}-${payeeName.replace(/\W/g, "-")}.pdf`;
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
