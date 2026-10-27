import { bodyText, checkboxRow, kvGrid, sectionHeading, signOffColumns } from "@/lib/pdf/blocks";
import { CONTENT_WIDTH, PRINT } from "@/config/print-tokens";
import { companyPrintView } from "@/config/company-print";
import { ensureSpace, createBrandedDoc, finalizeBrandedDoc } from "@/lib/pdf/letterhead";
import type { VisitRecordModel } from "@/lib/pdf/models";
import { drawTable } from "@/lib/pdf/table";
import type { PdfDoc } from "@/lib/pdf/types";

export type VisitPhoto = { jpeg: Buffer; caption: string };

function drawPhotos(doc: PdfDoc, photos: VisitPhoto[]): void {
  if (photos.length === 0) return;
  const gap = 12;
  const boxW = (CONTENT_WIDTH - gap) / 2;
  const boxH = 150;
  // Keep the heading with the first photo so it does not sit alone at the bottom of a page.
  ensureSpace(doc, 22 + boxH + 28);
  sectionHeading(doc, "Photos");
  for (let i = 0; i < photos.length; i += 2) {
    ensureSpace(doc, boxH + 28);
    const y = doc.y;
    [photos[i], photos[i + 1]].forEach((photo, column) => {
      if (!photo) return;
      const x = PRINT.marginX + column * (boxW + gap);
      try {
        doc.image(photo.jpeg, x, y, { fit: [boxW, boxH], align: "center", valign: "center" });
      } catch {
        doc.font("Lato").fontSize(8).fillColor(PRINT.body);
        doc.text("Photo unavailable", x, y + 60, { width: boxW, height: 12, align: "center", lineBreak: false });
      }
      doc.font("Lato").fontSize(7).fillColor(PRINT.body);
      doc.text(photo.caption, x, y + boxH + 4, {
        width: boxW,
        height: 12,
        lineBreak: false,
        ellipsis: true,
      });
    });
    doc.y = y + boxH + 22;
  }
}

export async function renderVisitRecordPdf(
  model: VisitRecordModel,
  photos: VisitPhoto[] = [],
  options?: { compress?: boolean }
): Promise<Buffer> {
  const company = companyPrintView();
  const slot = model.siteName.toUpperCase();
  const { doc, done } = createBrandedDoc(
    {
      title: "VISIT RECORD",
      slot,
      docCode: "F-03",
      rev: "1.0",
      issued: model.issued,
      classification: model.draft ? "DRAFT" : "CLIENT-FACING",
      scopeLine: "Visit record.",
    },
    options
  );

  sectionHeading(doc, "Job");
  kvGrid(doc, [
    { label: "Client", value: model.clientName },
    { label: "Site", value: model.siteName },
    { label: "Address", value: model.siteAddress },
    { label: "Visit date", value: model.whenLabel },
    { label: "Check in", value: model.checkInLabel },
    { label: "Check out", value: model.checkOutLabel },
    { label: "Status", value: model.statusLabel },
    { label: "Record", value: model.draft ? "Draft" : "Approved" },
  ]);

  sectionHeading(doc, "Completion");
  checkboxRow(doc, [
    { label: "Complete", checked: model.complete },
    { label: "Partial", checked: model.partial },
    { label: "Re-clean", checked: model.reclean },
    { label: "Issue raised", checked: model.issueRaised },
  ]);

  sectionHeading(doc, "Areas");
  drawTable(
    doc,
    [
      { header: "ITEM", width: 190 },
      { header: "RESULT", width: 70 },
      { header: "NOTE", width: 200 },
      { header: "PHOTOS", width: 68, align: "right" },
    ],
    model.items.length > 0 ? model.items : [["No checklist submitted", "—", "", "0"]],
    { header: "light" }
  );

  sectionHeading(doc, "Issues");
  if (model.issues.length === 0) {
    bodyText(doc, "None recorded.");
  } else {
    for (const issue of model.issues) {
      bodyText(doc, `${issue.label} — ${issue.detail}`);
    }
  }

  if (model.notes) {
    sectionHeading(doc, "Notes");
    bodyText(doc, model.notes);
  }

  sectionHeading(doc, "Sign-off");
  signOffColumns(
    doc,
    {
      title: company.legalName,
      lines: [
        model.workerName,
        model.submittedLabel === "—" ? "Submitted —" : `Submitted ${model.submittedLabel}`,
        model.approverName === "—" ? "Approval pending" : `Approved by ${model.approverName}`,
        model.approvedLabel === "—" ? "" : model.approvedLabel,
      ],
    },
    { title: "Client", lines: [model.clientName, ""] }
  );

  if (model.photoNote) bodyText(doc, model.photoNote);
  drawPhotos(doc, photos);

  return finalizeBrandedDoc(doc, done);
}
