/**
 * Render sample client PDFs from fake data and write page-1 PNGs.
 * Run from portal/: npx tsx scripts/render-print-samples.ts
 */
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import sharp from "sharp";
import { renderInvoicePdf } from "@/lib/pdf/documents/invoice";
import { renderMonthlyReportPdf } from "@/lib/pdf/documents/monthly-report";
import { renderProposalPdf } from "@/lib/pdf/documents/proposal";
import { renderVisitRecordPdf } from "@/lib/pdf/documents/visit-record";
import {
  buildInvoicePdfModel,
  buildMonthlyReportModel,
  buildProposalModel,
  buildVisitRecord,
} from "@/lib/pdf/models";
import { dueAtFromInvoiceDate } from "@/server/invoices/payment-terms";

const outDir = process.env.PRINT_SAMPLE_DIR || "/opt/cursor/artifacts/print-samples";

async function writeSample(name: string, pdf: Buffer, allPages = false) {
  fs.mkdirSync(outDir, { recursive: true });
  const pdfPath = path.join(outDir, `${name}.pdf`);
  fs.writeFileSync(pdfPath, pdf);
  const prefix = path.join(outDir, name);
  const args = allPages
    ? ["-png", "-r", "110", pdfPath, prefix]
    : ["-png", "-f", "1", "-l", "1", "-r", "140", pdfPath, prefix];
  execFileSync("pdftoppm", args, { stdio: "inherit" });
  if (!allPages) {
    const generated = `${prefix}-1.png`;
    const pngPath = path.join(outDir, `${name}-page1.png`);
    if (fs.existsSync(generated)) fs.renameSync(generated, pngPath);
    console.log(name, pdf.length, "bytes");
    return;
  }
  const generated = fs
    .readdirSync(outDir)
    .filter((file) => new RegExp(`^${name}-\\d+\\.png$`).test(file));
  for (const file of generated) {
    const match = file.match(/-(\d+)\.png$/);
    if (!match) continue;
    const page = match[1].padStart(2, "0");
    const next = path.join(outDir, `${name}-page-${page}.png`);
    fs.renameSync(path.join(outDir, file), next);
  }
  const stale = path.join(outDir, `${name}-page1.png`);
  if (fs.existsSync(stale)) fs.unlinkSync(stale);
  console.log(name, pdf.length, "bytes", "pages", generated.length);
}

async function main() {
  const issued = new Date("2026-10-30T15:00:00Z");
  const invoice = buildInvoicePdfModel({
    invoiceNumber: "261030001",
    status: "Sent",
    issuedAt: issued,
    dueAt: dueAtFromInvoiceDate(issued, 30),
    periodStart: new Date("2026-10-01T00:00:00Z"),
    periodEnd: new Date("2026-10-31T00:00:00Z"),
    termsLabel: "Net 30",
    hstNumber: "729655308RT0001",
    clientName: "Harbour Court Properties",
    contactName: "A. Client",
    contactEmail: "accounts@example.com",
    contactPhone: "519-555-0100",
    sites: [{ name: "North Tower", address: "1 Example Road, Windsor" }],
    lineItems: Array.from({ length: 8 }, (_, index) => ({
      description: `Recurring common-area cleaning — lobbies, corridors, stairwells, entrances (line ${index + 1})`,
      qty: 1,
      unitPriceCents: 100000,
      amountCents: 100000,
    })),
    adjustments: [{ type: "Credit", amountCents: 5000, notes: "Service credit", reasonCode: null }],
    payments: [{ status: "SETTLED", amountCents: 20000 }],
    subtotalCents: 795000,
    taxCents: 103350,
    taxRateBps: 1300,
    totalCents: 898350,
  });

  const proposal = buildProposalModel({
    status: "SENT",
    visitsPerWeek: 5,
    expiresAt: new Date("2026-11-29T00:00:00Z"),
    clientName: "Harbour Court Properties",
    contactName: "A. Client",
    contactEmail: "accounts@example.com",
    contactPhone: "519-555-0100",
    siteName: "North Tower",
    siteAddress: "1 Example Road, Windsor",
    serviceWindow: "Weekdays, daytime",
    suppliesProvidedBy: "COMPANY",
    doNotEnterUnits: true,
    reference: "BS-2026-001",
    termsLabel: "Net 30",
    monthlyAmountCents: 240000,
    areas: [
      { type: "LOBBY", measurements: { sizeLabel: "500-1500 sqft", finishes: ["tile", "glass"] } },
      { type: "HALLWAYS", measurements: { sizeLabel: "Corridors", finishes: ["tile"] } },
      { type: "ELEVATORS", measurements: { count: 2, finish: "standard" } },
      { type: "STAIRWELLS", measurements: { sizeLabel: "Full height", finishes: ["concrete"] } },
      { type: "WASHROOMS", measurements: { preset: "M", finish: "standard", count: 4 } },
      { type: "GARBAGE", measurements: { sizeLabel: "Room", finish: "standard" } },
    ],
    addOns: [{ name: "Entry glass", priceCents: 18000, includedInProposal: true }],
    now: issued,
  });
  if (!proposal) throw new Error("Proposal sample missing");

  const report = buildMonthlyReportModel({
    clientName: "Harbour Court Properties",
    contactName: "A. Client",
    contactEmail: "accounts@example.com",
    periodLabel: "October 2026",
    sites: [
      {
        name: "North Tower",
        jobs: 12,
        jobsDone: 11,
        passItems: 40,
        scoredItems: 42,
        photos: 18,
        qualityScore: 96,
      },
      {
        name: "South Annex",
        jobs: 8,
        jobsDone: 8,
        passItems: 20,
        scoredItems: 20,
        photos: 9,
        qualityScore: 100,
      },
    ],
    incidents: [
      {
        type: "PROPERTY_DAMAGE",
        reportedAt: new Date("2026-10-12T15:00:00Z"),
        resolvedAt: new Date("2026-10-14T15:00:00Z"),
        siteName: "North Tower",
        description: "This internal note must not be printed",
      },
    ],
    invoices: [{ invoiceNumber: "261030001", status: "Sent", totalCents: 898350 }],
    issued,
  });

  const visit = buildVisitRecord({
    siteName: "North Tower",
    siteAddress: "1 Example Road, Windsor",
    clientName: "Harbour Court Properties",
    scheduledStart: new Date("2026-10-20T14:00:00Z"),
    status: "APPROVED_PAYABLE",
    isReclean: false,
    checkedInAt: new Date("2026-10-20T14:05:00Z"),
    checkedOutAt: new Date("2026-10-20T16:10:00Z"),
    workerName: "Jordan Lee",
    approverName: "Casey Admin",
    notes: "Lobby and corridors completed.",
    runs: [
      {
        status: "Approved",
        submittedAt: new Date("2026-10-20T16:15:00Z"),
        approvedAt: new Date("2026-10-20T18:00:00Z"),
        templateSnapshot: [
          { itemId: "lobby", label: "Lobby floors" },
          { itemId: "glass", label: "Entry glass" },
          { itemId: "wash", label: "Washrooms" },
        ],
        items: [
          { itemId: "lobby", result: "PASS", failReason: null, note: null },
          { itemId: "glass", result: "FAIL", failReason: "Streaks on the entry glass", note: null },
          { itemId: "wash", result: "PASS", failReason: null, note: "Restocked soap" },
        ],
        evidence: [],
      },
    ],
    now: issued,
  });

  const jpeg = await sharp({
    create: { width: 240, height: 160, channels: 3, background: { r: 246, g: 244, b: 240 } },
  })
    .jpeg()
    .toBuffer();

  await writeSample("invoice", await renderInvoicePdf(invoice));
  await writeSample("proposal", await renderProposalPdf(proposal), true);
  await writeSample("monthly-report", await renderMonthlyReportPdf(report));
  await writeSample(
    "visit-record",
    await renderVisitRecordPdf(visit.model, [{ jpeg, caption: "Lobby floors · 20 Oct 2026" }])
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
