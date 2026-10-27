import { bodyText, kvGrid, sectionHeading } from "@/lib/pdf/blocks";
import { createBrandedDoc, finalizeBrandedDoc } from "@/lib/pdf/letterhead";
import type { MonthlyReportModel } from "@/lib/pdf/models";
import { drawTable } from "@/lib/pdf/table";

export async function renderMonthlyReportPdf(
  model: MonthlyReportModel,
  options?: { compress?: boolean }
): Promise<Buffer> {
  const { doc, done } = createBrandedDoc(
    {
      title: "SERVICE REPORT",
      slot: model.periodLabel.toUpperCase(),
      docCode: "OPS-RPT-001",
      rev: "1.0",
      issued: model.issued,
      classification: "CLIENT-FACING",
      scopeLine: "Period summary.",
    },
    options
  );

  kvGrid(doc, [
    { label: "Client", value: model.clientName },
    { label: "Period", value: model.periodLabel },
    { label: "Prepared for", value: model.contactName },
    { label: "Email", value: model.contactEmail },
  ]);

  sectionHeading(doc, "Sites");
  drawTable(
    doc,
    [
      { header: "SITE", width: 200 },
      { header: "JOBS", width: 80, align: "right" },
      { header: "PASS RATE", width: 80, align: "right" },
      { header: "PHOTOS", width: 70, align: "right" },
      { header: "QUALITY", width: 78, align: "right" },
    ],
    model.sites.length > 0 ? model.sites : [["No active sites", "—", "—", "—", "—"]],
    { header: "light" }
  );

  sectionHeading(doc, "Incidents");
  if (model.incidents.length === 0) {
    bodyText(doc, "No incidents recorded for this period.");
  } else {
    drawTable(
      doc,
      [
        { header: "DATE", width: 110 },
        { header: "SITE", width: 180 },
        { header: "CATEGORY", width: 140 },
        { header: "STATUS", width: 78 },
      ],
      model.incidents.map((incident) => [incident.date, incident.site, incident.category, incident.status]),
      { header: "light" }
    );
  }

  sectionHeading(doc, "Invoices");
  drawTable(
    doc,
    [
      { header: "INVOICE", width: 200 },
      { header: "STATUS", width: 140 },
      { header: "TOTAL", width: 168, align: "right" },
    ],
    model.invoices.length > 0 ? model.invoices : [["No invoices", "—", "—"]]
  );

  return finalizeBrandedDoc(doc, done);
}
