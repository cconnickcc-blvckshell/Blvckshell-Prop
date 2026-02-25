import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "FOUNDER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = params;
  const url = new URL(request.url);
  const monthParam = url.searchParams.get("month");

  const now = new Date();
  const periodStart = monthParam
    ? new Date(monthParam + "-01")
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0, 23, 59, 59);

  const client = await prisma.clientOrganization.findUnique({
    where: { id: clientId },
    select: {
      name: true,
      primaryContactName: true,
      primaryContactEmail: true,
      sites: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          address: true,
          qualityScore: true,
          qualityTrend: true,
        },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const siteIds = client.sites.map((s) => s.id);

  const jobs = await prisma.job.findMany({
    where: {
      siteId: { in: siteIds },
      scheduledStart: { gte: periodStart, lte: periodEnd },
      status: { not: "CANCELLED" },
    },
    select: {
      id: true,
      siteId: true,
      status: true,
      scheduledStart: true,
      checklistRuns: {
        select: {
          status: true,
          items: { select: { result: true } },
          evidence: { select: { id: true } },
        },
      },
    },
  });

  const incidents = await prisma.incidentReport.findMany({
    where: {
      siteId: { in: siteIds },
      reportedAt: { gte: periodStart, lte: periodEnd },
    },
    select: { type: true, description: true, reportedAt: true, site: { select: { name: true } } },
  });

  const invoices = await prisma.invoice.findMany({
    where: {
      clientId,
      periodStart: { gte: periodStart },
      periodEnd: { lte: periodEnd },
    },
    select: { invoiceNumber: true, status: true, totalCents: true },
  });

  const periodLabel = periodStart.toLocaleDateString("en-CA", { year: "numeric", month: "long" });

  const doc = new PDFDocument({ margin: 50, size: "LETTER" });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const pdfComplete = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  // Header
  doc.fontSize(20).fillColor("#10b981").text("BLVCKSHELL Facilities Services", { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(14).fillColor("#333").text("Monthly Service Report", { align: "center" });
  doc.moveDown(0.5);

  doc.fontSize(11).fillColor("#555");
  doc.text(`Client: ${client.name}`);
  doc.text(`Period: ${periodLabel}`);
  doc.text(`Prepared for: ${client.primaryContactName} (${client.primaryContactEmail})`);
  doc.moveDown(1);

  // Sites summary
  doc.fontSize(13).fillColor("#000").text("Sites Serviced", { underline: true });
  doc.moveDown(0.5);

  for (const site of client.sites) {
    const siteJobs = jobs.filter((j) => j.siteId === site.id);
    const completedCount = siteJobs.filter((j) => j.status !== "SCHEDULED").length;
    let totalItems = 0;
    let passedItems = 0;
    let evidenceCount = 0;

    for (const job of siteJobs) {
      for (const run of job.checklistRuns) {
        for (const item of run.items) {
          totalItems++;
          if (item.result === "PASS") passedItems++;
        }
        evidenceCount += run.evidence.length;
      }
    }

    const passRate = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0;

    doc.fontSize(11).fillColor("#000").text(`${site.name}`, { continued: false });
    doc.fontSize(9).fillColor("#666").text(`   ${site.address}`);
    doc.fontSize(10).fillColor("#333");
    doc.text(`   Jobs completed: ${completedCount} / ${siteJobs.length}`);
    doc.text(`   Checklist pass rate: ${passRate}% (${passedItems}/${totalItems} items)`);
    doc.text(`   Evidence photos: ${evidenceCount}`);
    if (site.qualityScore != null) {
      doc.text(`   Quality score: ${site.qualityScore}% (trend: ${site.qualityTrend ?? "stable"})`);
    }
    doc.moveDown(0.5);
  }

  // Incidents
  if (incidents.length > 0) {
    doc.moveDown(0.5);
    doc.fontSize(13).fillColor("#000").text("Incidents", { underline: true });
    doc.moveDown(0.5);
    for (const inc of incidents) {
      doc.fontSize(10).fillColor("#333");
      doc.text(`[${inc.type}] ${inc.site.name} — ${new Date(inc.reportedAt).toLocaleDateString()}`);
      doc.fontSize(9).fillColor("#666").text(`   ${inc.description}`);
    }
  } else {
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#666").text("No incidents reported this period.");
  }

  // Invoice summary
  doc.moveDown(1);
  doc.fontSize(13).fillColor("#000").text("Invoice Summary", { underline: true });
  doc.moveDown(0.5);
  if (invoices.length === 0) {
    doc.fontSize(10).fillColor("#666").text("No invoices for this period.");
  } else {
    for (const inv of invoices) {
      doc.fontSize(10).fillColor("#333");
      doc.text(`#${inv.invoiceNumber} — ${inv.status} — $${(inv.totalCents / 100).toFixed(2)}`);
    }
  }

  // Footer
  doc.moveDown(2);
  doc.fontSize(8).fillColor("#999").text(
    `Generated ${new Date().toISOString()} by BLVCKSHELL Portal`,
    { align: "center" },
  );

  doc.end();

  const pdfBuffer = await pdfComplete;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="report-${client.name.replace(/\s+/g, "_")}-${periodLabel.replace(/\s+/g, "_")}.pdf"`,
    },
  });
}
